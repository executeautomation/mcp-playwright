
import { BrowserToolBase } from './base.js';
import { ToolContext, ToolResponse, createSuccessResponse, createErrorResponse } from '../common/types.js';

/**
 * Tool for managing cookies
 */
export class CookieManagementTool extends BrowserToolBase {
  async execute(args: any, context: ToolContext): Promise<ToolResponse> {
    return this.safeExecute(context, async (page) => {
      const { action, cookieData, options } = args;
      
      try {
        switch (action) {
          case 'get':
            const cookies = await page.context().cookies(options?.url);
            return createSuccessResponse([
              `Found ${cookies.length} cookies:`,
              JSON.stringify(cookies, null, 2)
            ]);
            
          case 'set':
            await page.context().addCookies([{
              name: cookieData.name,
              value: cookieData.value,
              domain: cookieData.domain || new URL(page.url()).hostname,
              path: cookieData.path || '/',
              expires: cookieData.expires,
              httpOnly: cookieData.httpOnly || false,
              secure: cookieData.secure || false,
              sameSite: cookieData.sameSite || 'Lax'
            }]);
            return createSuccessResponse(`Cookie '${cookieData.name}' set successfully`);
            
          case 'delete':
            if (cookieData.name) {
              await page.context().clearCookies({
                name: cookieData.name,
                domain: cookieData.domain
              });
              return createSuccessResponse(`Cookie '${cookieData.name}' deleted`);
            } else {
              await page.context().clearCookies();
              return createSuccessResponse('All cookies cleared');
            }
            
          case 'export':
            const allCookies = await page.context().cookies();
            return createSuccessResponse([
              'Exported cookies:',
              JSON.stringify(allCookies, null, 2)
            ]);
            
          case 'import':
            if (cookieData.cookies && Array.isArray(cookieData.cookies)) {
              await page.context().addCookies(cookieData.cookies);
              return createSuccessResponse(`Imported ${cookieData.cookies.length} cookies`);
            }
            return createErrorResponse('Invalid cookie data for import');
            
          default:
            return createErrorResponse(`Unknown cookie action: ${action}`);
        }
      } catch (error) {
        return createErrorResponse(`Cookie operation failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    });
  }
}

/**
 * Tool for managing local storage
 */
export class LocalStorageTool extends BrowserToolBase {
  async execute(args: any, context: ToolContext): Promise<ToolResponse> {
    return this.safeExecute(context, async (page) => {
      const { action, key, value } = args;
      
      try {
        switch (action) {
          case 'get':
            if (key) {
              const item = await page.evaluate((k) => localStorage.getItem(k), key);
              return createSuccessResponse(`localStorage['${key}'] = ${item}`);
            } else {
              const allItems = await page.evaluate(() => {
                const items = {};
                for (let i = 0; i < localStorage.length; i++) {
                  const key = localStorage.key(i);
                  if (key) {
                    items[key] = localStorage.getItem(key);
                  }
                }
                return items;
              });
              return createSuccessResponse([
                'All localStorage items:',
                JSON.stringify(allItems, null, 2)
              ]);
            }
            
          case 'set':
            await page.evaluate(({ k, v }) => localStorage.setItem(k, v), { k: key, v: value });
            return createSuccessResponse(`localStorage['${key}'] set to: ${value}`);
            
          case 'remove':
            if (key) {
              await page.evaluate((k) => localStorage.removeItem(k), key);
              return createSuccessResponse(`localStorage['${key}'] removed`);
            } else {
              await page.evaluate(() => localStorage.clear());
              return createSuccessResponse('All localStorage items cleared');
            }
            
          case 'length':
            const length = await page.evaluate(() => localStorage.length);
            return createSuccessResponse(`localStorage contains ${length} items`);
            
          case 'keys':
            const keys = await page.evaluate(() => {
              const keys = [];
              for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key) keys.push(key);
              }
              return keys;
            });
            return createSuccessResponse([
              'localStorage keys:',
              JSON.stringify(keys, null, 2)
            ]);
            
          default:
            return createErrorResponse(`Unknown localStorage action: ${action}`);
        }
      } catch (error) {
        return createErrorResponse(`localStorage operation failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    });
  }
}

/**
 * Tool for managing session storage
 */
export class SessionStorageTool extends BrowserToolBase {
  async execute(args: any, context: ToolContext): Promise<ToolResponse> {
    return this.safeExecute(context, async (page) => {
      const { action, key, value } = args;
      
      try {
        switch (action) {
          case 'get':
            if (key) {
              const item = await page.evaluate((k) => sessionStorage.getItem(k), key);
              return createSuccessResponse(`sessionStorage['${key}'] = ${item}`);
            } else {
              const allItems = await page.evaluate(() => {
                const items = {};
                for (let i = 0; i < sessionStorage.length; i++) {
                  const key = sessionStorage.key(i);
                  if (key) {
                    items[key] = sessionStorage.getItem(key);
                  }
                }
                return items;
              });
              return createSuccessResponse([
                'All sessionStorage items:',
                JSON.stringify(allItems, null, 2)
              ]);
            }
            
          case 'set':
            await page.evaluate(({ k, v }) => sessionStorage.setItem(k, v), { k: key, v: value });
            return createSuccessResponse(`sessionStorage['${key}'] set to: ${value}`);
            
          case 'remove':
            if (key) {
              await page.evaluate((k) => sessionStorage.removeItem(k), key);
              return createSuccessResponse(`sessionStorage['${key}'] removed`);
            } else {
              await page.evaluate(() => sessionStorage.clear());
              return createSuccessResponse('All sessionStorage items cleared');
            }
            
          case 'length':
            const length = await page.evaluate(() => sessionStorage.length);
            return createSuccessResponse(`sessionStorage contains ${length} items`);
            
          case 'keys':
            const keys = await page.evaluate(() => {
              const keys = [];
              for (let i = 0; i < sessionStorage.length; i++) {
                const key = sessionStorage.key(i);
                if (key) keys.push(key);
              }
              return keys;
            });
            return createSuccessResponse([
              'sessionStorage keys:',
              JSON.stringify(keys, null, 2)
            ]);
            
          default:
            return createErrorResponse(`Unknown sessionStorage action: ${action}`);
        }
      } catch (error) {
        return createErrorResponse(`sessionStorage operation failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    });
  }
}

/**
 * Tool for managing browser storage state
 */
export class StorageStateTool extends BrowserToolBase {
  async execute(args: any, context: ToolContext): Promise<ToolResponse> {
    return this.safeExecute(context, async (page) => {
      const { action, filePath, storageData } = args;
      
      try {
        switch (action) {
          case 'save':
            const storageState = await page.context().storageState();
            if (filePath) {
              const fs = await import('fs/promises');
              await fs.writeFile(filePath, JSON.stringify(storageState, null, 2));
              return createSuccessResponse(`Storage state saved to: ${filePath}`);
            } else {
              return createSuccessResponse([
                'Current storage state:',
                JSON.stringify(storageState, null, 2)
              ]);
            }
            
          case 'load':
            if (filePath) {
              const fs = await import('fs/promises');
              const data = await fs.readFile(filePath, 'utf-8');
              const state = JSON.parse(data);
              // Note: Loading storage state requires creating a new context
              return createSuccessResponse([
                'Storage state loaded from file:',
                JSON.stringify(state, null, 2),
                'Note: To apply this state, create a new browser context with this data'
              ]);
            } else if (storageData) {
              return createSuccessResponse([
                'Storage state data received:',
                JSON.stringify(storageData, null, 2),
                'Note: To apply this state, create a new browser context with this data'
              ]);
            }
            return createErrorResponse('Either filePath or storageData must be provided');
            
          case 'clear':
            await page.context().clearCookies();
            await page.evaluate(() => {
              localStorage.clear();
              sessionStorage.clear();
            });
            return createSuccessResponse('All storage cleared (cookies, localStorage, sessionStorage)');
            
          default:
            return createErrorResponse(`Unknown storage state action: ${action}`);
        }
      } catch (error) {
        return createErrorResponse(`Storage state operation failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    });
  }
}
