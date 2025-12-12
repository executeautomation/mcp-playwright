import { VisibleTextTool, VisibleHtmlTool } from '../../../tools/browser/visiblePage.js';
import { ToolContext } from '../../../tools/common/types.js';
import { Page, Browser, ElementHandle } from 'playwright';
import { jest } from '@jest/globals';

// Mock the Page object
const mockEvaluate = jest.fn() as jest.MockedFunction<(pageFunction: Function | string, arg?: any) => Promise<any>>;
const mockContent = jest.fn();
const mockIsClosed = jest.fn().mockReturnValue(false);
const mock$ = jest.fn() as jest.MockedFunction<(selector: string) => Promise<ElementHandle | null>>;

const mockPage = {
  evaluate: mockEvaluate,
  content: mockContent,
  isClosed: mockIsClosed,
  $: mock$
} as unknown as Page;

// Mock the browser
const mockIsConnected = jest.fn().mockReturnValue(true);
const mockBrowser = {
  isConnected: mockIsConnected
} as unknown as Browser;

// Mock the server
const mockServer = {
  sendMessage: jest.fn()
};

// Mock context
const mockContext = {
  page: mockPage,
  browser: mockBrowser,
  server: mockServer
} as ToolContext;

describe('VisibleTextTool', () => {
  let visibleTextTool: VisibleTextTool;

  beforeEach(() => {
    jest.clearAllMocks();
    visibleTextTool = new VisibleTextTool(mockServer);
    // Reset mocks
    mockIsConnected.mockReturnValue(true);
    mockIsClosed.mockReturnValue(false);
    mockEvaluate.mockImplementation(() => Promise.resolve('Sample visible text content'));
  });

  test('should retrieve visible text content', async () => {
    const args = {};

    const result = await visibleTextTool.execute(args, mockContext);

    expect(mockEvaluate).toHaveBeenCalled();
    expect(result.isError).toBe(false);
    expect(result.content[0].type).toBe('text');
    if (result.content[0].type === 'text') {
      expect(result.content[0].text).toContain('Visible text content');
      expect(result.content[0].text).toContain('Sample visible text content');
    }
  });

  test('should handle missing page', async () => {
    const args = {};

    // Context with browser but without page
    const contextWithoutPage = {
      browser: mockBrowser,
      server: mockServer
    } as unknown as ToolContext;

    const result = await visibleTextTool.execute(args, contextWithoutPage);

    expect(mockEvaluate).not.toHaveBeenCalled();
    expect(result.isError).toBe(true);
    expect(result.content[0].type).toBe('text');
    if (result.content[0].type === 'text') {
      expect(result.content[0].text).toContain('Page is not available');
    }
  });
  
  test('should handle disconnected browser', async () => {
    const args = {};
    
    // Mock disconnected browser
    mockIsConnected.mockReturnValueOnce(false);
    
    const result = await visibleTextTool.execute(args, mockContext);
    
    expect(mockEvaluate).not.toHaveBeenCalled();
    expect(result.isError).toBe(true);
    expect(result.content[0].type).toBe('text');
    if (result.content[0].type === 'text') {
      expect(result.content[0].text).toContain('Browser is not connected');
    }
  });
  
  test('should handle closed page', async () => {
    const args = {};
    
    // Mock closed page
    mockIsClosed.mockReturnValueOnce(true);
    
    const result = await visibleTextTool.execute(args, mockContext);
    
    expect(mockEvaluate).not.toHaveBeenCalled();
    expect(result.isError).toBe(true);
    expect(result.content[0].type).toBe('text');
    if (result.content[0].type === 'text') {
      expect(result.content[0].text).toContain('Page is not available or has been closed');
    }
  });

  test('should handle evaluation errors', async () => {
    const args = {};

    // Mock evaluation error
    mockEvaluate.mockImplementationOnce(() => Promise.reject(new Error('Evaluation failed')));

    const result = await visibleTextTool.execute(args, mockContext);

    expect(mockEvaluate).toHaveBeenCalled();
    expect(result.isError).toBe(true);
    expect(result.content[0].type).toBe('text');
    if (result.content[0].type === 'text') {
      expect(result.content[0].text).toContain('Failed to get visible text content');
      expect(result.content[0].text).toContain('Evaluation failed');
    }
  });
});

