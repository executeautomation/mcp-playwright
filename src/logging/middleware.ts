import { Logger } from './logger';
import { RequestLogContext } from './types';
import { randomUUID } from 'crypto';

/**
 * Request/Response Logging Middleware
 * Provides comprehensive logging for all MCP requests and responses
 */
export class RequestLoggingMiddleware {
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Generate unique request ID for tracing
   * @returns Unique request identifier
   */
  generateRequestId(): string {
    return randomUUID();
  }

  /**
   * Wrap a request handler with logging middleware
   * @param handlerName Name of the handler for logging
   * @param handler Original handler function
   * @returns Wrapped handler with logging
   */
  wrapHandler<T, R>(
    handlerName: string,
    handler: (request: T) => Promise<R>
  ): (request: T) => Promise<R> {
    return async (request: T): Promise<R> => {
      const requestId = this.generateRequestId();
      const startTime = Date.now();
      
      // Set request ID in logger context
      this.logger.setRequestId(requestId);

      // Log incoming request
      const requestContext: RequestLogContext = {
        method: handlerName,
        url: handlerName,
        body: this.sanitizeRequestBody(request),
        clientIp: this.extractClientInfo(request),
      };

      this.logger.logRequest(`Incoming ${handlerName} request`, requestContext);

      try {
        // Execute the original handler
        const result = await handler(request);
        const duration = Date.now() - startTime;

        // Log successful response
        const responseContext: RequestLogContext = {
          ...requestContext,
          statusCode: 200,
          duration,
        };

        this.logger.logRequest(`${handlerName} request completed successfully`, responseContext);

        return result;
      } catch (error) {
        const duration = Date.now() - startTime;

        // Log error response
        const errorContext: RequestLogContext = {
          ...requestContext,
          statusCode: 500,
          duration,
        };

        this.logger.logError(
          `${handlerName} request failed`,
          error as Error,
          {
            ...errorContext,
            category: this.categorizeError(error as Error),
          }
        );

        throw error;
      } finally {
        // Clear request ID from logger context
        this.logger.clearRequestId();
      }
    };
  }

  /**
   * Wrap tool call handler with enhanced logging
   * @param handler Original tool call handler
   * @returns Wrapped handler with tool-specific logging
   */
  wrapToolHandler(
    handler: (name: string, args: any, server: any) => Promise<any>
  ): (name: string, args: any, server: any) => Promise<any> {
    return async (name: string, args: any, server: any): Promise<any> => {
      const requestId = this.generateRequestId();
      const startTime = Date.now();
      
      // Set request ID in logger context
      this.logger.setRequestId(requestId);

      // Log tool execution start
      const requestContext: RequestLogContext = {
        method: 'TOOL_CALL',
        url: name,
        body: this.sanitizeToolArgs(name, args),
      };

      this.logger.logRequest(`Tool execution started: ${name}`, requestContext);

      try {
        // Execute the original handler
        const result = await handler(name, args, server);
        const duration = Date.now() - startTime;

        // Log successful tool execution
        const responseContext: RequestLogContext = {
          ...requestContext,
          statusCode: result.isError ? 500 : 200,
          duration,
        };

        if (result.isError) {
          this.logger.warn(`Tool execution completed with error: ${name}`, responseContext);
        } else {
          this.logger.logRequest(`Tool execution completed successfully: ${name}`, responseContext);
        }

        return result;
      } catch (error) {
        const duration = Date.now() - startTime;

        // Log tool execution error
        const errorContext: RequestLogContext = {
          ...requestContext,
          statusCode: 500,
          duration,
        };

        // Capture enhanced error context
        const enhancedContext = this.captureErrorContext(error as Error, name, args);
        
        this.logger.logError(
          `Tool execution failed: ${name}`,
          error as Error,
          {
            ...errorContext,
            ...enhancedContext,
          }
        );

        throw error;
      } finally {
        // Clear request ID from logger context
        this.logger.clearRequestId();
      }
    };
  }

  /**
   * Sanitize request body for logging (remove sensitive data)
   * @param request Request object
   * @returns Sanitized request data
   */
  private sanitizeRequestBody(request: any): any {
    if (!request) return request;

    // Create a deep copy to avoid modifying original
    const sanitized = JSON.parse(JSON.stringify(request));

    // Remove or mask sensitive fields
    if (sanitized.params) {
      // Remove potential passwords, tokens, etc.
      const sensitiveFields = ['password', 'token', 'secret', 'key', 'auth'];
      sensitiveFields.forEach(field => {
        if (sanitized.params[field]) {
          sanitized.params[field] = '[REDACTED]';
        }
      });
    }

    return sanitized;
  }

  /**
   * Sanitize tool arguments for logging
   * @param toolName Tool name
   * @param args Tool arguments
   * @returns Sanitized arguments
   */
  private sanitizeToolArgs(toolName: string, args: any): any {
    if (!args) return args;

    // Create a deep copy
    const sanitized = JSON.parse(JSON.stringify(args));

    // Tool-specific sanitization
    switch (toolName) {
      case 'playwright_fill':
        // Don't log potentially sensitive form data
        if (sanitized.text && typeof sanitized.text === 'string' && sanitized.text.length > 100) {
          sanitized.text = `[TRUNCATED:${sanitized.text.length}chars]`;
        }
        break;
      
      case 'playwright_evaluate':
        // Truncate long JavaScript code
        if (sanitized.script && sanitized.script.length > 500) {
          sanitized.script = `[TRUNCATED:${sanitized.script.length}chars]`;
        }
        break;

      case 'playwright_post':
      case 'playwright_put':
      case 'playwright_patch':
        // Sanitize request bodies
        if (sanitized.body) {
          if (typeof sanitized.body === 'string' && sanitized.body.length > 1000) {
            sanitized.body = `[TRUNCATED:${sanitized.body.length}chars]`;
          } else if (typeof sanitized.body === 'object') {
            // Remove sensitive fields from request bodies
            const sensitiveFields = ['password', 'token', 'secret', 'key', 'auth'];
            sensitiveFields.forEach(field => {
              if (sanitized.body[field]) {
                sanitized.body[field] = '[REDACTED]';
              }
            });
          }
        }
        break;
    }

    return sanitized;
  }

