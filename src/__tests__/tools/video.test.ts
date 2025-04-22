import { test, expect, jest } from '@jest/globals';
import { StartVideoRecordingTool, StopVideoRecordingTool } from '../../tools/browser/video.js';
import { ToolContext } from '../../tools/common/types.js';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

// Mock dependencies
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  mkdirSync: jest.fn()
}));

jest.mock('os', () => ({
  homedir: jest.fn().mockReturnValue('/mock/home')
}));

// Mock toolHandler.js import
jest.mock('../../toolHandler.js', () => ({
  setGlobalPage: jest.fn()
}));

describe('Video Recording Tools', () => {
  // Mock browser context
  const mockContext = {
    close: jest.fn(),
    _options: { recordVideo: true }
  };

  // Mock page
  const mockPage = {
    context: jest.fn().mockReturnValue(mockContext),
    close: jest.fn(),
    url: jest.fn().mockReturnValue('https://example.com'),
    goto: jest.fn(),
    isClosed: jest.fn().mockReturnValue(false)
  };

  // Mock browser
  const mockBrowser = {
    isConnected: jest.fn().mockReturnValue(true),
    newContext: jest.fn().mockResolvedValue({
      newPage: jest.fn().mockResolvedValue(mockPage)
    })
  };

  // Mock toolContext
  const createMockContext = (): ToolContext => ({
    server: {},
    browser: mockBrowser as any,
    page: mockPage as any
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('StartVideoRecordingTool.execute creates directory if it does not exist', async () => {
    // Setup
    const mockContext = createMockContext();
    const tool = new StartVideoRecordingTool({});
    const args = { path: '/custom/video/path' };
    
    (fs.existsSync as jest.Mock).mockReturnValue(false);
    
    // Execute
    await tool.execute(args, mockContext);
    
    // Assert
    expect(fs.existsSync).toHaveBeenCalledWith('/custom/video/path');
    expect(fs.mkdirSync).toHaveBeenCalledWith('/custom/video/path', { recursive: true });
  });

  test('StartVideoRecordingTool.execute uses default path if none provided', async () => {
    // Setup
    const mockContext = createMockContext();
    const tool = new StartVideoRecordingTool({});
    const args = {};
    
    (fs.existsSync as jest.Mock).mockReturnValue(false);
    
    // Execute
    await tool.execute(args, mockContext);
    
    // Assert
    expect(fs.existsSync).toHaveBeenCalledWith(path.join('/mock/home', 'Videos'));
    expect(fs.mkdirSync).toHaveBeenCalledWith(path.join('/mock/home', 'Videos'), { recursive: true });
  });

  test('StartVideoRecordingTool.execute returns error if browser not initialized', async () => {
    // Setup
    const mockContextNoBrowser = { server: {} } as ToolContext;
    const tool = new StartVideoRecordingTool({});
    const args = {};
    
    // Execute
    const result = await tool.execute(args, mockContextNoBrowser);
    
    // Assert
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Browser not initialized');
  });

  test('StopVideoRecordingTool.execute closes current context and creates new one', async () => {
    // Setup
    const mockContext = createMockContext();
    const tool = new StopVideoRecordingTool({});
    const args = {};

    // Execute
    await tool.execute(args, mockContext);
    
    // Assert
    expect(mockPage.context).toHaveBeenCalled();
    expect(mockContext.page?.context().close).toHaveBeenCalled();
    expect(mockContext.browser?.newContext).toHaveBeenCalled();
  });

  test('StopVideoRecordingTool.execute returns error if no recording is active', async () => {
    // Setup
    const mockContext = createMockContext();
    const tool = new StopVideoRecordingTool({});
    const args = {};
    
    // Mock no active recording
    (mockPage.context as jest.Mock).mockReturnValueOnce({
      ...mockContext,
      _options: { recordVideo: false }
    });

    // Execute
    const result = await tool.execute(args, mockContext);
    
    // Assert
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('No active video recording found');
  });
});