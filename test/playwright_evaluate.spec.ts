import { mockPage, resetAllMocks, setupPlaywrightMocks } from "./helpers";

// Set up all mocks
setupPlaywrightMocks();

// Import the toolsHandler after mocking dependencies
import { handleToolCall } from "../src/toolsHandler";

describe("playwright_evaluate unit tests", () => {
  beforeEach(() => {
    // Reset mocks before each test
    resetAllMocks();
  });

  it("should handle playwright_evaluate tool", async () => {
    const name = "playwright_evaluate";
    const args = { script: "return document.title" };
    const server = {};

    // Mock the evaluate method to return a result
    mockPage.evaluate.mockResolvedValueOnce({
      result: "Example Domain",
      logs: ["[log] Document title: Example Domain"],
    });

    const result = await handleToolCall(name, args, server);

    // Verify the evaluate was called with the correct script
    expect(mockPage.evaluate).toHaveBeenCalledWith(
      expect.any(Function),
      "return document.title"
    );

    // Verify the result
    expect(result.isError).toBe(false);
    expect(result.content[0].text).toContain("Execution result");
    expect(result.content[0].text).toContain("Example Domain");
  });

  it("should handle errors when evaluating", async () => {
    const name = "playwright_evaluate";
    const args = { script: "return document.title" };
    const server = {};

    // Mock the evaluate method to throw an error
    mockPage.evaluate.mockRejectedValueOnce(new Error("Evaluation failed"));

    const result = await handleToolCall(name, args, server);

    // Verify the result
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Evaluation failed");
  });
});
