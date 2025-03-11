import { mockApiContext, resetAllMocks, setupPlaywrightMocks } from "./helpers";

// Set up all mocks
setupPlaywrightMocks();

// Import the toolsHandler after mocking dependencies
import { handleToolCall } from "../src/toolsHandler";

describe("playwright_delete unit tests", () => {
  beforeEach(() => {
    // Reset mocks before each test
    resetAllMocks();
  });

  it("should handle playwright_delete tool", async () => {
    const name = "playwright_delete";
    const args = { url: "https://example.com/api" };
    const server = {};

    // Mock the API response
    mockApiContext.delete.mockResolvedValueOnce({
      status: jest.fn().mockReturnValueOnce(204),
    });

    const result = await handleToolCall(name, args, server);

    // Verify the delete was called with the correct URL
    expect(mockApiContext.delete).toHaveBeenCalledWith(
      "https://example.com/api"
    );

    // Verify the result
    expect(result.isError).toBe(false);
    expect(result.content[0].text).toBe(
      `Performed delete Operation https://example.com/api`
    );
    expect(result.content[1].text).toBe("Response code 204");
  });

  it("should handle errors when deleting", async () => {
    const name = "playwright_delete";
    const args = { url: "https://example.com/api" };
    const server = {};

    // Mock the API response to return an error
    mockApiContext.delete.mockRejectedValueOnce(new Error("Delete failed"));

    const result = await handleToolCall(name, args, server);

    // Verify the delete was called with the correct URL
    expect(mockApiContext.delete).toHaveBeenCalledWith(
      "https://example.com/api"
    );

    // Verify the result is an error
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Delete failed");
  });
});
