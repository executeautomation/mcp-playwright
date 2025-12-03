import { __testUtils } from "../toolHandler.js";

describe("toolHandler initializeTools", () => {
  beforeEach(() => {
    __testUtils.clearToolInstancesForTests();
  });

  test("reuses tools for same server and refreshes when server changes", () => {
    const serverA = { name: "serverA" };
    const serverB = { name: "serverB" };

    __testUtils.initializeToolsForTests(serverA);
    const firstState = __testUtils.getToolStateForTests();
    expect(firstState.screenshotTool).toBeDefined();
    const firstScreenshotTool = firstState.screenshotTool;

    // Same server -> same tool instance
    __testUtils.initializeToolsForTests(serverA);
    expect(__testUtils.getToolStateForTests().screenshotTool).toBe(firstScreenshotTool);

    // New server -> cached tools cleared and recreated
    __testUtils.initializeToolsForTests(serverB);
    const refreshedState = __testUtils.getToolStateForTests();
    expect(refreshedState.screenshotTool).toBeDefined();
    expect(refreshedState.screenshotTool).not.toBe(firstScreenshotTool);
    expect(refreshedState.lastServer).toBe(serverB);
  });
});
