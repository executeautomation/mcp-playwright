import type { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
  type Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { listFileResources, readFileResource } from "./resourceManager.js";
import { handleToolCall } from "./toolHandler.js";

export function setupRequestHandlers(server: Server, tools: Tool[]) {
  // List resources handler
  server.setRequestHandler(ListResourcesRequestSchema, async () => ({
    resources: [...(await listFileResources(server))],
  }));

  // Read resource handler
  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const uri = request.params.uri.toString();

    const fileResource = await readFileResource(uri, server);
    if (fileResource) {
      const { resource, text, blob } = fileResource;
      return {
        contents: [
          {
            uri: resource.uri,
            mimeType: resource.mimeType,
            ...(text ? { text } : { blob }),
          },
        ],
      };
    }

    throw new Error(`Resource not found: ${uri}`);
  });

  // List tools handler
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: tools,
  }));

  // Call tool handler
  server.setRequestHandler(CallToolRequestSchema, async (request, extra) =>
    handleToolCall(request.params.name, request.params.arguments ?? {}, server, extra),
  );
}
