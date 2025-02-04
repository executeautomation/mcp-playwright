import { chromium, Browser, Page, request, APIRequest, APIRequestContext } from "playwright";
import { CallToolResult, TextContent, ImageContent } from "@modelcontextprotocol/sdk/types.js";
import { BROWSER_TOOLS, API_TOOLS } from "./tools.js";
import fs from 'node:fs';
import * as os from 'os';
import * as path from 'path';

// Global state
let browser: Browser | undefined;
let page: Page | undefined;
const consoleLogs: string[] = [];
const screenshots = new Map<string, string>();
const defaultDownloadsPath = path.join(os.homedir(), 'Downloads');

// Viewport type definition
type ViewportConfig = {
  channel?: string;
  width?: number;
  height?: number;
};

async function ensureBrowser(viewport?: ViewportConfig) {
  if (!browser) {
    browser = await chromium.launch({ headless: false, channel: viewport?.channel ?? 'chromium' });
    const context = await browser.newContext({
      viewport: {
        width: viewport?.width ?? 1920,
        height: viewport?.height ?? 1080,
      },
      deviceScaleFactor: 1,
    });

    page = await context.newPage();

    page.on("console", (msg) => {
      const logEntry = `[${msg.type()}] ${msg.text()}`;
      consoleLogs.push(logEntry);
      // Note: server.notification is assumed to be passed in from the main server
    });
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
): Promise<{ toolResult: CallToolResult }> {
  // Check if the tool requires browser interaction
  const requiresBrowser = BROWSER_TOOLS.includes(name);
  // Check if the tool requires api interaction
  const requiresApi = API_TOOLS.includes(name);
  let page: Page | undefined;
  let apiContext: APIRequestContext;



  // Set up API context for API-related operations
  if (requiresApi) {
    apiContext = await ensureApiContext(args.url);
  }

  switch (name) {
    case "playwright_navigate":
      try {
        if(!page) {
          page = await ensureBrowser({
                 channel: args.channel,
                 width: args.width,
                 height: args.height
               });
        }
        await page!.goto(args.url, {
          timeout: args.timeout || 30000,
          waitUntil: args.waitUntil || "load"
        });
        return {
          toolResult: {
            content: [{
              type: "text",
              text: `Navigated to ${args.url} with ${args.waitUntil || "load"} wait` +
                    (args.width && args.height ? ` (viewport: ${args.width}x${args.height})` : ""),
            }],
            isError: false,
          },
        };
      } catch (error) {
        return {
          toolResult: {
            content: [{
              type: "text",
              text: `Navigation failed: ${(error as Error).message}`,
            }],
            isError: true,
          },
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
              toolResult: {
                content: [{
                  type: "text",
                  text: `Element not found: ${args.selector}`,
                }],
                isError: true,
              },
            };
          }
          screenshotOptions.element = element;
        }

        if (args.mask) {
          screenshotOptions.mask = await Promise.all(
            args.mask.map(async (selector: string) => await page!.$(selector))
          );
        }

        const screenshot = await page!.screenshot(screenshotOptions);
        const base64Screenshot = screenshot.toString('base64');

        const responseContent: (TextContent | ImageContent)[] = [];

        // Handle PNG file saving
        if (args.savePng !== false) {
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const filename = `${args.name}-${timestamp}.png`;
          const downloadsDir = args.downloadsDir || defaultDownloadsPath;

          // Create downloads directory if it doesn't exist
          if (!fs.existsSync(downloadsDir)) {
            fs.mkdirSync(downloadsDir, { recursive: true });
          }

          const filePath = path.join(downloadsDir, filename);
          await fs.promises.writeFile(filePath, screenshot);
          responseContent.push({
            type: "text",
            text: `Screenshot saved to: ${filePath}`,
          } as TextContent);
        }

        // Handle base64 storage
        if (args.storeBase64 !== false) {
          screenshots.set(args.name, base64Screenshot);
          server.notification({
            method: "notifications/resources/list_changed",
          });

          responseContent.push({
            type: "image",
            data: base64Screenshot,
            mimeType: "image/png",
          } as ImageContent);
        }

        return {
          toolResult: {
            content: responseContent,
            isError: false,
          },
        };
      } catch (error) {
        return {
          toolResult: {
            content: [{
              type: "text",
              text: `Screenshot failed: ${(error as Error).message}`,
            }],
            isError: true,
          },
        };
      }
    }
    case "playwright_click":
      try {
        await page!.click(args.selector);
        return {
          toolResult: {
            content: [{
              type: "text",
              text: `Clicked: ${args.selector}`,
            }],
            isError: false,
          },
        };
      } catch (error) {
        return {
          toolResult: {
            content: [{
              type: "text",
              text: `Failed to click ${args.selector}: ${(error as Error).message}`,
            }],
            isError: true,
          },
        };
      }

    case "playwright_fill":
      try {
        await page!.waitForSelector(args.selector);
        await page!.fill(args.selector, args.value);
        return {
          toolResult: {
            content: [{
              type: "text",
              text: `Filled ${args.selector} with: ${args.value}`,
            }],
            isError: false,
          },
        };
      } catch (error) {
        return {
          toolResult: {
            content: [{
              type: "text",
              text: `Failed to type ${args.selector}: ${(error as Error).message}`,
            }],
            isError: true,
          },
        };
      }

    case "playwright_select":
      try {
        await page!.waitForSelector(args.selector);
        await page!.selectOption(args.selector, args.value);
        return {
          toolResult: {
            content: [{
              type: "text",
              text: `Selected ${args.selector} with: ${args.value}`,
            }],
            isError: false,
          },
        };
      } catch (error) {
        return {
          toolResult: {
            content: [{
              type: "text",
              text: `Failed to select ${args.selector}: ${(error as Error).message}`,
            }],
            isError: true,
          },
        };
      }

    case "playwright_hover":
      try {
        await page!.waitForSelector(args.selector);
        await page!.hover(args.selector);
        return {
          toolResult: {
            content: [{
              type: "text",
              text: `Hovered ${args.selector}`,
            }],
            isError: false,
          },
        };
      } catch (error) {
        return {
          toolResult: {
            content: [{
              type: "text",
              text: `Failed to hover ${args.selector}: ${(error as Error).message}`,
            }],
            isError: true,
          },
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
          toolResult: {
            content: [
              {
                type: "text",
                text: `Execution result:\n${JSON.stringify(result.result, null, 2)}\n\nConsole output:\n${result.logs.join('\n')}`,
              },
            ],
            isError: false,
          },
        };
      } catch (error) {
        return {
          toolResult: {
            content: [{
              type: "text",
              text: `Script execution failed: ${(error as Error).message}`,
            }],
            isError: true,
          },
        };
      }

    case "playwright_get":
      try {
        var response = await apiContext!.get(args.url);

        return {
          toolResult: {
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
          },
        };
      } catch (error) {
        return {
          toolResult: {
            content: [{
              type: "text",
              text: `Failed to perform GET operation on ${args.url}: ${(error as Error).message}`,
            }],
            isError: true,
          },
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
          toolResult: {
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
          },
        };
      } catch (error) {
        return {
          toolResult: {
            content: [{
              type: "text",
              text: `Failed to perform POST operation on ${args.url}: ${(error as Error).message}`,
            }],
            isError: true,
          },
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
          toolResult: {
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
          },
        };
      } catch (error) {
        return {
          toolResult: {
            content: [{
              type: "text",
              text: `Failed to perform PUT operation on ${args.url}: ${(error as Error).message}`,
            }],
            isError: true,
          },
        };
      }

    case "playwright_delete":
      try {
        var response = await apiContext!.delete(args.url);

        return {
          toolResult: {
            content: [{
              type: "text",
              text: `Performed delete Operation ${args.url}`,
            },
            {
              type: "text",
              text: `Response code ${response.status()}`
            }],
            isError: false,
          },
        };
      } catch (error) {
        return {
          toolResult: {
            content: [{
              type: "text",
              text: `Failed to perform delete operation on ${args.url}: ${(error as Error).message}`,
            }],
            isError: true,
          },
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
          toolResult: {
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
          },
        };
      } catch (error) {
        return {
          toolResult: {
            content: [{
              type: "text",
              text: `Failed to perform PATCH operation on ${args.url}: ${(error as Error).message}`,
            }],
            isError: true,
          },
        };
      }

    default:
      return {
        toolResult: {
          content: [{
            type: "text",
            text: `Unknown tool: ${name}`,
          }],
          isError: true,
        },
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