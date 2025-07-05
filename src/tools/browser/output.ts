
import { BrowserToolBase } from './base.js';
import { ToolContext, ToolResponse, createSuccessResponse, createErrorResponse } from '../common/types.js';

/**
 * Tool for taking screenshots
 */
export class ScreenshotTool extends BrowserToolBase {
  private screenshots = new Map<string, string>();

  async execute(args: any, context: ToolContext): Promise<ToolResponse> {
    return this.safeExecute(context, async (page) => {
      const { path, fullPage = false, selector } = args;
      
      if (selector) {
        // Screenshot specific element
        const element = page.locator(selector);
        await element.screenshot({ path });
        this.screenshots.set(selector, path);
        return createSuccessResponse(`Element screenshot saved to: ${path}`);
      } else {
        // Screenshot full page or viewport
        await page.screenshot({ path, fullPage });
        this.screenshots.set('fullpage', path);
        return createSuccessResponse(`Screenshot saved to: ${path}`);
      }
    });
  }

  getScreenshots(): Map<string, string> {
    return this.screenshots;
  }
}

/**
 * Tool for getting page HTML content
 */
export class GetPageContentTool extends BrowserToolBase {
  async execute(args: any, context: ToolContext): Promise<ToolResponse> {
    return this.safeExecute(context, async (page) => {
      const { selector } = args;
      
      if (selector) {
        const content = await page.locator(selector).innerHTML();
        return createSuccessResponse([
          `HTML content of element ${selector}:`,
          content
        ]);
      } else {
        const content = await page.content();
        return createSuccessResponse([
          'Full page HTML content:',
          content
        ]);
      }
    });
  }
}

/**
 * Tool for getting text content
 */
export class GetTextContentTool extends BrowserToolBase {
  async execute(args: any, context: ToolContext): Promise<ToolResponse> {
    return this.safeExecute(context, async (page) => {
      const { selector } = args;
      
      if (selector) {
        const text = await page.locator(selector).textContent();
        return createSuccessResponse([
          `Text content of element ${selector}:`,
          text || '(empty)'
        ]);
      } else {
        const text = await page.locator('body').textContent();
        return createSuccessResponse([
          'Full page text content:',
          text || '(empty)'
        ]);
      }
    });
  }
}

/**
 * Tool for getting element attributes
 */
export class GetElementAttributeTool extends BrowserToolBase {
  async execute(args: any, context: ToolContext): Promise<ToolResponse> {
    return this.safeExecute(context, async (page) => {
      const { selector, attribute } = args;
      
      const value = await page.locator(selector).getAttribute(attribute);
      return createSuccessResponse([
        `Attribute '${attribute}' of element ${selector}:`,
        value || '(not found)'
      ]);
    });
  }
}

/**
 * Tool for getting page title
 */
export class GetPageTitleTool extends BrowserToolBase {
  async execute(args: any, context: ToolContext): Promise<ToolResponse> {
    return this.safeExecute(context, async (page) => {
      const title = await page.title();
      return createSuccessResponse(`Page title: ${title}`);
    });
  }
}

/**
 * Tool for getting current URL
 */
export class GetCurrentUrlTool extends BrowserToolBase {
  async execute(args: any, context: ToolContext): Promise<ToolResponse> {
    return this.safeExecute(context, async (page) => {
      const url = page.url();
      return createSuccessResponse(`Current URL: ${url}`);
    });
  }
}

/**
 * Tool for waiting for elements
 */
export class WaitForElementTool extends BrowserToolBase {
  async execute(args: any, context: ToolContext): Promise<ToolResponse> {
    return this.safeExecute(context, async (page) => {
      const { selector, timeout = 30000, state = 'visible' } = args;
      
      await page.locator(selector).waitFor({ 
        state: state as any, 
        timeout 
      });
      
      return createSuccessResponse(`Element ${selector} is now ${state}`);
    });
  }
}

/**
 * Tool for waiting with timeout
 */
export class WaitForTimeoutTool extends BrowserToolBase {
  async execute(args: any, context: ToolContext): Promise<ToolResponse> {
    return this.safeExecute(context, async (page) => {
      const { timeout } = args;
      
      await page.waitForTimeout(timeout);
      return createSuccessResponse(`Waited for ${timeout}ms`);
    });
  }
}
