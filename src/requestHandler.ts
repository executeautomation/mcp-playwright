import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListToolsRequestSchema,
  CallToolRequestSchema,
  Tool,
  McpError
} from "@modelcontextprotocol/sdk/types.js";
import { handleToolCall, getConsoleLogs, getScreenshots } from "./toolHandler.js";

/**
 * Validates that required parameters are present in the arguments
 */
function validateToolParameters(toolName: string, args: any, tools: Tool[]): { valid: boolean; error?: string } {
  const tool = tools.find(t => t.name === toolName);
  if (!tool) {
    return { valid: false, error: `Unknown tool: ${toolName}` };
  }

  const schema = tool.inputSchema;
  if (!schema || !schema.required || !Array.isArray(schema.required) || schema.required.length === 0) {
    return { valid: true };
  }

  const missingParams: string[] = [];
  for (const requiredParam of schema.required) {
    if (!(requiredParam in args) || args[requiredParam] === undefined || args[requiredParam] === null) {
      missingParams.push(String(requiredParam));
    }
  }

  if (missingParams.length > 0) {
    return {
      valid: false,
      error: `Missing required parameters: ${missingParams.join(', ')}`
    };
  }

  // Validate nested required parameters (e.g., options.outputPath in start_codegen_session)
  if (schema.properties) {
    for (const [propName, propSchema] of Object.entries(schema.properties)) {
      if (args[propName] && typeof propSchema === 'object' && 'required' in propSchema) {
        const nestedRequired = (propSchema as any).required;
        if (Array.isArray(nestedRequired)) {
          const missingNested: string[] = [];
          for (const nestedParam of nestedRequired) {
            if (!(nestedParam in args[propName]) || args[propName][nestedParam] === undefined || args[propName][nestedParam] === null) {
              missingNested.push(`${propName}.${nestedParam}`);
            }
          }
          if (missingNested.length > 0) {
            return {
              valid: false,
              error: `Missing required nested parameters: ${missingNested.join(', ')}`
            };
          }
        }
      }
    }
  }

  return { valid: true };
}

export function setupRequestHandlers(server: Server, tools: Tool[]) {
  // List resources handler
  server.setRequestHandler(ListResourcesRequestSchema, async () => ({
    resources: [
      {
        uri: "console://logs",
        mimeType: "text/plain",
        name: "Browser console logs",
      },
      ...Array.from(getScreenshots().keys()).map(name => ({
        uri: `screenshot://${name}`,
        mimeType: "image/png",
        name: `Screenshot: ${name}`,
      })),
    ],
  }));

  // Read resource handler
  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const uri = request.params.uri.toString();

    if (uri === "console://logs") {
      const logs = getConsoleLogs().join("\n");
      return {
        contents: [{
          uri,
          mimeType: "text/plain",
          text: logs,
        }],
      };
    }

    if (uri.startsWith("screenshot://")) {
      const name = uri.split("://")[1];
      const screenshot = getScreenshots().get(name);
      if (screenshot) {
        return {
          contents: [{
            uri,
            mimeType: "image/png",
            blob: screenshot,
          }],
        };
      }
    }

    throw new Error(`Resource not found: ${uri}`);
  });

  // List tools handler
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: tools,
  }));

  // Call tool handler
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const toolName = request.params.name;
    const args = request.params.arguments ?? {};

    // Validate parameters before execution
    const validation = validateToolParameters(toolName, args, tools);
    if (!validation.valid) {
      // Throw McpError with Invalid params error code (-32602)
      throw new McpError(
        -32602,
        validation.error || "Parameter validation failed"
      );
    }

    return handleToolCall(toolName, args, server);
  });
}