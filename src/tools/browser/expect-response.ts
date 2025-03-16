import { BrowserToolBase } from './base.js';
import type { ToolResponse } from '../common/types.js';
import type { ToolContext } from '../common/types.js';

export class ExpectResponseTool extends BrowserToolBase {
  async execute(args: { id: string, url: string }, context: ToolContext): Promise<ToolResponse> {
    if (!context.page) {
      return {
        isError: true,
        content: [{ text: "Browser not initialized", mime: "text/plain" }]
      };
    }

    try {
      context.page.waitForResponse(args.url);
      return {
        isError: false,
        content: [{ text: `Waiting for response from ${args.url}`, mime: "text/plain" }]
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ text: `Failed to set up response wait: ${error}`, mime: "text/plain" }]
      };
    }
  }
} 