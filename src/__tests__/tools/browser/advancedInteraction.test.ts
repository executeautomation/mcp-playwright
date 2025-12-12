import { DragTool, PressKeyTool } from '../../../tools/browser/interaction.js';
import { ToolContext } from '../../../tools/common/types.js';
import { Page, Browser, ElementHandle } from 'playwright';
import { jest } from '@jest/globals';

// Mock page functions
const mockWaitForSelector = jest.fn();
const mockMouseMove = jest.fn().mockImplementation(() => Promise.resolve());
const mockMouseDown = jest.fn().mockImplementation(() => Promise.resolve());
const mockMouseUp = jest.fn().mockImplementation(() => Promise.resolve());
const mockKeyboardPress = jest.fn().mockImplementation(() => Promise.resolve());
const mockFocus = jest.fn().mockImplementation(() => Promise.resolve());
const mockIsClosed = jest.fn().mockReturnValue(false);

// Mock element handle
const mockBoundingBox = jest.fn().mockReturnValue({ x: 10, y: 10, width: 100, height: 50 });
const mockElementHandle = {
  boundingBox: mockBoundingBox
} as unknown as ElementHandle;

// Wait for selector returns element handle
mockWaitForSelector.mockImplementation(() => Promise.resolve(mockElementHandle));

// Mock mouse
const mockMouse = {
  move: mockMouseMove,
  down: mockMouseDown,
  up: mockMouseUp
};

// Mock keyboard
const mockKeyboard = {
  press: mockKeyboardPress
};

// Mock the Page object with proper typing
const mockPage = {
  waitForSelector: mockWaitForSelector,
  mouse: mockMouse,
  keyboard: mockKeyboard,
  focus: mockFocus,
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

describe('Advanced Browser Interaction Tools', () => {
  let dragTool: DragTool;
  let pressKeyTool: PressKeyTool;

  beforeEach(() => {
    jest.clearAllMocks();
    dragTool = new DragTool(mockServer);
    pressKeyTool = new PressKeyTool(mockServer);
    // Reset browser and page mocks
    mockIsConnected.mockReturnValue(true);
    mockIsClosed.mockReturnValue(false);
  });

  describe('DragTool', () => {
    test('should drag an element to a target location', async () => {
      const args = {
        sourceSelector: '#source-element',
        targetSelector: '#target-element'
      };

      const result = await dragTool.execute(args, mockContext);

      expect(mockWaitForSelector).toHaveBeenCalledWith('#source-element');
      expect(mockWaitForSelector).toHaveBeenCalledWith('#target-element');
      expect(mockBoundingBox).toHaveBeenCalledTimes(2);
      expect(mockMouseMove).toHaveBeenCalledWith(60, 35); // Source center (10+100/2, 10+50/2)
      expect(mockMouseDown).toHaveBeenCalled();
      expect(mockMouseMove).toHaveBeenCalledWith(60, 35); // Target center (same mock values)
      expect(mockMouseUp).toHaveBeenCalled();
      expect(result.isError).toBe(false);
      expect(result.content[0].type).toBe('text');
      if (result.content[0].type === 'text') {
        expect(result.content[0].text).toContain('Dragged element from');
      }
    });

    test('should handle errors when element positions cannot be determined', async () => {
      const args = {
        sourceSelector: '#source-element',
        targetSelector: '#target-element'
      };

      // Mock failure to get bounding box
      mockBoundingBox.mockReturnValueOnce(null);

      const result = await dragTool.execute(args, mockContext);

      expect(mockWaitForSelector).toHaveBeenCalledWith('#source-element');
      expect(mockBoundingBox).toHaveBeenCalled();
      expect(mockMouseMove).not.toHaveBeenCalled();
      expect(result.isError).toBe(true);
      expect(result.content[0].type).toBe('text');
      if (result.content[0].type === 'text') {
        expect(result.content[0].text).toContain('Could not get element positions');
      }
    });

    test('should handle drag errors', async () => {
      const args = {
        sourceSelector: '#source-element',
        targetSelector: '#target-element'
      };

      // Mock a mouse operation error
      mockMouseDown.mockImplementationOnce(() => Promise.reject(new Error('Mouse operation failed')));

      const result = await dragTool.execute(args, mockContext);

      expect(mockWaitForSelector).toHaveBeenCalledWith('#source-element');
      expect(mockWaitForSelector).toHaveBeenCalledWith('#target-element');
      expect(mockBoundingBox).toHaveBeenCalled();
      expect(mockMouseMove).toHaveBeenCalled();
      expect(mockMouseDown).toHaveBeenCalled();
      expect(result.isError).toBe(true);
      expect(result.content[0].type).toBe('text');
      if (result.content[0].type === 'text') {
        expect(result.content[0].text).toContain('Operation failed');
      }
    });

    test('should handle missing page', async () => {
      const args = {
        sourceSelector: '#source-element',
        targetSelector: '#target-element'
      };

      const result = await dragTool.execute(args, { server: mockServer } as ToolContext);

      expect(mockWaitForSelector).not.toHaveBeenCalled();
      expect(result.isError).toBe(true);
      expect(result.content[0].type).toBe('text');
      if (result.content[0].type === 'text') {
        expect(result.content[0].text).toContain('Browser page not initialized');
      }
    });
  });

  describe('PressKeyTool', () => {
    test('should press a keyboard key', async () => {
      const args = {
        key: 'Enter'
      };

      const result = await pressKeyTool.execute(args, mockContext);

      expect(mockKeyboardPress).toHaveBeenCalledWith('Enter');
      expect(result.isError).toBe(false);
      expect(result.content[0].type).toBe('text');
      if (result.content[0].type === 'text') {
        expect(result.content[0].text).toContain('Pressed key: Enter');
      }
    });

    test('should focus an element before pressing a key if selector provided', async () => {
      const args = {
        key: 'Enter',
        selector: '#input-field'
      };

      const result = await pressKeyTool.execute(args, mockContext);

      expect(mockWaitForSelector).toHaveBeenCalledWith('#input-field');
      expect(mockFocus).toHaveBeenCalledWith('#input-field');
      expect(mockKeyboardPress).toHaveBeenCalledWith('Enter');
      expect(result.isError).toBe(false);
      expect(result.content[0].type).toBe('text');
      if (result.content[0].type === 'text') {
        expect(result.content[0].text).toContain('Pressed key: Enter');
      }
    });

    test('should handle key press errors', async () => {
      const args = {
        key: 'Enter'
      };

      // Mock a keyboard operation error
      mockKeyboardPress.mockImplementationOnce(() => Promise.reject(new Error('Keyboard operation failed')));

      const result = await pressKeyTool.execute(args, mockContext);

      expect(mockKeyboardPress).toHaveBeenCalledWith('Enter');
      expect(result.isError).toBe(true);
      expect(result.content[0].type).toBe('text');
      if (result.content[0].type === 'text') {
        expect(result.content[0].text).toContain('Operation failed');
      }
    });

    test('should handle missing page', async () => {
      const args = {
        key: 'Enter'
      };

      const result = await pressKeyTool.execute(args, { server: mockServer } as ToolContext);

      expect(mockKeyboardPress).not.toHaveBeenCalled();
      expect(result.isError).toBe(true);
      expect(result.content[0].type).toBe('text');
      if (result.content[0].type === 'text') {
        expect(result.content[0].text).toContain('Browser page not initialized');
      }
    });
  });
}); 