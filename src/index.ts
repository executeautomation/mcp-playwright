#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import express from "express";
import cors from "cors";
import { createToolDefinitions } from "./tools.js";
import { setupRequestHandlers } from "./requestHandler.js";
import { setupSSEEndpoints } from "./sseHandler.js";

async function runServer() {
  // Create Express app for HTTP server
  const app = express();
  const PORT = process.env.PORT || 3000;
  
  // Enable CORS for all routes
  app.use(cors());
  
  // Parse JSON bodies
  app.use(express.json());

  // Setup SSE endpoints
  setupSSEEndpoints(app);
  
  // Start HTTP server
  const httpServer = app.listen(PORT, () => {
    console.log(`HTTP server running on port ${PORT}`);
  });

  // Initialize MCP server
  const server = new Server(
    {
      name: "executeautomation/playwright-mcp-server",
      version: "1.0.3",
    },
    {
      capabilities: {
        resources: {},
        tools: {},
      },
    }
  );

  // Create tool definitions
  const TOOLS = createToolDefinitions();

  // Setup request handlers
  setupRequestHandlers(server, TOOLS);

  // Create transport and connect
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  // Handle graceful shutdown
  const handleShutdown = async () => {
    console.log("Shutting down servers...");
    
    // Close HTTP server
    httpServer.close();
    
    // Exit process
    process.exit(0);
  };
  
  // Register shutdown handlers
  process.on("SIGINT", handleShutdown);
  process.on("SIGTERM", handleShutdown);
}

runServer().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});