import { mockPage, setupPlaywrightMocks, resetAllMocks } from "./helpers";

// Set up all mocks
setupPlaywrightMocks();

// IMPORTANT: Import the actual handleToolCall function AFTER mocking
import { handleToolCall } from "../src/toolsHandler";

describe("playwright_get_visible_text integration tests", () => {
  beforeEach(() => {
    // Reset mocks before each test
    resetAllMocks();
  });

  it("should get visible text content from a page", async () => {
    // Mock page evaluate to return visible text
    mockPage.evaluate.mockResolvedValueOnce("Sample visible text\nMultiple lines\nOf content");

    // First navigate to a page
    await handleToolCall(
      "playwright_navigate",
      { url: "https://example.com" },
      {}
    );

    // Then get visible text
    const result = await handleToolCall("playwright_get_visible_text", {}, {});

    // Verify the evaluate was called
    expect(mockPage.evaluate).toHaveBeenCalled();

    // Verify the result
    expect(result).toEqual({
      content: [{ type: "text", text: "Visible text content:\nSample visible text\nMultiple lines\nOf content" }],
      isError: false,
    });
  });

  it("should handle errors when getting visible text", async () => {
    // Mock page evaluate to throw an error
    mockPage.evaluate.mockRejectedValueOnce(new Error("DOM error"));

    // First navigate to a page
    await handleToolCall(
      "playwright_navigate",
      { url: "https://example.com" },
      {}
    );

    // Then try to get visible text with an error
    const result = await handleToolCall("playwright_get_visible_text", {}, {});

    // Verify the evaluate was called
    expect(mockPage.evaluate).toHaveBeenCalled();

    // Verify the error result
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Failed to get visible text");
  });

  it("should handle getting visible text after other operations", async () => {
    // First navigate to a page
    await handleToolCall(
      "playwright_navigate",
      { url: "https://example.com" },
      {}
    );

    // Perform a click operation
    await handleToolCall(
      "playwright_click",
      { selector: "#test-button" },
      {}
    );

    // Mock page evaluate to return visible text
    mockPage.evaluate.mockResolvedValueOnce("Text after click");

    // Get visible text after click
    const result = await handleToolCall("playwright_get_visible_text", {}, {});

    // Verify the result
    expect(result.isError).toBe(false);
    expect(result.content[0].text).toBe("Visible text content:\nText after click");
  });
});
