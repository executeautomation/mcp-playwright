import { mockApiContext, resetAllMocks, setupPlaywrightMocks } from "./helpers";

// Set up all mocks
setupPlaywrightMocks();

// Import the toolsHandler after mocking dependencies
import { handleToolCall } from "../src/toolsHandler";

describe("playwright_post unit tests", () => {
  beforeEach(() => {
    // Reset mocks before each test
    resetAllMocks();
  });

  it("should handle playwright_post tool", async () => {
    const name = "playwright_post";
    const args = { url: "https://example.com/api", value: { test: "data" } };
    const server = {};

    // Mock the API response
    mockApiContext.post.mockResolvedValueOnce({
      json: jest.fn().mockResolvedValueOnce({ success: true }),
      status: jest.fn().mockReturnValueOnce(201),
    });

    const result = await handleToolCall(name, args, server);

    // Verify the post was called with the correct URL and data
    expect(mockApiContext.post).toHaveBeenCalledWith(
      "https://example.com/api",
      expect.objectContaining({
        data: { test: "data" },
        headers: expect.any(Object),
      })
    );

    // Verify the result
    expect(result.isError).toBe(false);
    expect(result.content[0].text).toContain(
      `Performed POST Operation https://example.com/api`
    );
    expect(result.content[2].text).toBe("Response code 201");
  });

  it("should handle errors when posting", async () => {
    const name = "playwright_post";
    const args = { url: "https://example.com/api", value: { test: "data" } };
    const server = {};

    // Mock the API response to return an error
    mockApiContext.post.mockRejectedValueOnce(new Error("Post failed"));

    const result = await handleToolCall(name, args, server);

    // Verify the post was called with the correct URL and data
    expect(mockApiContext.post).toHaveBeenCalledWith(
      "https://example.com/api",
      expect.objectContaining({
        data: { test: "data" },
        headers: expect.any(Object),
      })
    );

    // Verify the result is an error
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Post failed");
  });
});
