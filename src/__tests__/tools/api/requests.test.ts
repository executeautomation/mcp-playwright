import { GetRequestTool, PostRequestTool, PutRequestTool, PatchRequestTool, DeleteRequestTool } from '../../../tools/api/requests.js';
import { ToolContext } from '../../../tools/common/types.js';
import { APIRequestContext } from 'playwright';
import { jest } from '@jest/globals';
import * as dns from 'node:dns';

jest.mock('node:dns');
const mockDnsLookup = dns.lookup as unknown as jest.Mock;
mockDnsLookup.mockImplementation(((hostname: string, options: any, callback: any) =>
  callback(null, [{ address: '93.184.216.34', family: 4 }])
) as any);

// Mock response
const mockStatus200 = jest.fn().mockReturnValue(200);
const mockStatus201 = jest.fn().mockReturnValue(201);
const mockStatus204 = jest.fn().mockReturnValue(204);
const mockText = jest.fn().mockImplementation(() => Promise.resolve('{"success": true}'));
const mockStatusText = jest.fn().mockReturnValue('OK');

const mockResponse = {
  status: mockStatus200,
  statusText: mockStatusText,
  text: mockText
};

// Mock API context: tools issue requests through fetchWithValidation ->
// apiContext.fetch(url, { method, ... })
const mockHeaders = jest.fn().mockReturnValue({});
const mockFetch = jest.fn().mockImplementation(((url: string, opts: any) => {
  const status = opts?.method === 'POST' ? mockStatus201
    : opts?.method === 'DELETE' ? mockStatus204
    : mockStatus200;
  return Promise.resolve({ ...mockResponse, status, headers: mockHeaders });
}) as any);
const mockDispose = jest.fn().mockImplementation(() => Promise.resolve());

const mockApiContext = {
  fetch: mockFetch,
  dispose: mockDispose
} as unknown as APIRequestContext;

// Mock server
const mockServer = {
  sendMessage: jest.fn()
};

// Mock context
const mockContext = {
  apiContext: mockApiContext,
  server: mockServer
} as ToolContext;

