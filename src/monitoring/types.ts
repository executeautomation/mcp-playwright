/**
 * System Metrics Interface
 */
export interface Metrics {
  /** Total number of requests processed */
  requestCount: number;
  /** Total number of errors encountered */
  errorCount: number;
  /** Average response time in milliseconds */
  averageResponseTime: number;
  /** Number of active browser instances */
  activeBrowsers: number;
  /** Memory usage in bytes */
  memoryUsage: number;
  /** Server uptime in milliseconds */
  uptime: number;
  /** Number of active SSE connections */
  activeConnections: number;
  /** Rate limit violations count */
  rateLimitViolations: number;
}

/**
 * Health Check Status
 */
export interface HealthStatus {
  /** Overall system status */
  status: 'healthy' | 'degraded' | 'unhealthy';
  /** Individual health checks */
  checks: Record<string, HealthCheck>;
  /** Status timestamp */
  timestamp: number;
  /** System version */
  version?: string;
}

/**
 * Individual Health Check
 */
export interface HealthCheck {
  /** Check status */
  status: 'pass' | 'fail' | 'warn';
  /** Check description */
  description?: string;
  /** Check duration in milliseconds */
  duration?: number;
  /** Additional check data */
  data?: Record<string, any>;
}

/**
 * Performance Metrics Configuration
 */
export interface MonitoringConfig {
  /** Enable metrics collection */
  enabled: boolean;
  /** Metrics collection interval in milliseconds */
  metricsInterval: number;
  /** Health check interval in milliseconds */
  healthCheckInterval: number;
  /** Memory usage threshold for warnings (percentage) */
  memoryThreshold: number;
  /** Response time threshold for warnings (milliseconds) */
  responseTimeThreshold: number;
}

/**
 * Request Performance Data
 */
export interface RequestMetrics {
  /** Request duration in milliseconds */
  duration: number;
  /** Whether request was successful */
  success: boolean;
  /** Request timestamp */
  timestamp: number;
  /** Request type/category */
  category?: string;
  /** Response size in bytes */
  responseSize?: number;
}