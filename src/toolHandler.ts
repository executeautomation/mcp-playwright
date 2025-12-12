import type { Browser, Page } from 'playwright';
import { chromium, firefox, webkit, request } from 'playwright';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { BROWSER_TOOLS, API_TOOLS } from './tools.js';
import type { ToolContext } from './tools/common/types.js';
import { ActionRecorder } from './tools/codegen/recorder.js';
import { spawn } from 'child_process';
import { 
  startCodegenSession,
  endCodegenSession,
  getCodegenSession,
  clearCodegenSession
} from './tools/codegen/index.js';
import { 
  ScreenshotTool,
  NavigationTool,
  CloseBrowserTool,
  ConsoleLogsTool,
  ExpectResponseTool,
  AssertResponseTool,
  CustomUserAgentTool,
  ResizeTool
} from './tools/browser/index.js';
import {
  ClickTool,
  IframeClickTool,
  FillTool,
  SelectTool,
  HoverTool,
  EvaluateTool,
  IframeFillTool,
  UploadFileTool
} from './tools/browser/interaction.js';
import { 
  VisibleTextTool, 
  VisibleHtmlTool 
} from './tools/browser/visiblePage.js';
import {
  GetRequestTool,
  PostRequestTool,
  PutRequestTool,
  PatchRequestTool,
  DeleteRequestTool
} from './tools/api/requests.js';
import { GoBackTool, GoForwardTool } from './tools/browser/navigation.js';
import { DragTool, PressKeyTool } from './tools/browser/interaction.js';
import { SaveAsPdfTool } from './tools/browser/output.js';
import { ClickAndSwitchTabTool } from './tools/browser/interaction.js';

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
/**
 * Sets the provided page to the global page variable
 * @param newPage The Page object to set as the global page
 */
export function setGlobalPage(newPage: Page): void {
  page = newPage;
  page.bringToFront();// Bring the new tab to the front
}
// Tool instances
let screenshotTool: ScreenshotTool;
let navigationTool: NavigationTool;
let closeBrowserTool: CloseBrowserTool;
let consoleLogsTool: ConsoleLogsTool;
let clickTool: ClickTool;
let iframeClickTool: IframeClickTool;
let iframeFillTool: IframeFillTool;
let fillTool: FillTool;
let selectTool: SelectTool;
let hoverTool: HoverTool;
let uploadFileTool: UploadFileTool;
let evaluateTool: EvaluateTool;
let expectResponseTool: ExpectResponseTool;
let assertResponseTool: AssertResponseTool;
let customUserAgentTool: CustomUserAgentTool;
let visibleTextTool: VisibleTextTool;
let visibleHtmlTool: VisibleHtmlTool;
let resizeTool: ResizeTool;

let getRequestTool: GetRequestTool;
let postRequestTool: PostRequestTool;
let putRequestTool: PutRequestTool;
let patchRequestTool: PatchRequestTool;
let deleteRequestTool: DeleteRequestTool;

// Add these variables at the top with other tool declarations
let goBackTool: GoBackTool;
let goForwardTool: GoForwardTool;
let dragTool: DragTool;
let pressKeyTool: PressKeyTool;
let saveAsPdfTool: SaveAsPdfTool;
let clickAndSwitchTabTool: ClickAndSwitchTabTool;


interface BrowserSettings {
  viewport?: {
    width?: number;
    height?: number;
  };
  userAgent?: string;
  headless?: boolean;
  browserType?: 'chromium' | 'firefox' | 'webkit';
}

async function registerConsoleMessage(page) {
  page.on("console", (msg) => {
    if (consoleLogsTool) {
      const type = msg.type();
      const text = msg.text();

      // "Unhandled Rejection In Promise" we injected
      if (text.startsWith("[Playwright]")) {
        const payload = text.replace("[Playwright]", "");
        if (consoleLogsTool) {
          consoleLogsTool.registerConsoleMessage("exception", payload);
        }
      } else {
        if (consoleLogsTool) {
          consoleLogsTool.registerConsoleMessage(type, text);
        }
      }
    }
  });

  // Uncaught exception
  page.on("pageerror", (error) => {
    if (consoleLogsTool) {
      const message = error.message;
      const stack = error.stack || "";
      consoleLogsTool.registerConsoleMessage("exception", `${message}\n${stack}`);
    }
  });

  // Unhandled rejection in promise
  await page.addInitScript(() => {
    window.addEventListener("unhandledrejection", (event) => {
      const reason = event.reason;
      const message = typeof reason === "object" && reason !== null
          ? reason.message || JSON.stringify(reason)
          : String(reason);

      const stack = reason?.stack || "";
      // Use console.error get "Unhandled Rejection In Promise"
      console.error(`[Playwright][Unhandled Rejection In Promise] ${message}\n${stack}`);
    });
  });
}

/**
 * Attempts to install browsers automatically
 */
