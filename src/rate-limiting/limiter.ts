import { 
  RateLimitConfig, 
  RateLimitResult, 
  RateLimitEntry, 
  RateLimitCategory, 
  RateLimitStats,
  ResourceLimitConfig 
} from './types';

/**
 * Rate Limiter Class
 * Implements request throttling and resource protection
 */
export class RateLimiter {
  private config: RateLimitConfig;
  private store: Map<string, RateLimitEntry> = new Map();
  private categoryConfigs: Map<string, RateLimitConfig> = new Map();
  private stats: RateLimitStats;
  private cleanupInterval?: NodeJS.Timeout;

  constructor(config: RateLimitConfig) {
    this.config = config;
    this.stats = {
      totalRequests: 0,
      blockedRequests: 0,
      activeEntries: 0,
      byCategory: {},
      timestamp: Date.now()
    };

    // Start cleanup interval to remove expired entries
    this.startCleanup();
  }

  /**
   * Set rate limit configuration for a specific category
   * @param category Rate limit category
   * @param config Category-specific configuration
   */
  setCategoryConfig(category: string, config: RateLimitConfig): void {
    this.categoryConfigs.set(category, config);
  }

  /**
   * Check if request is within rate limits
   * @param key Rate limit key (usually IP or user ID)
   * @param category Request category
   * @returns Rate limit check result
   */
  checkLimit(key: string, category: string = RateLimitCategory.GENERAL): RateLimitResult {
    const config = this.categoryConfigs.get(category) || this.config;
    const now = Date.now();
    const windowStart = now - config.windowMs;
    
    // Get or create entry for this key
    let entry = this.store.get(key);
    
    if (!entry || entry.windowStart < windowStart) {
      // Create new window
      entry = {
        count: 0,
        windowStart: now,
        firstRequest: now
      };
      this.store.set(key, entry);
    }

    // Update statistics
    this.stats.totalRequests++;
    if (!this.stats.byCategory[category]) {
      this.stats.byCategory[category] = { requests: 0, blocked: 0 };
    }
    this.stats.byCategory[category].requests++;

    // Check if limit exceeded
    const allowed = entry.count < config.maxRequests;
    
    if (allowed) {
      entry.count++;
    } else {
      this.stats.blockedRequests++;
      this.stats.byCategory[category].blocked++;
    }

    const resetTime = entry.windowStart + config.windowMs;
    const retryAfter = allowed ? undefined : Math.ceil((resetTime - now) / 1000);

    return {
      allowed,
      remaining: Math.max(0, config.maxRequests - entry.count),
      resetTime,
      retryAfter,
      limit: config.maxRequests,
      current: entry.count
    };
  }

  /**
   * Reset rate limits for a specific key
   * @param key Rate limit key to reset
   */
  resetLimits(key: string): void {
    this.store.delete(key);
  }

  /**
   * Reset all rate limits
   */
  resetAllLimits(): void {
    this.store.clear();
  }

  /**
   * Get rate limiter statistics
   * @returns Current statistics
   */
  getStats(): RateLimitStats {
    this.stats.activeEntries = this.store.size;
    this.stats.timestamp = Date.now();
    return { ...this.stats };
  }

  /**
   * Get current entries count
   * @returns Number of active rate limit entries
   */
  getActiveEntries(): number {
    return this.store.size;
  }

  /**
   * Check if a key is currently rate limited
   * @param key Rate limit key
   * @param category Request category
   * @returns Whether the key is rate limited
   */
  isRateLimited(key: string, category: string = RateLimitCategory.GENERAL): boolean {
    const result = this.checkLimit(key, category);
    return !result.allowed;
  }

  /**
   * Get remaining requests for a key
   * @param key Rate limit key
   * @param category Request category
   * @returns Number of remaining requests
   */
  getRemainingRequests(key: string, category: string = RateLimitCategory.GENERAL): number {
    const result = this.checkLimit(key, category);
    return result.remaining;
  }

  /**
   * Start cleanup interval to remove expired entries
   */
  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000); // Cleanup every minute
  }

  /**
   * Stop cleanup interval
   */
  stopCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = undefined;
    }
  }

  /**
   * Remove expired rate limit entries
   */
  private cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.store.entries()) {
      // Remove entries older than the longest window
      const maxWindow = Math.max(
        this.config.windowMs,
        ...Array.from(this.categoryConfigs.values()).map(c => c.windowMs)
      );
      
      if (entry.windowStart < now - maxWindow) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => this.store.delete(key));
  }
}

/**
 * Resource Limiter Class
 * Manages system resource limits
 */
export class ResourceLimiter {
  private config: ResourceLimitConfig;
  private activeBrowsers: number = 0;

  constructor(config: ResourceLimitConfig) {
    this.config = config;
  }

  /**
   * Check if browser instance can be created
   * @returns Whether browser creation is allowed
   */
  canCreateBrowser(): boolean {
    return this.activeBrowsers < this.config.maxBrowsers;
  }

  /**
   * Register a new browser instance
   */
  registerBrowser(): void {
    this.activeBrowsers++;
  }

  /**
   * Unregister a browser instance
   */
  unregisterBrowser(): void {
    this.activeBrowsers = Math.max(0, this.activeBrowsers - 1);
  }

  /**
   * Get current browser count
   */
  getActiveBrowserCount(): number {
    return this.activeBrowsers;
  }

  /**
   * Check current memory usage
   * @returns Whether memory usage is within limits
   */
  checkMemoryUsage(): boolean {
    const memoryUsage = process.memoryUsage();
    return memoryUsage.heapUsed < this.config.maxMemoryUsage;
  }

  /**
   * Get current memory usage percentage
   * @returns Memory usage as percentage of limit
   */
  getMemoryUsagePercent(): number {
    const memoryUsage = process.memoryUsage();
    return (memoryUsage.heapUsed / this.config.maxMemoryUsage) * 100;
  }
}