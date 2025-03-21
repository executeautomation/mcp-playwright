import type { Browser, Page } from 'playwright';
import { chromium, firefox, webkit, request } from 'playwright';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { BROWSER_TOOLS, API_TOOLS } from './tools.js';
import type { ToolContext } from './tools/common/types.js';
import { 
  ScreenshotTool,
  NavigationTool,
  CloseBrowserTool,
  ConsoleLogsTool,
  ExpectResponseTool,
  AssertResponseTool,
  CustomUserAgentTool
} from './tools/browser/index.js';
import {
  ClickTool,
  IframeClickTool,
  FillTool,
  SelectTool,
  HoverTool,
  EvaluateTool
} from './tools/browser/interaction.js';
import {
  GetRequestTool,
  PostRequestTool,
  PutRequestTool,
  PatchRequestTool,
  DeleteRequestTool
} from './tools/api/requests.js';

// Global state
let browser: Browser | undefined;
let page: Page | undefined;
let currentBrowserType: 'chromium' | 'firefox' | 'webkit' = 'chromium';

/**
 * Resets browser and page variables
 * Used when browser is closed
 */
export function resetBrowserState() {
  browser = undefined;
  page = undefined;
  currentBrowserType = 'chromium';
}

// Tool instances
let screenshotTool: ScreenshotTool;
let navigationTool: NavigationTool;
let closeBrowserTool: CloseBrowserTool;
let consoleLogsTool: ConsoleLogsTool;
let clickTool: ClickTool;
let iframeClickTool: IframeClickTool;
let fillTool: FillTool;
let selectTool: SelectTool;
let hoverTool: HoverTool;
let evaluateTool: EvaluateTool;
let expectResponseTool: ExpectResponseTool;
let assertResponseTool: AssertResponseTool;
let customUserAgentTool: CustomUserAgentTool;
let getRequestTool: GetRequestTool;
let postRequestTool: PostRequestTool;
let putRequestTool: PutRequestTool;
let patchRequestTool: PatchRequestTool;
let deleteRequestTool: DeleteRequestTool;

interface BrowserSettings {
  viewport?: {
    width?: number;
    height?: number;
  };
  userAgent?: string;
  headless?: boolean;
  browserType?: 'chromium' | 'firefox' | 'webkit';
}

/**
 * Ensures a browser is launched and returns the page
 */
async function ensureBrowser(browserSettings?: BrowserSettings) {
  try {
    // Check if browser exists but is disconnected
    if (browser && !browser.isConnected()) {
      console.error("Browser exists but is disconnected. Cleaning up...");
      try {
        await browser.close().catch(err => console.error("Error closing disconnected browser:", err));
      } catch (e) {
        // Ignore errors when closing disconnected browser
      }
      // Reset browser and page references
      resetBrowserState();
    }

    // Launch new browser if needed
    if (!browser) {
      const { viewport, userAgent, headless = false, browserType = 'chromium' } = browserSettings ?? {};
      
      // If browser type is changing, force a new browser instance
      if (browser && currentBrowserType !== browserType) {
        try {
          await browser.close().catch(err => console.error("Error closing browser on type change:", err));
        } catch (e) {
          // Ignore errors
        }
        resetBrowserState();
      }
      
      console.error(`Launching new ${browserType} browser instance...`);
      
      // Use the appropriate browser engine
      let browserInstance;
      switch (browserType) {
        case 'firefox':
          browserInstance = firefox;
          break;
        case 'webkit':
          browserInstance = webkit;
          break;
        case 'chromium':
        default:
          browserInstance = chromium;
          break;
      }
      
      browser = await browserInstance.launch({ headless });
      currentBrowserType = browserType;

      // Add cleanup logic when browser is disconnected
      browser.on('disconnected', () => {
        console.error("Browser disconnected event triggered");
        browser = undefined;
        page = undefined;
      });

      const context = await browser.newContext({
        ...userAgent && { userAgent },
        viewport: {
          width: viewport?.width ?? 1280,
          height: viewport?.height ?? 720,
        },
        deviceScaleFactor: 1,
      });

      page = await context.newPage();

      // Register console message handler
      page.on("console", (msg) => {
        if (consoleLogsTool) {
          consoleLogsTool.registerConsoleMessage(msg.type(), msg.text());
        }
      });
    }
    
    // Verify page is still valid
    if (!page || page.isClosed()) {
      console.error("Page is closed or invalid. Creating new page...");
      // Create a new page if the current one is invalid
      const context = browser.contexts()[0] || await browser.newContext();
      page = await context.newPage();
      
      // Re-register console message handler
      page.on("console", (msg) => {
        if (consoleLogsTool) {
          consoleLogsTool.registerConsoleMessage(msg.type(), msg.text());
        }
      });
    }
    
    return page!;
  } catch (error) {
    console.error("Error ensuring browser:", error);
    // If something went wrong, clean up completely and retry once
    try {
      if (browser) {
        await browser.close().catch(() => {});
      }
    } catch (e) {
      // Ignore errors during cleanup
    }
    
    resetBrowserState();
    
    // Try one more time from scratch
    const { viewport, userAgent, headless = false, browserType = 'chromium' } = browserSettings ?? {};
    
    // Use the appropriate browser engine
    let browserInstance;
    switch (browserType) {
      case 'firefox':
        browserInstance = firefox;
        break;
      case 'webkit':
        browserInstance = webkit;
        break;
      case 'chromium':
      default:
        browserInstance = chromium;
        break;
    }
    
    browser = await browserInstance.launch({ headless });
    currentBrowserType = browserType;
    
    browser.on('disconnected', () => {
      console.error("Browser disconnected event triggered (retry)");
      browser = undefined;
      page = undefined;
    });

    const context = await browser.newContext({
      ...userAgent && { userAgent },
      viewport: {
        width: viewport?.width ?? 1280,
        height: viewport?.height ?? 720,
      },
      deviceScaleFactor: 1,
    });

    page = await context.newPage();
    
    page.on("console", (msg) => {
      if (consoleLogsTool) {
        consoleLogsTool.registerConsoleMessage(msg.type(), msg.text());
      }
    });
    
    return page!;
  }
}

