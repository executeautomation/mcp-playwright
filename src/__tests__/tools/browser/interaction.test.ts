import { ClickTool,ClickAndSwitchTabTool, FillTool, SelectTool, HoverTool, EvaluateTool, IframeClickTool, UploadFileTool } from '../../../tools/browser/interaction.js';
import { NavigationTool } from '../../../tools/browser/navigation.js';
import { ToolContext } from '../../../tools/common/types.js';
import { Page, Browser } from 'playwright';
import { jest } from '@jest/globals';

// Mock page functions
const mockPageClick = jest.fn().mockImplementation(() => Promise.resolve());
const mockPageFill = jest.fn().mockImplementation(() => Promise.resolve());
const mockPageSelectOption = jest.fn().mockImplementation(() => Promise.resolve());
const mockPageHover = jest.fn().mockImplementation(() => Promise.resolve());
const mockPageSetInputFiles = jest.fn().mockImplementation(() => Promise.resolve());
const mockPageWaitForSelector = jest.fn().mockImplementation(() => Promise.resolve());
const mockWaitForEvent = jest.fn().mockImplementation(() => Promise.resolve(mockNewPage));
const mockWaitForLoadState = jest.fn().mockImplementation(() => Promise.resolve());
const mockBringToFront = jest.fn().mockImplementation(() => Promise.resolve());
const mockUrl = jest.fn().mockReturnValue('https://example.com');

// Mock new page
const mockNewPage = {
  waitForLoadState: mockWaitForLoadState,
  bringToFront: mockBringToFront,
  url: mockUrl,
} as unknown as Page;



// Mock locator functions
const mockLocatorClick = jest.fn().mockImplementation(() => Promise.resolve());
const mockLocatorFill = jest.fn().mockImplementation(() => Promise.resolve());
const mockLocatorSelectOption = jest.fn().mockImplementation(() => Promise.resolve());
const mockLocatorHover = jest.fn().mockImplementation(() => Promise.resolve());
const mockLocatorUploadFile = jest.fn().mockImplementation(() => Promise.resolve());

// Mock locator
const mockLocator = jest.fn().mockReturnValue({
  click: mockLocatorClick,
  fill: mockLocatorFill,
  selectOption: mockLocatorSelectOption,
  hover: mockLocatorHover,
  uploadFile: mockLocatorUploadFile
});

// Mock iframe locator
const mockIframeLocator = jest.fn().mockReturnValue({
  click: mockLocatorClick
});

// Mock frame locator
const mockFrameLocator = jest.fn().mockReturnValue({
  locator: mockIframeLocator
});

// Mock evaluate function
const mockEvaluate = jest.fn().mockImplementation(() => Promise.resolve('test-result'));

// Mock the Page object with proper typing
const mockGoto = jest.fn().mockImplementation(() => Promise.resolve());
const mockIsClosed = jest.fn().mockReturnValue(false);

