
import { BrowserToolBase } from './base.js';
import { ToolContext, ToolResponse, createSuccessResponse, createErrorResponse } from '../common/types.js';

// Extend Window interface for debugging
declare global {
  interface Window {
    __consoleLogs: any[];
    __errors: any[];
  }
}

/**
 * Tool for advanced debugging and tracing
 */
export class DebugTracingTool extends BrowserToolBase {
  async execute(args: any, context: ToolContext): Promise<ToolResponse> {
    return this.safeExecute(context, async (page) => {
      const { action, options } = args;
      
      try {
        switch (action) {
          case 'startTrace':
            // Note: page.tracing is not available in standard Playwright
            // Using CDP client instead
            const client = await page.context().newCDPSession(page);
            await client.send('Tracing.start', {
              categories: options?.categories?.join(',') || 'devtools.timeline',
              options: 'sampling-frequency=10000'
            });
            return createSuccessResponse(`Tracing started with categories: ${options?.categories?.join(',') || 'devtools.timeline'}`);
            
          case 'stopTrace':
            const client2 = await page.context().newCDPSession(page);
            await client2.send('Tracing.end');
            return createSuccessResponse('Tracing stopped');
            
          case 'captureConsole':
            const consoleLogs: any[] = [];
            
            page.on('console', msg => {
              consoleLogs.push({
                type: msg.type(),
                text: msg.text(),
                location: msg.location(),
                timestamp: new Date().toISOString()
              });
            });
            
            // Store in page context for later retrieval
            await page.evaluate((logs) => {
              (window as any).__consoleLogs = logs;
            }, consoleLogs);
            
            return createSuccessResponse('Console logging started');
            
          case 'getConsoleLogs':
            const logs = await page.evaluate(() => {
              return (window as any).__consoleLogs || [];
            });
            
            return createSuccessResponse([
              `Captured ${logs.length} console messages:`,
              JSON.stringify(logs, null, 2)
            ]);
            
          case 'captureErrors':
            const errors: any[] = [];
            
            page.on('pageerror', error => {
              errors.push({
                message: error.message,
                stack: error.stack,
                timestamp: new Date().toISOString()
              });
            });
            
            page.on('requestfailed', request => {
              errors.push({
                type: 'network',
                url: request.url(),
                failure: request.failure()?.errorText,
                timestamp: new Date().toISOString()
              });
            });
            
            await page.evaluate((errs) => {
              (window as any).__errors = errs;
            }, errors);
            
            return createSuccessResponse('Error capturing started');
            
          case 'getErrors':
            const capturedErrors = await page.evaluate(() => {
              return (window as any).__errors || [];
            });
            
            return createSuccessResponse([
              `Captured ${capturedErrors.length} errors:`,
              JSON.stringify(capturedErrors, null, 2)
            ]);
            
          case 'debugElement':
            const { selector } = options;
            const elementInfo = await page.evaluate((sel) => {
              const element = document.querySelector(sel);
              if (!element) {
                return { error: 'Element not found' };
              }
              
              const rect = element.getBoundingClientRect();
              const styles = window.getComputedStyle(element);
              
              return {
                tagName: element.tagName.toLowerCase(),
                id: element.id,
                className: element.className,
                textContent: element.textContent?.trim().substring(0, 200),
                attributes: Array.from(element.attributes).reduce((acc: any, attr: Attr) => {
                  acc[attr.name] = attr.value;
                  return acc;
                }, {}),
                boundingBox: {
                  x: rect.x,
                  y: rect.y,
                  width: rect.width,
                  height: rect.height
                },
                computedStyles: {
                  display: styles.display,
                  visibility: styles.visibility,
                  opacity: styles.opacity,
                  position: styles.position,
                  zIndex: styles.zIndex
                },
                isVisible: rect.width > 0 && rect.height > 0 && styles.display !== 'none',
                isInViewport: rect.top >= 0 && rect.left >= 0 && 
                             rect.bottom <= window.innerHeight && 
                             rect.right <= window.innerWidth
              };
            }, selector);
            
            if ('error' in elementInfo) {
              return createErrorResponse(elementInfo.error);
            }
            
            return createSuccessResponse([
              `Debug info for element: ${selector}`,
              JSON.stringify(elementInfo, null, 2)
            ]);
            
          case 'inspectLocator':
            const { locatorString } = options;
            try {
              const locator = page.locator(locatorString);
              const count = await locator.count();
              
              if (count === 0) {
                return createSuccessResponse(`Locator "${locatorString}" matches 0 elements`);
              }
              
              const elements = [];
              for (let i = 0; i < Math.min(count, 5); i++) {
                const element = locator.nth(i);
                const isVisible = await element.isVisible();
                const isEnabled = await element.isEnabled();
                const textContent = await element.textContent();
                const boundingBox = await element.boundingBox();
                
                elements.push({
                  index: i,
                  isVisible,
                  isEnabled,
                  textContent: textContent?.trim().substring(0, 100),
                  boundingBox
                });
              }
              
              return createSuccessResponse([
                `Locator "${locatorString}" matches ${count} elements:`,
                JSON.stringify(elements, null, 2)
              ]);
            } catch (error) {
              return createErrorResponse(`Invalid locator: ${(error as Error).message}`);
            }
            
          case 'waitForCondition':
            const { condition, timeout } = options;
            const waitTimeout = timeout || 30000;
            
            try {
              await page.waitForFunction(condition, {}, { timeout: waitTimeout });
              return createSuccessResponse(`Condition met: ${condition}`);
            } catch (error) {
              return createErrorResponse(`Condition not met within ${waitTimeout}ms: ${condition}. Error: ${(error as Error).message}`);
            }
            
          default:
            return createErrorResponse(`Unknown debugging action: ${action}`);
        }
      } catch (error) {
        return createErrorResponse(`Debugging operation failed: ${(error as Error).message}`);
      }
    });
  }
}

