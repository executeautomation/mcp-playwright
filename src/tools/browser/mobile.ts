
import { BrowserToolBase } from './base.js';
import { ToolContext, ToolResponse, createSuccessResponse, createErrorResponse } from '../common/types.js';

/**
 * Tool for mobile device emulation
 */
export class MobileEmulationTool extends BrowserToolBase {
  async execute(args: any, context: ToolContext): Promise<ToolResponse> {
    return this.safeExecute(context, async (page) => {
      const { device, customViewport } = args;
      
      try {
        if (device) {
          // Use predefined device
          const { devices } = await import('playwright');
          const deviceDescriptor = devices[device];
          if (!deviceDescriptor) {
            return createErrorResponse(`Unknown device: ${device}. Available devices: ${Object.keys(devices).join(', ')}`);
          }
          
          await page.setViewportSize(deviceDescriptor.viewport);
          await page.setExtraHTTPHeaders({ 'User-Agent': deviceDescriptor.userAgent });
          
          return createSuccessResponse(`Emulating device: ${device}`);
        } else if (customViewport) {
          // Use custom viewport
          await page.setViewportSize({
            width: customViewport.width,
            height: customViewport.height
          });
          
          if (customViewport.userAgent) {
            await page.setExtraHTTPHeaders({ 'User-Agent': customViewport.userAgent });
          }
          
          return createSuccessResponse(`Set custom viewport: ${customViewport.width}x${customViewport.height}`);
        }
        
        return createErrorResponse('Either device or customViewport must be specified');
      } catch (error) {
        return createErrorResponse(`Mobile emulation failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    });
  }
}

/**
 * Tool for touch gestures
 */
export class TouchGestureTool extends BrowserToolBase {
  async execute(args: any, context: ToolContext): Promise<ToolResponse> {
    return this.safeExecute(context, async (page) => {
      const { gesture, selector, coordinates, options } = args;
      
      try {
        switch (gesture) {
          case 'tap':
            if (selector) {
              await page.locator(selector).tap();
            } else if (coordinates) {
              await page.touchscreen.tap(coordinates.x, coordinates.y);
            }
            break;
            
          case 'doubleTap':
            if (selector) {
              const locator = page.locator(selector);
              await locator.tap();
              await page.waitForTimeout(100);
              await locator.tap();
            } else if (coordinates) {
              await page.touchscreen.tap(coordinates.x, coordinates.y);
              await page.waitForTimeout(100);
              await page.touchscreen.tap(coordinates.x, coordinates.y);
            }
            break;
            
          case 'longPress':
            const duration = options?.duration || 1000;
            if (selector) {
              const element = await page.locator(selector).elementHandle();
              const box = await element.boundingBox();
              if (box) {
                await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
                await page.waitForTimeout(duration);
              }
            } else if (coordinates) {
              await page.touchscreen.tap(coordinates.x, coordinates.y);
              await page.waitForTimeout(duration);
            }
            break;
            
          case 'swipe':
            const { startX, startY, endX, endY } = coordinates;
            const steps = options?.steps || 10;
            const stepDelay = options?.stepDelay || 50;
            
            // Simulate swipe with multiple touch moves
            await page.evaluate(({ startX, startY, endX, endY, steps, stepDelay }) => {
              const element = document.elementFromPoint(startX, startY);
              if (!element) return;
              
              const deltaX = (endX - startX) / steps;
              const deltaY = (endY - startY) / steps;
              
              // Start touch
              element.dispatchEvent(new TouchEvent('touchstart', {
                touches: [new Touch({
                  identifier: 0,
                  target: element,
                  clientX: startX,
                  clientY: startY
                })],
                bubbles: true
              }));
              
              // Move touch
              for (let i = 1; i <= steps; i++) {
                setTimeout(() => {
                  const currentX = startX + (deltaX * i);
                  const currentY = startY + (deltaY * i);
                  
                  element.dispatchEvent(new TouchEvent('touchmove', {
                    touches: [new Touch({
                      identifier: 0,
                      target: element,
                      clientX: currentX,
                      clientY: currentY
                    })],
                    bubbles: true
                  }));
                  
                  if (i === steps) {
                    // End touch
                    element.dispatchEvent(new TouchEvent('touchend', {
                      changedTouches: [new Touch({
                        identifier: 0,
                        target: element,
                        clientX: currentX,
                        clientY: currentY
                      })],
                      bubbles: true
                    }));
                  }
                }, i * stepDelay);
              }
            }, { startX, startY, endX, endY, steps, stepDelay });
            
            await page.waitForTimeout((steps + 1) * stepDelay);
            break;
            
          case 'pinch':
            const { centerX, centerY, startDistance, endDistance } = coordinates;
            const pinchSteps = options?.steps || 10;
            
            await page.evaluate(({ centerX, centerY, startDistance, endDistance, steps }) => {
              const element = document.elementFromPoint(centerX, centerY);
              if (!element) return;
              
              const startX1 = centerX - startDistance / 2;
              const startY1 = centerY;
              const startX2 = centerX + startDistance / 2;
              const startY2 = centerY;
              
              const endX1 = centerX - endDistance / 2;
              const endY1 = centerY;
              const endX2 = centerX + endDistance / 2;
              const endY2 = centerY;
              
              // Start pinch
              element.dispatchEvent(new TouchEvent('touchstart', {
                touches: [
                  new Touch({ identifier: 0, target: element, clientX: startX1, clientY: startY1 }),
                  new Touch({ identifier: 1, target: element, clientX: startX2, clientY: startY2 })
                ],
                bubbles: true
              }));
              
              // Animate pinch
              for (let i = 1; i <= steps; i++) {
                setTimeout(() => {
                  const progress = i / steps;
                  const currentX1 = startX1 + (endX1 - startX1) * progress;
                  const currentY1 = startY1 + (endY1 - startY1) * progress;
                  const currentX2 = startX2 + (endX2 - startX2) * progress;
                  const currentY2 = startY2 + (endY2 - startY2) * progress;
                  
                  element.dispatchEvent(new TouchEvent('touchmove', {
                    touches: [
                      new Touch({ identifier: 0, target: element, clientX: currentX1, clientY: currentY1 }),
                      new Touch({ identifier: 1, target: element, clientX: currentX2, clientY: currentY2 })
                    ],
                    bubbles: true
                  }));
                  
                  if (i === steps) {
                    element.dispatchEvent(new TouchEvent('touchend', {
                      changedTouches: [
                        new Touch({ identifier: 0, target: element, clientX: currentX1, clientY: currentY1 }),
                        new Touch({ identifier: 1, target: element, clientX: currentX2, clientY: currentY2 })
                      ],
                      bubbles: true
                    }));
                  }
                }, i * 50);
              }
            }, { centerX, centerY, startDistance, endDistance, steps: pinchSteps });
            
            await page.waitForTimeout((pinchSteps + 1) * 50);
            break;
            
          default:
            return createErrorResponse(`Unknown gesture: ${gesture}`);
        }
        
        return createSuccessResponse(`Touch gesture '${gesture}' completed successfully`);
      } catch (error) {
        return createErrorResponse(`Touch gesture failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    });
  }
}

/**
 * Tool for mobile-specific interactions
 */
export class MobileInteractionTool extends BrowserToolBase {
  async execute(args: any, context: ToolContext): Promise<ToolResponse> {
    return this.safeExecute(context, async (page) => {
      const { action, options } = args;
      
      try {
        switch (action) {
          case 'setOrientation':
            // Note: This requires the browser context to be created with mobile device settings
            const orientation = options.orientation; // 'portrait' or 'landscape'
            if (orientation === 'landscape') {
              await page.setViewportSize({ width: 812, height: 375 }); // iPhone X landscape
            } else {
              await page.setViewportSize({ width: 375, height: 812 }); // iPhone X portrait
            }
            break;
            
          case 'setGeolocation':
            await page.context().setGeolocation({
              latitude: options.latitude,
              longitude: options.longitude
            });
            break;
            
          case 'simulateNetworkCondition':
            // Simulate slow network
            const condition = options.condition; // 'slow3g', 'fast3g', 'offline'
            const conditions = {
              'slow3g': { downloadThroughput: 50 * 1024, uploadThroughput: 50 * 1024, latency: 2000 },
              'fast3g': { downloadThroughput: 1.6 * 1024 * 1024, uploadThroughput: 750 * 1024, latency: 150 },
              'offline': { downloadThroughput: 0, uploadThroughput: 0, latency: 0 }
            };
            
            if (conditions[condition]) {
              await page.context().setOffline(condition === 'offline');
              if (condition !== 'offline') {
                // Note: Network throttling requires CDP in Chromium
                const client = await page.context().newCDPSession(page);
                await client.send('Network.emulateNetworkConditions', {
                  offline: false,
                  ...conditions[condition]
                });
              }
            }
            break;
            
          case 'hideKeyboard':
            // Simulate hiding mobile keyboard
            await page.evaluate(() => {
              const activeElement = document.activeElement;
              if (activeElement && 'blur' in activeElement && typeof activeElement.blur === 'function') {
                (activeElement as HTMLElement).blur();
              }
            });
            break;
            
          default:
            return createErrorResponse(`Unknown mobile action: ${action}`);
        }
        
        return createSuccessResponse(`Mobile action '${action}' completed successfully`);
      } catch (error) {
        return createErrorResponse(`Mobile interaction failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    });
  }
}
