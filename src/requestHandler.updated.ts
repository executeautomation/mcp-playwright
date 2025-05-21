import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { 
  ListResourcesRequestSchema, 
  ReadResourceRequestSchema, 
  ListToolsRequestSchema, 
  CallToolRequestSchema,
  Tool
} from "@modelcontextprotocol/sdk/types.js";
import { handleToolCall, getConsoleLogs, getScreenshots } from "./toolHandler.js";
import { withSSENotifications } from "./sseIntegration.js";

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
      return {
        contents: [{
          uri,
          mimeType: "text/plain",
          text: getConsoleLogs().join("\n"),
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

  // Call tool handler with SSE notifications
  const enhancedToolHandler = withSSENotifications(handleToolCall);
  server.setRequestHandler(CallToolRequestSchema, async (request) =>
    enhancedToolHandler(request.params.name, request.params.arguments ?? {}, server)
  );
} 