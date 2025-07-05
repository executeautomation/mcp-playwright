
import { CallToolRequest, CallToolResult, Tool } from "@modelcontextprotocol/sdk/types.js";
import { ListToolsRequestSchema, CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { createToolDefinitions } from "./tools.js";
import { ToolContext, createErrorResponse } from "./tools/common/types.js";
import { handleToolCall as toolHandlerCall } from "./toolHandler.js";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";

export async function handleToolCall(request: CallToolRequest): Promise<CallToolResult> {
  const { name, arguments: args } = request.params;
  
  try {
    // Delegate to the existing tool handler
    return await toolHandlerCall(name, args || {}, null);
  } catch (error) {
    console.error(`Error executing tool ${name}:`, error);
    return {
      content: [
        {
          type: "text",
          text: `Error executing tool ${name}: ${error instanceof Error ? error.message : String(error)}`
        }
      ],
      isError: true
    };
  }
}

export function getAvailableTools(): Tool[] {
  return createToolDefinitions();
}

export function setupRequestHandlers(server: Server, tools: Tool[]): void {
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: tools
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    return await handleToolCall(request as CallToolRequest);
  });
}
