import type { Response } from 'playwright';
import { BrowserToolBase } from './base.js';
import type { ToolContext, ToolResponse } from '../common/types.js';
import { createSuccessResponse, createErrorResponse } from '../common/types.js';

const responsePromises = new Map<string, Promise<Response>>();

interface ExpectResponseArgs {
  id: string;
  url: string;
}

interface AssertResponseArgs {
  id: string;
  value?: string;
}

/**
 * Tool for setting up response wait operations
 */
export class ExpectResponseTool extends BrowserToolBase {
  /**
   * Execute the expect response tool
   */
  async execute(args: ExpectResponseArgs, context: ToolContext): Promise<ToolResponse> {
    return this.safeExecute(context, async (page) => {
      if (!args.id || !args.url) {
        return createErrorResponse("Missing required parameters: id and url must be provided");
      }

      const responsePromise = page.waitForResponse(args.url);
      responsePromises.set(args.id, responsePromise);

      return createSuccessResponse(`Started waiting for response with ID ${args.id}`);
    });
  }
}

/**
 * Tool for asserting and validating responses
 */
export class AssertResponseTool extends BrowserToolBase {
  /**
   * Execute the assert response tool
   */
  async execute(args: AssertResponseArgs, context: ToolContext): Promise<ToolResponse> {
    return this.safeExecute(context, async () => {
      if (!args.id) {
        return createErrorResponse("Missing required parameter: id must be provided");
      }

      const responsePromise = responsePromises.get(args.id);
      if (!responsePromise) {
        return createErrorResponse(`No response wait operation found with ID: ${args.id}`);
      }

      try {
        const response = await responsePromise;
        const body = await response.json();

        if (args.value) {
          const bodyStr = JSON.stringify(body);
          if (!bodyStr.includes(args.value)) {
            const messages = [
              `Response body does not contain expected value: ${args.value}`,
              `Actual body: ${bodyStr}`
            ];
            return createErrorResponse(messages.join('\n'));
          }
        }

        const messages = [
          `Response assertion for ID ${args.id} successful`,
          `URL: ${response.url()}`,
          `Status: ${response.status()}`,
          `Body: ${JSON.stringify(body, null, 2)}`
        ];
        return createSuccessResponse(messages.join('\n'));
      } catch (error) {
        return createErrorResponse(`Failed to assert response: ${(error as Error).message}`);
      } finally {
        responsePromises.delete(args.id);
      }
    });
  }
} 