const mockPage = {
  click: mockPageClick,
  fill: mockPageFill,
  selectOption: mockPageSelectOption,
  hover: mockPageHover,
  setInputFiles: mockPageSetInputFiles,
  waitForSelector: mockPageWaitForSelector,
  locator: mockLocator,
  frameLocator: mockFrameLocator,
  evaluate: mockEvaluate,
  goto: mockGoto,
  isClosed: mockIsClosed,
  context: jest.fn(() => ({
    waitForEvent: mockWaitForEvent,
  })),
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

describe('Browser Interaction Tools', () => {
  let clickTool: ClickTool;
  let fillTool: FillTool;
  let selectTool: SelectTool;
  let hoverTool: HoverTool;
  let evaluateTool: EvaluateTool;
  let iframeClickTool: IframeClickTool;
  let clickAndSwitchTabTool: ClickAndSwitchTabTool;
  let uploadFileTool: UploadFileTool;

  beforeEach(() => {
    jest.clearAllMocks();
    clickTool = new ClickTool(mockServer);
    fillTool = new FillTool(mockServer);
    selectTool = new SelectTool(mockServer);
    hoverTool = new HoverTool(mockServer);
    evaluateTool = new EvaluateTool(mockServer);
    iframeClickTool = new IframeClickTool(mockServer);
    clickAndSwitchTabTool = new ClickAndSwitchTabTool(mockServer);
    uploadFileTool = new UploadFileTool(mockServer);
  });

  describe('ClickTool', () => {
    test('should click an element', async () => {
      const args = {
        selector: '#test-button'
      };

      const result = await clickTool.execute(args, mockContext);

      // The actual implementation uses page.click directly, not locator
      expect(mockPageClick).toHaveBeenCalledWith('#test-button');
      expect(result.isError).toBe(false);
      expect(result.content[0].type).toBe('text');
      if (result.content[0].type === 'text') {
        expect(result.content[0].text).toContain('Clicked element');
      }
    });

    test('should handle click errors', async () => {
      const args = {
        selector: '#test-button'
      };

      // Mock a click error
      mockPageClick.mockImplementationOnce(() => Promise.reject(new Error('Click failed')));

      const result = await clickTool.execute(args, mockContext);

      expect(mockPageClick).toHaveBeenCalledWith('#test-button');
      expect(result.isError).toBe(true);
      expect(result.content[0].type).toBe('text');
      if (result.content[0].type === 'text') {
        expect(result.content[0].text).toContain('Operation failed');
      }
    });

    test('should handle missing page', async () => {
      const args = {
        selector: '#test-button'
      };

      const result = await clickTool.execute(args, { server: mockServer } as ToolContext);

      expect(mockPageClick).not.toHaveBeenCalled();
      expect(result.isError).toBe(true);
      expect(result.content[0].type).toBe('text');
      if (result.content[0].type === 'text') {
        expect(result.content[0].text).toContain('Browser page not initialized');
      }
    });
  });

  describe('ClickAndSwitchTabTool', () => {
    test('should click a link and switch to the new tab', async () => {
      const args = { 
        selector: 'a#test-link',
      };
  
      const result = await clickAndSwitchTabTool.execute(args, mockContext);
  
      expect(mockPageClick).toHaveBeenCalledWith('a#test-link');
      expect(mockWaitForEvent).toHaveBeenCalledWith('page');
      expect(mockWaitForLoadState).toHaveBeenCalledWith('domcontentloaded');
      expect(result.isError).toBe(false);
      expect(result.content[0].type).toBe('text');
      if (result.content[0].type === 'text') {
        expect(result.content[0].text).toContain('Clicked link and switched to new tab');
        expect(result.content[0].text).toContain('https://example.com');
      }
    });
  
    test('should handle errors during click', async () => {
      const args = {
        selector: 'a#test-link',
      };
  
      // Mock a click error
      mockPageClick.mockImplementationOnce(() => Promise.reject(new Error('Click failed')));
  
      const result = await clickAndSwitchTabTool.execute(args, mockContext);
  
      expect(mockPageClick).toHaveBeenCalledWith('a#test-link');
      expect(result.isError).toBe(true);
      expect(result.content[0].type).toBe('text');
      if (result.content[0].type === 'text') {
        expect(result.content[0].text).toContain('Operation failed');
      }
    });
  
    test('should handle errors during new tab opening', async () => {
      const args = {
        selector: 'a#test-link',
      };
  
      // Mock an error during waitForEvent
      mockWaitForEvent.mockImplementationOnce(() => Promise.reject(new Error('New tab failed to open')));
  
      const result = await clickAndSwitchTabTool.execute(args, mockContext);
  
      expect(mockPageClick).toHaveBeenCalledWith('a#test-link');
      expect(mockWaitForEvent).toHaveBeenCalledWith('page');
      expect(result.isError).toBe(true);
      expect(result.content[0].type).toBe('text');
      if (result.content[0].type === 'text') {
        expect(result.content[0].text).toContain('Operation failed');
      }
    });
  
    test('should handle missing page in context', async () => {
      const args = {
        selector: 'a#test-link',
      };
  
      const result = await clickAndSwitchTabTool.execute(args, { server: mockServer } as ToolContext);
  
      expect(mockPageClick).not.toHaveBeenCalled();
      expect(result.isError).toBe(true);
      expect(result.content[0].type).toBe('text');
      if (result.content[0].type === 'text') {
        expect(result.content[0].text).toContain('Browser page not initialized');
      }
    });
  });


  describe('IframeClickTool', () => {
    test('should click an element in an iframe', async () => {
      const args = {
        iframeSelector: '#test-iframe',
        selector: '#test-button'
      };

      const result = await iframeClickTool.execute(args, mockContext);

      expect(mockFrameLocator).toHaveBeenCalledWith('#test-iframe');
      expect(mockIframeLocator).toHaveBeenCalledWith('#test-button');
      expect(mockLocatorClick).toHaveBeenCalled();
      expect(result.isError).toBe(false);
      expect(result.content[0].type).toBe('text');
      if (result.content[0].type === 'text') {
        expect(result.content[0].text).toContain('Clicked element');
      }
    });
  });

  describe('FillTool', () => {
    test('should fill an input field', async () => {
      const args = {
        selector: '#test-input',
        value: 'test value'
      };

      const result = await fillTool.execute(args, mockContext);

      expect(mockPageWaitForSelector).toHaveBeenCalledWith('#test-input');
      expect(mockPageFill).toHaveBeenCalledWith('#test-input', 'test value');
      expect(result.isError).toBe(false);
      expect(result.content[0].type).toBe('text');
      if (result.content[0].type === 'text') {
        expect(result.content[0].text).toContain('Filled');
      }
    });
  });

  describe('SelectTool', () => {
    test('should select an option', async () => {
      const args = {
        selector: '#test-select',
        value: 'option1'
      };

      const result = await selectTool.execute(args, mockContext);

      expect(mockPageWaitForSelector).toHaveBeenCalledWith('#test-select');
      expect(mockPageSelectOption).toHaveBeenCalledWith('#test-select', 'option1');
      expect(result.isError).toBe(false);
      expect(result.content[0].type).toBe('text');
      if (result.content[0].type === 'text') {
        expect(result.content[0].text).toContain('Selected');
      }
    });
  });

  describe('HoverTool', () => {
    test('should hover over an element', async () => {
      const args = {
        selector: '#test-element'
      };

      const result = await hoverTool.execute(args, mockContext);

      expect(mockPageWaitForSelector).toHaveBeenCalledWith('#test-element');
      expect(mockPageHover).toHaveBeenCalledWith('#test-element');
      expect(result.isError).toBe(false);
      expect(result.content[0].type).toBe('text');
      if (result.content[0].type === 'text') {
        expect(result.content[0].text).toContain('Hovered');
      }
    });
  });

  describe('UploadFileTool', () => {
    test('should upload a file to an input element', async () => {
      const args = {
        selector: '#file-input',
        filePath: '/tmp/testfile.txt'
      };

      const result = await uploadFileTool.execute(args, mockContext);

      expect(mockPageWaitForSelector).toHaveBeenCalledWith('#file-input');
      expect(mockPageSetInputFiles).toHaveBeenCalledWith('#file-input', '/tmp/testfile.txt');
      expect(result.isError).toBe(false);
      expect(result.content[0].type).toBe('text');
      if (result.content[0].type === 'text') {
        expect(result.content[0].text).toContain("Uploaded file '/tmp/testfile.txt' to '#file-input'");
      }
    });
  });

  describe('EvaluateTool', () => {
    test('should evaluate JavaScript', async () => {
      const args = {
        script: 'return document.title'
      };

      const result = await evaluateTool.execute(args, mockContext);

      expect(mockEvaluate).toHaveBeenCalledWith('return document.title');
      expect(result.isError).toBe(false);
      expect(result.content[0].type).toBe('text');
      if (result.content[0].type === 'text') {
        expect(result.content[0].text).toContain('Executed JavaScript');
      }
    });
  });
});

describe('NavigationTool', () => {
  let navigationTool: NavigationTool;

  beforeEach(() => {
    jest.clearAllMocks();
    navigationTool = new NavigationTool(mockServer);
    // Reset browser and page mocks
    mockIsConnected.mockReturnValue(true);
    mockIsClosed.mockReturnValue(false);
  });

  test('should navigate to a URL', async () => {
    const args = {
      url: 'https://example.com',
      waitUntil: 'networkidle'
    };

    const result = await navigationTool.execute(args, mockContext);

    expect(mockGoto).toHaveBeenCalledWith('https://example.com', { waitUntil: 'networkidle', timeout: 30000 });
    expect(result.isError).toBe(false);
    expect(result.content[0].type).toBe('text');
    if (result.content[0].type === 'text') {
      expect(result.content[0].text).toContain('Navigated to');
    }
  });

  test('should handle navigation errors', async () => {
    const args = {
      url: 'https://example.com'
    };

    // Mock a navigation error
    mockGoto.mockImplementationOnce(() => Promise.reject(new Error('Navigation failed')));

    const result = await navigationTool.execute(args, mockContext);

    expect(mockGoto).toHaveBeenCalledWith('https://example.com', { waitUntil: 'load', timeout: 30000 });
    expect(result.isError).toBe(true);
    expect(result.content[0].type).toBe('text');
    if (result.content[0].type === 'text') {
      expect(result.content[0].text).toContain('Operation failed');
    }
  });

  test('should handle missing page', async () => {
    const args = {
      url: 'https://example.com'
    };

    // Create context with no page but with browser
    const contextWithoutPage = { 
      server: mockServer,
      browser: mockBrowser
    } as unknown as ToolContext;

    const result = await navigationTool.execute(args, contextWithoutPage);

    expect(mockGoto).not.toHaveBeenCalled();
    expect(result.isError).toBe(true);
    expect(result.content[0].type).toBe('text');
    if (result.content[0].type === 'text') {
      expect(result.content[0].text).toContain('Page is not available');
    }
  });
  
  test('should handle disconnected browser', async () => {
    const args = {
      url: 'https://example.com'
    };
    
    // Mock disconnected browser
    mockIsConnected.mockReturnValueOnce(false);
    
    const result = await navigationTool.execute(args, mockContext);
    
    expect(mockGoto).not.toHaveBeenCalled();
    expect(result.isError).toBe(true);
    expect(result.content[0].type).toBe('text');
    if (result.content[0].type === 'text') {
      expect(result.content[0].text).toContain('Browser is not connected');
    }
  });
  
  test('should handle closed page', async () => {
    const args = {
      url: 'https://example.com'
    };
    
    // Mock closed page
    mockIsClosed.mockReturnValueOnce(true);
    
    const result = await navigationTool.execute(args, mockContext);
    
    expect(mockGoto).not.toHaveBeenCalled();
    expect(result.isError).toBe(true);
    expect(result.content[0].type).toBe('text');
    if (result.content[0].type === 'text') {
      expect(result.content[0].text).toContain('Page is not available or has been closed');
    }
  });
});