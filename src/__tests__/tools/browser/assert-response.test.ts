import { AssertResponseTool } from '../../../tools/browser/assert-response.js';
import { ToolContext } from '../../../tools/common/types.js';
import { Page, Response } from 'playwright';
import { jest } from '@jest/globals';

// Mock response
const createMockResponse = (body: string): Partial<Response> => ({
  url: () => 'test-url',
  text: () => Promise.resolve(body)
});

// Mock the Page object
const mockWaitForResponse = jest.fn();
const mockPage = {
  waitForResponse: mockWaitForResponse
} as unknown as Page;

// Mock the server
const mockServer = {
  sendMessage: jest.fn(),
  notification: jest.fn()
};

// Mock context
const mockContext = {
  page: mockPage,
  server: mockServer
} as ToolContext;

describe('AssertResponseTool', () => {
  let assertResponseTool: AssertResponseTool;

  beforeEach(() => {
    jest.clearAllMocks();
    assertResponseTool = new AssertResponseTool(mockServer);
  });

  test('should handle missing browser page', async () => {
    const result = await assertResponseTool.execute({ id: 'test-id' }, { server: mockServer } as ToolContext);
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe('Browser not initialized');
  });

  test('should pass when response matches without value check', async () => {
    const mockResponse = createMockResponse('response body');
    mockWaitForResponse.mockImplementationOnce(() => Promise.resolve(mockResponse));

    const result = await assertResponseTool.execute({ id: 'test-id' }, mockContext);
    expect(result.isError).toBe(false);
    expect(result.content[0].text).toBe('Response assertion passed');
  });

  test('should pass when response matches with value check', async () => {
    const mockResponse = createMockResponse('expected value in response');
    mockWaitForResponse.mockImplementationOnce(() => Promise.resolve(mockResponse));

    const result = await assertResponseTool.execute({ 
      id: 'test-id', 
      value: 'expected value' 
    }, mockContext);
    
    expect(result.isError).toBe(false);
    expect(result.content[0].text).toBe('Response assertion passed');
  });

  test('should fail when response does not contain expected value', async () => {
    const mockResponse = createMockResponse('different response body');
    mockWaitForResponse.mockImplementationOnce(() => Promise.resolve(mockResponse));

    const result = await assertResponseTool.execute({ 
      id: 'test-id', 
      value: 'expected value' 
    }, mockContext);
    
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Response does not contain expected value');
  });

  test('should handle response wait failure', async () => {
    mockWaitForResponse.mockImplementationOnce(() => Promise.reject(new Error('Network error')));

    const result = await assertResponseTool.execute({ id: 'test-id' }, mockContext);
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Response assertion failed');
  });
}); 