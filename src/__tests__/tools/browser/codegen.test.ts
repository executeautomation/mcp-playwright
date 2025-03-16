import { CodeGeneratorTool } from '../../../tools/browser/codegen.js';
import { ToolContext } from '../../../tools/common/types.js';
import { Page } from 'playwright';
import { jest } from '@jest/globals';

// Mock server
const mockServer = {
  sendMessage: jest.fn(),
  notification: jest.fn()
};

// Mock context
const mockContext = {
  server: mockServer
} as ToolContext;

describe('CodeGeneratorTool', () => {
  let codeGeneratorTool: CodeGeneratorTool;

  beforeEach(() => {
    jest.clearAllMocks();
    codeGeneratorTool = new CodeGeneratorTool(mockServer);
  });

  test('should initialize with empty actions', () => {
    const result = codeGeneratorTool.execute({ name: 'test' }, mockContext);
    expect(result).resolves.toMatchObject({
      isError: false,
      content: [{
        text: expect.stringContaining('Generated Playwright test code:'),
        mime: 'text/plain'
      }]
    });
  });

  test('should add navigation action and generate code', async () => {
    codeGeneratorTool.addAction('playwright_navigate', { url: 'https://example.com' });
    
    const result = await codeGeneratorTool.execute({ name: 'test' }, mockContext);
    expect(result.content[0].text).toContain("await page.goto('https://example.com')");
  });

  test('should add click action and generate code', async () => {
    codeGeneratorTool.addAction('playwright_click', { selector: '#button' });
    
    const result = await codeGeneratorTool.execute({ name: 'test' }, mockContext);
    expect(result.content[0].text).toContain("await page.click('#button')");
  });

  test('should add fill action and generate code', async () => {
    codeGeneratorTool.addAction('playwright_fill', { selector: '#input', value: 'test value' });
    
    const result = await codeGeneratorTool.execute({ name: 'test' }, mockContext);
    expect(result.content[0].text).toContain("await page.fill('#input', 'test value')");
  });

  test('should add select action and generate code', async () => {
    codeGeneratorTool.addAction('playwright_select', { selector: '#select', value: 'option1' });
    
    const result = await codeGeneratorTool.execute({ name: 'test' }, mockContext);
    expect(result.content[0].text).toContain("await page.selectOption('#select', 'option1')");
  });

  test('should add hover action and generate code', async () => {
    codeGeneratorTool.addAction('playwright_hover', { selector: '#menu' });
    
    const result = await codeGeneratorTool.execute({ name: 'test' }, mockContext);
    expect(result.content[0].text).toContain("await page.hover('#menu')");
  });

  test('should add screenshot action and generate code', async () => {
    codeGeneratorTool.addAction('playwright_screenshot', { name: 'test-screenshot', fullPage: true });
    
    const result = await codeGeneratorTool.execute({ name: 'test' }, mockContext);
    expect(result.content[0].text).toContain("await page.screenshot({ path: 'test-screenshot.png', fullPage: true })");
  });

  test('should add screenshot action without fullPage and generate code', async () => {
    codeGeneratorTool.addAction('playwright_screenshot', { name: 'test-screenshot' });
    
    const result = await codeGeneratorTool.execute({ name: 'test' }, mockContext);
    expect(result.content[0].text).toContain("await page.screenshot({ path: 'test-screenshot.png' })");
  });

  test('should add evaluate action and generate code', async () => {
    codeGeneratorTool.addAction('playwright_evaluate', { script: 'window.scrollTo(0, 100)' });
    
    const result = await codeGeneratorTool.execute({ name: 'test' }, mockContext);
    expect(result.content[0].text).toContain("await page.evaluate(window.scrollTo(0, 100))");
  });

  test('should add iframe click action and generate code', async () => {
    codeGeneratorTool.addAction('playwright_iframe_click', { 
      iframeSelector: '#frame', 
      selector: '#button' 
    });
    
    const result = await codeGeneratorTool.execute({ name: 'test' }, mockContext);
    expect(result.content[0].text).toContain("await page.frameLocator('#frame').locator('#button').click()");
  });

  test('should add API request actions and generate code', async () => {
    codeGeneratorTool.addAction('playwright_get', { url: '/api/data' });
    codeGeneratorTool.addAction('playwright_post', { url: '/api/create', value: '{"data": "test"}' });
    codeGeneratorTool.addAction('playwright_put', { url: '/api/update', value: '{"data": "test"}' });
    codeGeneratorTool.addAction('playwright_patch', { url: '/api/patch', value: '{"data": "test"}' });
    codeGeneratorTool.addAction('playwright_delete', { url: '/api/delete' });
    
    const result = await codeGeneratorTool.execute({ name: 'test' }, mockContext);
    const code = result.content[0].text;
    
    expect(code).toContain("await page.request.get('/api/data')");
    expect(code).toContain("await page.request.post('/api/create', { data: {\"data\": \"test\"} })");
    expect(code).toContain("await page.request.put('/api/update', { data: {\"data\": \"test\"} })");
    expect(code).toContain("await page.request.patch('/api/patch', { data: {\"data\": \"test\"} })");
    expect(code).toContain("await page.request.delete('/api/delete')");
  });

  test('should handle unsupported action type', async () => {
    codeGeneratorTool.addAction('unsupported_action', { param: 'value' });
    
    const result = await codeGeneratorTool.execute({ name: 'test' }, mockContext);
    expect(result.content[0].text).toContain("// Unsupported action: unsupported_action");
  });

  test('should clear actions', async () => {
    codeGeneratorTool.addAction('playwright_navigate', { url: 'https://example.com' });
    codeGeneratorTool.clearActions();
    
    const result = await codeGeneratorTool.execute({ name: 'test' }, mockContext);
    expect(result.content[0].text).not.toContain("await page.goto('https://example.com')");
  });

  test('should generate complete test file structure', async () => {
    codeGeneratorTool.addAction('playwright_navigate', { url: 'https://example.com' });
    
    const result = await codeGeneratorTool.execute({ name: 'test' }, mockContext);
    const code = result.content[0].text;
    
    expect(code).toContain("import { test, expect } from '@playwright/test';");
    expect(code).toContain("test('Generated test from recorded actions', async ({ page }) => {");
    expect(code).toContain("});");
  });
}); 