
import { BrowserToolBase } from './base.js';
import { ToolContext, ToolResponse, createSuccessResponse, createErrorResponse } from '../common/types.js';

// Axe-core type definitions
interface AxeResults {
  violations: AxeViolation[];
  passes: AxePass[];
  incomplete: AxeIncomplete[];
  inapplicable: AxeInapplicable[];
}

interface AxeViolation {
  id: string;
  impact: string;
  tags: string[];
  description: string;
  help: string;
  helpUrl: string;
  nodes: AxeNode[];
}

interface AxePass {
  id: string;
  impact: string | null;
  tags: string[];
  description: string;
  help: string;
  helpUrl: string;
  nodes: AxeNode[];
}

interface AxeIncomplete {
  id: string;
  impact: string | null;
  tags: string[];
  description: string;
  help: string;
  helpUrl: string;
  nodes: AxeNode[];
}

interface AxeInapplicable {
  id: string;
  impact: string | null;
  tags: string[];
  description: string;
  help: string;
  helpUrl: string;
}

interface AxeNode {
  any: AxeCheck[];
  all: AxeCheck[];
  none: AxeCheck[];
  impact: string | null;
  html: string;
  target: string[];
}

interface AxeCheck {
  id: string;
  impact: string;
  message: string;
  data: any;
}

interface AxeError {
  error: string;
}

type AxeResult = AxeResults | AxeError;

// Extend Window interface for axe
declare global {
  interface Window {
    axe: {
      run: (context?: any, options?: any, callback?: (err: any, results: AxeResults) => void) => Promise<AxeResults>;
    };
  }
}

/**
 * Tool for accessibility testing using axe-core
 */
export class AccessibilityTestTool extends BrowserToolBase {
  async execute(args: any, context: ToolContext): Promise<ToolResponse> {
    return this.safeExecute(context, async (page) => {
      const { action, options } = args;
      
      try {
        // Inject axe-core if not already present
        await page.addScriptTag({
          url: 'https://unpkg.com/axe-core@4.8.2/axe.min.js'
        });
        
        switch (action) {
          case 'scan':
            const results = await page.evaluate((opts) => {
              return new Promise<AxeResult>((resolve) => {
                const config = {
                  include: opts?.include ? [opts.include] : undefined,
                  exclude: opts?.exclude ? [opts.exclude] : undefined
                };
                
                const axeOptions = {
                  tags: opts?.tags || ['wcag2a', 'wcag2aa'],
                  rules: opts?.rules || {}
                };
                
                if (opts?.disableRules) {
                  opts.disableRules.forEach((rule: string) => {
                    axeOptions.rules[rule] = { enabled: false };
                  });
                }
                
                (window as any).axe.run(config, axeOptions, (err: any, results: AxeResults) => {
                  if (err) {
                    resolve({ error: (err as Error).message });
                  } else {
                    resolve(results);
                  }
                });
              });
            }, options);
            
            if ('error' in results) {
              return createErrorResponse(`Accessibility scan failed: ${results.error}`);
            }
            
            const summary = {
              violations: results.violations.length,
              passes: results.passes.length,
              incomplete: results.incomplete.length,
              inapplicable: results.inapplicable.length
            };
            
            return createSuccessResponse([
              'Accessibility Scan Results:',
              `Violations: ${summary.violations}`,
              `Passes: ${summary.passes}`,
              `Incomplete: ${summary.incomplete}`,
              `Inapplicable: ${summary.inapplicable}`,
              '',
              'Detailed Results:',
              JSON.stringify(results, null, 2)
            ]);
            
          case 'checkElement':
            const elementResults = await page.evaluate((selector) => {
              return new Promise<AxeResult>((resolve) => {
                const element = document.querySelector(selector);
                if (!element) {
                  resolve({ error: 'Element not found' });
                  return;
                }
                
                (window as any).axe.run(element, (err: any, results: AxeResults) => {
                  if (err) {
                    resolve({ error: (err as Error).message });
                  } else {
                    resolve(results);
                  }
                });
              });
            }, options?.selector);
            
            if ('error' in elementResults) {
              return createErrorResponse(`Element accessibility check failed: ${elementResults.error}`);
            }
            
            return createSuccessResponse([
              `Accessibility check for element: ${options?.selector}`,
              `Violations: ${elementResults.violations.length}`,
              JSON.stringify(elementResults, null, 2)
            ]);
            
          default:
            return createErrorResponse(`Unknown accessibility action: ${action}`);
        }
      } catch (error) {
        return createErrorResponse(`Accessibility test failed: ${(error as Error).message}`);
      }
    });
  }
}

