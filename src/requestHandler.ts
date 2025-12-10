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
import { Logger, RequestLoggingMiddleware } from "./logging/index.js";
import { MonitoringSystem } from "./monitoring/index.js";

export function setupRequestHandlers(server: Server, tools: Tool[], monitoringSystem?: MonitoringSystem) {
  // Initialize logger and middleware
  const logger = Logger.getInstance(Logger.createDefaultConfig());
  const loggingMiddleware = new RequestLoggingMiddleware(logger);

  // Helper function to wrap handlers with monitoring
  const wrapWithMonitoring = <T extends (...args: any[]) => Promise<any>>(
    handler: T,
    category: string
  ): T => {
    return (async (...args: any[]) => {
      const startTime = Date.now();
      let success = true;
      
      try {
        const result = await handler(...args);
        return result;
      } catch (error) {
        success = false;
        throw error;
      } finally {
        if (monitoringSystem) {
          const duration = Date.now() - startTime;
          monitoringSystem.recordRequest(duration, success, category);
        }
      }
    }) as T;
  };

  // List resources handler
  server.setRequestHandler(ListResourcesRequestSchema, loggingMiddleware.wrapHandler(
    'ListResources',
    wrapWithMonitoring(async () => ({
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
    }), 'ListResources')
  ));

  // Read resource handler
  server.setRequestHandler(ReadResourceRequestSchema, loggingMiddleware.wrapHandler(
    'ReadResource',
    wrapWithMonitoring(async (request) => {
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
    }, 'ReadResource')
  ));

  // List tools handler
  server.setRequestHandler(ListToolsRequestSchema, loggingMiddleware.wrapHandler(
    'ListTools',
    wrapWithMonitoring(async () => ({
      tools: tools,
    }), 'ListTools')
  ));

  // Call tool handler with enhanced tool logging
  const wrappedToolHandler = loggingMiddleware.wrapToolHandler(handleToolCall);
  server.setRequestHandler(CallToolRequestSchema, loggingMiddleware.wrapHandler(
    'CallTool',
    wrapWithMonitoring(async (request) => wrappedToolHandler(request.params.name, request.params.arguments ?? {}, server), 'CallTool')
  ));
}