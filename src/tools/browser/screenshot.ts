import fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { registerFileResource } from "../../resourceManager.js";
import { createSuccessResponse, type ToolContext, type ToolResponse } from "../common/types.js";
import { BrowserToolBase } from "./base.js";

const defaultDownloadsPath = path.join(os.homedir(), "Downloads");

/**
 * Tool for taking screenshots of pages or elements
 */
export class ScreenshotTool extends BrowserToolBase {
  private screenshots = new Map<string, string>();

  /**
   * Execute the screenshot tool
   */
  async execute(args: any, context: ToolContext): Promise<ToolResponse> {
    return this.safeExecute(context, async (page) => {
      const screenshotOptions: any = {
        type: args.type || "png",
        fullPage: !!args.fullPage,
      };

      if (args.selector) {
        const element = await page.$(args.selector);
        if (!element) {
          return {
            content: [
              {
                type: "text",
                text: `Element not found: ${args.selector}`,
              },
            ],
            isError: true,
          };
        }
        screenshotOptions.element = element;
      }

      // Generate output path
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const filename = `${args.name || "screenshot"}-${timestamp}.png`;
      const downloadsDir = args.downloadsDir || defaultDownloadsPath;

      if (!fs.existsSync(downloadsDir)) {
        fs.mkdirSync(downloadsDir, { recursive: true });
      }

      const outputPath = path.join(downloadsDir, filename);
      screenshotOptions.path = outputPath;

      const screenshot = await page.screenshot(screenshotOptions);
      const base64Screenshot = screenshot.toString("base64");

      let savedLocation = path.relative(process.cwd(), outputPath);
      let resourceLink: Awaited<ReturnType<typeof registerFileResource>> | undefined;
      try {
        resourceLink = await registerFileResource({
          filePath: outputPath,
          name: filename,
          mimeType: "image/png",
          server: this.server,
        });
        if (resourceLink?.uri) {
          savedLocation = resourceLink.uri;
        }
      } catch (error) {
        console.warn("Failed to register screenshot as resource:", error);
      }

      // Handle base64 storage
      if (args.storeBase64 !== false) {
        this.screenshots.set(args.name || "screenshot", base64Screenshot);
      }

      return {
        ...createSuccessResponse(`Screenshot saved to: ${savedLocation}`),
        ...(resourceLink ? { resourceLinks: [resourceLink] } : {}),
      };
    });
  }

  /**
   * Get all stored screenshots
   */
  getScreenshots(): Map<string, string> {
    return this.screenshots;
  }
}