/**
 * Tool for accessibility tree analysis
 */
export class AccessibilityTreeTool extends BrowserToolBase {
  async execute(args: any, context: ToolContext): Promise<ToolResponse> {
    return this.safeExecute(context, async (page) => {
      const { action, selector } = args;
      
      try {
        switch (action) {
          case 'getTree':
            const tree = await page.accessibility.snapshot({
              root: selector ? await page.locator(selector).elementHandle() : undefined
            });
            
            return createSuccessResponse([
              'Accessibility Tree:',
              JSON.stringify(tree, null, 2)
            ]);
            
          case 'findByRole':
            const { role, name } = args;
            const elements = await page.evaluate(({ role, name }) => {
              const elements = [];
              const walker = document.createTreeWalker(
                document.body,
                NodeFilter.SHOW_ELEMENT,
                null
              );
              
              let node;
              while (node = walker.nextNode()) {
                const element = node as Element;
                const computedRole = element.getAttribute('role') || 
                  getImplicitRole(element);
                
                if (computedRole === role) {
                  const accessibleName = getAccessibleName(element);
                  if (!name || accessibleName.includes(name)) {
                    elements.push({
                      tagName: element.tagName.toLowerCase(),
                      role: computedRole,
                      name: accessibleName,
                      selector: generateSelector(element)
                    });
                  }
                }
              }
              
              function getImplicitRole(element: Element) {
                const tagName = element.tagName.toLowerCase();
                const type = (element as HTMLInputElement).type;
                
                const roleMap = {
                  'button': 'button',
                  'a': (element as HTMLAnchorElement).href ? 'link' : null,
                  'input': type === 'button' ? 'button' : 
                          type === 'checkbox' ? 'checkbox' :
                          type === 'radio' ? 'radio' : 'textbox',
                  'textarea': 'textbox',
                  'select': 'combobox',
                  'h1': 'heading',
                  'h2': 'heading',
                  'h3': 'heading',
                  'h4': 'heading',
                  'h5': 'heading',
                  'h6': 'heading',
                  'img': 'img',
                  'nav': 'navigation',
                  'main': 'main',
                  'header': 'banner',
                  'footer': 'contentinfo'
                };
                
                return roleMap[tagName] || null;
              }
              
              function getAccessibleName(element: Element) {
                // Simplified accessible name calculation
                const ariaLabel = element.getAttribute('aria-label');
                if (ariaLabel) return ariaLabel;
                
                const ariaLabelledby = element.getAttribute('aria-labelledby');
                if (ariaLabelledby) {
                  const labelElement = document.getElementById(ariaLabelledby);
                  if (labelElement) return labelElement.textContent?.trim() || '';
                }
                
                if (element.tagName.toLowerCase() === 'input') {
                  const label = document.querySelector(`label[for="${element.id}"]`);
                  if (label) return label.textContent?.trim() || '';
                }
                
                return element.textContent?.trim() || '';
              }
              
              function generateSelector(element: Element) {
                if (element.id) return `#${element.id}`;
                
                let selector = element.tagName.toLowerCase();
                if (element.className) {
                  selector += '.' + element.className.split(' ').join('.');
                }
                return selector;
              }
              
              return elements;
            }, { role, name });
            
            return createSuccessResponse([
              `Found ${elements.length} elements with role "${role}":`,
              JSON.stringify(elements, null, 2)
            ]);
            
          default:
            return createErrorResponse(`Unknown accessibility tree action: ${action}`);
        }
      } catch (error) {
        return createErrorResponse(`Accessibility tree operation failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    });
  }
}

/**
 * Tool for keyboard navigation testing
 */
export class KeyboardNavigationTool extends BrowserToolBase {
  async execute(args: any, context: ToolContext): Promise<ToolResponse> {
    return this.safeExecute(context, async (page) => {
      const { action, options } = args;
      
      try {
        switch (action) {
          case 'tabSequence':
            const tabSequence = await page.evaluate(() => {
              const focusableElements = [];
              const walker = document.createTreeWalker(
                document.body,
                NodeFilter.SHOW_ELEMENT,
                {
                  acceptNode: (node) => {
                    const element = node as HTMLElement;
                    const tabIndex = element.tabIndex;
                    const isVisible = element.offsetParent !== null;
                    const isFocusable = tabIndex >= 0 || 
                      ['input', 'button', 'select', 'textarea', 'a'].includes(element.tagName.toLowerCase());
                    
                    return (isFocusable && isVisible) ? 
                      NodeFilter.FILTER_ACCEPT : 
                      NodeFilter.FILTER_SKIP;
                  }
                }
              );
              
              let node;
              while (node = walker.nextNode()) {
                const element = node as HTMLElement;
                focusableElements.push({
                  tagName: element.tagName.toLowerCase(),
                  id: element.id || null,
                  className: element.className || null,
                  tabIndex: element.tabIndex,
                  textContent: element.textContent?.trim().substring(0, 50) || null,
                  selector: element.id ? `#${element.id}` : 
                    `${element.tagName.toLowerCase()}${element.className ? '.' + element.className.split(' ').join('.') : ''}`
                });
              }
              
              return focusableElements;
            });
            
