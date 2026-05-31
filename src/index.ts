#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createToolDefinitions } from "./tools.js";
import { setupRequestHandlers } from "./requestHandler.js";
import { closeBrowser } from "./toolHandler.js";
import { Logger, RequestLoggingMiddleware } from "./logging/index.js";
import { MonitoringSystem } from "./monitoring/index.js";
import { startHttpServer } from "./http-server.js";

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options: { port?: number } = {};
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--port' && i + 1 < args.length) {
      options.port = parseInt(args[i + 1], 10);
      if (isNaN(options.port) || options.port < 1 || options.port > 65535) {
        console.error('Error: --port must be a valid port number (1-65535)');
        process.exit(1);
      }
    } else if (args[i] === '--help' || args[i] === '-h') {
      console.error(`
Playwright MCP Server

USAGE:
  playwright-mcp-server [OPTIONS]

OPTIONS:
  --port <number>    Run in HTTP mode on the specified port
  --help, -h         Show this help message

EXAMPLES:
  # Run in stdio mode (default)
  playwright-mcp-server

  # Run in HTTP mode on port 8931
  playwright-mcp-server --port 8931

HTTP MODE CONFIGURATION:
  When running with --port, configure your MCP client:
  
  {
    "mcpServers": {
      "playwright": {
        "url": "http://localhost:8931/mcp",
        "type": "http"
      }
    }
  }
`);
      process.exit(0);
    }
  }
  
  return options;
}

async function runServer() {
  const options = parseArgs();
  
  // If port is specified, run in HTTP mode
  if (options.port) {
    // Show immediate feedback
    process.stdout.write(`\n⏳ Initializing Playwright MCP Server on port ${options.port}...\n`);
    await startHttpServer(options.port);
    return;
  }
  
  // Otherwise, run in stdio mode (default)
  // Initialize logger for stdio mode (file only - no console output to avoid breaking stdio protocol)
  const logger = Logger.getInstance({
    level: 'info',
    format: 'json',
    outputs: ['file'], // File only - console would write to stdout and break stdio protocol
    filePath: `${process.env.HOME || '/tmp'}/playwright-mcp-server.log`, // Use home directory
    maxFileSize: 10485760,
    maxFiles: 5
  });
  const loggingMiddleware = new RequestLoggingMiddleware(logger);

  // Initialize monitoring system (disabled in stdio mode to avoid console output)
  const monitoringSystem = new MonitoringSystem({
    enabled: false, // Disabled in stdio mode - HTTP server output would break stdio protocol
    metricsInterval: 30000,
    healthCheckInterval: 60000,
    memoryThreshold: 80,
    responseTimeThreshold: 5000
  });

  const serverInfo = {
    name: "playwright-mcp",
    version: "1.0.11",
    capabilities: {
      resources: {},
      tools: {},
    }
  };

  const server = new Server(
    {
      name: serverInfo.name,
      version: serverInfo.version,
    },
    {
      capabilities: serverInfo.capabilities,
    }
  );

  // Log server startup
  loggingMiddleware.logServerStartup(serverInfo);

  // Create tool definitions
  const TOOLS = createToolDefinitions();

  // Setup request handlers
  setupRequestHandlers(server, TOOLS, monitoringSystem);

  // Start monitoring system
  try {
    await monitoringSystem.startMetricsCollection(3001);
    logger.info('Monitoring system started', { port: 3001 });
  } catch (error) {
    logger.warn('Failed to start monitoring HTTP server', { error: error instanceof Error ? error.message : String(error) });
  }

  // Graceful shutdown logic — close the browser so we don't leak Chromium
  let shuttingDown = false;
  async function shutdown() {
    if (shuttingDown) return; // ignore repeat signals / 'exit' re-entry
    shuttingDown = true;
    loggingMiddleware.logServerShutdown();
    logger.info('Shutdown signal received');

    // Close the browser, but never let a hung close block process exit
    try {
      await Promise.race([
        closeBrowser(),
        new Promise<void>((resolve) => setTimeout(resolve, 5000)),
      ]);
    } catch (error) {
      logger.error('Error closing browser on shutdown', error instanceof Error ? error : new Error(String(error)));
    }

    try {
      await monitoringSystem.stopMetricsCollection();
      logger.info('Monitoring system stopped');
    } catch (error) {
      logger.error('Error stopping monitoring system', error instanceof Error ? error : new Error(String(error)));
    }

    process.exit(0);
  }

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
  process.on('exit', shutdown);
  process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception', err, {
      category: 'system',
      nodeVersion: process.version,
      platform: process.platform,
    });
  });

  // Exit when the client/parent goes away. StdioServerTransport only listens
  // for 'data'/'error' on stdin, so when the parent process dies (stdin EOF)
  // nothing tears the server down — without this it lingers and leaks its
  // browser. Watching stdin end/close lets us shut down cleanly.
  process.stdin.on('end', shutdown);
  process.stdin.on('close', shutdown);

  // Create transport and connect
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  logger.info('MCP Server connected and ready', {
    transport: 'stdio',
    toolCount: TOOLS.length,
  });
}

runServer().catch(() => {
  process.exit(1);
});