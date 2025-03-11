import {
  mockPage,
  mockApiContext,
  mockFs,
  mockPath,
  setupPlaywrightMocks,
  resetAllMocks,
} from "./helpers";

// Set up all mocks
setupPlaywrightMocks();

// IMPORTANT: Import the actual handleToolCall function AFTER mocking
import { handleToolCall } from "../src/toolsHandler";

describe("generic integration tests", () => {
  beforeEach(() => {
    // Reset mocks before each test
    resetAllMocks();
  });

  it("should navigate to a URL", async () => {
    // Set up the mock
    mockPage.goto.mockResolvedValueOnce(undefined);

    const url = "https://example.com";
    const result = await handleToolCall("playwright_navigate", { url }, {});

    // Verify the goto was called with the correct URL
    expect(mockPage.goto).toHaveBeenCalledWith(
      url,
      expect.objectContaining({
        timeout: expect.any(Number),
        waitUntil: expect.any(String),
      })
    );

    // Verify the result
    expect(result.isError).toBe(false);
    expect(result.content[0].text).toBe(`Navigated to ${url}`);
  });

  it("should take a screenshot", async () => {
    // First navigate to a page to ensure browser is initialized
    await handleToolCall(
      "playwright_navigate",
      { url: "https://example.com" },
      {}
    );

    // Set up the mock
    mockPage.screenshot.mockResolvedValueOnce(Buffer.from("mock-screenshot"));

    // Mock fs and path modules which are used in the screenshot function
    jest.mock("node:fs", () => mockFs);
    jest.mock("node:path", () => mockPath);

    const name = "test-screenshot";
    const result = await handleToolCall(
      "playwright_screenshot",
      { name },
      { notification: jest.fn() }
    );

    // Verify the screenshot was called
    expect(mockPage.screenshot).toHaveBeenCalled();

    // Verify the result
    expect(result.isError).toBe(false);
    expect(result.content[0].text).toContain("Screenshot saved");
  });

  it("should click on an element", async () => {
    // Mock fs and path modules which are used in the screenshot function
    jest.mock("node:fs", () => mockFs);
    jest.mock("node:path", () => mockPath);
    // Set up the mock
    mockPage.click.mockResolvedValueOnce(undefined);

    const selector = "body";
    const result = await handleToolCall("playwright_click", { selector }, {});

    // Verify the click was called with the correct selector
    expect(mockPage.click).toHaveBeenCalledWith(selector);

    // Verify the result
    expect(result.isError).toBe(false);
    expect(result.content[0].text).toBe(`Clicked: ${selector}`);
  });

  it("should fill an input field", async () => {
    // Set up the mock
    mockPage.waitForSelector.mockResolvedValueOnce(undefined);
    mockPage.fill.mockResolvedValueOnce(undefined);

    const selector = "input";
    const value = "test";
    const result = await handleToolCall(
      "playwright_fill",
      { selector, value },
      {}
    );

    // Verify the waitForSelector and fill were called with the correct parameters
    expect(mockPage.waitForSelector).toHaveBeenCalledWith(selector);
    expect(mockPage.fill).toHaveBeenCalledWith(selector, value);

    // Verify the result
    expect(result.isError).toBe(false);
    expect(result.content[0].text).toBe(`Filled ${selector} with: ${value}`);
  });

  it("should perform a GET request", async () => {
    // Set up the mock
    mockApiContext.get.mockResolvedValueOnce({
      json: jest.fn().mockResolvedValueOnce({}),
      status: jest.fn().mockReturnValueOnce(200),
    });

    const url = "https://example.com";
    const result = await handleToolCall("playwright_get", { url }, {});

    // Verify the get was called with the correct URL
    expect(mockApiContext.get).toHaveBeenCalledWith(url);

    // Verify the result
    expect(result.isError).toBe(false);
    expect(result.content[0].text).toBe(`Performed GET Operation ${url}`);
    expect(result.content[2].text).toBe("Response code 200");
  });

  it("should perform a POST request", async () => {
    // Set up the mock
    mockApiContext.post.mockResolvedValueOnce({
      json: jest.fn().mockResolvedValueOnce({}),
      status: jest.fn().mockReturnValueOnce(200),
    });

    const url = "https://example.com";
    const value = "test";
    const result = await handleToolCall("playwright_post", { url, value }, {});

    // Verify the post was called with the correct URL and data
    expect(mockApiContext.post).toHaveBeenCalledWith(
      url,
      expect.objectContaining({
        data: value,
        headers: expect.any(Object),
      })
    );

    // Verify the result
    expect(result.isError).toBe(false);
    expect(result.content[0].text).toContain(`Performed POST Operation ${url}`);
    expect(result.content[2].text).toBe("Response code 200");
  });
});
