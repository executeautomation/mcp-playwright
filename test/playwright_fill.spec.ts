import { mockPage, resetAllMocks, setupPlaywrightMocks } from "./helpers";

// Set up all mocks
setupPlaywrightMocks();

// Import the toolsHandler after mocking dependencies
import { handleToolCall } from "../src/toolsHandler";

describe("playwright_fill unit tests", () => {
  beforeEach(() => {
    // Reset mocks before each test
    resetAllMocks();
  });

  it("should handle playwright_fill tool", async () => {
    // First navigate to a page to ensure browser is initialized
    await handleToolCall(
      "playwright_navigate",
      { url: "https://example.com" },
      {}
    );

    const name = "playwright_fill";
    const args = { selector: "input", value: "test" };
    const server = {};

    const result = await handleToolCall(name, args, server);

    // Verify the waitForSelector and fill were called with the correct parameters
    expect(mockPage.waitForSelector).toHaveBeenCalledWith("input");
    expect(mockPage.fill).toHaveBeenCalledWith("input", "test");

    // Verify the result
    expect(result.isError).toBe(false);
    expect(result.content[0].text).toBe(`Filled input with: test`);
  });

  it("should handle errors when filling", async () => {
    // First navigate to a page to ensure browser is initialized
    await handleToolCall(
      "playwright_navigate",
      { url: "https://example.com" },
      {}
    );

    const name = "playwright_fill";
    const args = { selector: "input", value: "test" };
    const server = {};

    // Mock the fill method to throw an error
    mockPage.fill.mockRejectedValueOnce(new Error("Fill failed"));

    const result = await handleToolCall(name, args, server);

    // Verify the result
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Fill failed");
  });
});
