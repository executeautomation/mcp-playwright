#!/usr/bin/env node

import express from 'express';
import { randomUUID } from 'node:crypto';
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import { createToolDefinitions } from "./tools.js";
import { setupRequestHandlers } from "./requestHandler.js";
import { Logger, RequestLoggingMiddleware } from "./logging/index.js";
import { MonitoringSystem } from "./monitoring/index.js";

interface TransportMap {
  [sessionId: string]: SSEServerTransport;
}

export async function startHttpServer(port: number) {
  // Initialize logger and middleware
  const logger = Logger.getInstance(Logger.createDefaultConfig());
  const loggingMiddleware = new RequestLoggingMiddleware(logger);

  // Initialize monitoring system
  const monitoringSystem = new MonitoringSystem({
    enabled: true,
    metricsInterval: 30000,
    healthCheckInterval: 60000,
    memoryThreshold: 80,
    responseTimeThreshold: 5000
  });

  const serverInfo = {
    name: "playwright-mcp",
    version: "1.0.7",
    capabilities: {
      resources: {},
      tools: {},
    }
  };

  // Create Express application
  const app = express();
  app.use(express.json());

  // Store transports by session ID
  const transports: TransportMap = {};

  // Create tool definitions
  const TOOLS = createToolDefinitions();

  // Helper function to create a new MCP server instance
  const createMcpServer = () => {
    const server = new Server(
      {
        name: serverInfo.name,
        version: serverInfo.version,
      },
      {
        capabilities: serverInfo.capabilities,
      }
    );

    // Setup request handlers
    setupRequestHandlers(server, TOOLS, monitoringSystem);

    return server;
  };

  // SSE endpoint - establishes the SSE connection
  app.get('/sse', async (req, res) => {
    logger.info('SSE connection request received');
    
    try {
      const transport = new SSEServerTransport('/messages', res);
      const sessionId = transport.sessionId;
      transports[sessionId] = transport;

      res.on('close', () => {
        logger.info('SSE connection closed', { sessionId });
        delete transports[sessionId];
      });

      const server = createMcpServer();
      await server.connect(transport);
      
      logger.info('SSE transport connected', { sessionId });
    } catch (error) {
      logger.error('Error establishing SSE connection', error instanceof Error ? error : new Error(String(error)));
      if (!res.headersSent) {
        res.status(500).send('Failed to establish SSE connection');
      }
    }
  });

  // Messages endpoint - receives client messages
  app.post('/messages', async (req, res) => {
    const sessionId = req.query.sessionId as string;
    
    if (!sessionId) {
      res.status(400).json({
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message: 'Bad Request: sessionId query parameter required',
        },
        id: null,
      });
      return;
    }

    const transport = transports[sessionId];
    
    if (!transport) {
      logger.warn('Message received for unknown session', { sessionId });
      res.status(400).json({
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message: 'Bad Request: No transport found for sessionId',
        },
        id: null,
      });
      return;
    }

    try {
      await transport.handlePostMessage(req, res, req.body);
    } catch (error) {
      logger.error('Error handling POST message', error instanceof Error ? error : new Error(String(error)), { sessionId });
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: '2.0',
          error: {
            code: -32603,
            message: 'Internal server error',
          },
          id: null,
        });
      }
    }
  });

  // MCP endpoint - unified endpoint for SSE (compatible with newer clients)
  app.get('/mcp', async (req, res) => {
    logger.info('MCP SSE connection request received');
    
    try {
      const transport = new SSEServerTransport('/mcp', res);
      const sessionId = transport.sessionId;
      transports[sessionId] = transport;

      res.on('close', () => {
        logger.info('MCP SSE connection closed', { sessionId });
        delete transports[sessionId];
      });

      const server = createMcpServer();
      await server.connect(transport);
      
      logger.info('MCP SSE transport connected', { sessionId });
    } catch (error) {
      logger.error('Error establishing MCP SSE connection', error instanceof Error ? error : new Error(String(error)));
      if (!res.headersSent) {
        res.status(500).send('Failed to establish MCP SSE connection');
      }
    }
  });

  // MCP POST endpoint - receives client messages on unified endpoint
  app.post('/mcp', async (req, res) => {
    const sessionId = req.query.sessionId as string;
    
    if (!sessionId) {
      res.status(400).json({
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message: 'Bad Request: sessionId query parameter required',
        },
        id: null,
      });
      return;
    }

    const transport = transports[sessionId];
    
    if (!transport) {
      logger.warn('MCP message received for unknown session', { sessionId });
      res.status(400).json({
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message: 'Bad Request: No transport found for sessionId',
        },
        id: null,
      });
      return;
    }

    try {
      await transport.handlePostMessage(req, res, req.body);
    } catch (error) {
      logger.error('Error handling MCP POST message', error instanceof Error ? error : new Error(String(error)), { sessionId });
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: '2.0',
          error: {
            code: -32603,
            message: 'Internal server error',
          },
          id: null,
        });
      }
    }
  });

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      version: serverInfo.version,
      activeSessions: Object.keys(transports).length,
    });
  });

  // Start the HTTP server
  return new Promise<void>((resolve, reject) => {
    const httpServer = app.listen(port, () => {
      logger.info(`Playwright MCP HTTP server listening on port ${port}`, {
        endpoints: {
          sse: `http://localhost:${port}/sse`,
          messages: `http://localhost:${port}/messages`,
          mcp: `http://localhost:${port}/mcp`,
          health: `http://localhost:${port}/health`,
        }
      });

      console.log(`
==============================================
Playwright MCP Server (HTTP Mode)
==============================================
Port: ${port}
Version: ${serverInfo.version}

ENDPOINTS:
- SSE Stream:     GET  http://localhost:${port}/sse
- Messages:       POST http://localhost:${port}/messages?sessionId=<id>
- MCP (unified):  GET  http://localhost:${port}/mcp
- MCP (unified):  POST http://localhost:${port}/mcp?sessionId=<id>
- Health Check:   GET  http://localhost:${port}/health

CLIENT CONFIGURATION:
{
  "mcpServers": {
    "playwright": {
      "url": "http://localhost:${port}/mcp"
    }
  }
}
==============================================
`);

      // Start monitoring system
      monitoringSystem.startMetricsCollection(port + 1).catch(error => {
        logger.warn('Failed to start monitoring HTTP server', { 
          error: error instanceof Error ? error.message : String(error) 
        });
      });

      resolve();
    });

    httpServer.on('error', (error) => {
      logger.error('Failed to start HTTP server', error);
      reject(error);
    });

    // Graceful shutdown
    const shutdown = async () => {
      logger.info('Shutdown signal received');
      
      // Close all active transports
      for (const sessionId in transports) {
        try {
          logger.info('Closing transport', { sessionId });
          await transports[sessionId].close();
          delete transports[sessionId];
        } catch (error) {
          logger.error('Error closing transport', error instanceof Error ? error : new Error(String(error)), { sessionId });
        }
      }

      // Stop monitoring
      try {
        await monitoringSystem.stopMetricsCollection();
        logger.info('Monitoring system stopped');
      } catch (error) {
        logger.error('Error stopping monitoring system', error instanceof Error ? error : new Error(String(error)));
      }

      // Close HTTP server
      httpServer.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });

      // Force exit after timeout
      setTimeout(() => {
        logger.warn('Forced shutdown after timeout');
        process.exit(1);
      }, 5000);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  });
}