/**
 * Tool for step-by-step debugging
 */
export class StepDebuggerTool extends BrowserToolBase {
  async execute(args: any, context: ToolContext): Promise<ToolResponse> {
    return this.safeExecute(context, async (page) => {
      const { action, options } = args;
      
      try {
        switch (action) {
          case 'pause':
            // Add a visual indicator that we're paused
            await page.evaluate(() => {
              const indicator = document.createElement('div');
              indicator.id = 'playwright-debug-indicator';
              indicator.style.cssText = `
                position: fixed;
                top: 10px;
                right: 10px;
                background: red;
                color: white;
                padding: 10px;
                border-radius: 5px;
                z-index: 999999;
                font-family: monospace;
              `;
              indicator.textContent = 'PAUSED - Playwright Debug Mode';
              document.body.appendChild(indicator);
            });
            
            return createSuccessResponse('Execution paused. Use "resume" action to continue.');
            
          case 'resume':
            await page.evaluate(() => {
              const indicator = document.getElementById('playwright-debug-indicator');
              if (indicator) {
                indicator.remove();
              }
            });
            
            return createSuccessResponse('Execution resumed');
            
          case 'step':
            const stepAction = options.stepAction;
            const stepSelector = options.selector;
            
            // Highlight the element we're about to interact with
            if (stepSelector) {
              await page.evaluate((selector) => {
                const element = document.querySelector(selector);
                if (element) {
                  element.style.outline = '3px solid red';
                  element.style.outlineOffset = '2px';
                  element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
              }, stepSelector);
              
              await page.waitForTimeout(1000); // Give time to see the highlight
            }
            
            // Execute the step
            let result;
            switch (stepAction) {
              case 'click':
                await page.click(stepSelector);
                result = `Clicked: ${stepSelector}`;
                break;
              case 'fill':
                await page.fill(stepSelector, options.value);
                result = `Filled: ${stepSelector} with "${options.value}"`;
                break;
              case 'hover':
                await page.hover(stepSelector);
                result = `Hovered: ${stepSelector}`;
                break;
              default:
                result = `Unknown step action: ${stepAction}`;
            }
            
            // Remove highlight
            if (stepSelector) {
              await page.evaluate((selector) => {
                const element = document.querySelector(selector);
                if (element) {
                  element.style.outline = '';
                  element.style.outlineOffset = '';
                }
              }, stepSelector);
            }
            
            return createSuccessResponse(result);
            
          case 'inspect':
            const inspectSelector = options.selector;
            
            // Highlight and get info about the element
            const elementInfo = await page.evaluate((selector) => {
              const element = document.querySelector(selector);
              if (!element) {
                return { error: 'Element not found' };
              }
              
              // Highlight the element
              element.style.outline = '3px solid blue';
              element.style.outlineOffset = '2px';
              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
              
              const rect = element.getBoundingClientRect();
              
              return {
                tagName: element.tagName.toLowerCase(),
                id: element.id,
                className: element.className,
                textContent: element.textContent?.trim(),
                value: (element as any).value,
                boundingBox: {
                  x: rect.x,
                  y: rect.y,
                  width: rect.width,
                  height: rect.height
                },
                isVisible: rect.width > 0 && rect.height > 0,
                isEnabled: !(element as any).disabled
              };
            }, inspectSelector);
            
            if ('error' in elementInfo) {
              return createErrorResponse(elementInfo.error);
            }
            
            return createSuccessResponse([
              `Inspecting element: ${inspectSelector}`,
              JSON.stringify(elementInfo, null, 2)
            ]);
            
          case 'screenshot':
            const screenshotPath = options.path || `debug-screenshot-${Date.now()}.png`;
            await page.screenshot({ path: screenshotPath, fullPage: true });
            
            return createSuccessResponse(`Debug screenshot saved to: ${screenshotPath}`);
            
          default:
            return createErrorResponse(`Unknown step debugger action: ${action}`);
        }
      } catch (error) {
        return createErrorResponse(`Step debugger operation failed: ${(error as Error).message}`);
      }
    });
  }
}

/**
 * Tool for browser developer tools integration
 */
export class DevToolsIntegrationTool extends BrowserToolBase {
  async execute(args: any, context: ToolContext): Promise<ToolResponse> {
    return this.safeExecute(context, async (page) => {
      const { action, options } = args;
      
      try {
        // Get CDP session for advanced debugging
        const client = await page.context().newCDPSession(page);
        
        switch (action) {
          case 'enableDomains':
            const domains = options.domains || ['Runtime', 'Debugger', 'Network', 'Performance'];
            
            for (const domain of domains) {
              await client.send(`${domain}.enable` as any);
            }
            
            return createSuccessResponse(`Enabled CDP domains: ${domains.join(', ')}`);
            
          case 'setBreakpoint':
            await client.send('Debugger.enable');
            await client.send('Debugger.setBreakpointByUrl' as any, {
              lineNumber: options.lineNumber,
              url: options.url || page.url()
            });
            
            return createSuccessResponse(`Breakpoint set at line ${options.lineNumber}`);
            
          case 'evaluateExpression':
            const result = await client.send('Runtime.evaluate' as any, {
              expression: options.expression,
              returnByValue: true
            });
            
            return createSuccessResponse([
              `Expression: ${options.expression}`,
              `Result: ${JSON.stringify((result as any).result.value, null, 2)}`
            ]);
            
          case 'getCallStack':
            await client.send('Debugger.enable');
            const callFrames = await client.send('Debugger.getStackTrace' as any);
            
            return createSuccessResponse([
              'Call Stack:',
              JSON.stringify(callFrames, null, 2)
            ]);
            
          case 'profilePerformance':
            await client.send('Performance.enable');
            await client.send('Performance.startPreciseCoverage' as any);
            
            // Wait for specified duration
            const duration = options.duration || 5000;
            await page.waitForTimeout(duration);
            
            const coverage = await client.send('Performance.takePreciseCoverage' as any);
            await client.send('Performance.stopPreciseCoverage' as any);
            
            return createSuccessResponse([
              `Performance profile completed (${duration}ms):`,
              JSON.stringify(coverage, null, 2)
            ]);
            
          default:
            return createErrorResponse(`Unknown DevTools action: ${action}`);
        }
      } catch (error) {
        return createErrorResponse(`DevTools integration failed: ${(error as Error).message}`);
      }
    });
  }
}
