/**
 * Log Entry Structure
 */
export interface LogEntry {
  /** ISO timestamp string */
  timestamp: string;
  /** Log level */
  level: 'debug' | 'info' | 'warn' | 'error';
  /** Log message */
  message: string;
  /** Additional context data */
  context?: Record<string, any>;
  /** Request ID for tracing */
  requestId?: string;
  /** User ID for attribution */
  userId?: string;
  /** Error stack trace if applicable */
  stack?: string;
}

/**
 * Logger Configuration
 */
export interface LoggerConfig {
  /** Minimum log level to output */
  level: 'debug' | 'info' | 'warn' | 'error';
  /** Output format */
  format: 'json' | 'text';
  /** Output destinations */
  outputs: ('console' | 'file')[];
  /** File path for file output */
  filePath?: string;
  /** Maximum file size before rotation */
  maxFileSize?: number;
  /** Maximum number of log files to keep */
  maxFiles?: number;
}

/**
 * Request Logging Context
 */
export interface RequestLogContext {
  /** HTTP method */
  method?: string;
  /** Request URL or path */
  url?: string;
  /** Request headers */
  headers?: Record<string, string>;
  /** Request body (sanitized) */
  body?: any;
  /** Response status code */
  statusCode?: number;
  /** Request duration in milliseconds */
  duration?: number;
  /** Client IP address */
  clientIp?: string;
  /** User agent */
  userAgent?: string;
}

/**
 * Error Logging Context
 */
export interface ErrorLogContext extends RequestLogContext {
  /** Error name */
  errorName?: string;
  /** Error code */
  errorCode?: string;
  /** Error category */
  category?: 'validation' | 'authentication' | 'authorization' | 'rate_limit' | 'resource' | 'system' | 'unknown';
}