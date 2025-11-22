#!/usr/bin/env node

import { randomUUID } from "node:crypto";
import fs from "node:fs";
import { createServer } from "node:http";
import os from "node:os";
import nodePath from "node:path";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import Busboy from "busboy";
import { setupRequestHandlers } from "./requestHandler.js";
import { clearResourcesForServer, configureResourceManager, getFileResourceById } from "./resourceManager.js";
import { setUserAgentConfig } from "./toolHandler.js";
import { createToolDefinitions } from "./tools.js";
import {
  clearUploadsForSession,
  ensureUploadsDir,
  registerUploadedFile,
  setUploadEndpointUrl,
} from "./uploadManager.js";

const DEFAULT_PORT = 8000;
const DEFAULT_PATH = "/mcp";
const DEFAULT_RESOURCE_TTL_SECONDS = 600;
const DEFAULT_HOSTNAME = os.hostname();

export interface CliOptions {
  http: boolean;
  port: number;
  path: string;
  resourceTtlSeconds: number;
  hostName: string;
  insecure: boolean;
  listen: string;
  staticUserAgent: boolean;
}

export function normalizeHttpPath(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error("HTTP path cannot be empty");
  }
  const withLeadingSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return withLeadingSlash.endsWith("/") && withLeadingSlash !== "/" ? withLeadingSlash.slice(0, -1) : withLeadingSlash;
}

export function parseCliOptions(args: string[]): CliOptions {
  const options: CliOptions = {
    http: false,
    port: DEFAULT_PORT,
    path: DEFAULT_PATH,
    resourceTtlSeconds: DEFAULT_RESOURCE_TTL_SECONDS,
    hostName: DEFAULT_HOSTNAME,
    insecure: false,
    listen: "0.0.0.0",
    staticUserAgent: false,
  };

  const parsePort = (value: string) => {
    const port = Number.parseInt(value, 10);
    if (!Number.isFinite(port) || port < 0 || port > 65535) {
      throw new Error(`Invalid port value: ${value}`);
    }
    return port;
  };

  const parseTtl = (value: string) => {
    const seconds = Number.parseInt(value, 10);
    if (!Number.isFinite(seconds) || seconds <= 0) {
      throw new Error(`Invalid resource TTL: ${value}`);
    }
    return seconds;
  };

  const parseHost = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) {
      throw new Error("Host name cannot be empty");
    }
    return trimmed;
  };

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === "--http") {
      options.http = true;
    } else if (arg === "--port") {
      const value = args[i + 1];
      if (!value) {
        throw new Error("Missing value for --port");
      }
      options.port = parsePort(value);
      i += 1;
    } else if (arg.startsWith("--port=")) {
      options.port = parsePort(arg.split("=")[1] ?? "");
    } else if (arg === "--path") {
      const value = args[i + 1];
      if (!value) {
        throw new Error("Missing value for --path");
      }
      options.path = normalizeHttpPath(value);
      i += 1;
    } else if (arg.startsWith("--path=")) {
      options.path = normalizeHttpPath(arg.split("=")[1] ?? "");
    } else if (arg === "--resource-ttl") {
      const value = args[i + 1];
      if (!value) {
        throw new Error("Missing value for --resource-ttl");
      }
      options.resourceTtlSeconds = parseTtl(value);
      i += 1;
    } else if (arg.startsWith("--resource-ttl=")) {
      options.resourceTtlSeconds = parseTtl(arg.split("=")[1] ?? "");
    } else if (arg === "--host-name") {
      const value = args[i + 1];
      if (!value) {
        throw new Error("Missing value for --host-name");
      }
      options.hostName = parseHost(value);
      i += 1;
    } else if (arg.startsWith("--host-name=")) {
      options.hostName = parseHost(arg.split("=")[1] ?? "");
    } else if (arg === "--insecure") {
      options.insecure = true;
    } else if (arg === "--static-user-agent") {
      options.staticUserAgent = true;
    } else if (arg === "--listen") {
      const value = args[i + 1];
      if (!value) {
        throw new Error("Missing value for --listen");
      }
      options.listen = value;
      i += 1;
    } else if (arg.startsWith("--listen=")) {
      options.listen = arg.split("=")[1] ?? "0.0.0.0";
    }
  }

  return options;
}

