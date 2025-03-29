import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import SSEManager from './sse.js';

// Get SSE Manager instance
const sseManager = SSEManager.getInstance();

/**
 * Wraps the original handleToolCall function to add SSE notifications
 * 
 * @param originalHandler - Original tool handler function
 * @returns Wrapped handler function with SSE integration
 */
export function withSSENotifications(
  originalHandler: (name: string, args: any, server: any) => Promise<CallToolResult>
) {
  return async (name: string, args: any, server: any): Promise<CallToolResult> => {
    // Notify clients that a tool is being called
    sseManager.broadcast({
      event: 'tool_call_start',
      data: JSON.stringify({ 
        tool: name, 
        args: sanitizeArgs(args),
        timestamp: new Date().toISOString()
      })
    });

    try {
      // Call the original handler
      const result = await originalHandler(name, args, server);

      // Broadcast tool result via SSE
      sseManager.broadcast({
        event: 'tool_call_complete',
        data: JSON.stringify({
          tool: name,
          args: sanitizeArgs(args),
          success: !result.isError,
          timestamp: new Date().toISOString()
        })
      });

      return result;
    } catch (error) {
      // Notify about tool error via SSE
      sseManager.broadcast({
        event: 'tool_call_error',
        data: JSON.stringify({ 
          tool: name, 
          args: sanitizeArgs(args),
          error: (error as Error).message,
          timestamp: new Date().toISOString()
        })
      });

      // Re-throw the error to be handled by the original error handling
      throw error;
    }
  };
}

/**
 * Returns a safe copy of args for JSON serialization
 * Removes any sensitive data or complex objects that can't be serialized
 */
function sanitizeArgs(args: any): any {
  if (!args) return {};
  
  // Create a shallow copy
  const sanitized = { ...args };
  
  // Remove any sensitive fields
  if (sanitized.password) sanitized.password = '******';
  if (sanitized.token) sanitized.token = '******';
  
  return sanitized;
}

/**
 * Send a notification about browser events through SSE
 */
export function notifyBrowserEvent(event: string, details: any): void {
  sseManager.broadcast({
    event: `browser_${event}`,
    data: JSON.stringify({
      event,
      details,
      timestamp: new Date().toISOString()
    })
  });
}

/**
 * Notify when a screenshot is taken
 */
export function notifyScreenshot(name: string, hasSelector: boolean): void {
  sseManager.broadcast({
    event: 'screenshot_taken',
    data: JSON.stringify({
      name,
      type: hasSelector ? 'element' : 'page',
      timestamp: new Date().toISOString()
    })
  });
}

/**
 * Notify when console logs are updated
 */
export function notifyConsoleLogUpdate(count: number): void {
  sseManager.broadcast({
    event: 'console_logs_updated',
    data: JSON.stringify({
      count,
      timestamp: new Date().toISOString()
    })
  });
} 