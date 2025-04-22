import { test, expect, vi } from 'vitest';
import { StartVideoRecordingTool, StopVideoRecordingTool } from '../../../tools/browser/video';
import { ToolContext } from '../../../tools/common/types';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

// Mock dependencies
vi.mock('fs', () => ({
  existsSync: vi.fn(),
  mkdirSync: vi.fn()
}));

vi.mock('os', () => ({
  homedir: vi.fn().mockReturnValue('/mock/home')
}));

// Mock browser context
const mockContext = {
  close: vi.fn(),
  _options: { recordVideo: true }
};

// Mock page
const mockPage = {
  context: vi.fn().mockReturnValue(mockContext),
  close: vi.fn(),
  url: vi.fn().mockReturnValue('https://example.com'),
  goto: vi.fn(),
  isClosed: vi.fn().mockReturnValue(false)
};

// Mock browser
const mockBrowser = {
  isConnected: vi.fn().mockReturnValue(true),
  newContext: vi.fn().mockResolvedValue({
    newPage: vi.fn().mockResolvedValue(mockPage)
  })
};

// Mock toolContext
const createMockContext = (): ToolContext => ({
  server: {},
  browser: mockBrowser as any,
  page: mockPage as any
});

// Mock the toolHandler.js import
vi.mock('../../../toolHandler.js', () => ({
  setGlobalPage: vi.fn()
}));

test('StartVideoRecordingTool.execute creates directory if it does not exist', async () => {
  // Setup
  const mockContext = createMockContext();
  const tool = new StartVideoRecordingTool({});
  const args = { path: '/custom/video/path' };
  
  (fs.existsSync as any).mockReturnValue(false);
  
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
  
  (fs.existsSync as any).mockReturnValue(false);
  
  // Execute
  await tool.execute(args, mockContext);
  
  // Assert
  expect(fs.existsSync).toHaveBeenCalledWith(path.join('/mock/home', 'Videos'));
  expect(fs.mkdirSync).toHaveBeenCalledWith(path.join('/mock/home', 'Videos'), { recursive: true });
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
  expect(mockContext.context().close).toHaveBeenCalled();
  expect(mockBrowser.newContext).toHaveBeenCalled();
});

test('StopVideoRecordingTool.execute returns error if no recording is active', async () => {
  // Setup
  const mockContext = createMockContext();
  const tool = new StopVideoRecordingTool({});
  const args = {};
  
  // Mock no active recording
  mockPage.context.mockReturnValueOnce({
    ...mockContext,
    _options: { recordVideo: false }
  });

  // Execute
  const result = await tool.execute(args, mockContext);
  
  // Assert
  expect(result.isError).toBe(true);
  expect(result.content[0].text).toContain('No active video recording found');
});