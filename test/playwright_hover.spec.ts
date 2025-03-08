import { mockPage, resetAllMocks, setupPlaywrightMocks } from "./helpers";

// Set up all mocks
setupPlaywrightMocks();

// Import the toolsHandler after mocking dependencies
import { handleToolCall } from "../src/toolsHandler";

describe("playwright_hover unit tests", () => {
  beforeEach(() => {
    // Reset mocks before each test
    resetAllMocks();
  });

  it("should handle playwright_hover tool", async () => {
    // First navigate to a page to ensure browser is initialized
    await handleToolCall(
      "playwright_navigate",
      { url: "https://example.com" },
      {}
    );

    const name = "playwright_hover";
    const args = { selector: "#hover-element" };
    const server = {};

    const result = await handleToolCall(name, args, server);

    // Verify the waitForSelector and hover were called with the correct parameters
    expect(mockPage.waitForSelector).toHaveBeenCalledWith("#hover-element");
    expect(mockPage.hover).toHaveBeenCalledWith("#hover-element");

    // Verify the result
    expect(result.isError).toBe(false);
    expect(result.content[0].text).toBe(`Hovered #hover-element`);
  });

  it("should handle errors when hovering", async () => {
    // First navigate to a page to ensure browser is initialized
    await handleToolCall(
      "playwright_navigate",
      { url: "https://example.com" },
      {}
    );

    const name = "playwright_hover";
    const args = { selector: "#hover-element" };
    const server = {};

    // Mock the hover method to throw an error
    mockPage.hover.mockRejectedValueOnce(new Error("Hover failed"));

    const result = await handleToolCall(name, args, server);

    // Verify the result
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Hover failed");
  });
});