  /**
   * Extract client information from request
   * @param request Request object
   * @returns Client IP or identifier
   */
  private extractClientInfo(request: any): string | undefined {
    // For MCP over STDIO, we don't have traditional HTTP headers
    // This could be enhanced if running over HTTP transport
    return 'stdio-client';
  }

  /**
   * Categorize errors for better logging
   * @param error Error object
   * @returns Error category
   */
  private categorizeError(error: Error): 'validation' | 'system' | 'unknown' {
    const message = error.message.toLowerCase();
    
    if (message.includes('invalid') || message.includes('validation') || message.includes('required')) {
      return 'validation';
    }
    
    if (message.includes('browser') || message.includes('page') || message.includes('connection')) {
      return 'system';
    }
    
    return 'unknown';
  }

  /**
   * Categorize tool-specific errors
   * @param toolName Tool name
   * @param error Error object
   * @returns Error category
   */
  private categorizeToolError(toolName: string, error: Error): 'validation' | 'resource' | 'system' | 'authentication' | 'authorization' | 'rate_limit' | 'unknown' {
    const message = error.message.toLowerCase();
    const stack = error.stack?.toLowerCase() || '';
    
    // Validation errors
    if (message.includes('invalid') || message.includes('validation') || message.includes('required') ||
        message.includes('missing parameter') || message.includes('malformed')) {
      return 'validation';
    }
    
    // Resource/browser errors
    if (message.includes('browser') || message.includes('page') || message.includes('connection') || 
        message.includes('closed') || message.includes('disconnected') || message.includes('target') ||
        message.includes('protocol error') || message.includes('websocket')) {
      return 'resource';
    }
    
    // Authentication/Authorization errors
    if (message.includes('unauthorized') || message.includes('forbidden') || message.includes('access denied') ||
        message.includes('authentication') || message.includes('permission')) {
      return 'authentication';
    }
    
    // Rate limiting errors
    if (message.includes('rate limit') || message.includes('too many requests') || message.includes('throttle')) {
      return 'rate_limit';
    }
    
    // System/timeout errors
    if (toolName.startsWith('playwright_') && (message.includes('timeout') || message.includes('element') ||
        message.includes('navigation') || message.includes('waiting') || stack.includes('timeout'))) {
      return 'system';
    }
    
    return 'unknown';
  }

  /**
   * Capture enhanced error context
   * @param error Error object
   * @param toolName Optional tool name
   * @param args Optional tool arguments
   * @returns Enhanced error context
   */
  captureErrorContext(error: Error, toolName?: string, args?: any): Record<string, any> {
    const context: Record<string, any> = {
      errorName: error.name,
      errorMessage: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime(),
    };

    // Add tool-specific context
    if (toolName) {
      context.toolName = toolName;
      context.toolCategory = toolName.split('_')[0]; // e.g., 'playwright' from 'playwright_click'
      context.errorCategory = this.categorizeToolError(toolName, error);
      
      // Add sanitized arguments
      if (args) {
        context.toolArgs = this.sanitizeToolArgs(toolName, args);
      }
    }

    // Add browser-specific context for playwright tools
    if (toolName?.startsWith('playwright_')) {
      context.browserContext = this.captureBrowserContext(error);
    }

    return context;
  }

  /**
   * Capture browser-specific error context
   * @param error Error object
   * @returns Browser context information
   */
  private captureBrowserContext(error: Error): Record<string, any> {
    const context: Record<string, any> = {};
    const message = error.message.toLowerCase();
    const stack = error.stack?.toLowerCase() || '';

    // Detect browser state issues
    if (message.includes('closed') || message.includes('disconnected')) {
      context.browserState = 'disconnected';
    } else if (message.includes('timeout')) {
      context.browserState = 'timeout';
    } else if (message.includes('navigation')) {
      context.browserState = 'navigation_error';
    } else {
      context.browserState = 'unknown';
    }

    // Extract timeout information
    const timeoutMatch = message.match(/timeout (\d+)ms/);
    if (timeoutMatch) {
      context.timeoutMs = parseInt(timeoutMatch[1]);
    }

    // Extract selector information
    const selectorMatch = message.match(/selector "([^"]+)"/);
    if (selectorMatch) {
      context.selector = selectorMatch[1];
    }

    return context;
  }

  /**
   * Log system startup information
   * @param serverInfo Server information
   */
  logServerStartup(serverInfo: { name: string; version: string; capabilities: any }): void {
    this.logger.info('MCP Server starting up', {
      serverName: serverInfo.name,
      serverVersion: serverInfo.version,
      capabilities: serverInfo.capabilities,
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
    });
  }

  /**
   * Log system shutdown information
   */
  logServerShutdown(): void {
    this.logger.info('MCP Server shutting down', {
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
    });
  }
}