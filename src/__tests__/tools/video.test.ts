// Import the types
import { ToolContext } from '../../tools/common/types.js';

// Mocking the filesystem operations to avoid permission issues
jest.mock('fs', () => ({
  existsSync: jest.fn().mockReturnValue(true),
  mkdirSync: jest.fn()
}));

// Skip importing the actual tools until after mocks
let StartVideoRecordingTool;
let StopVideoRecordingTool;

describe('Video Recording Tools', () => {
  beforeAll(() => {
    // Import tools after mocks are set up
    const videoModule = require('../../tools/browser/video.js');
    StartVideoRecordingTool = videoModule.StartVideoRecordingTool;
    StopVideoRecordingTool = videoModule.StopVideoRecordingTool;
  });

  test('StartVideoRecordingTool exists', () => {
    expect(typeof StartVideoRecordingTool).toBe('function');
  });

  test('StopVideoRecordingTool exists', () => {
    expect(typeof StopVideoRecordingTool).toBe('function');
  });

  test('StartVideoRecordingTool returns error if browser not initialized', async () => {
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
});