import type { Browser, Page } from 'playwright';
import { ToolHandler, ToolContext, ToolResponse, createErrorResponse } from '../common/types.js';

/**
 * Base class for all browser-based tools
 * Provides common functionality and error handling
 */
export abstract class BrowserToolBase implements ToolHandler {
  protected server: any;

  constructor(server: any) {
    this.server = server;
  }

  /**
   * Main execution method that all tools must implement
   */
  abstract execute(args: any, context: ToolContext): Promise<ToolResponse>;

  /**
   * Ensures a page is available and returns it
   * @param context The tool context containing browser and page
   * @returns The page or null if not available
   */
  protected ensurePage(context: ToolContext): Page | null {
    if (!context.page) {
      return null;
    }
    return context.page;
  }

  /**
   * Validates that a page is available and returns an error response if not
   * @param context The tool context
   * @returns Either null if page is available, or an error response
   */
  protected validatePageAvailable(context: ToolContext): ToolResponse | null {
    if (!this.ensurePage(context)) {
      return createErrorResponse("Browser page not initialized");
    }
    return null;
  }

  /**
   * Safely executes a browser operation with proper error handling
   * @param context The tool context
   * @param operation The async operation to perform
   * @returns The tool response
   */
  protected async safeExecute(
    context: ToolContext,
    operation: (page: Page) => Promise<ToolResponse>
  ): Promise<ToolResponse> {
    const pageError = this.validatePageAvailable(context);
    if (pageError) return pageError;

    try {
      // Verify browser is connected before proceeding
      if (context.browser && !context.browser.isConnected()) {
        // If browser exists but is disconnected, reset state
        const { resetBrowserState } = await import('../../toolHandler.js');
        resetBrowserState();
        return createErrorResponse("Browser is disconnected. Please retry the operation.");
      }

      // Check if page is closed
      if (context.page && context.page.isClosed()) {
        return createErrorResponse("Page is closed. Please retry the operation.");
      }

      return await operation(context.page!);
    } catch (error) {
      const errorMessage = (error as Error).message;
      
      // Check for common browser disconnection errors
      if (
        errorMessage.includes("Target page, context or browser has been closed") ||
        errorMessage.includes("Target closed") ||
        errorMessage.includes("Browser has been disconnected") ||
        errorMessage.includes("Protocol error") ||
        errorMessage.includes("Connection closed")
      ) {
        // Reset browser state on connection issues
        const { resetBrowserState } = await import('../../toolHandler.js');
        resetBrowserState();
        return createErrorResponse(`Browser connection error: ${errorMessage}. Connection has been reset - please retry the operation.`);
      }
      
      return createErrorResponse(`Operation failed: ${errorMessage}`);
    }
  }
} 