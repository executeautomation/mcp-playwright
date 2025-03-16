import { BrowserToolBase } from './base.js';
import type { ToolResponse } from '../common/types.js';
import type { ToolContext } from '../common/types.js';

export class CloseBrowserTool extends BrowserToolBase {
  async execute(_args: {}, context: ToolContext): Promise<ToolResponse> {
    if (!context.page) {
      return {
        isError: true,
        content: [{ text: "Browser not initialized", mime: "text/plain" }]
      };
    }

    await context.page.close();
    return {
      isError: false,
      content: [{ text: "Browser closed successfully", mime: "text/plain" }]
    };
  }
} 