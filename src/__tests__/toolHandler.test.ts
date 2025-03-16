import { handleToolCall, getConsoleLogs, getScreenshots } from '../toolHandler.js';
import { Browser, Page, APIRequestContext } from 'playwright';
import { jest } from '@jest/globals';

// Mock Playwright
jest.mock('playwright', () => {
  const mockPage = {
    goto: jest.fn(() => Promise.resolve()),
    screenshot: jest.fn(() => Promise.resolve(Buffer.from('mock-screenshot'))),
    click: jest.fn(() => Promise.resolve()),
    fill: jest.fn(() => Promise.resolve()),
    selectOption: jest.fn(() => Promise.resolve()),
    hover: jest.fn(() => Promise.resolve()),
    evaluate: jest.fn(() => Promise.resolve()),
    close: jest.fn(() => Promise.resolve()),
    on: jest.fn()
  } as unknown as Page;

  const mockBrowser = {
    newPage: jest.fn(() => Promise.resolve(mockPage))
  } as unknown as Browser;

  const mockResponse = {
    ok: true,
    status: jest.fn(() => 200),
    statusText: jest.fn(() => 'OK'),
    text: jest.fn(() => Promise.resolve('{"success": true}'))
  };

  const mockApiContext = {
    get: jest.fn(() => Promise.resolve(mockResponse)),
    post: jest.fn(() => Promise.resolve(mockResponse)),
    put: jest.fn(() => Promise.resolve(mockResponse)),
    patch: jest.fn(() => Promise.resolve(mockResponse)),
    delete: jest.fn(() => Promise.resolve(mockResponse))
  } as unknown as APIRequestContext;

  return {
    chromium: {
      launch: jest.fn(() => Promise.resolve(mockBrowser))
    },
    request: {
      newContext: jest.fn(() => Promise.resolve(mockApiContext))
    }
  };
});

// Mock server
const mockServer = {
  sendMessage: jest.fn(),
  notification: jest.fn()
};

describe('Tool Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('handleToolCall should handle unknown tool', async () => {
    const result = await handleToolCall('unknown_tool', {}, mockServer);
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Unknown tool');
  });

  test('handleToolCall should handle browser tools', async () => {
    const result = await handleToolCall('playwright_navigate', { url: 'https://example.com' }, mockServer);
    expect(result.isError).toBe(false);
  });

  test('handleToolCall should handle API tools', async () => {
    const result = await handleToolCall('playwright_get', { url: 'https://api.example.com' }, mockServer);
    expect(result.isError).toBe(false);
  });

  test('getConsoleLogs should return console logs', () => {
    const logs = getConsoleLogs();
    expect(Array.isArray(logs)).toBe(true);
  });

  test('getScreenshots should return screenshots map', () => {
    const screenshots = getScreenshots();
    expect(screenshots instanceof Map).toBe(true);
  });
}); 