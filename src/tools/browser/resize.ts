import { BrowserToolBase } from './base.js';
import { ToolContext, ToolResponse, createSuccessResponse, createErrorResponse } from '../common/types.js';
import { devices } from 'playwright';

/**
 * Tool for resizing the browser viewport with device preset support
 */
export class ResizeTool extends BrowserToolBase {
  /**
   * Execute the resize tool
   */
  async execute(args: any, context: ToolContext): Promise<ToolResponse> {
    return this.safeExecute(context, async (page) => {
      let width: number;
      let height: number;
      let deviceName: string | undefined;
      let shouldSetUserAgent = false;
      let userAgent: string | undefined;
      let isMobile = false;
      let hasTouch = false;
      let deviceScaleFactor = 1;

      // Check if using device preset
      if (args.device) {
        const device = devices[args.device];
        
        if (!device) {
          // List some popular devices for suggestions
          const popularDevices = [
            'iPhone 13', 'iPhone 13 Pro', 'iPhone 14', 'iPhone 15',
            'iPad Pro 11', 'iPad Pro 12.9',
            'Pixel 5', 'Pixel 7', 
            'Galaxy S9+', 'Galaxy S24',
            'Desktop Chrome', 'Desktop Firefox', 'Desktop Safari'
          ];
          
          return createErrorResponse(
            `Device "${args.device}" not found. Popular devices: ${popularDevices.join(', ')}. ` +
            `Use playwright.devices to see all ${Object.keys(devices).length} available devices.`
          );
        }

        // Extract device properties
        width = device.viewport.width;
        height = device.viewport.height;
        deviceName = args.device;
        shouldSetUserAgent = true;
        userAgent = device.userAgent;
        isMobile = device.isMobile || false;
        hasTouch = device.hasTouch || false;
        deviceScaleFactor = device.deviceScaleFactor || 1;

        // Handle orientation
        if (args.orientation === 'landscape' && width < height) {
          [width, height] = [height, width];
        } else if (args.orientation === 'portrait' && width > height) {
          [width, height] = [height, width];
        }
      } else {
        // Manual dimensions
        width = args.width;
        height = args.height;

        // Check if dimensions are provided
        if (width === undefined || height === undefined) {
          return createErrorResponse(
            "Either 'device' parameter or both 'width' and 'height' parameters are required"
          );
        }

        // Validate dimensions
        if (width <= 0 || height <= 0) {
          throw new Error("Width and height must be positive integers");
        }

        if (width > 7680 || height > 4320) {
          throw new Error("Width and height must not exceed 7680x4320 (8K resolution)");
        }
      }

      // Apply viewport resize
      await page.setViewportSize({ width, height });

      // If using device preset, also update user agent and touch settings
      if (shouldSetUserAgent && userAgent) {
        await page.setExtraHTTPHeaders({
          'User-Agent': userAgent
        });
      }

      // Construct success message
      let message = deviceName 
        ? `Browser viewport resized to ${deviceName} (${width}x${height})`
        : `Browser viewport resized to ${width}x${height}`;

      if (args.orientation) {
        message += ` in ${args.orientation} orientation`;
      }

      if (deviceName) {
        const features = [];
        if (isMobile) features.push('mobile');
        if (hasTouch) features.push('touch');
        if (deviceScaleFactor > 1) features.push(`${deviceScaleFactor}x scale`);
        
        if (features.length > 0) {
          message += ` [${features.join(', ')}]`;
        }
      }

      return createSuccessResponse(message);
    });
  }
}
