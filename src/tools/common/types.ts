import type { CallToolResult, ImageContent, TextContent } from "@modelcontextprotocol/sdk/types.js";
import type { APIRequestContext, Browser, Page } from "playwright";
import type { ResourceLink } from "../../resourceManager.js";

// Context for tool execution
export interface ToolContext {
  page?: Page;
  browser?: Browser;
  apiContext?: APIRequestContext;
  server?: any;
  sessionId?: string;
  sendRequest?: (request: any, resultSchema?: { parse: (value: any) => any }, options?: any) => Promise<any>;
}

// Standard response format for all tools
export interface ToolResponse extends CallToolResult {
  content: (TextContent | ImageContent)[];
  isError: boolean;
  resourceLinks?: ResourceLink[];
}

// Interface that all tool implementations must follow
export interface ToolHandler {
  execute(args: any, context: ToolContext): Promise<ToolResponse>;
}

// Helper functions for creating responses
export function createErrorResponse(message: string): ToolResponse {
  return {
    content: [
      {
        type: "text",
        text: message,
      },
    ],
    isError: true,
  };
}

export function createSuccessResponse(message: string | string[]): ToolResponse {
  const messages = Array.isArray(message) ? message : [message];
  return {
    content: messages.map((msg) => ({
      type: "text",
      text: msg,
    })),
    isError: false,
  };
}
