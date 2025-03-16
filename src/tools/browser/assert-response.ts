import { BrowserToolBase } from './base.js';
import type { ToolResponse } from '../common/types.js';
import type { ToolContext } from '../common/types.js';

export class AssertResponseTool extends BrowserToolBase {
  async execute(args: { id: string, value?: string }, context: ToolContext): Promise<ToolResponse> {
    if (!context.page) {
      return {
        isError: true,
        content: [{ text: "Browser not initialized", mime: "text/plain" }]
      };
    }

    try {
      const response = await context.page.waitForResponse(response => 
        response.url().includes(args.id)
      );
      
      if (args.value) {
        const body = await response.text();
        if (!body.includes(args.value)) {
          return {
            isError: true,
            content: [{ text: `Response does not contain expected value: ${args.value}`, mime: "text/plain" }]
          };
        }
      }

      return {
        isError: false,
        content: [{ text: `Response assertion passed`, mime: "text/plain" }]
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ text: `Response assertion failed: ${error}`, mime: "text/plain" }]
      };
    }
  }
} 