            return createSuccessResponse([
              `Tab sequence contains ${tabSequence.length} focusable elements:`,
              JSON.stringify(tabSequence, null, 2)
            ]);
            
          case 'testTabNavigation':
            const navigationResults = await page.evaluate(() => {
              const results = [];
              const focusableElements = document.querySelectorAll(
                'input, button, select, textarea, a[href], [tabindex]:not([tabindex="-1"])'
              );
              
              let currentIndex = 0;
              
              function simulateTab() {
                if (currentIndex < focusableElements.length) {
                  const element = focusableElements[currentIndex] as HTMLElement;
                  (element as any).focus();
                  
                  results.push({
                    index: currentIndex,
                    tagName: element.tagName.toLowerCase(),
                    id: element.id || null,
                    focused: document.activeElement === element,
                    visible: element.offsetParent !== null
                  });
                  
                  currentIndex++;
                  return true;
                }
                return false;
              }
              
              // Simulate tab navigation
              while (simulateTab()) {
                // Continue until all elements are tested
              }
              
              return results;
            });
            
            return createSuccessResponse([
              'Tab navigation test results:',
              JSON.stringify(navigationResults, null, 2)
            ]);
            
          case 'checkFocusTraps':
            // Test for focus traps in modals/dialogs
            const focusTrapResults = await page.evaluate(() => {
              const modals = document.querySelectorAll('[role="dialog"], .modal, .popup');
              const results = [];
              
              modals.forEach((modal, index) => {
                const focusableInModal = modal.querySelectorAll(
                  'input, button, select, textarea, a[href], [tabindex]:not([tabindex="-1"])'
                );
                
                results.push({
                  modalIndex: index,
                  modalSelector: modal.className ? `.${modal.className.split(' ').join('.')}` : modal.tagName.toLowerCase(),
                  focusableElements: focusableInModal.length,
                  hasFocusTrap: focusableInModal.length > 0
                });
              });
              
              return results;
            });
            
            return createSuccessResponse([
              'Focus trap analysis:',
              JSON.stringify(focusTrapResults, null, 2)
            ]);
            
          default:
            return createErrorResponse(`Unknown keyboard navigation action: ${action}`);
        }
      } catch (error) {
        return createErrorResponse(`Keyboard navigation test failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    });
  }
}
