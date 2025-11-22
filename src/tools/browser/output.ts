import * as path from "node:path";
import { registerFileResource } from "../../resourceManager.js";
import { createSuccessResponse, type ToolContext, type ToolResponse } from "../common/types.js";
import { BrowserToolBase } from "./base.js";

/**
 * Tool for saving page as PDF
 */
export class SaveAsPdfTool extends BrowserToolBase {
  /**
   * Execute the save as PDF tool
   */
  async execute(args: any, context: ToolContext): Promise<ToolResponse> {
    return this.safeExecute(context, async (page) => {
      const filename = args.filename || "page.pdf";
      const options = {
        path: path.resolve(args.outputPath || ".", filename),
        format: args.format || "A4",
        printBackground: args.printBackground !== false,
        margin: args.margin || {
          top: "1cm",
          right: "1cm",
          bottom: "1cm",
          left: "1cm",
        },
      };

      await page.pdf(options);
      let resourceLink: Awaited<ReturnType<typeof registerFileResource>> | undefined;
      let savedLocation = options.path;
      try {
        resourceLink = await registerFileResource({
          filePath: options.path,
          name: filename,
          mimeType: "application/pdf",
          server: this.server,
        });
        if (resourceLink?.uri) {
          savedLocation = resourceLink.uri;
        }
      } catch (error) {
        console.warn("Failed to register PDF as resource:", error);
      }
      return {
        ...createSuccessResponse(`Saved page as PDF: ${savedLocation}`),
        ...(resourceLink ? { resourceLinks: [resourceLink] } : {}),
      };
    });
  }
}
