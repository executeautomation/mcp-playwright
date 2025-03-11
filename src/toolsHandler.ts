import type { CallToolResult, ImageContent, TextContent } from '@modelcontextprotocol/sdk/types.js';
import fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { APIRequestContext, Browser, chromium, Page, request } from 'playwright';
import { API_TOOLS, BROWSER_TOOLS } from './tools.js';

// Global state
let browser: Browser | undefined;
let page: Page | undefined;
let currentHeadless: boolean = false;
const consoleLogs: string[] = [];
const screenshots = new Map<string, string>();
const defaultDownloadsPath = path.join(os.homedir(), 'Downloads');

// Viewport type definition
type ViewportSize = {
  width?: number;
  height?: number;
};

async function ensureBrowser(viewport?: ViewportSize, headless: boolean = false) {
  if (browser && currentHeadless !== headless) {
    await browser.close();
    browser = undefined;
    page = undefined;
  }

  if (!browser) {
    browser = await chromium.launch({ headless });
    const context = await browser.newContext({
      viewport: {
        width: viewport?.width ?? 1280,
        height: viewport?.height ?? 720,
      },
      deviceScaleFactor: 1,
    });

    page = await context.newPage();

    page.on("console", (msg) => {
      const logEntry = `[${msg.type()}] ${msg.text()}`;
      consoleLogs.push(logEntry);
    });

    currentHeadless = headless; // Speichere den aktuellen headless-Status
  }
  return page!;
}

async function ensureApiContext(url: string) {
  return await request.newContext({
    baseURL: url,
  });
}

