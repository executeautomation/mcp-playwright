import { createToolDefinitions, BROWSER_TOOLS, API_TOOLS } from '../tools';

describe('Tool Definitions', () => {
  const toolDefinitions = createToolDefinitions();

  test('should return an array of tool definitions', () => {
    expect(Array.isArray(toolDefinitions)).toBe(true);
    expect(toolDefinitions.length).toBeGreaterThan(0);
  });

  test('each tool definition should have required properties', () => {
    toolDefinitions.forEach(tool => {
      expect(tool).toHaveProperty('name');
      expect(tool).toHaveProperty('description');
      expect(tool).toHaveProperty('inputSchema');
      expect(tool.inputSchema).toHaveProperty('type');
      expect(tool.inputSchema).toHaveProperty('properties');
    });
  });

  test('BROWSER_TOOLS should contain browser-related tool names', () => {
    expect(Array.isArray(BROWSER_TOOLS)).toBe(true);
    expect(BROWSER_TOOLS.length).toBeGreaterThan(0);
    
    BROWSER_TOOLS.forEach(toolName => {
      expect(toolDefinitions.some(tool => tool.name === toolName)).toBe(true);
    });
  });

  test('API_TOOLS should contain API-related tool names', () => {
    expect(Array.isArray(API_TOOLS)).toBe(true);
    expect(API_TOOLS.length).toBeGreaterThan(0);
    
    API_TOOLS.forEach(toolName => {
      expect(toolDefinitions.some(tool => tool.name === toolName)).toBe(true);
    });
  });

  test('should validate navigate tool schema', () => {
    const navigateTool = toolDefinitions.find(tool => tool.name === 'playwright_navigate');
    expect(navigateTool).toBeDefined();
    expect(navigateTool!.inputSchema.properties).toHaveProperty('url');
    expect(navigateTool!.inputSchema.properties).toHaveProperty('waitUntil');
    expect(navigateTool!.inputSchema.properties).toHaveProperty('timeout');
    expect(navigateTool!.inputSchema.properties).toHaveProperty('width');
    expect(navigateTool!.inputSchema.properties).toHaveProperty('height');
    expect(navigateTool!.inputSchema.properties).toHaveProperty('headless');
    expect(navigateTool!.inputSchema.required).toEqual(['url']);
  });

  test('should validate go_back tool schema', () => {
    const goBackTool = toolDefinitions.find(tool => tool.name === 'playwright_go_back');
    expect(goBackTool).toBeDefined();
    expect(goBackTool!.inputSchema.properties).toEqual({});
    expect(goBackTool!.inputSchema.required).toEqual([]);
  });

  test('should validate go_forward tool schema', () => {
    const goForwardTool = toolDefinitions.find(tool => tool.name === 'playwright_go_forward');
    expect(goForwardTool).toBeDefined();
    expect(goForwardTool!.inputSchema.properties).toEqual({});
    expect(goForwardTool!.inputSchema.required).toEqual([]);
  });

  test('should validate drag tool schema', () => {
    const dragTool = toolDefinitions.find(tool => tool.name === 'playwright_drag');
    expect(dragTool).toBeDefined();
    expect(dragTool!.inputSchema.properties).toHaveProperty('sourceSelector');
    expect(dragTool!.inputSchema.properties).toHaveProperty('targetSelector');
    expect(dragTool!.inputSchema.required).toEqual(['sourceSelector', 'targetSelector']);
  });

  test('should validate press_key tool schema', () => {
    const pressKeyTool = toolDefinitions.find(tool => tool.name === 'playwright_press_key');
    expect(pressKeyTool).toBeDefined();
    expect(pressKeyTool!.inputSchema.properties).toHaveProperty('key');
    expect(pressKeyTool!.inputSchema.properties).toHaveProperty('selector');
    expect(pressKeyTool!.inputSchema.required).toEqual(['key']);
  });

  test('should validate save_as_pdf tool schema', () => {
    const saveAsPdfTool = toolDefinitions.find(tool => tool.name === 'playwright_save_as_pdf');
    expect(saveAsPdfTool).toBeDefined();
    expect(saveAsPdfTool!.inputSchema.properties).toHaveProperty('outputPath');
    expect(saveAsPdfTool!.inputSchema.properties).toHaveProperty('filename');
    expect(saveAsPdfTool!.inputSchema.properties).toHaveProperty('format');
    expect(saveAsPdfTool!.inputSchema.properties).toHaveProperty('printBackground');
    expect(saveAsPdfTool!.inputSchema.properties).toHaveProperty('margin');
    expect(saveAsPdfTool!.inputSchema.required).toEqual(['outputPath']);
  });

  test('should validate upload_file tool schema', () => {
    const uploadFileTool = toolDefinitions.find(tool => tool.name === 'playwright_upload_file');
    expect(uploadFileTool).toBeDefined();
    expect(uploadFileTool!.inputSchema.properties).toHaveProperty('selector');
    expect(uploadFileTool!.inputSchema.properties).toHaveProperty('filePath');
    expect(uploadFileTool!.inputSchema.required).toEqual(['selector', 'filePath']);
  });

  test('should validate resize tool schema', () => {
    const resizeTool = toolDefinitions.find(tool => tool.name === 'playwright_resize');
    expect(resizeTool).toBeDefined();
    expect(resizeTool!.inputSchema.properties).toHaveProperty('width');
    expect(resizeTool!.inputSchema.properties).toHaveProperty('height');
    expect(resizeTool!.inputSchema.properties).toHaveProperty('device');
    expect(resizeTool!.inputSchema.properties).toHaveProperty('orientation');
    expect(resizeTool!.inputSchema.required).toEqual([]);
  });
}); 