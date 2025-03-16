import { BrowserToolBase } from './base.js';
import type { ToolResponse } from '../common/types.js';
import type { ToolContext } from '../common/types.js';

interface Action {
  type: string;
  params: Record<string, any>;
  timestamp: number;
}

export class CodeGeneratorTool extends BrowserToolBase {
  private actions: Action[] = [];

  public addAction(type: string, params: Record<string, any>) {
    this.actions.push({
      type,
      params,
      timestamp: Date.now()
    });
  }

  private generateTestCode(): string {
    const imports = `import { test, expect } from '@playwright/test';\n\n`;
    
    const testCase = `test('Generated test from recorded actions', async ({ page }) => {
${this.generateActionCode()}
});\n`;

    return imports + testCase;
  }

  private generateActionCode(): string {
    return this.actions.map(action => {
      switch (action.type) {
        case 'playwright_navigate':
          return `  await page.goto('${action.params.url}');`;
        case 'playwright_click':
          return `  await page.click('${action.params.selector}');`;
        case 'playwright_fill':
          return `  await page.fill('${action.params.selector}', '${action.params.value}');`;
        case 'playwright_select':
          return `  await page.selectOption('${action.params.selector}', '${action.params.value}');`;
        case 'playwright_hover':
          return `  await page.hover('${action.params.selector}');`;
        case 'playwright_screenshot':
          return `  await page.screenshot({ path: '${action.params.name}.png'${action.params.fullPage ? ', fullPage: true' : ''} });`;
        case 'playwright_evaluate':
          return `  await page.evaluate(${action.params.script});`;
        case 'playwright_iframe_click':
          return `  await page.frameLocator('${action.params.iframeSelector}').locator('${action.params.selector}').click();`;
        case 'playwright_get':
          return `  await page.request.get('${action.params.url}');`;
        case 'playwright_post':
          return `  await page.request.post('${action.params.url}', { data: ${action.params.value} });`;
        case 'playwright_put':
          return `  await page.request.put('${action.params.url}', { data: ${action.params.value} });`;
        case 'playwright_patch':
          return `  await page.request.patch('${action.params.url}', { data: ${action.params.value} });`;
        case 'playwright_delete':
          return `  await page.request.delete('${action.params.url}');`;
        default:
          return `  // Unsupported action: ${action.type}`;
      }
    }).join('\n');
  }

  async execute(args: { name: string }, context: ToolContext): Promise<ToolResponse> {
    const testCode = this.generateTestCode();
    
    return {
      isError: false,
      content: [
        {
          text: `Generated Playwright test code:\n\n${testCode}`,
          mime: 'text/plain'
        }
      ]
    };
  }

  clearActions() {
    this.actions = [];
  }
} 