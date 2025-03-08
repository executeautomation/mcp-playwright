import { mockPage, mockChromium, resetAllMocks } from "./helpers";
import { handleToolCall } from "../src/toolsHandler";

// Mock the playwright module
jest.mock("playwright", () => ({
  chromium: mockChromium,
  request: {
    newContext: jest.fn().mockResolvedValue({}),
  },
}));

describe("playwright_navigate unit tests", () => {
  beforeEach(() => {
    resetAllMocks();
  });

  it("should handle playwright_navigate tool", async () => {
    const name = "playwright_navigate";
    const args = { url: "https://example.com" };
    const server = {};

    const result = await handleToolCall(name, args, server);

    expect(mockPage.goto).toHaveBeenCalledWith(
      "https://example.com",
      expect.objectContaining({
        timeout: expect.any(Number),
        waitUntil: expect.any(String),
      })
    );

    expect(result.isError).toBe(false);
    expect(result.content[0].text).toBe(`Navigated to https://example.com`);
  });

  it("should handle navigation errors", async () => {
    mockPage.goto.mockRejectedValueOnce(new Error("Navigation failed"));

    const name = "playwright_navigate";
    const args = { url: "https://example.com" };
    const server = {};

    const result = await handleToolCall(name, args, server);

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Navigation failed");
  });
});
