import { BrowserToolBase } from './base.js';
import { ToolContext, ToolResponse, createSuccessResponse, createErrorResponse } from '../common/types.js';
import { setGlobalPage } from '../../toolHandler.js';
/**
 * Tool for clicking elements on the page
 */
export class ClickTool extends BrowserToolBase {
  /**
   * Execute the click tool
   */
  async execute(args: any, context: ToolContext): Promise<ToolResponse> {
    return this.safeExecute(context, async (page) => {
      await page.click(args.selector);      
      return createSuccessResponse(`Clicked element: ${args.selector}`);
    });
  }
}
/**
 * Tool for clicking a link and switching to the new tab
 */
export class ClickAndSwitchTabTool extends BrowserToolBase {
  /**
   * Execute the click and switch tab tool
   */
  async execute(args: any, context: ToolContext): Promise<ToolResponse> {
    
    return this.safeExecute(context, async (page) => {
      // Listen for a new tab to open
      const [newPage] = await Promise.all([
        //context.browser.waitForEvent('page'), // Wait for a new page (tab) to open
        page.context().waitForEvent('page'),// Wait for a new page (tab) to open
        page.click(args.selector), // Click the link that opens the new tab
      ]);

      // Wait for the new page to load
      await newPage.waitForLoadState('domcontentloaded');

      // Switch control to the new tab
      setGlobalPage(newPage);
      //page= newPage; // Update the current page to the new tab
      //context.page = newPage;
      //context.page.bringToFront(); // Bring the new tab to the front
      return createSuccessResponse(`Clicked link and switched to new tab: ${newPage.url()}`);
      //return createSuccessResponse(`Clicked link and switched to new tab: ${context.page.url()}`);
    });
  }
}
/**
 * Tool for clicking elements inside iframes
 */
export class IframeClickTool extends BrowserToolBase {
  /**
   * Execute the iframe click tool
   */
  async execute(args: any, context: ToolContext): Promise<ToolResponse> {
    return this.safeExecute(context, async (page) => {
      const frame = page.frameLocator(args.iframeSelector);
      if (!frame) {
        return createErrorResponse(`Iframe not found: ${args.iframeSelector}`);
      }
      
      await frame.locator(args.selector).click();
      return createSuccessResponse(`Clicked element ${args.selector} inside iframe ${args.iframeSelector}`);
    });
  }
}

/**
 * Tool for filling elements inside iframes
 */
export class IframeFillTool extends BrowserToolBase {
  /**
   * Execute the iframe fill tool
   */
  async execute(args: any, context: ToolContext): Promise<ToolResponse> {
    return this.safeExecute(context, async (page) => {
      const frame = page.frameLocator(args.iframeSelector);
      if (!frame) {
        return createErrorResponse(`Iframe not found: ${args.iframeSelector}`);
      }
      
      await frame.locator(args.selector).fill(args.value);
      return createSuccessResponse(`Filled element ${args.selector} inside iframe ${args.iframeSelector} with: ${args.value}`);
    });
  }
}

/**
 * Tool for filling form fields
 */
export class FillTool extends BrowserToolBase {
  /**
   * Execute the fill tool
   */
  async execute(args: any, context: ToolContext): Promise<ToolResponse> {
    return this.safeExecute(context, async (page) => {
      await page.waitForSelector(args.selector);
      await page.fill(args.selector, args.value);
      return createSuccessResponse(`Filled ${args.selector} with: ${args.value}`);
    });
  }
}

/**
 * Tool for selecting options from dropdown menus
 */
export class SelectTool extends BrowserToolBase {
  /**
   * Execute the select tool
   */
  async execute(args: any, context: ToolContext): Promise<ToolResponse> {
    return this.safeExecute(context, async (page) => {
      await page.waitForSelector(args.selector);
      await page.selectOption(args.selector, args.value);
      return createSuccessResponse(`Selected ${args.selector} with: ${args.value}`);
    });
  }
}

/**
 * Tool for hovering over elements
 */
