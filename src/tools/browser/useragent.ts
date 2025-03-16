import { BrowserToolBase } from './base.js';
import type { ToolContext, ToolResponse } from '../common/types.js';
import { createSuccessResponse, createErrorResponse } from '../common/types.js';

interface CustomUserAgentArgs {
  userAgent: string;
}

/**
 * Tool for validating custom User Agent settings
 */
export class CustomUserAgentTool extends BrowserToolBase {
  /**
   * Execute the custom user agent tool
   */
  async execute(args: CustomUserAgentArgs, context: ToolContext): Promise<ToolResponse> {
    return this.safeExecute(context, async (page) => {
      if (!args.userAgent) {
        return createErrorResponse("Missing required parameter: userAgent must be provided");
      }

      try {
        const currentUserAgent = await page.evaluate(() => navigator.userAgent);
        
        if (currentUserAgent !== args.userAgent) {
          const messages = [
            "Page was already initialized with a different User Agent.",
            `Requested: ${args.userAgent}`,
            `Current: ${currentUserAgent}`
          ];
          return createErrorResponse(messages.join('\n'));
        }

        return createSuccessResponse("User Agent validation successful");
      } catch (error) {
        return createErrorResponse(`Failed to validate User Agent: ${(error as Error).message}`);
      }
    });
  }
} 