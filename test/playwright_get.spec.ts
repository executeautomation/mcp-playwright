import { mockApiContext, resetAllMocks, setupPlaywrightMocks } from "./helpers";

// Set up all mocks
setupPlaywrightMocks();

// Import the toolsHandler after mocking dependencies
import { handleToolCall } from "../src/toolsHandler";

describe("playwright_get unit tests", () => {
  beforeEach(() => {
    // Reset mocks before each test
    resetAllMocks();
  });

  it("should handle playwright_get tool", async () => {
    const name = "playwright_get";
    const args = { url: "https://example.com/api" };
    const server = {};

    // Mock the API response
    mockApiContext.get.mockResolvedValueOnce({
      json: jest.fn().mockResolvedValueOnce({ data: "test" }),
      status: jest.fn().mockReturnValueOnce(200),
    });

    const result = await handleToolCall(name, args, server);

    // Verify the get was called with the correct URL
    expect(mockApiContext.get).toHaveBeenCalledWith("https://example.com/api");

    // Verify the result
    expect(result.isError).toBe(false);
    expect(result.content[0].text).toBe(
      `Performed GET Operation https://example.com/api`
    );
    expect(result.content[2].text).toBe("Response code 200");
  });

  it("should handle errors when performing GET request", async () => {
    const name = "playwright_get";
    const args = { url: "https://example.com/api" };
    const server = {};

    // Mock the API response to return an error
    mockApiContext.get.mockRejectedValueOnce(new Error("GET failed"));

    const result = await handleToolCall(name, args, server);

    // Verify the get was called with the correct URL
    expect(mockApiContext.get).toHaveBeenCalledWith("https://example.com/api");

    // Verify the result is an error
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("GET failed");
  });
});
