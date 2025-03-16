import { mockPage, setupPlaywrightMocks, resetAllMocks } from "./helpers";

// Set up all mocks
setupPlaywrightMocks();

// IMPORTANT: Import the actual handleToolCall function AFTER mocking
import { handleToolCall } from "../src/toolsHandler";

describe("playwright_get_html integration tests", () => {
  beforeEach(() => {
    // Reset mocks before each test
    resetAllMocks();
  });

  it("should get HTML content from a page", async () => {
    // Mock HTML content
    const sampleHtml = "<!DOCTYPE html><html><body><h1>Sample Page</h1></body></html>";
    mockPage.content.mockResolvedValueOnce(sampleHtml);

    // First navigate to a page
    await handleToolCall(
      "playwright_navigate",
      { url: "https://example.com" },
      {}
    );

    // Then get HTML content
    const result = await handleToolCall("playwright_get_html", {}, {});

    // Verify the content method was called
    expect(mockPage.content).toHaveBeenCalled();

    // Verify the result
    expect(result).toEqual({
      content: [{ type: "text", text: `HTML content:\n${sampleHtml}` }],
      isError: false,
    });
  });

  it("should handle errors when getting HTML content", async () => {
    // Mock content to throw an error
    mockPage.content.mockRejectedValueOnce(new Error("Page crashed"));

    // First navigate to a page
    await handleToolCall(
      "playwright_navigate",
      { url: "https://example.com" },
      {}
    );

    // Then try to get HTML with an error
    const result = await handleToolCall("playwright_get_html", {}, {});

    // Verify the content method was called
    expect(mockPage.content).toHaveBeenCalled();

    // Verify the error result
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Failed to get HTML content");
  });

  it("should handle getting HTML after DOM manipulation", async () => {
    // First navigate to a page
    await handleToolCall(
      "playwright_navigate",
      { url: "https://example.com" },
      {}
    );

    // Mock evaluate to simulate DOM manipulation
    mockPage.evaluate.mockResolvedValueOnce({ result: true, logs: [] });
    await handleToolCall(
      "playwright_evaluate",
      { script: "document.body.innerHTML = '<h1>Updated Content</h1>'" },
      {}
    );

    // Mock HTML content after manipulation
    const updatedHtml = "<!DOCTYPE html><html><body><h1>Updated Content</h1></body></html>";
    mockPage.content.mockResolvedValueOnce(updatedHtml);

    // Get HTML after manipulation
    const result = await handleToolCall("playwright_get_html", {}, {});

    // Verify the result
    expect(result.isError).toBe(false);
    expect(result.content[0].text).toBe(`HTML content:\n${updatedHtml}`);
  });
});
