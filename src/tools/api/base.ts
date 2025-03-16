import type { APIRequestContext } from 'playwright';
import { ToolHandler, ToolContext, ToolResponse, createErrorResponse } from '../common/types.js';

/**
 * Base class for all API-based tools
 * Provides common functionality and error handling
 */
export abstract class ApiToolBase implements ToolHandler {
  protected server: any;

  constructor(server: any) {
    this.server = server;
  }

  /**
   * Main execution method that all tools must implement
   */
  abstract execute(args: any, context: ToolContext): Promise<ToolResponse>;

  /**
   * Ensures an API context is available and returns it
   * @param context The tool context containing apiContext
   * @returns The apiContext or null if not available
   */
  protected ensureApiContext(context: ToolContext): APIRequestContext | null {
    if (!context.apiContext) {
      return null;
    }
    return context.apiContext;
  }

  /**
   * Validates that an API context is available and returns an error response if not
   * @param context The tool context
   * @returns Either null if apiContext is available, or an error response
   */
  protected validateApiContextAvailable(context: ToolContext): ToolResponse | null {
    if (!this.ensureApiContext(context)) {
      return createErrorResponse("API context not initialized");
    }
    return null;
  }

  /**
   * Safely executes an API operation with proper error handling
   * @param context The tool context
   * @param operation The async operation to perform
   * @returns The tool response
   */
  protected async safeExecute(
    context: ToolContext,
    operation: (apiContext: APIRequestContext) => Promise<ToolResponse>
  ): Promise<ToolResponse> {
    const apiError = this.validateApiContextAvailable(context);
    if (apiError) return apiError;

    try {
      return await operation(context.apiContext!);
    } catch (error) {
      return createErrorResponse(`API operation failed: ${(error as Error).message}`);
    }
  }
} 