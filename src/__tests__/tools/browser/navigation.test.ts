import { NavigationTool } from '../../../tools/browser/navigation.js';
import { ToolContext } from '../../../tools/common/types.js';
import { Page } from 'playwright';
import { jest } from '@jest/globals';

// Mock the Page object
const mockGoto = jest.fn();
mockGoto.mockImplementation(() => Promise.resolve());

const mockPage = {
  goto: mockGoto
} as unknown as Page;

// Mock the server
const mockServer = {
  sendMessage: jest.fn()
};

// Mock context
const mockContext = {
  page: mockPage,
  server: mockServer
} as ToolContext;

describe('NavigationTool', () => {
  let navigationTool: NavigationTool;

  beforeEach(() => {
    jest.clearAllMocks();
    navigationTool = new NavigationTool(mockServer);
  });

  test('should navigate to a URL', async () => {
    const args = {
      url: 'https://example.com',
      waitUntil: 'networkidle'
    };

    const result = await navigationTool.execute(args, mockContext);

    expect(mockGoto).toHaveBeenCalledWith('https://example.com', { waitUntil: 'networkidle', timeout: 30000 });
    expect(result.isError).toBe(false);
    expect(result.content[0].text).toContain('Navigated to');
  });

  test('should handle navigation errors', async () => {
    const args = {
      url: 'https://example.com'
    };

    // Mock a navigation error
    mockGoto.mockImplementationOnce(() => Promise.reject(new Error('Navigation failed')));

    const result = await navigationTool.execute(args, mockContext);

    expect(mockGoto).toHaveBeenCalledWith('https://example.com', { waitUntil: 'load', timeout: 30000 });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Operation failed');
  });

  test('should handle missing page', async () => {
    const args = {
      url: 'https://example.com'
    };

    const result = await navigationTool.execute(args, { server: mockServer } as ToolContext);

    expect(mockGoto).not.toHaveBeenCalled();
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Browser page not initialized');
  });
}); 