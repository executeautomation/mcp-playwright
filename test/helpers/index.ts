import {
  API_TOOLS as ACTUAL_API_TOOLS,
  BROWSER_TOOLS as ACTUAL_BROWSER_TOOLS,
} from "../../src/tools";

// Export the actual tool arrays for proper tool detection
export const API_TOOLS = ACTUAL_API_TOOLS;
export const BROWSER_TOOLS = ACTUAL_BROWSER_TOOLS;

// Mock for virtual handleToolCall
export const mockVirtualHandleToolCall = jest
  .fn()
  .mockImplementation((name, args, server) => {
    return Promise.resolve({
      content: [{ type: "text", text: `Mocked result for ${name}` }],
      isError: false,
    });
  });

// Mock server for request handler tests
export const mockServer = {
  setRequestHandler: jest.fn(),
};

// Mock page with all required methods
export const mockPage = {
  goto: jest.fn(),
  screenshot: jest.fn().mockResolvedValue(Buffer.from("mock-screenshot")),
  $: jest.fn().mockResolvedValue(null),
  click: jest.fn(),
  fill: jest.fn(),
  selectOption: jest.fn(),
  hover: jest.fn(),
  evaluate: jest.fn().mockResolvedValue({ result: "mock-result", logs: [] }),
  waitForSelector: jest.fn(),
  setContent: jest.fn(),
  content: jest.fn().mockResolvedValue("<html><body>Mock HTML</body></html>"),
  on: jest.fn(),
  frameLocator: jest.fn().mockReturnValue({
    locator: jest.fn().mockReturnValue({
      click: jest.fn(),
    }),
  }),
};

// Mock API context
export const mockApiContext = {
  get: jest.fn().mockResolvedValue({
    json: jest.fn().mockResolvedValue({}),
    status: jest.fn().mockReturnValue(200),
  }),
  post: jest.fn().mockResolvedValue({
    json: jest.fn().mockResolvedValue({}),
    status: jest.fn().mockReturnValue(200),
  }),
  put: jest.fn().mockResolvedValue({
    json: jest.fn().mockResolvedValue({}),
    status: jest.fn().mockReturnValue(200),
  }),
  patch: jest.fn().mockResolvedValue({
    json: jest.fn().mockResolvedValue({}),
    status: jest.fn().mockReturnValue(200),
  }),
  delete: jest.fn().mockResolvedValue({
    status: jest.fn().mockReturnValue(200),
  }),
};

// Mock fs module
export const mockFs = {
  existsSync: jest.fn().mockReturnValue(true),
  mkdirSync: jest.fn(),
};

// Mock path module
export const mockPath = {
  join: jest.fn().mockImplementation((...args) => args.join("/")),
  relative: jest.fn().mockImplementation((from, to) => to),
};

export const handleToolCall = mockVirtualHandleToolCall;
export const getConsoleLogs = jest.fn().mockReturnValue(["Test log"]);
export const getScreenshots = jest
  .fn()
  .mockReturnValue(new Map([["test", "base64data"]]));

// Mock request
const mockRequest = {
  newContext: jest.fn().mockResolvedValue(mockApiContext),
};

// Mock browser context
const mockContext = {
  newPage: jest.fn().mockResolvedValue(mockPage),
};

// Mock browser
const mockBrowser = {
  newContext: jest.fn().mockResolvedValue(mockContext),
  close: jest.fn().mockResolvedValue(undefined),
};

// Mock chromium
export const mockChromium = {
  launch: jest.fn().mockResolvedValue(mockBrowser),
};

export const mockPlaywright = () => ({
  chromium: mockChromium,
  request: mockRequest,
});

export const mockNodeModules = () => ({
  fs: mockFs,
  path: mockPath,
});

/**
 * Sets up mocks for Playwright-related modules
 */
export function setupPlaywrightMocks() {
  // Mock the playwright module
  jest.mock("playwright", () => ({
    chromium: mockChromium,
    request: mockRequest,
  }));

  // Mock the fs module
  jest.mock("node:fs", () => mockFs);

  // Mock the path module
  jest.mock("node:path", () => mockPath);
}

/**
 * Resets all mocks before each test
 */
export function resetAllMocks() {
  jest.clearAllMocks();
}
