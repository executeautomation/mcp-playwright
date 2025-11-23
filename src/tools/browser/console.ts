import * as fs from "node:fs/promises";
import * as path from "node:path";
import { registerFileResource } from "../../resourceManager.js";
import { createSuccessResponse, type ToolContext, type ToolResponse } from "../common/types.js";
import { BrowserToolBase } from "./base.js";

/**
 * Tool for retrieving and filtering console logs from the browser
 */
export class ConsoleLogsTool extends BrowserToolBase {
  private consoleLogs: string[] = [];

  /**
   * Register a console message
   * @param type The type of console message
   * @param text The text content of the message
   */
  registerConsoleMessage(type: string, text: string): void {
    const logEntry = `[${type}] ${text}`;
    this.consoleLogs.push(logEntry);
  }

  /**
   * Execute the console logs tool
   */
  async execute(args: any, _context: ToolContext): Promise<ToolResponse> {
    // No need to use safeExecute here as we don't need to interact with the page
    // We're just filtering and returning logs that are already stored

    let logs = [...this.consoleLogs];

    // Filter by type if specified
    if (args.type && args.type !== "all") {
      logs = logs.filter((log) => log.startsWith(`[${args.type}]`));
    }

    // Filter by search text if specified
    if (args.search) {
      logs = logs.filter((log) => log.includes(args.search));
    }

    // Limit the number of logs if specified
    if (args.limit && args.limit > 0) {
      logs = logs.slice(-args.limit);
    }

    // Clear logs if requested
    if (args.clear) {
      this.consoleLogs = [];
    }

    // Format the response
    if (logs.length === 0) {
      return createSuccessResponse("No console logs matching the criteria");
    } else {
      let savedLocation: string | undefined;
      let resourceLink: Awaited<ReturnType<typeof registerFileResource>> | undefined;
      try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const filename = `console-logs-${timestamp}.txt`;
        const tempPath = path.join(process.cwd(), filename);
        await fs.writeFile(tempPath, logs.join("\n"), "utf-8");
        resourceLink = await registerFileResource({
          filePath: tempPath,
          name: filename,
          mimeType: "text/plain",
          server: this.server,
        });
        savedLocation = resourceLink?.uri ?? tempPath;
        await fs.unlink(tempPath).catch(() => {});
      } catch (_error) {
        // If resource registration fails, just include inline logs
        savedLocation = undefined;
      }

      return {
        ...createSuccessResponse(
          savedLocation ? [`Retrieved ${logs.length} console log(s). Download: ${savedLocation}`, ...logs] : logs,
        ),
        ...(resourceLink ? { resourceLinks: [resourceLink] } : {}),
      };
    }
  }

  /**
   * Get all console logs
   */
  getConsoleLogs(): string[] {
    return this.consoleLogs;
  }

  /**
   * Clear all console logs
   */
  clearConsoleLogs(): void {
    this.consoleLogs = [];
  }
}
