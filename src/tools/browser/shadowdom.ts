
import { BrowserToolBase } from './base.js';
import { ToolContext, ToolResponse, createSuccessResponse, createErrorResponse } from '../common/types.js';

/**
 * Tool for finding all elements with Shadow DOM information and selectors
 */
export class ShadowDomAnalyzerTool extends BrowserToolBase {
  async execute(args: any, context: ToolContext): Promise<ToolResponse> {
    return this.safeExecute(context, async (page) => {
      const result = await page.evaluate((options) => {
        function alleElementeMitShadowInfoUndSelector(
          tagNames = null, 
          root = document, 
          result = [], 
          path = []
        ) {
          const elements = root.querySelectorAll('*');
          
          elements.forEach((element, index) => {
            const tagName = element.tagName.toLowerCase();
            
            // Filter by tag names if specified
            if (tagNames && !tagNames.includes(tagName)) {
              return;
            }
            
            const currentPath = [...path, `${tagName}:nth-child(${index + 1})`];
            const elementInfo = {
              tagName: tagName,
              id: element.id || null,
              className: element.className || null,
              textContent: element.textContent?.trim().substring(0, 100) || null,
              innerText: (element as HTMLElement).innerText?.trim().substring(0, 100) || null,
              hasShadowRoot: !!element.shadowRoot,
              shadowMode: element.shadowRoot ? 'open' : null,
              cssSelector: generateCSSSelector(element),
              xpathSelector: generateXPathSelector(element),
              path: currentPath.join(' > '),
              attributes: getElementAttributes(element),
              boundingBox: element.getBoundingClientRect(),
              isVisible: isElementVisible(element),
              shadowChildren: []
            };
            
            // If element has shadow root, recursively analyze it
            if (element.shadowRoot) {
              elementInfo.shadowMode = 'open';
              elementInfo.shadowChildren = alleElementeMitShadowInfoUndSelector(
                tagNames, 
                element.shadowRoot as any, 
                [], 
                [...currentPath, 'shadow-root']
              );
            }
            
            result.push(elementInfo);
          });
          
          return result;
        }
        
        function generateCSSSelector(element) {
          if (element.id) {
            return `#${element.id}`;
          }
          
          let selector = element.tagName.toLowerCase();
          
          if (element.className) {
            const classes = element.className.split(' ').filter(c => c.trim());
            if (classes.length > 0) {
              selector += '.' + classes.join('.');
            }
          }
          
          // Add nth-child if needed for uniqueness
          const parent = element.parentElement;
          if (parent) {
            const siblings = Array.from(parent.children).filter(
              sibling => (sibling as Element).tagName === (element as Element).tagName
            );
            if (siblings.length > 1) {
              const index = siblings.indexOf(element) + 1;
              selector += `:nth-child(${index})`;
            }
          }
          
          return selector;
        }
        
        function generateXPathSelector(element) {
          if (element.id) {
            return `//*[@id="${element.id}"]`;
          }
          
          const parts = [];
          let current = element;
          
          while (current && current.nodeType === Node.ELEMENT_NODE) {
            let part = current.tagName.toLowerCase();
            
            if (current.id) {
              part = `*[@id="${current.id}"]`;
              parts.unshift(part);
              break;
            }
            
            const parent = current.parentElement;
            if (parent) {
              const siblings = Array.from(parent.children).filter(
                sibling => (sibling as Element).tagName === (current as Element).tagName
              );
              if (siblings.length > 1) {
                const index = siblings.indexOf(current) + 1;
                part += `[${index}]`;
              }
            }
            
            parts.unshift(part);
            current = parent;
          }
          
          return '//' + parts.join('/');
        }
        
        function getElementAttributes(element) {
          const attrs = {};
          for (let i = 0; i < element.attributes.length; i++) {
            const attr = element.attributes[i];
            attrs[attr.name] = attr.value;
          }
          return attrs;
        }
        
        function isElementVisible(element) {
          const style = window.getComputedStyle(element);
          const rect = element.getBoundingClientRect();
          
          return (
            style.display !== 'none' &&
            style.visibility !== 'hidden' &&
            style.opacity !== '0' &&
            rect.width > 0 &&
            rect.height > 0
          );
        }
        
        // Execute the main function
        return alleElementeMitShadowInfoUndSelector(
          options.tagNames,
          document,
          [],
          []
        );
      }, {
        tagNames: args.tagNames || null
      });
      
      return createSuccessResponse([
        `Found ${result.length} elements with Shadow DOM analysis`,
        `Elements with Shadow Roots: ${result.filter(el => el.hasShadowRoot).length}`,
        JSON.stringify(result, null, 2)
      ]);
    });
  }
}

