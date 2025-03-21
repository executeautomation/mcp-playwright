import { NavigationTool } from '../../../tools/browser/navigation.js';
import { ToolContext } from '../../../tools/common/types.js';
import { Page, Browser } from 'playwright';
import { jest } from '@jest/globals';

// Mock the Page object
const mockGoto = jest.fn();
mockGoto.mockImplementation(() => Promise.resolve());
const mockIsClosed = jest.fn().mockReturnValue(false);

const mockPage = {
  goto: mockGoto,
  isClosed: mockIsClosed
} as unknown as Page;

// Mock the browser
const mockIsConnected = jest.fn().mockReturnValue(true);
const mockBrowser = {
  isConnected: mockIsConnected
} as unknown as Browser;

// Mock the server
const mockServer = {
  sendMessage: jest.fn()
};

// Mock context
const mockContext = {
  page: mockPage,
  browser: mockBrowser,
  server: mockServer
} as ToolContext;

describe('NavigationTool', () => {
  let navigationTool: NavigationTool;

  beforeEach(() => {
    jest.clearAllMocks();
    navigationTool = new NavigationTool(mockServer);
    // Reset mocks
    mockIsConnected.mockReturnValue(true);
    mockIsClosed.mockReturnValue(false);
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

  test('should handle navigation with specific browser type', async () => {
    const args = {
      url: 'https://example.com',
      waitUntil: 'networkidle',
      browserType: 'firefox'
    };

    const result = await navigationTool.execute(args, mockContext);

    expect(mockGoto).toHaveBeenCalledWith('https://example.com', { waitUntil: 'networkidle', timeout: 30000 });
    expect(result.isError).toBe(false);
    expect(result.content[0].text).toContain('Navigated to');
  });

  test('should handle navigation with webkit browser type', async () => {
    const args = {
      url: 'https://example.com',
      browserType: 'webkit'
    };

    const result = await navigationTool.execute(args, mockContext);

    expect(mockGoto).toHaveBeenCalledWith('https://example.com', { waitUntil: 'load', timeout: 30000 });
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

    // Context with browser but without page
    const contextWithoutPage = {
      browser: mockBrowser,
      server: mockServer
    } as unknown as ToolContext;

    const result = await navigationTool.execute(args, contextWithoutPage);

    expect(mockGoto).not.toHaveBeenCalled();
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Page is not available');
  });
  
  test('should handle disconnected browser', async () => {
    const args = {
      url: 'https://example.com'
    };
    
    // Mock disconnected browser
    mockIsConnected.mockReturnValueOnce(false);
    
    const result = await navigationTool.execute(args, mockContext);
    
    expect(mockGoto).not.toHaveBeenCalled();
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Browser is not connected');
  });
  
  test('should handle closed page', async () => {
    const args = {
      url: 'https://example.com'
    };
    
    // Mock closed page
    mockIsClosed.mockReturnValueOnce(true);
    
    const result = await navigationTool.execute(args, mockContext);
    
    expect(mockGoto).not.toHaveBeenCalled();
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Page is not available or has been closed');
  });
}); 