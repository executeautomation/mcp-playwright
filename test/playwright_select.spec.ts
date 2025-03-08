import { mockPage, resetAllMocks, setupPlaywrightMocks } from "./helpers";

// Set up all mocks
setupPlaywrightMocks();

// Import the toolsHandler after mocking dependencies
import { handleToolCall } from "../src/toolsHandler";

describe("playwright_select unit tests", () => {
  beforeEach(() => {
    // Reset mocks before each test
    resetAllMocks();
  });

  it("should handle playwright_select tool", async () => {
    // First navigate to a page to ensure browser is initialized
    await handleToolCall(
      "playwright_navigate",
      { url: "https://example.com" },
      {}
    );

    const name = "playwright_select";
    const args = { selector: "select", value: "option1" };
    const server = {};

    const result = await handleToolCall(name, args, server);

    // Verify the waitForSelector and selectOption were called with the correct parameters
    expect(mockPage.waitForSelector).toHaveBeenCalledWith("select");
    expect(mockPage.selectOption).toHaveBeenCalledWith("select", "option1");

    // Verify the result
    expect(result.isError).toBe(false);
    expect(result.content[0].text).toBe(`Selected select with: option1`);
  });

  it("should handle errors when selecting", async () => {
    // First navigate to a page to ensure browser is initialized
    await handleToolCall(
      "playwright_navigate",
      { url: "https://example.com" },
      {}
    );

    const name = "playwright_select";
    const args = { selector: "select", value: "option1" };
    const server = {};

    // Mock the selectOption method to throw an error
    mockPage.selectOption.mockRejectedValueOnce(new Error("Select failed"));

    const result = await handleToolCall(name, args, server);

    // Verify the result
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Select failed");
  });
});