/**
 * Tool for interacting with elements inside Shadow DOM
 */
export class ShadowDomInteractionTool extends BrowserToolBase {
  async execute(args: any, context: ToolContext): Promise<ToolResponse> {
    return this.safeExecute(context, async (page) => {
      const { hostSelector, shadowSelector, action, value } = args;
      
      const result = await page.evaluate(({ hostSelector, shadowSelector, action, value }) => {
        const host = document.querySelector(hostSelector);
        if (!host || !host.shadowRoot) {
          return { success: false, error: `Shadow host not found or no shadow root: ${hostSelector}` };
        }
        
        const shadowElement = host.shadowRoot.querySelector(shadowSelector);
        if (!shadowElement) {
          return { success: false, error: `Element not found in shadow DOM: ${shadowSelector}` };
        }
        
        try {
          switch (action) {
            case 'click':
              shadowElement.click();
              break;
            case 'fill':
              if (shadowElement.tagName === 'INPUT' || shadowElement.tagName === 'TEXTAREA') {
                shadowElement.value = value;
                shadowElement.dispatchEvent(new Event('input', { bubbles: true }));
                shadowElement.dispatchEvent(new Event('change', { bubbles: true }));
              }
              break;
            case 'getText':
              return { success: true, result: shadowElement.textContent };
            case 'getAttribute':
              return { success: true, result: shadowElement.getAttribute(value) };
            case 'hover':
              shadowElement.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
              break;
            default:
              return { success: false, error: `Unknown action: ${action}` };
          }
          
          return { success: true, result: `${action} performed successfully` };
        } catch (error) {
          return { success: false, error: error instanceof Error ? error.message : String(error) };
        }
      }, { hostSelector, shadowSelector, action, value });
      
      if (!result.success) {
        return createErrorResponse(result.error);
      }
      
      return createSuccessResponse(result.result);
    });
  }
}

/**
 * Tool for piercing through Shadow DOM boundaries with Playwright's built-in support
 */
export class ShadowDomPiercingTool extends BrowserToolBase {
  async execute(args: any, context: ToolContext): Promise<ToolResponse> {
    return this.safeExecute(context, async (page) => {
      const { selector, action, value } = args;
      
      try {
        // Playwright automatically pierces through open shadow roots
        const locator = page.locator(selector);
        
        switch (action) {
          case 'click':
            await locator.click();
            break;
          case 'fill':
            await locator.fill(value);
            break;
          case 'getText':
            const text = await locator.textContent();
            return createSuccessResponse(`Text content: ${text}`);
          case 'getAttribute':
            const attr = await locator.getAttribute(value);
            return createSuccessResponse(`Attribute ${value}: ${attr}`);
          case 'hover':
            await locator.hover();
            break;
          case 'isVisible':
            const visible = await locator.isVisible();
            return createSuccessResponse(`Element visible: ${visible}`);
          case 'count':
            const count = await locator.count();
            return createSuccessResponse(`Element count: ${count}`);
          default:
            return createErrorResponse(`Unknown action: ${action}`);
        }
        
        return createSuccessResponse(`${action} performed successfully on shadow DOM element`);
      } catch (error) {
        return createErrorResponse(`Failed to interact with shadow DOM element: ${error instanceof Error ? error.message : String(error)}`);
      }
    });
  }
}
