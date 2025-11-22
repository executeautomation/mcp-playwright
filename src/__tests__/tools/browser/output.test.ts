import { jest } from '@jest/globals';
import * as path from 'node:path';
import type { Page, Browser } from 'playwright';
import { SaveAsPdfTool } from '../../../tools/browser/output.js';
import type { ToolContext } from '../../../tools/common/types.js';
import { getTextContent } from '../../testUtils';

// Mock page functions
const mockPdf = jest.fn().mockImplementation(() => Promise.resolve());
const mockIsClosed = jest.fn().mockReturnValue(false);

// Mock the Page object with proper typing
const mockPage = {
  pdf: mockPdf,
  isClosed: mockIsClosed
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

describe('Browser Output Tools', () => {
  let saveAsPdfTool: SaveAsPdfTool;

  beforeEach(() => {
    jest.clearAllMocks();
    saveAsPdfTool = new SaveAsPdfTool(mockServer);
    // Reset browser and page mocks
    mockIsConnected.mockReturnValue(true);
    mockIsClosed.mockReturnValue(false);
  });

  describe('SaveAsPdfTool', () => {
    test('should save page as PDF with default options', async () => {
      const args = {
        outputPath: '/downloads'
      };

      const result = await saveAsPdfTool.execute(args, mockContext);
      const expectedPath = path.resolve('/downloads', 'page.pdf');

      expect(mockPdf).toHaveBeenCalledWith({
        path: expectedPath,
        format: 'A4',
        printBackground: true,
        margin: {
          top: '1cm',
          right: '1cm',
          bottom: '1cm',
          left: '1cm'
        }
      });
      expect(result.isError).toBe(false);
      expect(getTextContent(result)).toContain('Saved page as PDF');
    });

    test('should save page as PDF with custom options', async () => {
      const args = {
        outputPath: '/downloads',
        filename: 'custom.pdf',
        format: 'Letter',
        printBackground: false,
        margin: {
          top: '2cm',
          right: '2cm',
          bottom: '2cm',
          left: '2cm'
        }
      };

      const result = await saveAsPdfTool.execute(args, mockContext);
      const expectedPath = path.resolve('/downloads', 'custom.pdf');

      expect(mockPdf).toHaveBeenCalledWith({
        path: expectedPath,
        format: 'Letter',
        printBackground: false,
        margin: {
          top: '2cm',
          right: '2cm',
          bottom: '2cm',
          left: '2cm'
        }
      });
      expect(result.isError).toBe(false);
      expect(getTextContent(result)).toContain('Saved page as PDF');
    });

    test('should handle PDF generation errors', async () => {
      const args = {
        outputPath: '/downloads'
      };

      // Mock PDF generation error
      mockPdf.mockImplementationOnce(() => Promise.reject(new Error('PDF generation failed')));

      const result = await saveAsPdfTool.execute(args, mockContext);

      expect(mockPdf).toHaveBeenCalled();
      expect(result.isError).toBe(true);
      expect(getTextContent(result)).toContain('Operation failed');
    });

    test('should handle missing page', async () => {
      const args = {
        outputPath: '/downloads'
      };

      const result = await saveAsPdfTool.execute(args, { server: mockServer } as ToolContext);

      expect(mockPdf).not.toHaveBeenCalled();
      expect(result.isError).toBe(true);
      expect(getTextContent(result)).toContain('Browser page not initialized');
    });
  });
});
