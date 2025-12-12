import { ResizeTool } from '../../../tools/browser/resize';
import { ToolContext } from '../../../tools/common/types';
import type { Page } from 'playwright';

describe('ResizeTool', () => {
  let resizeTool: ResizeTool;
  let mockServer: any;
  let mockPage: Partial<Page>;
  let mockContext: ToolContext;

  beforeEach(() => {
    mockServer = {};
    resizeTool = new ResizeTool(mockServer);

    mockPage = {
      setViewportSize: jest.fn().mockResolvedValue(undefined),
      setExtraHTTPHeaders: jest.fn().mockResolvedValue(undefined),
      isClosed: jest.fn().mockReturnValue(false),
    };

    mockContext = {
      page: mockPage as Page,
      browser: undefined,
      apiContext: undefined,
    };
  });

  test('should resize viewport successfully', async () => {
    const args = { width: 1920, height: 1080 };
    const result = await resizeTool.execute(args, mockContext);

    expect(mockPage.setViewportSize).toHaveBeenCalledWith({ width: 1920, height: 1080 });
    expect(result.isError).toBe(false);
    expect(result.content[0].type).toBe('text');
    if (result.content[0].type === 'text') {
      expect(result.content[0].text).toBe('Browser viewport resized to 1920x1080');
    }
  });

  test('should resize to mobile viewport', async () => {
    const args = { width: 375, height: 667 };
    const result = await resizeTool.execute(args, mockContext);

    expect(mockPage.setViewportSize).toHaveBeenCalledWith({ width: 375, height: 667 });
    expect(result.isError).toBe(false);
    expect(result.content[0].type).toBe('text');
    if (result.content[0].type === 'text') {
      expect(result.content[0].text).toBe('Browser viewport resized to 375x667');
    }
  });

  test('should resize to tablet viewport', async () => {
    const args = { width: 768, height: 1024 };
    const result = await resizeTool.execute(args, mockContext);

    expect(mockPage.setViewportSize).toHaveBeenCalledWith({ width: 768, height: 1024 });
    expect(result.isError).toBe(false);
    expect(result.content[0].type).toBe('text');
    if (result.content[0].type === 'text') {
      expect(result.content[0].text).toBe('Browser viewport resized to 768x1024');
    }
  });

  test('should reject negative width', async () => {
    const args = { width: -100, height: 600 };
    const result = await resizeTool.execute(args, mockContext);

    expect(result.isError).toBe(true);
    expect(result.content[0].type).toBe('text');
    if (result.content[0].type === 'text') {
      expect(result.content[0].text).toContain('Width and height must be positive integers');
    }
  });

  test('should reject negative height', async () => {
    const args = { width: 800, height: -600 };
    const result = await resizeTool.execute(args, mockContext);

    expect(result.isError).toBe(true);
    expect(result.content[0].type).toBe('text');
    if (result.content[0].type === 'text') {
      expect(result.content[0].text).toContain('Width and height must be positive integers');
    }
  });

  test('should reject zero width', async () => {
    const args = { width: 0, height: 600 };
    const result = await resizeTool.execute(args, mockContext);

    expect(result.isError).toBe(true);
    expect(result.content[0].type).toBe('text');
    if (result.content[0].type === 'text') {
      expect(result.content[0].text).toContain('Width and height must be positive integers');
    }
  });

  test('should reject zero height', async () => {
    const args = { width: 800, height: 0 };
    const result = await resizeTool.execute(args, mockContext);

    expect(result.isError).toBe(true);
    expect(result.content[0].type).toBe('text');
    if (result.content[0].type === 'text') {
      expect(result.content[0].text).toContain('Width and height must be positive integers');
    }
  });

  test('should reject dimensions exceeding 8K resolution width', async () => {
    const args = { width: 7681, height: 4320 };
    const result = await resizeTool.execute(args, mockContext);

    expect(result.isError).toBe(true);
    expect(result.content[0].type).toBe('text');
    if (result.content[0].type === 'text') {
      expect(result.content[0].text).toContain('Width and height must not exceed 7680x4320 (8K resolution)');
    }
  });

  test('should reject dimensions exceeding 8K resolution height', async () => {
    const args = { width: 7680, height: 4321 };
    const result = await resizeTool.execute(args, mockContext);

    expect(result.isError).toBe(true);
    expect(result.content[0].type).toBe('text');
    if (result.content[0].type === 'text') {
      expect(result.content[0].text).toContain('Width and height must not exceed 7680x4320 (8K resolution)');
    }
  });

  test('should accept maximum 8K resolution', async () => {
    const args = { width: 7680, height: 4320 };
    const result = await resizeTool.execute(args, mockContext);

    expect(mockPage.setViewportSize).toHaveBeenCalledWith({ width: 7680, height: 4320 });
    expect(result.isError).toBe(false);
    expect(result.content[0].type).toBe('text');
    if (result.content[0].type === 'text') {
      expect(result.content[0].text).toBe('Browser viewport resized to 7680x4320');
    }
  });

  test('should return error when page is not available', async () => {
    const args = { width: 1920, height: 1080 };
    const contextWithoutPage: ToolContext = {
      page: undefined,
      browser: undefined,
      apiContext: undefined,
    };

    const result = await resizeTool.execute(args, contextWithoutPage);

    expect(result.isError).toBe(true);
    expect(result.content[0].type).toBe('text');
    if (result.content[0].type === 'text') {
      expect(result.content[0].text).toContain('Browser page not initialized');
    }
  });

  test('should handle setViewportSize errors gracefully', async () => {
    mockPage.setViewportSize = jest.fn().mockRejectedValue(new Error('Viewport error'));
    const args = { width: 1920, height: 1080 };

    const result = await resizeTool.execute(args, mockContext);

    expect(result.isError).toBe(true);
    expect(result.content[0].type).toBe('text');
    if (result.content[0].type === 'text') {
      expect(result.content[0].text).toContain('Viewport error');
    }
  });

  // Device preset tests
  test('should resize using iPhone 13 device preset', async () => {
    const args = { device: 'iPhone 13' };
    const result = await resizeTool.execute(args, mockContext);

    expect(mockPage.setViewportSize).toHaveBeenCalledWith({ width: 390, height: 664 });
    expect(mockPage.setExtraHTTPHeaders).toHaveBeenCalled();
    expect(result.isError).toBe(false);
    expect(result.content[0].type).toBe('text');
    if (result.content[0].type === 'text') {
      expect(result.content[0].text).toContain('iPhone 13');
      expect(result.content[0].text).toContain('390x664');
    }
  });

  test('should resize using iPad device preset', async () => {
    const args = { device: 'iPad Pro 11' };
    const result = await resizeTool.execute(args, mockContext);

    expect(mockPage.setViewportSize).toHaveBeenCalled();
    expect(mockPage.setExtraHTTPHeaders).toHaveBeenCalled();
    expect(result.isError).toBe(false);
    expect(result.content[0].type).toBe('text');
    if (result.content[0].type === 'text') {
      expect(result.content[0].text).toContain('iPad Pro 11');
    }
  });

  test('should resize using Android device preset', async () => {
    const args = { device: 'Pixel 5' };
    const result = await resizeTool.execute(args, mockContext);

    expect(mockPage.setViewportSize).toHaveBeenCalled();
    expect(mockPage.setExtraHTTPHeaders).toHaveBeenCalled();
    expect(result.isError).toBe(false);
    expect(result.content[0].type).toBe('text');
    if (result.content[0].type === 'text') {
      expect(result.content[0].text).toContain('Pixel 5');
    }
  });

  test('should handle device preset with portrait orientation', async () => {
    const args = { device: 'iPhone 13', orientation: 'portrait' };
    const result = await resizeTool.execute(args, mockContext);

    expect(mockPage.setViewportSize).toHaveBeenCalledWith({ width: 390, height: 664 });
    expect(result.isError).toBe(false);
    expect(result.content[0].type).toBe('text');
    if (result.content[0].type === 'text') {
      expect(result.content[0].text).toContain('portrait');
    }
  });

  test('should handle device preset with landscape orientation', async () => {
    const args = { device: 'iPhone 13', orientation: 'landscape' };
    const result = await resizeTool.execute(args, mockContext);

    // Should swap width and height for landscape
    expect(mockPage.setViewportSize).toHaveBeenCalledWith({ width: 664, height: 390 });
    expect(result.isError).toBe(false);
    expect(result.content[0].type).toBe('text');
    if (result.content[0].type === 'text') {
      expect(result.content[0].text).toContain('landscape');
    }
  });

  test('should return error for invalid device name', async () => {
    const args = { device: 'InvalidDevice123' };
    const result = await resizeTool.execute(args, mockContext);

    expect(result.isError).toBe(true);
    expect(result.content[0].type).toBe('text');
    if (result.content[0].type === 'text') {
      expect(result.content[0].text).toContain('Device "InvalidDevice123" not found');
      expect(result.content[0].text).toContain('Popular devices');
    }
  });

  test('should return error when neither device nor dimensions provided', async () => {
    const args = {};
    const result = await resizeTool.execute(args, mockContext);

    expect(result.isError).toBe(true);
    expect(result.content[0].type).toBe('text');
    if (result.content[0].type === 'text') {
      expect(result.content[0].text).toContain("Either 'device' parameter or both 'width' and 'height'");
    }
  });

  test('should return error when only width provided without device', async () => {
    const args = { width: 800 };
    const result = await resizeTool.execute(args, mockContext);

    expect(result.isError).toBe(true);
    expect(result.content[0].type).toBe('text');
    if (result.content[0].type === 'text') {
      expect(result.content[0].text).toContain("Either 'device' parameter or both 'width' and 'height'");
    }
  });

  test('should return error when only height provided without device', async () => {
    const args = { height: 600 };
    const result = await resizeTool.execute(args, mockContext);

    expect(result.isError).toBe(true);
    expect(result.content[0].type).toBe('text');
    if (result.content[0].type === 'text') {
      expect(result.content[0].text).toContain("Either 'device' parameter or both 'width' and 'height'");
    }
  });

  test('should include device features in success message', async () => {
    const args = { device: 'iPhone 13' };
    const result = await resizeTool.execute(args, mockContext);

    expect(result.isError).toBe(false);
    expect(result.content[0].type).toBe('text');
    if (result.content[0].type === 'text') {
      expect(result.content[0].text).toContain('mobile');
      expect(result.content[0].text).toContain('touch');
    }
  });

  test('should use Desktop Chrome device preset', async () => {
    const args = { device: 'Desktop Chrome' };
    const result = await resizeTool.execute(args, mockContext);

    expect(mockPage.setViewportSize).toHaveBeenCalled();
    expect(result.isError).toBe(false);
    expect(result.content[0].type).toBe('text');
    if (result.content[0].type === 'text') {
      expect(result.content[0].text).toContain('Desktop Chrome');
    }
  });
});
