import { getConsoleLogs, getScreenshots } from "../src/toolsHandler";

describe("tools unit tests", () => {
  it("should get console logs", () => {
    // Add some console logs
    const logs = getConsoleLogs();

    // Verify the logs
    expect(Array.isArray(logs)).toBe(true);
  });

  it("should get screenshots", () => {
    // Get the screenshots
    const screenshots = getScreenshots();

    // Verify the screenshots
    expect(screenshots instanceof Map).toBe(true);
  });
});
