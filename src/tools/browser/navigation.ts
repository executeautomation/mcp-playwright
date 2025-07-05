
import { BrowserToolBase } from './base.js';
import { ToolContext, ToolResponse, createSuccessResponse, createErrorResponse } from '../common/types.js';

/**
 * Tool for navigating to URLs
 */
export class GotoTool extends BrowserToolBase {
  async execute(args: any, context: ToolContext): Promise<ToolResponse> {
    return this.safeExecute(context, async (page) => {
      const { url, waitUntil = 'load' } = args;
      
      if (!url) {
        return createErrorResponse('URL is required');
      }
      
      // Ensure URL has protocol
      const finalUrl = url.startsWith('http') ? url : `https://${url}`;
      
      await page.goto(finalUrl, { waitUntil });
      return createSuccessResponse(`Navigated to: ${finalUrl}`);
    });
  }
}

/**
 * Tool for going back in browser history
 */
export class GoBackTool extends BrowserToolBase {
  async execute(args: any, context: ToolContext): Promise<ToolResponse> {
    return this.safeExecute(context, async (page) => {
      await page.goBack();
      return createSuccessResponse(`Navigated back to: ${page.url()}`);
    });
  }
}

/**
 * Tool for going forward in browser history
 */
export class GoForwardTool extends BrowserToolBase {
  async execute(args: any, context: ToolContext): Promise<ToolResponse> {
    return this.safeExecute(context, async (page) => {
      await page.goForward();
      return createSuccessResponse(`Navigated forward to: ${page.url()}`);
    });
  }
}

/**
 * Tool for reloading the current page
 */
export class ReloadTool extends BrowserToolBase {
  async execute(args: any, context: ToolContext): Promise<ToolResponse> {
    return this.safeExecute(context, async (page) => {
      const { ignoreCache = false } = args;
      
      await page.reload({ 
        waitUntil: 'load',
        ...(ignoreCache && { timeout: 30000 })
      });
      
      return createSuccessResponse(`Page reloaded: ${page.url()}`);
    });
  }
}
