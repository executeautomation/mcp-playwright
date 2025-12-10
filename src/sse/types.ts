/**
 * SSE Server Configuration Interface
 */
export interface SSEServerConfig {
  /** Port to bind the SSE server to. If not specified, will auto-detect available port */
  port?: number;
  /** Maximum number of concurrent SSE connections */
  maxConnections: number;
  /** Interval in milliseconds for sending heartbeat messages */
  heartbeatInterval: number;
  /** Allowed CORS origins for SSE connections */
  corsOrigins: string[];
}

/**
 * SSE Event Structure
 */
export interface SSEEvent {
  /** Event type identifier */
  type: string;
  /** Event payload data */
  data: any;
  /** Event timestamp */
  timestamp: number;
  /** Optional event ID for client-side deduplication */
  id?: string;
}

/**
 * SSE Event Types Enumeration
 */
export enum SSEEventType {
  BROWSER_LAUNCHED = 'browser.launched',
  BROWSER_CLOSED = 'browser.closed',
  NAVIGATION_START = 'navigation.start',
  NAVIGATION_COMPLETE = 'navigation.complete',
  TOOL_EXECUTION_START = 'tool.execution.start',
  TOOL_EXECUTION_COMPLETE = 'tool.execution.complete',
  ERROR_OCCURRED = 'error.occurred',
  SYSTEM_STATUS = 'system.status',
  RATE_LIMIT_EXCEEDED = 'rate_limit.exceeded'
}

/**
 * SSE Client Connection Information
 */
export interface SSEClient {
  /** Unique client identifier */
  id: string;
  /** Connection timestamp */
  connectedAt: number;
  /** Client IP address */
  ipAddress: string;
  /** User agent string */
  userAgent?: string;
}