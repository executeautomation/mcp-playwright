/**
 * Rate Limit Configuration
 */
export interface RateLimitConfig {
  /** Time window in milliseconds */
  windowMs: number;
  /** Maximum requests allowed in the window */
  maxRequests: number;
  /** Maximum concurrent browser instances */
  maxBrowsers: number;
  /** Skip counting successful requests */
  skipSuccessfulRequests: boolean;
  /** Function to generate rate limit key from request */
  keyGenerator: (req: any) => string;
  /** Custom message for rate limit exceeded */
  message?: string;
  /** Headers to include in rate limit response */
  standardHeaders?: boolean;
}

/**
 * Rate Limit Check Result
 */
export interface RateLimitResult {
  /** Whether the request is allowed */
  allowed: boolean;
  /** Number of requests remaining in current window */
  remaining: number;
  /** Timestamp when the rate limit resets */
  resetTime: number;
  /** Seconds to wait before retrying (if not allowed) */
  retryAfter?: number;
  /** Total requests allowed in window */
  limit: number;
  /** Current request count in window */
  current: number;
}

/**
 * Rate Limit Store Entry
 */
export interface RateLimitEntry {
  /** Request count in current window */
  count: number;
  /** Window start timestamp */
  windowStart: number;
  /** First request timestamp in window */
  firstRequest: number;
}

/**
 * Rate Limit Categories
 */
export enum RateLimitCategory {
  BROWSER = 'browser',
  API = 'api',
  SCREENSHOT = 'screenshot',
  NAVIGATION = 'navigation',
  INTERACTION = 'interaction',
  GENERAL = 'general'
}

/**
 * Rate Limit Statistics
 */
export interface RateLimitStats {
  /** Total requests processed */
  totalRequests: number;
  /** Total requests blocked */
  blockedRequests: number;
  /** Active rate limit entries */
  activeEntries: number;
  /** Statistics by category */
  byCategory: Record<string, {
    requests: number;
    blocked: number;
  }>;
  /** Current timestamp */
  timestamp: number;
}

/**
 * Resource Limit Configuration
 */
export interface ResourceLimitConfig {
  /** Maximum concurrent browser instances */
  maxBrowsers: number;
  /** Maximum memory usage in bytes */
  maxMemoryUsage: number;
  /** Maximum CPU usage percentage */
  maxCpuUsage: number;
  /** Enable resource monitoring */
  enableMonitoring: boolean;
}