import { mockPage, resetAllMocks, setupPlaywrightMocks } from "./helpers";

// Set up all mocks
setupPlaywrightMocks();

// Import the toolsHandler after mocking dependencies
import { handleToolCall } from "../src/toolsHandler";

describe("playwright_iframe_click unit tests", () => {
  beforeEach(() => {
    // Reset mocks before each test
    resetAllMocks();
  });

  it("should handle playwright_iframe_click tool", async () => {
    // First navigate to a page to ensure browser is initialized
    await handleToolCall(
      "playwright_navigate",
      { url: "https://example.com" },
      {}
    );

    // Mock the iframe locator
    const mockIframeLocator = {
      locator: jest.fn().mockReturnValue({
        click: jest.fn().mockResolvedValue(undefined),
      }),
    };
    mockPage.frameLocator = jest.fn().mockReturnValue(mockIframeLocator);

    const name = "playwright_iframe_click";
    const args = { iframeSelector: "#my-iframe", selector: "#my-button" };
    const server = {};

    const result = await handleToolCall(name, args, server);

    // Verify the frameLocator was called with the correct selector
    expect(mockPage.frameLocator).toHaveBeenCalledWith("#my-iframe");
    expect(mockIframeLocator.locator).toHaveBeenCalledWith("#my-button");
    expect(mockIframeLocator.locator().click).toHaveBeenCalled();

    // Verify the result
    expect(result.isError).toBe(false);
    expect(result.content[0].text).toBe(
      `Clicked: #my-button (iframe: #my-iframe)`
    );
  });

  it("should handle errors when clicking in iframe", async () => {
    // First navigate to a page to ensure browser is initialized
    await handleToolCall(
      "playwright_navigate",
      { url: "https://example.com" },
      {}
    );

    // Mock the iframe locator
    const mockIframeLocator = {
      locator: jest.fn().mockReturnValue({
        click: jest.fn().mockRejectedValue(new Error("Click failed")),
      }),
    };
    mockPage.frameLocator = jest.fn().mockReturnValue(mockIframeLocator);

    const name = "playwright_iframe_click";
    const args = { iframeSelector: "#my-iframe", selector: "#my-button" };
    const server = {};

    const result = await handleToolCall(name, args, server);

    // Verify the result
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Click failed");
  });
});
