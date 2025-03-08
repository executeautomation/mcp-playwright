import {
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { setupRequestHandlers } from "../src/requestHandler";
import { createToolDefinitions } from "../src/tools";
import {
  mockServer,
  mockVirtualHandleToolCall,
  resetAllMocks,
} from "./helpers";

// Automatically mock the toolsHandler module
jest.mock("../src/toolsHandler");

describe("requestHandler unit tests", () => {
  beforeEach(() => {
    // Reset mocks before each test
    resetAllMocks();
  });

  it("should set up request handlers on the server", () => {
    const tools = createToolDefinitions();

    // Call the function being tested
    setupRequestHandlers(mockServer as any, tools as any);

    // Verify that setRequestHandler was called for each handler type
    expect(mockServer.setRequestHandler).toHaveBeenCalledTimes(4);
  });

  it("should set up ListResourcesRequestSchema handler", () => {
    const tools = createToolDefinitions();

    // Call the function being tested
    setupRequestHandlers(mockServer as any, tools as any);

    // Get the first call arguments
    const [schema, handler] = mockServer.setRequestHandler.mock.calls[0];

    // Verify the schema is the ListResourcesRequestSchema
    expect(schema).toBe(ListResourcesRequestSchema);

    // Call the handler and verify the result
    return handler().then((result: any) => {
      expect(result).toHaveProperty("resources");
      expect(result.resources[0]).toEqual({
        uri: "console://logs",
        mimeType: "text/plain",
        name: "Browser console logs",
      });
    });
  });

  it("should set up ReadResourceRequestSchema handler for console logs", () => {
    const tools = createToolDefinitions();

    // Call the function being tested
    setupRequestHandlers(mockServer as any, tools as any);

    // Get the second call arguments
    const [schema, handler] = mockServer.setRequestHandler.mock.calls[1];

    // Verify the schema is the ReadResourceRequestSchema
    expect(schema).toBe(ReadResourceRequestSchema);

    // Call the handler with console logs URI and verify the result
    const request = { params: { uri: "console://logs" } };
    return handler(request).then((result: any) => {
      expect(result).toHaveProperty("contents");
      expect(result.contents[0]).toEqual({
        uri: "console://logs",
        mimeType: "text/plain",
        text: "Test log",
      });
    });
  });

  it("should set up ReadResourceRequestSchema handler for screenshots", () => {
    const tools = createToolDefinitions();

    // Call the function being tested
    setupRequestHandlers(mockServer as any, tools as any);

    // Get the second call arguments
    const [schema, handler] = mockServer.setRequestHandler.mock.calls[1];

    // Call the handler with screenshot URI and verify the result
    const request = { params: { uri: "screenshot://test" } };
    return handler(request).then((result: any) => {
      expect(result).toHaveProperty("contents");
      expect(result.contents[0]).toEqual({
        uri: "screenshot://test",
        mimeType: "image/png",
        blob: "base64data",
      });
    });
  });

  it("should handle errors for non-existent resources", () => {
    const tools = createToolDefinitions();

    // Call the function being tested
    setupRequestHandlers(mockServer as any, tools as any);

    // Get the second call arguments
    const [schema, handler] = mockServer.setRequestHandler.mock.calls[1];

    // Call the handler with an invalid URI and verify it throws an error
    const request = { params: { uri: "invalid://uri" } };
    return expect(handler(request)).rejects.toThrow(
      "Resource not found: invalid://uri"
    );
  });

  it("should set up ListToolsRequestSchema handler", () => {
    const tools = createToolDefinitions();

    // Call the function being tested
    setupRequestHandlers(mockServer as any, tools as any);

    // Get the third call arguments
    const [schema, handler] = mockServer.setRequestHandler.mock.calls[2];

    // Verify the schema is the ListToolsRequestSchema
    expect(schema).toBe(ListToolsRequestSchema);

    // Call the handler and verify the result
    return handler().then((result: any) => {
      expect(result).toHaveProperty("tools");
      expect(result.tools).toBe(tools);
    });
  });

  it("should set up CallToolRequestSchema handler", () => {
    const tools = createToolDefinitions();

    // Call the function being tested
    setupRequestHandlers(mockServer as any, tools as any);

    // Get the fourth call arguments
    const [schema, handler] = mockServer.setRequestHandler.mock.calls[3];

    // Verify the schema is the CallToolRequestSchema
    expect(schema).toBe(CallToolRequestSchema);

    // Call the handler and verify handleToolCall is called with the right arguments
    const request = {
      params: {
        name: "playwright_click",
        arguments: { selector: "#test-button" },
      },
    };

    return handler(request).then(() => {
      expect(mockVirtualHandleToolCall).toHaveBeenCalledWith(
        "playwright_click",
        { selector: "#test-button" },
        mockServer
      );
    });
  });
});
