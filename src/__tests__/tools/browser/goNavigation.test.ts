import { GoBackTool, GoForwardTool } from '../../../tools/browser/navigation.js';
import type { ToolContext } from '../../../tools/common/types.js';
import type { Page, Browser } from 'playwright';
import { jest } from '@jest/globals';
import { getTextContent } from '../../testUtils';

// Mock page functions
const mockGoBack = jest.fn().mockImplementation(() => Promise.resolve());
const mockGoForward = jest.fn().mockImplementation(() => Promise.resolve());
const mockIsClosed = jest.fn().mockReturnValue(false);

// Mock the Page object with proper typing
const mockPage = {
  goBack: mockGoBack,
  goForward: mockGoForward,
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

describe('Browser Navigation History Tools', () => {
  let goBackTool: GoBackTool;
  let goForwardTool: GoForwardTool;

  beforeEach(() => {
    jest.clearAllMocks();
    goBackTool = new GoBackTool(mockServer);
    goForwardTool = new GoForwardTool(mockServer);
    // Reset browser and page mocks
    mockIsConnected.mockReturnValue(true);
    mockIsClosed.mockReturnValue(false);
  });

  describe('GoBackTool', () => {
    test('should navigate back in browser history', async () => {
      const args = {};

      const result = await goBackTool.execute(args, mockContext);

      expect(mockGoBack).toHaveBeenCalled();
      expect(result.isError).toBe(false);
      expect(getTextContent(result)).toContain('Navigated back');
    });

    test('should handle navigation back errors', async () => {
      const args = {};

      // Mock a navigation error
      mockGoBack.mockImplementationOnce(() => Promise.reject(new Error('Navigation back failed')));

      const result = await goBackTool.execute(args, mockContext);

      expect(mockGoBack).toHaveBeenCalled();
      expect(result.isError).toBe(true);
      expect(getTextContent(result)).toContain('Operation failed');
    });

    test('should handle missing page', async () => {
      const args = {};

      const result = await goBackTool.execute(args, { server: mockServer } as ToolContext);

      expect(mockGoBack).not.toHaveBeenCalled();
      expect(result.isError).toBe(true);
      expect(getTextContent(result)).toContain('Browser page not initialized');
    });
  });

  describe('GoForwardTool', () => {
    test('should navigate forward in browser history', async () => {
      const args = {};

      const result = await goForwardTool.execute(args, mockContext);

      expect(mockGoForward).toHaveBeenCalled();
      expect(result.isError).toBe(false);
      expect(getTextContent(result)).toContain('Navigated forward');
    });

    test('should handle navigation forward errors', async () => {
      const args = {};

      // Mock a navigation error
      mockGoForward.mockImplementationOnce(() => Promise.reject(new Error('Navigation forward failed')));

      const result = await goForwardTool.execute(args, mockContext);

      expect(mockGoForward).toHaveBeenCalled();
      expect(result.isError).toBe(true);
      expect(getTextContent(result)).toContain('Operation failed');
    });

    test('should handle missing page', async () => {
      const args = {};

      const result = await goForwardTool.execute(args, { server: mockServer } as ToolContext);

      expect(mockGoForward).not.toHaveBeenCalled();
      expect(result.isError).toBe(true);
      expect(getTextContent(result)).toContain('Browser page not initialized');
    });
  });
}); 
