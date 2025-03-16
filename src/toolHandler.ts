import type { Browser, Page, APIRequestContext } from 'playwright';
import { chromium, request } from 'playwright';
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
import { CodeGeneratorTool } from './tools/browser/codegen.js';

// Global state
let browser: Browser | undefined;
let page: Page | undefined;
let apiContext: APIRequestContext | undefined;

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
let codeGeneratorTool: CodeGeneratorTool;

interface BrowserSettings {
  viewport?: {
    width?: number;
    height?: number;
  };
  userAgent?: string;
}

/**
 * Ensures a browser is launched and returns the page
 */
async function ensureBrowser(browserSettings?: BrowserSettings) {
  if (!browser) {
    const { viewport, userAgent } = browserSettings ?? {};
    browser = await chromium.launch({ headless: false });
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
  return page!;
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
  if (!codeGeneratorTool) codeGeneratorTool = new CodeGeneratorTool(server);
}

/**
 * Main handler for tool calls
 */
export async function handleToolCall(
  name: string,
  args: any,
  server: any
): Promise<CallToolResult> {
  const context: ToolContext = { page, server, apiContext };

  // Initialize tools if not already done
  if (!screenshotTool) {
    initializeTools(server);
  }

  // Create browser if not exists
  if (!browser) {
    browser = await chromium.launch();
  }

  // Create page if not exists and tool requires browser
  if (!page && BROWSER_TOOLS.includes(name)) {
    page = await browser.newPage();
    context.page = page;
  }

  // Create API context if not exists and tool requires it
  if (!apiContext && API_TOOLS.includes(name)) {
    apiContext = await request.newContext();
    context.apiContext = apiContext;
  }

  let result: CallToolResult;

  try {
    switch (name) {
      case 'playwright_navigate':
        result = await navigationTool.execute(args, context);
        codeGeneratorTool.addAction(name, args);
        break;
      case 'playwright_screenshot':
        result = await screenshotTool.execute(args, context);
        codeGeneratorTool.addAction(name, args);
        break;
      case 'playwright_click':
        result = await clickTool.execute(args, context);
        codeGeneratorTool.addAction(name, args);
        break;
      case 'playwright_iframe_click':
        result = await iframeClickTool.execute(args, context);
        codeGeneratorTool.addAction(name, args);
        break;
      case 'playwright_fill':
        result = await fillTool.execute(args, context);
        codeGeneratorTool.addAction(name, args);
        break;
      case 'playwright_select':
        result = await selectTool.execute(args, context);
        codeGeneratorTool.addAction(name, args);
        break;
      case 'playwright_hover':
        result = await hoverTool.execute(args, context);
        codeGeneratorTool.addAction(name, args);
        break;
      case 'playwright_evaluate':
        result = await evaluateTool.execute(args, context);
        codeGeneratorTool.addAction(name, args);
        break;
      case 'playwright_console_logs':
        result = await consoleLogsTool.execute(args, context);
        break;
      case 'playwright_close':
        result = await closeBrowserTool.execute(args, context);
        break;
      case 'playwright_expect_response':
        result = await expectResponseTool.execute(args, context);
        break;
      case 'playwright_assert_response':
        result = await assertResponseTool.execute(args, context);
        break;
      case 'playwright_custom_user_agent':
        result = await customUserAgentTool.execute(args, context);
        break;
      case 'playwright_get':
        result = await getRequestTool.execute(args, context);
        codeGeneratorTool.addAction(name, args);
        break;
      case 'playwright_post':
        result = await postRequestTool.execute(args, context);
        codeGeneratorTool.addAction(name, args);
        break;
      case 'playwright_put':
        result = await putRequestTool.execute(args, context);
        codeGeneratorTool.addAction(name, args);
        break;
      case 'playwright_patch':
        result = await patchRequestTool.execute(args, context);
        codeGeneratorTool.addAction(name, args);
        break;
      case 'playwright_delete':
        result = await deleteRequestTool.execute(args, context);
        codeGeneratorTool.addAction(name, args);
        break;
      case 'playwright_codegen':
        result = await codeGeneratorTool.execute(args, context);
        break;
      default:
        result = {
          isError: true,
          content: [{ text: `Unknown tool: ${name}`, mime: 'text/plain' }]
        };
    }
  } catch (error) {
    result = {
      isError: true,
      content: [{ text: `Error executing tool ${name}: ${error}`, mime: 'text/plain' }]
    };
  }

  return result;
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