/**
 * Creates a new API request context
 */
async function ensureApiContext(url: string) {
  return await request.newContext({
    baseURL: url,
  });
}

/**
 * Initialize all tool instances
 */
function initializeTools(server: any) {
  // Browser tools
  if (!screenshotTool) screenshotTool = new ScreenshotTool(server);
  if (!navigationTool) navigationTool = new NavigationTool(server);
  if (!closeBrowserTool) closeBrowserTool = new CloseBrowserTool(server);
  if (!consoleLogsTool) consoleLogsTool = new ConsoleLogsTool(server);
  if (!clickTool) clickTool = new ClickTool(server);
  if (!iframeClickTool) iframeClickTool = new IframeClickTool(server);
  if (!fillTool) fillTool = new FillTool(server);
  if (!selectTool) selectTool = new SelectTool(server);
  if (!hoverTool) hoverTool = new HoverTool(server);
  if (!evaluateTool) evaluateTool = new EvaluateTool(server);
  if (!expectResponseTool) expectResponseTool = new ExpectResponseTool(server);
  if (!assertResponseTool) assertResponseTool = new AssertResponseTool(server);
  if (!customUserAgentTool) customUserAgentTool = new CustomUserAgentTool(server);
  
  // API tools
  if (!getRequestTool) getRequestTool = new GetRequestTool(server);
  if (!postRequestTool) postRequestTool = new PostRequestTool(server);
  if (!putRequestTool) putRequestTool = new PutRequestTool(server);
  if (!patchRequestTool) patchRequestTool = new PatchRequestTool(server);
  if (!deleteRequestTool) deleteRequestTool = new DeleteRequestTool(server);
}

/**
 * Main handler for tool calls
 */
