import { BrowserToolBase } from './base.js';
import { ToolContext, ToolResponse, createSuccessResponse } from '../common/types.js';

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
    this.consoleLogs.push(`[${type}] ${text}`);
  }

  /**
   * Execute the console logs tool
   */
  async execute(args: any, context: ToolContext): Promise<ToolResponse> {
    // No need to use safeExecute here as we don't need to interact with the page
    // We're just filtering and returning logs that are already stored
    
    let logs = [...this.consoleLogs];
    
    // Filter by type if specified
    if (args.type && args.type !== 'all') {
      logs = logs.filter(log => log.startsWith(`[${args.type}]`));
    }
    
    // Filter by search text if specified
    if (args.search) {
      logs = logs.filter(log => log.includes(args.search));
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
      return createSuccessResponse([
        `Retrieved ${logs.length} console log(s):`,
        ...logs
      ]);
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