import { mockApiContext, resetAllMocks, setupPlaywrightMocks } from "./helpers";

// Set up all mocks
setupPlaywrightMocks();

// Import the toolsHandler after mocking dependencies
import { handleToolCall } from "../src/toolsHandler";

describe("playwright_patch unit tests", () => {
  beforeEach(() => {
    // Reset mocks before each test
    resetAllMocks();
  });

  it("should handle playwright_patch tool", async () => {
    const name = "playwright_patch";
    const args = { url: "https://example.com/api", value: { test: "data" } };
    const server = {};

    // Mock the API response
    mockApiContext.patch.mockResolvedValueOnce({
      json: jest.fn().mockResolvedValueOnce({ success: true }),
      status: jest.fn().mockReturnValueOnce(200),
    });

    const result = await handleToolCall(name, args, server);

    // Verify the patch was called with the correct URL and data
    expect(mockApiContext.patch).toHaveBeenCalledWith(
      "https://example.com/api",
      expect.objectContaining({
        data: { test: "data" },
        headers: expect.any(Object),
      })
    );

    // Verify the result
    expect(result.isError).toBe(false);
    expect(result.content[0].text).toContain(
      `Performed PATCH Operation https://example.com/api`
    );
    expect(result.content[2].text).toBe("Response code 200");
  });

  it("should handle errors when patching", async () => {
    const name = "playwright_patch";
    const args = { url: "https://example.com/api", value: { test: "data" } };
    const server = {};

    // Mock the API response to return an error
    mockApiContext.patch.mockRejectedValueOnce(new Error("Patch failed"));

    const result = await handleToolCall(name, args, server);

    // Verify the patch was called with the correct URL and data
    expect(mockApiContext.patch).toHaveBeenCalledWith(
      "https://example.com/api",
      expect.objectContaining({
        data: { test: "data" },
        headers: expect.any(Object),
      })
    );

    // Verify the result is an error
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Patch failed");
  });
});
