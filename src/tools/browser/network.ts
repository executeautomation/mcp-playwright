
import { BrowserToolBase } from './base.js';
import { ToolContext, ToolResponse, createSuccessResponse, createErrorResponse } from '../common/types.js';

/**
 * Tool for network request interception and mocking
 */
export class NetworkInterceptionTool extends BrowserToolBase {
  async execute(args: any, context: ToolContext): Promise<ToolResponse> {
    return this.safeExecute(context, async (page) => {
      const { action, pattern, response, options } = args;
      
      try {
        switch (action) {
          case 'mock':
            await page.route(pattern, async (route) => {
              await route.fulfill({
                status: response.status || 200,
                headers: response.headers || {},
                body: response.body || '',
                contentType: response.contentType || 'application/json'
              });
            });
            break;
            
          case 'block':
            await page.route(pattern, async (route) => {
              await route.abort();
            });
            break;
            
          case 'modify':
            await page.route(pattern, async (route) => {
              const originalResponse = await route.fetch();
              let body = await originalResponse.text();
              
              // Apply modifications
              if (options.replaceText) {
                body = body.replace(
                  new RegExp(options.replaceText.from, 'g'),
                  options.replaceText.to
                );
              }
              
              await route.fulfill({
                status: originalResponse.status(),
                headers: originalResponse.headers(),
                body: body
              });
            });
            break;
            
          case 'delay':
            const delay = options.delay || 1000;
            await page.route(pattern, async (route) => {
              await new Promise(resolve => setTimeout(resolve, delay));
              await route.continue();
            });
            break;
            
          case 'redirect':
            await page.route(pattern, async (route) => {
              await route.fulfill({
                status: 302,
                headers: {
                  'Location': options.redirectUrl
                }
              });
            });
            break;
            
          case 'unroute':
            await page.unroute(pattern);
            break;
            
          default:
            return createErrorResponse(`Unknown network action: ${action}`);
        }
        
        return createSuccessResponse(`Network interception '${action}' set up for pattern: ${pattern}`);
      } catch (error) {
        return createErrorResponse(`Network interception failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    });
  }
}

/**
 * Tool for monitoring network activity
 */
export class NetworkMonitorTool extends BrowserToolBase {
  async execute(args: any, context: ToolContext): Promise<ToolResponse> {
    return this.safeExecute(context, async (page) => {
      const { action, options } = args;
      
      try {
        switch (action) {
          case 'startMonitoring':
            const requests = [];
            const responses = [];
            
            page.on('request', request => {
              requests.push({
                url: request.url(),
                method: request.method(),
                headers: request.headers(),
                postData: request.postData(),
                timestamp: Date.now()
              });
            });
            
            page.on('response', response => {
              responses.push({
                url: response.url(),
                status: response.status(),
                headers: response.headers(),
                timestamp: Date.now()
              });
            });
            
            // Store monitoring data in page context
            await page.evaluate(() => {
              (window as any).__networkMonitoring = { active: true };
            });
            
            return createSuccessResponse('Network monitoring started');
            
          case 'getRequests':
            const requestData = await page.evaluate(() => {
              return (window as any).__networkRequests || [];
            });
            
            return createSuccessResponse([
              `Captured ${requestData.length} requests:`,
              JSON.stringify(requestData, null, 2)
            ]);
            
          case 'waitForRequest':
            const urlPattern = options.urlPattern;
            const timeout = options.timeout || 30000;
            
            const request = await page.waitForRequest(
              request => request.url().includes(urlPattern),
              { timeout }
            );
            
            return createSuccessResponse([
              `Request captured:`,
              `URL: ${request.url()}`,
              `Method: ${request.method()}`,
              `Headers: ${JSON.stringify(request.headers(), null, 2)}`
            ]);
            
          case 'waitForResponse':
            const responseUrlPattern = options.urlPattern;
            const responseTimeout = options.timeout || 30000;
            
            const response = await page.waitForResponse(
              response => response.url().includes(responseUrlPattern),
              { timeout: responseTimeout }
            );
            
            return createSuccessResponse([
              `Response captured:`,
              `URL: ${response.url()}`,
              `Status: ${response.status()}`,
              `Headers: ${JSON.stringify(response.headers(), null, 2)}`
            ]);
            
          default:
            return createErrorResponse(`Unknown monitoring action: ${action}`);
        }
      } catch (error) {
        return createErrorResponse(`Network monitoring failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    });
  }
}

/**
 * Tool for WebSocket monitoring and interaction
 */
export class WebSocketTool extends BrowserToolBase {
  async execute(args: any, context: ToolContext): Promise<ToolResponse> {
    return this.safeExecute(context, async (page) => {
      const { action, options } = args;
      
      try {
        switch (action) {
          case 'monitor':
            const wsMessages = [];
            
            page.on('websocket', ws => {
              ws.on('framesent', event => {
                wsMessages.push({
                  type: 'sent',
                  payload: event.payload,
                  timestamp: Date.now()
                });
              });
              
              ws.on('framereceived', event => {
                wsMessages.push({
                  type: 'received',
                  payload: event.payload,
                  timestamp: Date.now()
                });
              });
            });
            
            return createSuccessResponse('WebSocket monitoring started');
            
          case 'mock':
            await page.routeWebSocket(options.url, ws => {
              ws.onMessage(message => {
                // Mock response
                if (options.mockResponse) {
                  ws.send(options.mockResponse);
                }
              });
            });
            
            return createSuccessResponse(`WebSocket mocking set up for: ${options.url}`);
            
          case 'getMessages':
            const messages = await page.evaluate(() => {
              return (window as any).__wsMessages || [];
            });
            
            return createSuccessResponse([
              `Captured ${messages.length} WebSocket messages:`,
              JSON.stringify(messages, null, 2)
            ]);
            
          default:
            return createErrorResponse(`Unknown WebSocket action: ${action}`);
        }
      } catch (error) {
        return createErrorResponse(`WebSocket operation failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    });
  }
}