export function createMcpServer(options?: { httpMode?: boolean; uploadEndpoint?: string }): Server {
  const server = new Server(
    {
      name: "playwright-mcp",
      version: "1.0.6",
    },
    {
      capabilities: {
        resources: {
          listChanged: true,
        },
        tools: {},
      },
    },
  );

  const tools = createToolDefinitions({
    httpMode: options?.httpMode ?? false,
    uploadEndpoint: options?.uploadEndpoint,
  });
  setupRequestHandlers(server, tools);
  return server;
}

function registerShutdown(cleanup?: () => Promise<void>) {
  let isShuttingDown = false;

  const shutdown = async () => {
    if (isShuttingDown) {
      return;
    }
    isShuttingDown = true;
    console.log("Shutdown signal received");
    if (cleanup) {
      try {
        await cleanup();
      } catch (error) {
        console.error("Error during shutdown:", error);
      }
    }
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
  process.on("uncaughtException", (err) => {
    console.error("Uncaught Exception:", err);
  });
}

async function runStdioServer() {
  configureResourceManager({ enabled: false });
  const server = createMcpServer({ httpMode: false });
  registerShutdown(() => server.close());

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

export async function startStreamableHttpServer({
  port,
  path,
  resourceTtlSeconds = DEFAULT_RESOURCE_TTL_SECONDS,
  hostName = DEFAULT_HOSTNAME,
  insecure = false,
  listen = "0.0.0.0",
}: {
  port: number;
  path: string;
  resourceTtlSeconds?: number;
  hostName?: string;
  insecure?: boolean;
  listen?: string;
}) {
  const sessionByServer = new Map<Server, string>();
  const normalizedPath = normalizeHttpPath(path);
  configureResourceManager({
    enabled: true,
    ttlSeconds: resourceTtlSeconds,
    buildResourceUri: ({ server, id, filename }) => {
      const sessionId = sessionByServer.get(server);
      if (!sessionId) return undefined;
      const scheme = insecure ? "http" : "https";
      const portPart = `:${port}`;
      const sanitizedFile = encodeURIComponent(filename);
      return `${scheme}://${hostName}${portPart}${normalizedPath}/resources/${sessionId}/${id}/${sanitizedFile}`;
    },
    getSessionId: (server) => sessionByServer.get(server),
  });
  const sessions: Record<string, { transport: StreamableHTTPServerTransport; server: Server }> = {};
  const uploadsPath = `${normalizedPath}/uploads`;
  const uploadEndpointBase = `${insecure ? "http" : "https"}://${hostName}:${port}${uploadsPath}`;
  setUploadEndpointUrl(uploadEndpointBase);
  const server = createServer(async (req, res) => {
    try {
      const url = req.url ? new URL(req.url, "http://localhost") : null;
      const method = req.method ?? "GET";

      const downloadPrefix = `${normalizedPath}/resources/`;
      if (url?.pathname.startsWith(downloadPrefix)) {
        const parts = url.pathname.slice(downloadPrefix.length).split("/");
        if (parts.length < 2) {
          res.writeHead(400).end("Invalid download path");
          return;
        }
        const [sessionId, resourceId] = parts;
        const session = sessions[sessionId];
        if (!session) {
          res.writeHead(404).end("Not Found");
          return;
        }
        const fileResource = await getFileResourceById(session.server, resourceId);
        if (!fileResource) {
          res.writeHead(404).end("Not Found");
          return;
        }
        try {
          const stat = await fs.promises.stat(fileResource.filePath);
          res.writeHead(200, {
            "content-type": fileResource.mimeType ?? "application/octet-stream",
            "content-length": stat.size,
            "content-disposition": `inline; filename="${nodePath.basename(fileResource.name)}"`,
          });
          fs.createReadStream(fileResource.filePath).pipe(res);
        } catch (error) {
          console.error("Failed to serve download:", error);
          res.writeHead(500).end("Failed to serve file");
        }
        return;
      }

      const uploadPathPrefix = `${uploadsPath}/`;
      const isUploadPath =
        (url?.pathname === uploadsPath || (url?.pathname ?? "").startsWith(uploadPathPrefix)) && method === "POST";
      if (isUploadPath) {
        const sessionIdFromPath = url?.pathname?.startsWith(uploadPathPrefix)
          ? url.pathname.slice(uploadPathPrefix.length).split("/")[0]
          : undefined;
        const sessionIdHeader = req.headers["x-mcp-session-id"] ?? req.headers["mcp-session-id"];
        const sessionIdHeaderValue = Array.isArray(sessionIdHeader) ? sessionIdHeader[0] : sessionIdHeader;
        const sessionId = sessionIdFromPath || sessionIdHeaderValue;

        const safeEnd = (status: number, message: string) => {
          if (res.writableEnded) return;
          res.writeHead(status).end(message);
        };

        if (!sessionId || !sessions[sessionId]) {
          safeEnd(400, "Invalid or missing session ID");
          return;
        }

        const contentType = String(req.headers["content-type"] ?? "").toLowerCase();
        if (!contentType.includes("multipart/form-data")) {
          safeEnd(
            415,
            'Invalid content-type; expected multipart/form-data with a boundary. Example: curl -F "file=@path" <upload-url>',
          );
          return;
        }
        if (!contentType.includes("boundary=")) {
          safeEnd(
            400,
            'Missing multipart boundary. Ensure you send multipart/form-data with a boundary (e.g., curl -F "file=@path" <upload-url>).',
          );
          return;
        }

        const sessionDir = await ensureUploadsDir(sessionId);
        let storedPath: string | null = null;
        let originalName = "upload.bin";
        let mimeType: string | undefined;
        let size = 0;
        let errored = false;

        try {
          const busboy = Busboy({ headers: req.headers });
          await new Promise<void>((resolve, reject) => {
            busboy.on("file", (_fieldname, file, info) => {
              const safeName = info.filename ? nodePath.basename(info.filename) : "upload.bin";
              originalName = safeName;
              mimeType = info.mimeType;
              const targetPath = nodePath.join(sessionDir, `${randomUUID()}-${safeName}`);
              storedPath = targetPath;
              const writeStream = fs.createWriteStream(targetPath);

              file.on("data", (data) => {
                size += data.length;
                writeStream.write(data);
              });

              file.on("end", () => {
                writeStream.end();
              });

              file.on("error", (err) => {
                errored = true;
                writeStream.destroy(err);
                reject(err);
              });

              writeStream.on("error", (err) => {
                errored = true;
                reject(err);
              });
            });

            busboy.on("finish", () => {
              if (!storedPath || errored) {
                reject(new Error("Upload failed"));
                return;
              }
              resolve();
            });

            busboy.on("error", (err) => reject(err));
            req.on("aborted", () => reject(new Error("Upload aborted")));

            req.pipe(busboy);
          });
        } catch (error) {
          const message =
            error instanceof Error && error.message.toLowerCase().includes("boundary not found")
              ? 'Upload failed: multipart boundary not found. Use POST multipart/form-data with a boundary (e.g., curl -F "file=@path" <upload-url>).'
              : 'Upload failed. Ensure you POST multipart/form-data with field name "file".';
          console.error("Upload handling failed:", error);
          safeEnd(400, message);
          return;
        }

        if (!storedPath) {
          safeEnd(400, "No file uploaded");
          return;
        }

        const registered = registerUploadedFile({
          sessionId,
          filePath: storedPath,
          name: originalName,
          mimeType,
          size,
        });

        if (res.writableEnded) return;
        res.writeHead(200, { "content-type": "application/json" }).end(
          JSON.stringify({
            resourceUri: registered.uri,
            name: registered.name,
            mimeType: registered.mimeType,
            size: registered.size,
          }),
        );
        return;
      }

      if (!url || url.pathname !== normalizedPath) {
        res.writeHead(404).end("Not Found");
        return;
      }

      const sendJsonError = (status: number, message: string) => {
        res.writeHead(status, { "content-type": "application/json" }).end(
          JSON.stringify({
            jsonrpc: "2.0",
            error: { code: -32000, message },
            id: null,
          }),
        );
      };

      const getSession = () => {
        const sessionId =
          req.headers["mcp-session-id"] === undefined ? undefined : String(req.headers["mcp-session-id"]);
        return sessionId ? sessions[sessionId] : undefined;
      };

      if (method === "POST") {
        const chunks: Buffer[] = [];
        for await (const chunk of req) {
          chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : Buffer.from(chunk));
        }

        const rawBody = Buffer.concat(chunks).toString("utf8");
        let parsedBody: unknown;

        if (rawBody) {
          try {
            parsedBody = JSON.parse(rawBody);
          } catch (_error) {
            sendJsonError(400, "Invalid JSON body");
            return;
          }
        }

        const existingSession = getSession();
        if (existingSession) {
          await existingSession.transport.handleRequest(req, res, parsedBody);
          return;
        }

        if (!parsedBody || !isInitializeRequest(parsedBody)) {
          sendJsonError(400, "Bad Request: No valid session ID provided");
          return;
        }

        const mcpServer = createMcpServer({
          httpMode: true,
          uploadEndpoint: uploadEndpointBase,
        });
        let transport: StreamableHTTPServerTransport | null = null;
        transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => randomUUID(),
          onsessioninitialized: (sessionId: string) => {
            if (transport) {
              sessions[sessionId] = { server: mcpServer, transport };
              sessionByServer.set(mcpServer, sessionId);
            }
          },
        });

        if (transport.sessionId) {
          sessions[transport.sessionId] = { server: mcpServer, transport };
          sessionByServer.set(mcpServer, transport.sessionId);
        }

        let transportClosed = false;
        transport.onclose = () => {
          if (transportClosed) return;
          transportClosed = true;
          const sessionId = transport?.sessionId;
          if (sessionId && sessions[sessionId]) {
            delete sessions[sessionId];
          }
          mcpServer.close().catch((error) => console.error("Error closing MCP server:", error));
          clearResourcesForServer(mcpServer);
          if (sessionId) {
            clearUploadsForSession(sessionId).catch(() => {});
          }
          sessionByServer.delete(mcpServer);
        };

        await mcpServer.connect(transport);
        await transport.handleRequest(req, res, parsedBody);
        return;
      }

      if (method === "GET" || method === "DELETE") {
        const session = getSession();
        if (!session) {
          res.writeHead(400).end("Invalid or missing session ID");
          return;
        }

        await session.transport.handleRequest(req, res);

        if (method === "DELETE" && session.transport.sessionId) {
          clearResourcesForServer(session.server);
          clearUploadsForSession(session.transport.sessionId).catch(() => {});
          delete sessions[session.transport.sessionId];
          sessionByServer.delete(session.server);
        }
        return;
      }

      res.writeHead(405).end("Method Not Allowed");
    } catch (error) {
      console.error("Error handling Streamable HTTP request:", error);
      if (!res.headersSent) {
        res.writeHead(500, { "content-type": "application/json" }).end(
          JSON.stringify({
            jsonrpc: "2.0",
            error: { code: -32603, message: "Internal server error" },
            id: null,
          }),
        );
      }
    }
  });

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, listen, resolve);
  });

  const address = server.address();
  const resolvedPort = typeof address === "object" && address !== null ? address.port : port;

  console.log(`MCP Streamable HTTP server listening on http://${listen}:${resolvedPort}${normalizedPath}`);

  const close = async () => {
    const sessionIds = Object.keys(sessions);
    for (const sessionId of sessionIds) {
      const session = sessions[sessionId];
      try {
        await session.server.close();
      } catch (error) {
        console.error(`Error closing session ${sessionId}:`, error);
      }
      await clearUploadsForSession(sessionId).catch(() => {});
      delete sessions[sessionId];
    }

    await new Promise<void>((resolve, reject) => {
      server.close((err) => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    });
  };

  registerShutdown(close);
  return { server, close };
}

async function runServer() {
  const options = parseCliOptions(process.argv.slice(2));

  if (options.http) {
    setUserAgentConfig({ staticUserAgent: options.staticUserAgent });
    await startStreamableHttpServer({
      port: options.port,
      path: options.path,
      hostName: options.hostName,
      insecure: options.insecure,
      resourceTtlSeconds: options.resourceTtlSeconds,
      listen: options.listen,
    });
    return;
  }

  setUserAgentConfig({ staticUserAgent: options.staticUserAgent });
  await runStdioServer();
}

const isDirectRun = (process.argv[1] ?? "").endsWith("index.js");

if (isDirectRun) {
  runServer().catch((error) => {
    console.error("Fatal error in main():", error);
    process.exit(1);
  });
}