describe('API Request Tools', () => {
  let getRequestTool: GetRequestTool;
  let postRequestTool: PostRequestTool;
  let putRequestTool: PutRequestTool;
  let patchRequestTool: PatchRequestTool;
  let deleteRequestTool: DeleteRequestTool;

  beforeEach(() => {
    jest.clearAllMocks();
    getRequestTool = new GetRequestTool(mockServer);
    postRequestTool = new PostRequestTool(mockServer);
    putRequestTool = new PutRequestTool(mockServer);
    patchRequestTool = new PatchRequestTool(mockServer);
    deleteRequestTool = new DeleteRequestTool(mockServer);
  });

  describe('GetRequestTool', () => {
    test('should make a GET request', async () => {
      const args = {
        url: 'https://api.example.com'
      };

      const result = await getRequestTool.execute(args, mockContext);

      expect(mockFetch).toHaveBeenCalledWith('https://api.example.com', expect.objectContaining({
        method: 'GET',
        headers: {}
      }));
      expect(result.isError).toBe(false);
      expect(result.content[0].type).toBe('text');
      if (result.content[0].type === 'text') {
        expect(result.content[0].text).toContain('GET request to');
      }
    });

    test('should make a GET request with Bearer token', async () => {
      const args = {
        url: 'https://api.example.com',
        token: 'test-token'
      };

      const result = await getRequestTool.execute(args, mockContext);

      expect(mockFetch).toHaveBeenCalledWith('https://api.example.com', expect.objectContaining({
        method: 'GET',
        headers: {
          'Authorization': 'Bearer test-token'
        }
      }));
      expect(result.isError).toBe(false);
      expect(result.content[0].type).toBe('text');
      if (result.content[0].type === 'text') {
        expect(result.content[0].text).toContain('GET request to');
      }
    });

    test('should make a GET request with custom headers', async () => {
      const args = {
        url: 'https://api.example.com',
        headers: {
          'Authorization': 'Basic YWRtaW46cGFzc3dvcmQxMjM=',
          'X-Custom-Header': 'custom-value'
        }
      };

      const result = await getRequestTool.execute(args, mockContext);

      expect(mockFetch).toHaveBeenCalledWith('https://api.example.com', expect.objectContaining({
        method: 'GET',
        headers: {
          'Authorization': 'Basic YWRtaW46cGFzc3dvcmQxMjM=',
          'X-Custom-Header': 'custom-value'
        }
      }));
      expect(result.isError).toBe(false);
      expect(result.content[0].type).toBe('text');
      if (result.content[0].type === 'text') {
        expect(result.content[0].text).toContain('GET request to');
      }
    });

    test('should handle GET request errors', async () => {
      const args = {
        url: 'https://api.example.com'
      };

      // Mock a request error
      mockFetch.mockImplementationOnce(() => Promise.reject(new Error('Request failed')));

      const result = await getRequestTool.execute(args, mockContext);

      expect(result.isError).toBe(true);
      expect(result.content[0].type).toBe('text');
      if (result.content[0].type === 'text') {
        expect(result.content[0].text).toContain('API operation failed');
      }
    });

    test('should handle missing API context', async () => {
      const args = {
        url: 'https://api.example.com'
      };

      const result = await getRequestTool.execute(args, { server: mockServer } as ToolContext);

      expect(mockFetch).not.toHaveBeenCalled();
      expect(result.isError).toBe(true);
      expect(result.content[0].type).toBe('text');
      if (result.content[0].type === 'text') {
        expect(result.content[0].text).toContain('API context not initialized');
      }
    });
  });

  describe('PostRequestTool', () => {
    test('should make a POST request without token', async () => {
      const args = {
        url: 'https://api.example.com',
        value: '{"data": "test"}'
      };

      const result = await postRequestTool.execute(args, mockContext);

      expect(mockFetch).toHaveBeenCalledWith('https://api.example.com', expect.objectContaining({
        method: 'POST',
        data: { data: "test" },
        headers: {
          'Content-Type': 'application/json'
        }
      }));
      expect(result.isError).toBe(false);
      expect(result.content[0].type).toBe('text');
      if (result.content[0].type === 'text') {
        expect(result.content[0].text).toContain('POST request to');
      }
    });

    test('should make a POST request with Bearer token', async () => {
      const args = {
        url: 'https://api.example.com',
        value: '{"data": "test"}',
        token: 'test-token'
      };

      const result = await postRequestTool.execute(args, mockContext);

      expect(mockFetch).toHaveBeenCalledWith('https://api.example.com', expect.objectContaining({
        method: 'POST',
        data: { data: "test" },
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        }
      }));
      expect(result.isError).toBe(false);
      expect(result.content[0].type).toBe('text');
      if (result.content[0].type === 'text') {
        expect(result.content[0].text).toContain('POST request to');
      }
    });

    test('should make a POST request with Bearer token and custom headers', async () => {
      const args = {
        url: 'https://api.example.com',
        value: '{"data": "test"}',
        token: 'test-token',
        headers: {
          'X-Custom-Header': 'custom-value'
        }
      };

      const result = await postRequestTool.execute(args, mockContext);

      expect(mockFetch).toHaveBeenCalledWith('https://api.example.com', expect.objectContaining({
        method: 'POST',
        data: { data: "test" },
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token',
          'X-Custom-Header': 'custom-value'
        }
      }));
      expect(result.isError).toBe(false);
      expect(result.content[0].type).toBe('text');
      if (result.content[0].type === 'text') {
        expect(result.content[0].text).toContain('POST request to');
      }
    });
  });

  describe('PutRequestTool', () => {
    test('should make a PUT request', async () => {
      const args = {
        url: 'https://api.example.com',
        value: '{"data": "test"}'
      };

      const result = await putRequestTool.execute(args, mockContext);

      expect(mockFetch).toHaveBeenCalledWith('https://api.example.com', expect.objectContaining({
        method: 'PUT',
        data: { data: "test" },
        headers: {
          'Content-Type': 'application/json'
        }
      }));
      expect(result.isError).toBe(false);
      expect(result.content[0].type).toBe('text');
      if (result.content[0].type === 'text') {
        expect(result.content[0].text).toContain('PUT request to');
      }
    });

    test('should make a PUT request with Bearer token', async () => {
      const args = {
        url: 'https://api.example.com',
        value: '{"data": "test"}',
        token: 'test-token'
      };

      const result = await putRequestTool.execute(args, mockContext);

      expect(mockFetch).toHaveBeenCalledWith('https://api.example.com', expect.objectContaining({
        method: 'PUT',
        data: { data: "test" },
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        }
      }));
      expect(result.isError).toBe(false);
      expect(result.content[0].type).toBe('text');
      if (result.content[0].type === 'text') {
        expect(result.content[0].text).toContain('PUT request to');
      }
    });

    test('should make a PUT request with custom headers including Basic auth', async () => {
      const args = {
        url: 'https://api.example.com',
        value: '{"data": "test"}',
        headers: {
          'Authorization': 'Basic YWRtaW46cGFzc3dvcmQxMjM=',
          'Accept': 'application/json'
        }
      };

      const result = await putRequestTool.execute(args, mockContext);

      expect(mockFetch).toHaveBeenCalledWith('https://api.example.com', expect.objectContaining({
        method: 'PUT',
        data: { data: "test" },
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Basic YWRtaW46cGFzc3dvcmQxMjM=',
          'Accept': 'application/json'
        }
      }));
      expect(result.isError).toBe(false);
      expect(result.content[0].type).toBe('text');
      if (result.content[0].type === 'text') {
        expect(result.content[0].text).toContain('PUT request to');
      }
    });
  });

  describe('PatchRequestTool', () => {
    test('should make a PATCH request', async () => {
      const args = {
        url: 'https://api.example.com',
        value: '{"data": "test"}'
      };

      const result = await patchRequestTool.execute(args, mockContext);

      expect(mockFetch).toHaveBeenCalledWith('https://api.example.com', expect.objectContaining({
        method: 'PATCH',
        data: { data: "test" },
        headers: {
          'Content-Type': 'application/json'
        }
      }));
      expect(result.isError).toBe(false);
      expect(result.content[0].type).toBe('text');
      if (result.content[0].type === 'text') {
        expect(result.content[0].text).toContain('PATCH request to');
      }
    });

    test('should make a PATCH request with Bearer token', async () => {
      const args = {
        url: 'https://api.example.com',
        value: '{"data": "test"}',
        token: 'test-token'
      };

      const result = await patchRequestTool.execute(args, mockContext);

      expect(mockFetch).toHaveBeenCalledWith('https://api.example.com', expect.objectContaining({
        method: 'PATCH',
        data: { data: "test" },
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        }
      }));
      expect(result.isError).toBe(false);
      expect(result.content[0].type).toBe('text');
      if (result.content[0].type === 'text') {
        expect(result.content[0].text).toContain('PATCH request to');
      }
    });

    test('should make a PATCH request with custom headers', async () => {
      const args = {
        url: 'https://api.example.com',
        value: '{"data": "test"}',
        headers: {
          'X-Custom-Header': 'custom-value'
        }
      };

      const result = await patchRequestTool.execute(args, mockContext);

      expect(mockFetch).toHaveBeenCalledWith('https://api.example.com', expect.objectContaining({
        method: 'PATCH',
        data: { data: "test" },
        headers: {
          'Content-Type': 'application/json',
          'X-Custom-Header': 'custom-value'
        }
      }));
      expect(result.isError).toBe(false);
      expect(result.content[0].type).toBe('text');
      if (result.content[0].type === 'text') {
        expect(result.content[0].text).toContain('PATCH request to');
      }
    });
  });

  describe('DeleteRequestTool', () => {
    test('should make a DELETE request', async () => {
      const args = {
        url: 'https://api.example.com/1'
      };

      const result = await deleteRequestTool.execute(args, mockContext);

      expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/1', expect.objectContaining({
        method: 'DELETE',
        headers: {}
      }));
      expect(result.isError).toBe(false);
      expect(result.content[0].type).toBe('text');
      if (result.content[0].type === 'text') {
        expect(result.content[0].text).toContain('DELETE request to');
      }
    });

    test('should make a DELETE request with Bearer token', async () => {
      const args = {
        url: 'https://api.example.com/1',
        token: 'test-token'
      };

      const result = await deleteRequestTool.execute(args, mockContext);

      expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/1', expect.objectContaining({
        method: 'DELETE',
        headers: {
          'Authorization': 'Bearer test-token'
        }
      }));
      expect(result.isError).toBe(false);
      expect(result.content[0].type).toBe('text');
      if (result.content[0].type === 'text') {
        expect(result.content[0].text).toContain('DELETE request to');
      }
    });

    test('should make a DELETE request with custom headers', async () => {
      const args = {
        url: 'https://api.example.com/1',
        headers: {
          'Authorization': 'Basic YWRtaW46cGFzc3dvcmQxMjM=',
          'X-Custom-Header': 'custom-value'
        }
      };

      const result = await deleteRequestTool.execute(args, mockContext);

      expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/1', expect.objectContaining({
        method: 'DELETE',
        headers: {
          'Authorization': 'Basic YWRtaW46cGFzc3dvcmQxMjM=',
          'X-Custom-Header': 'custom-value'
        }
      }));
      expect(result.isError).toBe(false);
      expect(result.content[0].type).toBe('text');
      if (result.content[0].type === 'text') {
        expect(result.content[0].text).toContain('DELETE request to');
      }
    });
  });

  describe('Edge Cases and Validation', () => {
    test('should handle invalid header values', async () => {
      const args = {
        url: 'https://api.example.com',
        headers: {
          'Valid-Header': 'string-value',
          'Invalid-Header': 123 as any  // Invalid: number instead of string
        }
      };

      const result = await getRequestTool.execute(args, mockContext);

      expect(result.isError).toBe(true);
      expect(result.content[0].type).toBe('text');
      if (result.content[0].type === 'text') {
        expect(result.content[0].text).toContain("Header 'Invalid-Header' must be a string");
      }
    });

    test('should warn when both token and Authorization header provided (GET)', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      
      const args = {
        url: 'https://api.example.com',
        token: 'bearer-token',
        headers: {
          'Authorization': 'Basic xyz'
        }
      };

      const result = await getRequestTool.execute(args, mockContext);

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Both token and Authorization header provided. Custom Authorization header will override token.'
      );
      expect(mockFetch).toHaveBeenCalledWith('https://api.example.com', expect.objectContaining({
        method: 'GET',
        headers: {
          'Authorization': 'Basic xyz'  // Custom header should win
        }
      }));
      expect(result.isError).toBe(false);
      
      consoleWarnSpy.mockRestore();
    });

    test('should warn when both token and Authorization header provided (POST)', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      
      const args = {
        url: 'https://api.example.com',
        value: '{"test":"data"}',
        token: 'bearer-token',
        headers: {
          'Authorization': 'Custom auth-value'
        }
      };

      const result = await postRequestTool.execute(args, mockContext);

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Both token and Authorization header provided. Custom Authorization header will override token.'
      );
      expect(mockFetch).toHaveBeenCalledWith('https://api.example.com', expect.objectContaining({
        method: 'POST',
        data: { test: 'data' },
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Custom auth-value'  // Custom header wins
        }
      }));
      expect(result.isError).toBe(false);
      
      consoleWarnSpy.mockRestore();
    });

    test('should warn on JSON parse failure but continue with raw string', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      
      const args = {
        url: 'https://api.example.com',
        value: 'not-valid-json-but-valid-string'
      };

      const result = await postRequestTool.execute(args, mockContext);

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Failed to parse JSON, using raw string:',
        expect.any(String)
      );
      expect(mockFetch).toHaveBeenCalledWith('https://api.example.com', expect.objectContaining({
        method: 'POST',
        data: 'not-valid-json-but-valid-string',
        headers: {
          'Content-Type': 'application/json'
        }
      }));
      expect(result.isError).toBe(false);
      
      consoleWarnSpy.mockRestore();
    });

    test('should handle empty headers object', async () => {
      const args = {
        url: 'https://api.example.com',
        headers: {}
      };

      const result = await getRequestTool.execute(args, mockContext);

      expect(mockFetch).toHaveBeenCalledWith('https://api.example.com', expect.objectContaining({
        method: 'GET',
        headers: {}
      }));
      expect(result.isError).toBe(false);
    });

    test('should validate headers in PUT request', async () => {
      const args = {
        url: 'https://api.example.com',
        value: '{"test":"data"}',
        headers: {
          'Invalid': null as any
        }
      };

      const result = await putRequestTool.execute(args, mockContext);

      expect(result.isError).toBe(true);
      expect(result.content[0].type).toBe('text');
      if (result.content[0].type === 'text') {
        expect(result.content[0].text).toContain("Header 'Invalid' must be a string");
      }
    });

    test('should validate headers in PATCH request', async () => {
      const args = {
        url: 'https://api.example.com',
        value: '{"test":"data"}',
        headers: {
          'Valid': 'value',
          'Invalid': undefined as any
        }
      };

      const result = await patchRequestTool.execute(args, mockContext);

      expect(result.isError).toBe(true);
      expect(result.content[0].type).toBe('text');
      if (result.content[0].type === 'text') {
        expect(result.content[0].text).toContain("Header 'Invalid' must be a string");
      }
    });

    test('should validate headers in DELETE request', async () => {
      const args = {
        url: 'https://api.example.com',
        headers: {
          'Array-Header': ['value1', 'value2'] as any
        }
      };

      const result = await deleteRequestTool.execute(args, mockContext);

      expect(result.isError).toBe(true);
      expect(result.content[0].type).toBe('text');
      if (result.content[0].type === 'text') {
        expect(result.content[0].text).toContain("Header 'Array-Header' must be a string");
      }
    });
  });
}); 