export async function handleToolCall(
  name: string,
  args: any,
  server: any
): Promise<CallToolResult> {
  const requiresBrowser = BROWSER_TOOLS.includes(name);
  const requiresApi = API_TOOLS.includes(name);
  let page: Page | undefined;
  let apiContext: APIRequestContext;

  if (requiresBrowser) {
    // Verwende die headless-Option aus den Argumenten, falls vorhanden (nur für playwright_navigate relevant)
    const headless = name === "playwright_navigate" ? (args.headless ?? false) : currentHeadless;
    page = await ensureBrowser({
      width: args.width,
      height: args.height
    }, headless);
  }

  if (requiresApi) {
    apiContext = await ensureApiContext(args.url);
  }

  switch (name) {
    case "playwright_navigate":
      try {
        await page!.goto(args.url, {
          timeout: args.timeout || 30000,
          waitUntil: args.waitUntil || "load"
        });
        return {
          content: [{
            type: "text",
            text: `Navigated to ${args.url}`,
          }],
          isError: false,
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `Navigation failed: ${(error as Error).message}`,
          }],
          isError: true,
        };
      }

    case "playwright_screenshot": {
      try {
        const screenshotOptions: any = {
          type: args.type || "png",
          fullPage: !!args.fullPage
        };

        if (args.selector) {
          const element = await page!.$(args.selector);
          if (!element) {
            return {
              content: [{
                type: "text",
                text: `Element not found: ${args.selector}`,
              }],
              isError: true
            };
          }
          screenshotOptions.element = element;
        }

        if (args.mask) {
          screenshotOptions.mask = await Promise.all(
            args.mask.map(async (selector: string) => await page!.$(selector))
          );
        }

        // Generate an output path
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `${args.name || 'screenshot'}-${timestamp}.png`;
        const downloadsDir = args.downloadsDir || defaultDownloadsPath;

        // Create downloads directory if it doesn't exist
        if (!fs.existsSync(downloadsDir)) {
          fs.mkdirSync(downloadsDir, { recursive: true });
        }

        const outputPath = path.join(downloadsDir, filename);

        // Add the path to the screenshot options
        screenshotOptions.path = outputPath;

        // Take the screenshot with the path included
        const screenshot = await page!.screenshot(screenshotOptions);
        const base64Screenshot = screenshot.toString('base64');

        const responseContent: TextContent[] = [];

        // Add relative path info to response
        const relativePath = path.relative(process.cwd(), outputPath);
        responseContent.push({
          type: "text",
          text: `Screenshot saved to: ${relativePath}`,
        });

        // Handle base64 storage, but only store it without returning image content
        if (args.storeBase64 !== false) {
          screenshots.set(args.name || 'screenshot', base64Screenshot);
          server.notification({
            method: "notifications/resources/list_changed",
          });

          responseContent.push({
            type: "text",
            text: `Screenshot also stored in memory with name: '${args.name || 'screenshot'}'`,
          });
        }

        return {
          content: responseContent,
          isError: false,
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `Screenshot failed: ${(error as Error).message}`,
          }],
          isError: true,
        };
      }
    }
    case "playwright_click":
      try {
        await page!.click(args.selector);
        return {
          content: [{
            type: "text",
            text: `Clicked: ${args.selector}`,
          }],
          isError: false,
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `Failed to click ${args.selector}: ${(error as Error).message}`,
          }],
          isError: true,
        };
      }

    case "playwright_iframe_click":
      try {
        const iframe = page!.frameLocator(args.iframeSelector);
        await iframe.locator(args.selector).click();
        return {
          content: [{
            type: "text",
            text: `Clicked: ${args.selector} (iframe: ${args.iframeSelector})`,
          }],
          isError: false,
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `Failed to click ${args.selector} in iframe ${args.iframeSelector}: ${(error as Error).message}`,
          }],
          isError: true,
        };
      }

    case "playwright_fill":
      try {
        await page!.waitForSelector(args.selector);
        await page!.fill(args.selector, args.value);
        return {
          content: [{
            type: "text",
            text: `Filled ${args.selector} with: ${args.value}`,
          }],
          isError: false,
        };
      } catch (error) {
        return {

          content: [{
            type: "text",
            text: `Failed to type ${args.selector}: ${(error as Error).message}`,
          }],
          isError: true,
        };
      }

    case "playwright_select":
      try {
        await page!.waitForSelector(args.selector);
        await page!.selectOption(args.selector, args.value);
        return {
          content: [{
            type: "text",
            text: `Selected ${args.selector} with: ${args.value}`,
          }],
          isError: false,
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `Failed to select ${args.selector}: ${(error as Error).message}`,
          }],
          isError: true,
        };
      }

    case "playwright_hover":
      try {
        await page!.waitForSelector(args.selector);
        await page!.hover(args.selector);
        return {
          content: [{
            type: "text",
            text: `Hovered ${args.selector}`,
          }],
          isError: false,
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `Failed to hover ${args.selector}: ${(error as Error).message}`,
          }],
          isError: true,
        };
      }

    case "playwright_evaluate":
      try {
        const result = await page!.evaluate((script) => {
          const logs: string[] = [];
          const originalConsole = { ...console };

          ['log', 'info', 'warn', 'error'].forEach(method => {
            (console as any)[method] = (...args: any[]) => {
              logs.push(`[${method}] ${args.join(' ')}`);
              (originalConsole as any)[method](...args);
            };
          });

          try {
            const result = eval(script);
            Object.assign(console, originalConsole);
            return { result, logs };
          } catch (error) {
            Object.assign(console, originalConsole);
            throw error;
          }
        }, args.script);

        return {
          content: [
            {
              type: "text",
              text: `Execution result:\n${JSON.stringify(result.result, null, 2)}\n\nConsole output:\n${result.logs.join('\n')}`,
            },
          ],
          isError: false,
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `Script execution failed: ${(error as Error).message}`,
          }],
          isError: true,
        };
      }

    case "playwright_console_logs": {
      try {
        const logType = args.type?.toLowerCase();
        let filteredLogs: string[] = [];

        // Improved pattern matching for different log types
        if (logType === "all") {
          filteredLogs = [...consoleLogs];
        } else if (logType === "error") {
          filteredLogs = consoleLogs.filter(log =>
            log.includes("[error]") ||
            log.includes("[pageerror]") ||
            log.includes("[crash]") ||
            log.includes("Failed to load resource") ||
            log.includes("net::ERR_") ||
            log.includes("Error with")
          );
        } else if (logType === "warning") {
          filteredLogs = consoleLogs.filter(log =>
            log.includes("[warning]") ||
            log.includes("Warning:")
          );
        } else if (logType === "log") {
          // Filter out errors and warnings to keep general logs
          filteredLogs = consoleLogs.filter(log =>
            !log.includes("[error]") &&
            !log.includes("[warning]") &&
            !log.includes("Failed to load") &&
            !log.includes("Error with") &&
            !log.includes("Warning:")
          );
        } else if (logType === "info") {
          filteredLogs = consoleLogs.filter(log => log.includes("[info]"));
        } else if (logType === "debug") {
          filteredLogs = consoleLogs.filter(log => log.includes("[debug]"));
        } else {
          // Default to all logs if type is not specified
          filteredLogs = [...consoleLogs];
        }

        // Rest of the code remains the same
        if (args.search) {
          const searchTerm = args.search.toString();
          filteredLogs = filteredLogs.filter(log => log.includes(searchTerm));
        }

        if (args.clear === true) {
          consoleLogs.length = 0;
        }

        if (args.limit && typeof args.limit === 'number' && args.limit > 0) {
          filteredLogs = filteredLogs.slice(-args.limit);
        }

        return {
          content: [{
            type: "text",
            text: filteredLogs.length > 0
              ? `Console Logs (${filteredLogs.length}):\n${filteredLogs.join('\n')}`
              : "No matching console logs found."
          }],
          isError: false
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `Failed to retrieve console logs: ${(error as Error).message}`
          }],
          isError: true
        };
      }
    }

    case "playwright_close": {
      try {
        // Check if there's an active browser instance
        if (browser) {
          await browser.close();
          browser = undefined;
          page = undefined;

          return {
            content: [{
              type: "text",
              text: "Browser successfully closed"
            }],
            isError: false
          };
        } else {
          return {
            content: [{
              type: "text",
              text: "No active browser to close"
            }],
            isError: false
          };
        }
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `Failed to close browser: ${(error as Error).message}`
          }],
          isError: true
        };
      }
    }

    case "playwright_get":
      try {
        var response = await apiContext!.get(args.url);

        return {
          content: [{
            type: "text",
            text: `Performed GET Operation ${args.url}`,
          },
          {
            type: "text",
            text: `Response: ${JSON.stringify(await response.json(), null, 2)}`,
          },
          {
            type: "text",
            text: `Response code ${response.status()}`
          }
          ],
          isError: false,
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `Failed to perform GET operation on ${args.url}: ${(error as Error).message}`,
          }],
          isError: true,
        };
      }

    case "playwright_post":
      try {
        var data = {
          data: args.value,
          headers: {
            'Content-Type': 'application/json'
          }
        };

        var response = await apiContext!.post(args.url, data);
        return {
          content: [{
            type: "text",
            text: `Performed POST Operation ${args.url} with data ${JSON.stringify(args.value, null, 2)}`,
          },
          {
            type: "text",
            text: `Response: ${JSON.stringify(await response.json(), null, 2)}`,
          },
          {
            type: "text",
            text: `Response code ${response.status()}`
          }],
          isError: false,
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `Failed to perform POST operation on ${args.url}: ${(error as Error).message}`,
          }],
          isError: true,
        };
      }

    case "playwright_put":
      try {
        var data = {
          data: args.value,
          headers: {
            'Content-Type': 'application/json'
          }
        };
        var response = await apiContext!.put(args.url, data);

        return {
          content: [{
            type: "text",
            text: `Performed PUT Operation ${args.url} with data ${JSON.stringify(args.value, null, 2)}`,
          }, {
            type: "text",
            text: `Response: ${JSON.stringify(await response.json(), null, 2)}`,
          },
          {
            type: "text",
            text: `Response code ${response.status()}`
          }],
          isError: false,
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `Failed to perform PUT operation on ${args.url}: ${(error as Error).message}`,
          }],
          isError: true,
        };
      }

    case "playwright_delete":
      try {
        var response = await apiContext!.delete(args.url);

        return {
          content: [{
            type: "text",
            text: `Performed delete Operation ${args.url}`,
          },
          {
            type: "text",
            text: `Response code ${response.status()}`
          }],
          isError: false,
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `Failed to perform delete operation on ${args.url}: ${(error as Error).message}`,
          }],
          isError: true,
        };
      }

    case "playwright_patch":
      try {
        var data = {
          data: args.value,
          headers: {
            'Content-Type': 'application/json'
          }
        };
        var response = await apiContext!.patch(args.url, data);

        return {
          content: [{
            type: "text",
            text: `Performed PATCH Operation ${args.url} with data ${JSON.stringify(args.value, null, 2)}`,
          }, {
            type: "text",
            text: `Response: ${JSON.stringify(await response.json(), null, 2)}`,
          }, {
            type: "text",
            text: `Response code ${response.status()}`
          }],
          isError: false,
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `Failed to perform PATCH operation on ${args.url}: ${(error as Error).message}`,
          }],
          isError: true,
        };
      }
    case "playwright_get_visible_text":
      try {
        const visibleText = await page!.evaluate(() => {
          const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            {
              acceptNode: (node) => {
                const style = window.getComputedStyle(node.parentElement!);
                return (style.display !== "none" && style.visibility !== "hidden")
                  ? NodeFilter.FILTER_ACCEPT
                  : NodeFilter.FILTER_REJECT;
              },
            }
          );
          let text = "";
          let node;
          while ((node = walker.nextNode())) {
            const trimmedText = node.textContent?.trim();
            if (trimmedText) {
              text += trimmedText + "\n";
            }
          }
          return text.trim();
        });
        return {
          content: [{
            type: "text",
            text: `Visible text content:\n${visibleText}`,
          }],
          isError: false,
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `Failed to get visible text: ${(error as Error).message}`,
          }],
          isError: true,
        };
      }
  
    case "playwright_get_html":
      try {
        const htmlContent = await page!.content();
        return {
          content: [{
            type: "text",
            text: `HTML content:\n${htmlContent}`,
          }],
          isError: false,
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `Failed to get HTML content: ${(error as Error).message}`,
          }],
          isError: true,
        };
      }
  
    default:
      return {
        content: [{
          type: "text",
          text: `Unknown tool: ${name}`,
        }],
        isError: true,
      };
  }
}

// Expose utility functions for resource management
export function getConsoleLogs(): string[] {
  return consoleLogs;
}

export function getScreenshots(): Map<string, string> {
  return screenshots;
}
