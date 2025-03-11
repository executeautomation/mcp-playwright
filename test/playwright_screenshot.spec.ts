import {
  mockPage,
  mockFs,
  mockPath,
  setupPlaywrightMocks,
  resetAllMocks,
} from "./helpers";

// Set up all mocks
setupPlaywrightMocks();

// Import the toolsHandler after mocking dependencies
import { handleToolCall, getScreenshots } from "../src/toolsHandler";

describe("playwright_screenshot unit tests", () => {
  beforeEach(() => {
    // Reset mocks before each test
    resetAllMocks();
  });

  it("should handle playwright_screenshot tool", async () => {
    // First navigate to a page to ensure browser is initialized
    await handleToolCall(
      "playwright_navigate",
      { url: "https://example.com" },
      {}
    );

    // Set up the mock
    mockPage.screenshot.mockResolvedValueOnce(Buffer.from("mock-screenshot"));

    const name = "playwright_screenshot";
    const args = { name: "test-screenshot" };
    const server = { notification: jest.fn() };

    const result = await handleToolCall(name, args, server);

    // Verify the screenshot was called
    expect(mockPage.screenshot).toHaveBeenCalled();

    // Verify the result
    expect(result.isError).toBe(false);
    expect(result.content[0].text).toContain("Screenshot saved");
  });

  it("should handle playwright_screenshot tool with storeBase64 and directory creation", async () => {
    // First navigate to a page to ensure browser is initialized
    await handleToolCall(
      "playwright_navigate",
      { url: "https://example.com" },
      {}
    );

    // Set up the mock
    mockPage.screenshot.mockResolvedValueOnce(Buffer.from("mock-screenshot"));
    mockFs.existsSync.mockReturnValue(false); // Directory doesn't exist
    mockPath.join.mockReturnValue("/tmp/downloads/test-screenshot.png");

    const name = "playwright_screenshot";
    const args = {
      name: "test-screenshot",
      storeBase64: true,
      downloadsDir: "/tmp/downloads",
    };
    const server = { notification: jest.fn() };

    const result = await handleToolCall(name, args, server);

    // Verify the screenshot was called
    expect(mockPage.screenshot).toHaveBeenCalled();

    // Verify the directory was created
    expect(mockFs.mkdirSync).toHaveBeenCalledWith("/tmp/downloads", {
      recursive: true,
    });

    // Verify the screenshot is stored in memory
    expect(getScreenshots().get("test-screenshot")).toBe(
      Buffer.from("mock-screenshot").toString("base64")
    );

    // Verify the notification was sent
    expect(server.notification).toHaveBeenCalledWith({
      method: "notifications/resources/list_changed",
    });

    // Verify the result
    expect(result.isError).toBe(false);
    expect(result.content[0].text).toContain("Screenshot saved");
    expect(result.content[1].text).toContain(
      "Screenshot also stored in memory"
    );
  });

  it("should handle playwright_screenshot tool when element selector is not found", async () => {
    // First navigate to a page to ensure browser is initialized
    await handleToolCall(
      "playwright_navigate",
      { url: "https://example.com" },
      {}
    );

    // Set up the mock
    mockPage.screenshot.mockResolvedValueOnce(Buffer.from("mock-screenshot"));
    mockPage.$.mockResolvedValueOnce(null); // Element not found

    const name = "playwright_screenshot";
    const args = { name: "test-screenshot", selector: "#non-existent" };
    const server = { notification: jest.fn() };

    const result = await handleToolCall(name, args, server);

    // Verify the element selector was called
    expect(mockPage.$).toHaveBeenCalledWith("#non-existent");

    // Verify the result
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Element not found");
  });

  it("should handle playwright_screenshot tool with mask", async () => {
    // First navigate to a page to ensure browser is initialized
    await handleToolCall(
      "playwright_navigate",
      { url: "https://example.com" },
      {}
    );

    // Set up the mock
    mockPage.screenshot.mockResolvedValueOnce(Buffer.from("mock-screenshot"));

    // Mock the element selector to return a valid element
    const mockElement = { id: "mock-element" };
    mockPage.$.mockResolvedValueOnce(mockElement);

    const name = "playwright_screenshot";
    const args = {
      name: "test-screenshot",
      mask: ["#element-to-mask"],
    };
    const server = { notification: jest.fn() };

    const result = await handleToolCall(name, args, server);

    // Verify the element selector was called
    expect(mockPage.$).toHaveBeenCalledWith("#element-to-mask");

    // Verify the screenshot was called with the mask option
    expect(mockPage.screenshot).toHaveBeenCalledWith(
      expect.objectContaining({
        mask: [mockElement],
      })
    );

    // Verify the result
    expect(result.isError).toBe(false);
    expect(result.content[0].text).toContain("Screenshot saved");
  });
});
