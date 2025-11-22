import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

export interface Tool {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, unknown>;
    required?: string[];
  };
  handler: (args: any, context?: any) => Promise<any>;
}

export interface ToolCall {
  name: string;
  parameters: Record<string, unknown>;
  result?: CallToolResult;
}
