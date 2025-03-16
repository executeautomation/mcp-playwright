import { BrowserToolBase } from './base.js';
import { ToolContext, ToolResponse, createSuccessResponse } from '../common/types.js';

/**
 * Tool for navigating to URLs
 */
export class NavigationTool extends BrowserToolBase {
  /**
   * Execute the navigation tool
   */
  async execute(args: any, context: ToolContext): Promise<ToolResponse> {
    return this.safeExecute(context, async (page) => {
      await page.goto(args.url, {
        timeout: args.timeout || 30000,
        waitUntil: args.waitUntil || "load"
      });
      
      return createSuccessResponse(`Navigated to ${args.url}`);
    });
  }
}

/**
 * Tool for closing the browser
 */
export class CloseBrowserTool extends BrowserToolBase {
  /**
   * Execute the close browser tool
   */
  async execute(args: any, context: ToolContext): Promise<ToolResponse> {
    if (context.browser) {
      await context.browser.close();
      return createSuccessResponse("Browser closed successfully");
    }
    
    return createSuccessResponse("No browser instance to close");
  }
} 