export async function handleToolCall(
  name: string,
  args: any,
  server: any
): Promise<CallToolResult> {
  // Initialize tools
  initializeTools(server);

  // Special case for browser close to ensure it always works
  if (name === "playwright_close") {
    if (browser) {
      try {
        if (browser.isConnected()) {
          await browser.close().catch(e => console.error("Error closing browser:", e));
        }
      } catch (error) {
        console.error("Error during browser close in handler:", error);
      } finally {
        resetBrowserState();
      }
      return {
        content: [{
          type: "text",
          text: "Browser closed successfully",
        }],
        isError: false,
      };
    }
    return {
      content: [{
        type: "text",
        text: "No browser instance to close",
      }],
      isError: false,
    };
  }

  // Check if we have a disconnected browser that needs cleanup
  if (browser && !browser.isConnected() && BROWSER_TOOLS.includes(name)) {
    console.error("Detected disconnected browser before tool execution, cleaning up...");
    try {
      await browser.close().catch(() => {}); // Ignore errors
    } catch (e) {
      // Ignore any errors during cleanup
    }
    resetBrowserState();
  }

  // Prepare context based on tool requirements
  const context: ToolContext = {
    server
  };
  
  // Set up browser if needed
  if (BROWSER_TOOLS.includes(name)) {
    const browserSettings = {
      viewport: {
        width: args.width,
        height: args.height
      },
      userAgent: name === "playwright_custom_user_agent" ? args.userAgent : undefined,
      headless: args.headless,
      browserType: args.browserType || 'chromium'
    };
    
    try {
      context.page = await ensureBrowser(browserSettings);
      context.browser = browser;
    } catch (error) {
      console.error("Failed to ensure browser:", error);
      return {
        content: [{
          type: "text",
          text: `Failed to initialize browser: ${(error as Error).message}. Please try again.`,
        }],
        isError: true,
      };
    }
  }

  // Set up API context if needed
  if (API_TOOLS.includes(name)) {
    try {
      context.apiContext = await ensureApiContext(args.url);
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Failed to initialize API context: ${(error as Error).message}`,
        }],
        isError: true,
      };
    }
  }

  // Route to appropriate tool
  try {
    switch (name) {
      // Browser tools
      case "playwright_navigate":
        return await navigationTool.execute(args, context);
        
      case "playwright_screenshot":
        return await screenshotTool.execute(args, context);
        
      case "playwright_close":
        return await closeBrowserTool.execute(args, context);
        
      case "playwright_console_logs":
        return await consoleLogsTool.execute(args, context);
        
      case "playwright_click":
        return await clickTool.execute(args, context);
        
      case "playwright_iframe_click":
        return await iframeClickTool.execute(args, context);
        
      case "playwright_fill":
        return await fillTool.execute(args, context);
        
      case "playwright_select":
        return await selectTool.execute(args, context);
        
      case "playwright_hover":
        return await hoverTool.execute(args, context);
        
      case "playwright_evaluate":
        return await evaluateTool.execute(args, context);

      case "playwright_expect_response":
        return await expectResponseTool.execute(args, context);

      case "playwright_assert_response":
        return await assertResponseTool.execute(args, context);

      case "playwright_custom_user_agent":
        return await customUserAgentTool.execute(args, context);
        
      // API tools
      case "playwright_get":
        return await getRequestTool.execute(args, context);
        
      case "playwright_post":
        return await postRequestTool.execute(args, context);
        
      case "playwright_put":
        return await putRequestTool.execute(args, context);
        
      case "playwright_patch":
        return await patchRequestTool.execute(args, context);
        
      case "playwright_delete":
        return await deleteRequestTool.execute(args, context);
      
      default:
        return {
          content: [{
            type: "text",
            text: `Unknown tool: ${name}`,
          }],
          isError: true,
        };
    }
  } catch (error) {
    console.error(`Error executing tool ${name}:`, error);
    
    // Check if it's a browser connection error
    const errorMessage = (error as Error).message;
    if (
      BROWSER_TOOLS.includes(name) && 
      (errorMessage.includes("Target page, context or browser has been closed") || 
      errorMessage.includes("Browser has been disconnected") ||
      errorMessage.includes("Target closed") ||
      errorMessage.includes("Protocol error"))
    ) {
      // Reset browser state if it's a connection issue
      resetBrowserState();
      return {
        content: [{
          type: "text",
          text: `Browser connection error: ${errorMessage}. Browser state has been reset, please try again.`,
        }],
        isError: true,
      };
    }
    
    return {
      content: [{
        type: "text",
        text: `Tool execution error: ${errorMessage}`,
      }],
      isError: true,
    };
  }
}

/**
 * Get console logs
 */
export function getConsoleLogs(): string[] {
  return consoleLogsTool?.getConsoleLogs() ?? [];
}

/**
 * Get screenshots
 */
export function getScreenshots(): Map<string, string> {
  return screenshotTool?.getScreenshots() ?? new Map();
} 