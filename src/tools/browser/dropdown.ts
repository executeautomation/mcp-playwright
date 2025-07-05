
import { BrowserToolBase } from './base.js';
import { ToolContext, ToolResponse, createSuccessResponse, createErrorResponse } from '../common/types.js';

/**
 * Enhanced tool for advanced dropdown interactions
 */
export class AdvancedDropdownTool extends BrowserToolBase {
  async execute(args: any, context: ToolContext): Promise<ToolResponse> {
    return this.safeExecute(context, async (page) => {
      const { selector, action, options } = args;
      
      try {
        const locator = page.locator(selector);
        await locator.waitFor({ state: 'visible' });
        
        switch (action) {
          case 'selectByValue':
            await locator.selectOption({ value: options.value });
            break;
          case 'selectByLabel':
            await locator.selectOption({ label: options.label });
            break;
          case 'selectByIndex':
            await locator.selectOption({ index: options.index });
            break;
          case 'selectMultiple':
            await locator.selectOption(options.values);
            break;
          case 'getOptions':
            const optionElements = await locator.locator('option').all();
            const optionsData = [];
            for (const option of optionElements) {
              const value = await option.getAttribute('value');
              const text = await option.textContent();
              const selected = await option.getAttribute('selected');
              optionsData.push({
                value: value,
                text: text?.trim(),
                selected: selected !== null
              });
            }
            return createSuccessResponse([
              `Found ${optionsData.length} options:`,
              JSON.stringify(optionsData, null, 2)
            ]);
          case 'getSelectedOptions':
            const selectedOptions = await locator.locator('option[selected]').all();
            const selectedData = [];
            for (const option of selectedOptions) {
              const value = await option.getAttribute('value');
              const text = await option.textContent();
              selectedData.push({ value, text: text?.trim() });
            }
            return createSuccessResponse([
              `Selected options:`,
              JSON.stringify(selectedData, null, 2)
            ]);
          case 'clearSelection':
            // For multiple select, deselect all options
            const allOptions = await locator.locator('option').all();
            for (const option of allOptions) {
              await option.evaluate(el => (el as HTMLOptionElement).selected = false);
            }
            break;
          default:
            return createErrorResponse(`Unknown action: ${action}`);
        }
        
        return createSuccessResponse(`Dropdown ${action} completed successfully`);
      } catch (error) {
        return createErrorResponse(`Dropdown operation failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    });
  }
}

/**
 * Tool for custom dropdown interactions (non-select elements)
 */
export class CustomDropdownTool extends BrowserToolBase {
  async execute(args: any, context: ToolContext): Promise<ToolResponse> {
    return this.safeExecute(context, async (page) => {
      const { triggerSelector, optionSelector, optionText, waitForOptions } = args;
      
      try {
        // Click to open dropdown
        await page.locator(triggerSelector).click();
        
        // Wait for options to appear
        if (waitForOptions) {
          await page.waitForSelector(optionSelector, { timeout: 5000 });
        }
        
        // Find and click the desired option
        if (optionText) {
          // Select by text content
          const option = page.locator(optionSelector).filter({ hasText: optionText });
          await option.click();
        } else {
          // Click first available option
          await page.locator(optionSelector).first().click();
        }
        
        return createSuccessResponse(`Custom dropdown option selected: ${optionText || 'first option'}`);
      } catch (error) {
        return createErrorResponse(`Custom dropdown interaction failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    });
  }
}

/**
 * Tool for analyzing dropdown structure and options
 */
export class DropdownAnalyzerTool extends BrowserToolBase {
  async execute(args: any, context: ToolContext): Promise<ToolResponse> {
    return this.safeExecute(context, async (page) => {
      const { selector } = args;
      
      try {
        const dropdownInfo = await page.evaluate((sel) => {
          const element = document.querySelector(sel);
          if (!element) {
            return { error: 'Dropdown element not found' };
          }
          
          const info = {
            tagName: element.tagName.toLowerCase(),
            type: element.type || null,
            multiple: element.multiple || false,
            disabled: element.disabled || false,
            required: element.required || false,
            size: element.size || null,
            options: []
          };
          
          if (element.tagName.toLowerCase() === 'select') {
            // Standard select element
            const options = Array.from(element.options);
            info.options = options.map((option: HTMLOptionElement, index) => ({
              index,
              value: option.value,
              text: option.text,
              selected: option.selected,
              disabled: option.disabled,
              label: option.label || null
            }));
          } else {
            // Custom dropdown - try to find options
            const possibleOptions = element.querySelectorAll('[role="option"], .option, .dropdown-item, li');
            info.options = Array.from(possibleOptions).map((option: Element, index) => ({
              index,
              text: option.textContent?.trim(),
              value: option.getAttribute('data-value') || option.getAttribute('value'),
              selected: option.getAttribute('aria-selected') === 'true' || option.classList.contains('selected'),
              disabled: option.getAttribute('aria-disabled') === 'true' || option.classList.contains('disabled')
            }));
          }
          
          return info;
        }, selector);
        
        if ('error' in dropdownInfo) {
          return createErrorResponse(dropdownInfo.error);
        }
        
        return createSuccessResponse([
          `Dropdown Analysis for: ${selector}`,
          `Type: ${dropdownInfo.tagName}`,
          `Multiple: ${dropdownInfo.multiple}`,
          `Options count: ${dropdownInfo.options.length}`,
          `Options:`,
          JSON.stringify(dropdownInfo.options, null, 2)
        ]);
      } catch (error) {
        return createErrorResponse(`Dropdown analysis failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    });
  }
}