async function installBrowsers(browserType: string = 'chromium'): Promise<{ success: boolean; message: string }> {
  return new Promise((resolve) => {
    console.error(`[Playwright MCP] Attempting to install ${browserType} browser...`);
    
    const installProcess = spawn('npx', ['playwright', 'install', browserType], {
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let output = '';
    let errorOutput = '';

    installProcess.stdout?.on('data', (data) => {
      output += data.toString();
    });

    installProcess.stderr?.on('data', (data) => {
      errorOutput += data.toString();
    });

    installProcess.on('close', (code) => {
      if (code === 0) {
        console.error(`[Playwright MCP] Successfully installed ${browserType} browser`);
        resolve({
          success: true,
          message: `Successfully installed ${browserType} browser. Please try your request again.`
        });
      } else {
        console.error(`[Playwright MCP] Failed to install browser: ${errorOutput}`);
        resolve({
          success: false,
          message: `Failed to automatically install ${browserType} browser. Please run: npx playwright install ${browserType}`
        });
      }
    });

    installProcess.on('error', (error) => {
      console.error(`[Playwright MCP] Error during browser installation: ${error.message}`);
      resolve({
        success: false,
        message: `Error during installation: ${error.message}. Please run: npx playwright install ${browserType}`
      });
    });

    // Timeout after 2 minutes
    setTimeout(() => {
      installProcess.kill();
      resolve({
        success: false,
        message: `Browser installation timed out. Please run manually: npx playwright install ${browserType}`
      });
    }, 120000);
  });
}

/**
 * Ensures a browser is launched and returns the page
 */
export async function ensureBrowser(browserSettings?: BrowserSettings) {
  try {
    // Check if browser exists but is disconnected
    if (browser && !browser.isConnected()) {
      try {
        await browser.close().catch(() => {});
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
          await browser.close().catch(() => {});
        } catch (e) {
          // Ignore errors
        }
        resetBrowserState();
      }

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
      
      const executablePath = process.env.CHROME_EXECUTABLE_PATH;

      try {
        browser = await browserInstance.launch({
          headless,
          executablePath: executablePath
        });
        
        currentBrowserType = browserType;
      } catch (launchError: any) {
        // Check if error is due to missing browser executable
        if (launchError.message?.includes("Executable doesn't exist") || 
            launchError.message?.includes("Failed to launch") ||
            launchError.message?.includes("browserType.launch")) {
          
          console.error(`[Playwright MCP] Browser not found, attempting auto-installation...`);
          const installResult = await installBrowsers(browserType);
          
          if (installResult.success) {
            // Try launching again after installation
            browser = await browserInstance.launch({
              headless,
              executablePath: executablePath
            });
            currentBrowserType = browserType;
          } else {
            throw new Error(installResult.message);
          }
        } else {
          throw launchError;
        }
      }

      // Add cleanup logic when browser is disconnected
      browser.on('disconnected', () => {
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
      await registerConsoleMessage(page);
    }
    
    // Verify page is still valid
    if (!page || page.isClosed()) {
      // Create a new page if the current one is invalid
      const context = browser.contexts()[0] || await browser.newContext();
      page = await context.newPage();

      // Re-register console message handler
      await registerConsoleMessage(page);
    }

    return page!;
  } catch (error) {
    // If something went wrong, clean up completely and retry once
    try {
      if (browser) {
        await browser.close().catch(() => {});
      }
    } catch (e) {
      // Ignore errors during cleanup
    }
    
    resetBrowserState();
    
    // Check if error is due to missing browser, if so attempt install
    const errorMessage = (error as Error).message;
    if (errorMessage?.includes("Executable doesn't exist") || 
        errorMessage?.includes("Failed to launch") ||
        errorMessage?.includes("browserType.launch")) {
      
      const { browserType = 'chromium' } = browserSettings ?? {};
      console.error(`[Playwright MCP] Browser not found in retry, attempting auto-installation...`);
      const installResult = await installBrowsers(browserType);
      
      if (!installResult.success) {
        throw new Error(installResult.message);
      }
      // If installation successful, continue to retry
    }
    
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
    
    await registerConsoleMessage(page);
    
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
  if (!iframeFillTool) iframeFillTool = new IframeFillTool(server);
  if (!fillTool) fillTool = new FillTool(server);
  if (!selectTool) selectTool = new SelectTool(server);
  if (!hoverTool) hoverTool = new HoverTool(server);
  if (!uploadFileTool) uploadFileTool = new UploadFileTool(server);
  if (!evaluateTool) evaluateTool = new EvaluateTool(server);
  if (!expectResponseTool) expectResponseTool = new ExpectResponseTool(server);
  if (!assertResponseTool) assertResponseTool = new AssertResponseTool(server);
  if (!customUserAgentTool) customUserAgentTool = new CustomUserAgentTool(server);
  if (!visibleTextTool) visibleTextTool = new VisibleTextTool(server);
  if (!visibleHtmlTool) visibleHtmlTool = new VisibleHtmlTool(server);
  if (!resizeTool) resizeTool = new ResizeTool(server);
  
  // API tools
  if (!getRequestTool) getRequestTool = new GetRequestTool(server);
  if (!postRequestTool) postRequestTool = new PostRequestTool(server);
  if (!putRequestTool) putRequestTool = new PutRequestTool(server);
  if (!patchRequestTool) patchRequestTool = new PatchRequestTool(server);
  if (!deleteRequestTool) deleteRequestTool = new DeleteRequestTool(server);

  // Initialize new tools
  if (!goBackTool) goBackTool = new GoBackTool(server);
  if (!goForwardTool) goForwardTool = new GoForwardTool(server);
  if (!dragTool) dragTool = new DragTool(server);
  if (!pressKeyTool) pressKeyTool = new PressKeyTool(server);
  if (!saveAsPdfTool) saveAsPdfTool = new SaveAsPdfTool(server);
  if (!clickAndSwitchTabTool) clickAndSwitchTabTool = new ClickAndSwitchTabTool(server);
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

  try {
    // Handle codegen tools
    switch (name) {
      case 'start_codegen_session':
        return await handleCodegenResult(startCodegenSession.handler(args));
      case 'end_codegen_session':
        return await handleCodegenResult(endCodegenSession.handler(args));
      case 'get_codegen_session':
        return await handleCodegenResult(getCodegenSession.handler(args));
      case 'clear_codegen_session':
        return await handleCodegenResult(clearCodegenSession.handler(args));
    }

    // Record tool action if there's an active session
    const recorder = ActionRecorder.getInstance();
    const activeSession = recorder.getActiveSession();
    if (activeSession && name !== 'playwright_close') {
      recorder.recordAction(name, args);
    }

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
    switch (name) {
      // Browser tools
      case "playwright_navigate":
        return await navigationTool.execute(args, context);
        
      case "playwright_screenshot":
        return await screenshotTool.execute(args, context);
        
      case "playwright_resize":
        return await resizeTool.execute(args, context);

      case "playwright_close":
        return await closeBrowserTool.execute(args, context);
        
      case "playwright_console_logs":
        return await consoleLogsTool.execute(args, context);
        
      case "playwright_click":
        return await clickTool.execute(args, context);
        
      case "playwright_iframe_click":
        return await iframeClickTool.execute(args, context);

      case "playwright_iframe_fill":
        return await iframeFillTool.execute(args, context);
        
      case "playwright_fill":
        return await fillTool.execute(args, context);
        
      case "playwright_select":
        return await selectTool.execute(args, context);
        
      case "playwright_hover":
        return await hoverTool.execute(args, context);

      case "playwright_upload_file":
        return await uploadFileTool.execute(args, context);
        
      case "playwright_evaluate":
        return await evaluateTool.execute(args, context);

      case "playwright_expect_response":
        return await expectResponseTool.execute(args, context);

      case "playwright_assert_response":
        return await assertResponseTool.execute(args, context);

      case "playwright_custom_user_agent":
        return await customUserAgentTool.execute(args, context);
        
      case "playwright_get_visible_text":
        return await visibleTextTool.execute(args, context);
      
      case "playwright_get_visible_html":
        return await visibleHtmlTool.execute(args, context);
        
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
      
      // New tools
      case "playwright_go_back":
        return await goBackTool.execute(args, context);
      case "playwright_go_forward":
        return await goForwardTool.execute(args, context);
      case "playwright_drag":
        return await dragTool.execute(args, context);
      case "playwright_press_key":
        return await pressKeyTool.execute(args, context);
      case "playwright_save_as_pdf":
        return await saveAsPdfTool.execute(args, context);
      case "playwright_click_and_switch_tab":
        return await clickAndSwitchTabTool.execute(args, context);
      
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
    // Handle browser-specific errors at the top level
    if (BROWSER_TOOLS.includes(name)) {
      const errorMessage = (error as Error).message;
      if (
        errorMessage.includes("Target page, context or browser has been closed") || 
        errorMessage.includes("Browser has been disconnected") ||
        errorMessage.includes("Target closed") ||
        errorMessage.includes("Protocol error") ||
        errorMessage.includes("Connection closed")
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
    }

    return {
      content: [{
        type: "text",
        text: error instanceof Error ? error.message : String(error),
      }],
      isError: true,
    };
  }
}

/**
 * Helper function to handle codegen tool results
 */
async function handleCodegenResult(resultPromise: Promise<any>): Promise<CallToolResult> {
  try {
    const result = await resultPromise;
    return {
      content: [{
        type: "text",
        text: JSON.stringify(result),
      }],
      isError: false,
    };
  } catch (error) {
    return {
      content: [{
        type: "text",
        text: error instanceof Error ? error.message : String(error),
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

export { registerConsoleMessage };
