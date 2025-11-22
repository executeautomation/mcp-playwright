import type { AddressInfo } from "node:net";
import { startStreamableHttpServer, parseCliOptions, normalizeHttpPath } from "../index.js";
import os from "node:os";

const handleRequestMock = jest.fn(
  async (_req: unknown, res: any, _body?: unknown) => {
    if (!res.writableEnded) {
      res.writeHead(200).end("ok");
    }
  }
);
const startMock = jest.fn();
const closeTransportMock = jest.fn();
let lastSessionId = "mock-session";

jest.mock("@modelcontextprotocol/sdk/server/streamableHttp.js", () => ({
  __esModule: true,
  StreamableHTTPServerTransport: class {
    sessionId?: string;
    onclose?: () => void;
    onerror?: (error: Error) => void;
    onmessage?: (message: unknown) => void;

    constructor(options: { sessionIdGenerator?: () => string; onsessioninitialized?: (sessionId: string) => void }) {
      lastSessionId = options.sessionIdGenerator?.() ?? "mock-session";
      this.sessionId = lastSessionId;
      options.onsessioninitialized?.(this.sessionId);
    }

    async start() {
      startMock();
    }

    async handleRequest(req: unknown, res: any, body?: unknown) {
      await handleRequestMock(req, res, body);
      if (!res.writableEnded) {
        res.writeHead(200).end("ok");
      }
    }

    async close() {
      closeTransportMock();
      this.onclose?.();
    }

    async send() {
      // no-op for tests
    }
  },
}));

const initializeRequest = {
  jsonrpc: "2.0",
  id: "1",
  method: "initialize",
  params: {
    protocolVersion: "2025-03-26",
    capabilities: {},
    clientInfo: {
      name: "jest",
      version: "1.0.0",
    },
  },
};

describe("CLI options", () => {
  test("uses defaults without flags", () => {
    expect(parseCliOptions([])).toEqual({
      http: false,
      port: 8000,
      path: "/mcp",
      resourceTtlSeconds: 600,
      hostName: os.hostname(),
      insecure: false,
      listen: "0.0.0.0",
      staticUserAgent: false,
    });
  });

  test("parses http flags with normalization", () => {
    expect(
      parseCliOptions(["--http", "--port", "9001", "--path", "custom/"])
    ).toEqual({
      http: true,
      port: 9001,
      path: "/custom",
      resourceTtlSeconds: 600,
      hostName: os.hostname(),
      insecure: false,
      listen: "0.0.0.0",
      staticUserAgent: false,
    });
    expect(normalizeHttpPath("/nested/path/")).toBe("/nested/path");
  });
});

describe("Streamable HTTP server", () => {
  let cleanup: (() => Promise<void>) | null = null;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    if (cleanup) {
      await cleanup();
      cleanup = null;
    }
  });

  test("accepts initialization and reuses the same session", async () => {
    const { server, close } = await startStreamableHttpServer({
      port: 0,
      path: "/mcp",
    });
    cleanup = close;

    const address = server.address() as AddressInfo;
    const baseUrl = `http://127.0.0.1:${address.port}`;

    const initResponse = await fetch(`${baseUrl}/mcp`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(initializeRequest),
    });

    expect(initResponse.status).toBe(200);
    expect(handleRequestMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      initializeRequest
    );

    handleRequestMock.mockClear();
    const sessionId = lastSessionId;

    const getResponse = await fetch(`${baseUrl}/mcp`, {
      method: "GET",
      headers: { "mcp-session-id": sessionId },
    });

    expect(getResponse.status).toBe(200);
    expect(handleRequestMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      undefined
    );
  });

  test("rejects requests without a session", async () => {
    const { server, close } = await startStreamableHttpServer({
      port: 0,
      path: "/mcp",
    });
    cleanup = close;

    const address = server.address() as AddressInfo;
    const baseUrl = `http://127.0.0.1:${address.port}`;

    const response = await fetch(`${baseUrl}/mcp`, { method: "GET" });
    expect(response.status).toBe(400);
    expect(handleRequestMock).not.toHaveBeenCalled();
  });
});
