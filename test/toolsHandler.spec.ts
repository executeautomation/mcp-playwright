import { handleToolCall } from "../src/toolsHandler";

describe("toolsHandler unit tests", () => {
  let server: any;

  beforeEach(() => {
    jest.clearAllMocks();
    server = {
      notification: jest.fn(),
    };
  });

  it("should handle unknown tools", async () => {
    const name = "unknown_tool";
    const args = {};

    const result = await handleToolCall(name, args, server);

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe(`Unknown tool: ${name}`);
  }, 5000);
});