describe('VisibleHtmlTool', () => {
  let visibleHtmlTool: VisibleHtmlTool;

  beforeEach(() => {
    jest.clearAllMocks();
    visibleHtmlTool = new VisibleHtmlTool(mockServer);
    // Reset mocks
    mockIsConnected.mockReturnValue(true);
    mockIsClosed.mockReturnValue(false);
    mockContent.mockImplementation(() => Promise.resolve('<html><body>Sample HTML content</body></html>'));
  });

  test('should retrieve HTML content', async () => {
    const args = { removeScripts: false };

    const result = await visibleHtmlTool.execute(args, mockContext);

    expect(mockContent).toHaveBeenCalled();
    expect(result.isError).toBe(false);
    expect(result.content[0].type).toBe('text');
    if (result.content[0].type === 'text') {
      expect(result.content[0].text).toContain('HTML content');
      expect(result.content[0].text).toContain('<html><body>Sample HTML content</body></html>');
    }
  });

  test('should supply the correct filters', async () => {
    const args = {
      removeScripts: true,
      removeComments: true,
      removeStyles: true,
      removeMeta: true,
      minify: true,
      cleanHtml: true
    };

    // Mock the page.evaluate to capture the filter arguments
    mockEvaluate.mockImplementationOnce((callback, params) => {
      expect(params).toEqual({
        html: '<html><body>Sample HTML content</body></html>',
        removeScripts: true,
        removeComments: true,
        removeStyles: true,
        removeMeta: true,
        minify: true
      });
      return Promise.resolve('<html><body>Processed HTML content</body></html>');
    });

    const result = await visibleHtmlTool.execute(args, mockContext);

    expect(mockContent).toHaveBeenCalled();
    expect(mockEvaluate).toHaveBeenCalled();
    expect(result.isError).toBe(false);
    expect(result.content[0].type).toBe('text');
    if (result.content[0].type === 'text') {
      expect(result.content[0].text).toContain('HTML content');
      expect(result.content[0].text).toContain('Processed HTML content');
    }
  });

  test('should handle individual filter combinations', async () => {
    const args = {
      removeScripts: true,
      minify: true
    };

    // Mock content to return HTML
    mockContent.mockImplementationOnce(() =>
      Promise.resolve('<html><body>Sample HTML content</body></html>')
    );

    mockEvaluate.mockImplementationOnce((callback, params: any) => {
      expect(params).toEqual({
        html: '<html><body>Sample HTML content</body></html>',
        removeScripts: true,
        removeComments: undefined,
        removeStyles: undefined,
        removeMeta: undefined,
        minify: true
      });
      return Promise.resolve('<html><body>Filtered content</body></html>');
    });

    const result = await visibleHtmlTool.execute(args, mockContext);
    expect(result.isError).toBe(false);
    expect(result.content[0].type).toBe('text');
    if (result.content[0].type === 'text') {
      expect(result.content[0].text).toContain('Filtered content');
    }
  });

  test('should handle selector parameter', async () => {
    const args = {
      selector: '#main-content',
      removeScripts: true
    };

    // Mock element selection
    const mockElement = {
      outerHTML: '<div id="main-content">Selected content</div>'
    } as unknown as ElementHandle<Element>;
    mock$.mockResolvedValueOnce(mockElement);

    // Mock evaluate for filtering
    mockEvaluate.mockImplementation((_: any, params: any) => 
      Promise.resolve('<div>Processed selected content</div>')
    );

    const result = await visibleHtmlTool.execute(args, mockContext);
    expect(mock$).toHaveBeenCalledWith('#main-content');
    expect(result.isError).toBe(false);
    expect(result.content[0].type).toBe('text');
    if (result.content[0].type === 'text') {
      expect(result.content[0].text).toContain('Processed selected content');
    }
  });

  test('should handle empty HTML content', async () => {
    const args = {
      removeScripts: true
    };

    // Mock content to return empty HTML
    mockContent.mockImplementationOnce(() => Promise.resolve(''));

    mockEvaluate.mockImplementationOnce((callback, params: any) => {
      expect(params.html).toBe('');
      return Promise.resolve('');
    });

    const result = await visibleHtmlTool.execute(args, mockContext);
    expect(result.isError).toBe(false);
    expect(result.content[0].type).toBe('text');
    if (result.content[0].type === 'text') {
      expect(result.content[0].text).toContain('HTML content');
    }
  });

  test('should handle cleanHtml flag setting all filters', async () => {
    const args = {
      cleanHtml: true
    };

    mockEvaluate.mockImplementationOnce((callback, params) => {
      expect(params).toEqual({
        html: '<html><body>Sample HTML content</body></html>',
        removeScripts: true,
        removeComments: true,
        removeStyles: true,
        removeMeta: true,
        minify: undefined
      });
      return Promise.resolve('<html><body>Processed HTML content</body></html>');
    });

    const result = await visibleHtmlTool.execute(args, mockContext);
    expect(result.isError).toBe(false);
  });

  test('should handle missing page', async () => {
    const args = {};

    // Context with browser but without page
    const contextWithoutPage = {
      browser: mockBrowser,
      server: mockServer
    } as unknown as ToolContext;

    const result = await visibleHtmlTool.execute(args, contextWithoutPage);

    expect(mockContent).not.toHaveBeenCalled();
    expect(result.isError).toBe(true);
    expect(result.content[0].type).toBe('text');
    if (result.content[0].type === 'text') {
      expect(result.content[0].text).toContain('Page is not available');
    }
  });
  
  test('should handle disconnected browser', async () => {
    const args = {};
    
    // Mock disconnected browser
    mockIsConnected.mockReturnValueOnce(false);
    
    const result = await visibleHtmlTool.execute(args, mockContext);
    
    expect(mockContent).not.toHaveBeenCalled();
    expect(result.isError).toBe(true);
    expect(result.content[0].type).toBe('text');
    if (result.content[0].type === 'text') {
      expect(result.content[0].text).toContain('Browser is not connected');
    }
  });
  
  test('should handle closed page', async () => {
    const args = {};
    
    // Mock closed page
    mockIsClosed.mockReturnValueOnce(true);
    
    const result = await visibleHtmlTool.execute(args, mockContext);
    
    expect(mockContent).not.toHaveBeenCalled();
    expect(result.isError).toBe(true);
    expect(result.content[0].type).toBe('text');
    if (result.content[0].type === 'text') {
      expect(result.content[0].text).toContain('Page is not available or has been closed');
    }
  });

  test('should handle content retrieval errors', async () => {
    const args = {};

    // Mock content error
    mockContent.mockImplementationOnce(() => Promise.reject(new Error('Content retrieval failed')));

    const result = await visibleHtmlTool.execute(args, mockContext);

    expect(mockContent).toHaveBeenCalled();
    expect(result.isError).toBe(true);
    expect(result.content[0].type).toBe('text');
    if (result.content[0].type === 'text') {
      expect(result.content[0].text).toContain('Failed to get visible HTML content');
      expect(result.content[0].text).toContain('Content retrieval failed');
    }
  });
});