export class HoverTool extends BrowserToolBase {
  /**
   * Execute the hover tool
   */
  async execute(args: any, context: ToolContext): Promise<ToolResponse> {
    return this.safeExecute(context, async (page) => {
      await page.waitForSelector(args.selector);
      await page.hover(args.selector);
      return createSuccessResponse(`Hovered ${args.selector}`);
    });
  }
}

/**
 * Tool for uploading files
 */
export class UploadFileTool extends BrowserToolBase {
  /**
   * Execute the upload file tool
   */
  async execute(args: any, context: ToolContext): Promise<ToolResponse> {
    return this.safeExecute(context, async (page) => {
        await page.waitForSelector(args.selector);
        await page.setInputFiles(args.selector, args.filePath);
        return createSuccessResponse(`Uploaded file '${args.filePath}' to '${args.selector}'`);
    });
  }
}

/**
 * Tool for executing JavaScript in the browser
 */
export class EvaluateTool extends BrowserToolBase {
  /**
   * Execute the evaluate tool
   */
  async execute(args: any, context: ToolContext): Promise<ToolResponse> {
    return this.safeExecute(context, async (page) => {
      const result = await page.evaluate(args.script);
      
      // Convert result to string for display
      let resultStr: string;
      try {
        resultStr = JSON.stringify(result, null, 2);
      } catch (error) {
        resultStr = String(result);
      }
      
      return createSuccessResponse([
        `Executed JavaScript:`,
        `${args.script}`,
        `Result:`,
        `${resultStr}`
      ]);
    });
  }
}

/**
 * Tool for dragging elements on the page
 */
export class DragTool extends BrowserToolBase {
  /**
   * Execute the drag tool
   */
  async execute(args: any, context: ToolContext): Promise<ToolResponse> {
    return this.safeExecute(context, async (page) => {
      const sourceElement = await page.waitForSelector(args.sourceSelector);
      const targetElement = await page.waitForSelector(args.targetSelector);
      
      const sourceBound = await sourceElement.boundingBox();
      const targetBound = await targetElement.boundingBox();
      
      if (!sourceBound || !targetBound) {
        return createErrorResponse("Could not get element positions for drag operation");
      }

      await page.mouse.move(
        sourceBound.x + sourceBound.width / 2,
        sourceBound.y + sourceBound.height / 2
      );
      await page.mouse.down();
      await page.mouse.move(
        targetBound.x + targetBound.width / 2,
        targetBound.y + targetBound.height / 2
      );
      await page.mouse.up();
      
      return createSuccessResponse(`Dragged element from ${args.sourceSelector} to ${args.targetSelector}`);
    });
  }
}

/**
 * Tool for pressing keyboard keys
 */
export class PressKeyTool extends BrowserToolBase {
  /**
   * Execute the key press tool
   */
  async execute(args: any, context: ToolContext): Promise<ToolResponse> {
    return this.safeExecute(context, async (page) => {
      if (args.selector) {
        await page.waitForSelector(args.selector);
        await page.focus(args.selector);
      }
      
      await page.keyboard.press(args.key);
      return createSuccessResponse(`Pressed key: ${args.key}`);
    });
  }
} 


/**
 * Tool for switching browser tabs
 */
// export class SwitchTabTool extends BrowserToolBase {
//   /**
//    * Switch the tab to the specified index
//    */
//   async execute(args: any, context: ToolContext): Promise<ToolResponse> {
//     return this.safeExecute(context, async (page) => {
//       const tabs = await browser.page;      

//       // Validate the tab index
//       const tabIndex = Number(args.index);
//       if (isNaN(tabIndex)) {
//         return createErrorResponse(`Invalid tab index: ${args.index}. It must be a number.`);
//       }

//       if (tabIndex >= 0 && tabIndex < tabs.length) {
//         await tabs[tabIndex].bringToFront();
//         return createSuccessResponse(`Switched to tab with index ${tabIndex}`);
//       } else {
//         return createErrorResponse(
//           `Tab index out of range: ${tabIndex}. Available tabs: 0 to ${tabs.length - 1}.`
//         );
//       }
//     });
//   }
// }