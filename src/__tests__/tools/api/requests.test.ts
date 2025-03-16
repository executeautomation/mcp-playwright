import { GetRequestTool, PostRequestTool, PutRequestTool, PatchRequestTool, DeleteRequestTool } from '../../../tools/api/requests.js';
import { ToolContext } from '../../../tools/common/types.js';
import { APIRequestContext } from 'playwright';
import { jest } from '@jest/globals';

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

// Mock API context
const mockGet = jest.fn().mockImplementation(() => Promise.resolve(mockResponse));
const mockPost = jest.fn().mockImplementation(() => Promise.resolve({...mockResponse, status: mockStatus201}));
const mockPut = jest.fn().mockImplementation(() => Promise.resolve(mockResponse));
const mockPatch = jest.fn().mockImplementation(() => Promise.resolve(mockResponse));
const mockDelete = jest.fn().mockImplementation(() => Promise.resolve({...mockResponse, status: mockStatus204}));
const mockDispose = jest.fn().mockImplementation(() => Promise.resolve());

const mockApiContext = {
  get: mockGet,
  post: mockPost,
  put: mockPut,
  patch: mockPatch,
  delete: mockDelete,
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

      expect(mockGet).toHaveBeenCalledWith('https://api.example.com');
      expect(result.isError).toBe(false);
      expect(result.content[0].text).toContain('GET request to');
    });

    test('should handle GET request errors', async () => {
      const args = {
        url: 'https://api.example.com'
      };

      // Mock a request error
      mockGet.mockImplementationOnce(() => Promise.reject(new Error('Request failed')));

      const result = await getRequestTool.execute(args, mockContext);

      expect(mockGet).toHaveBeenCalledWith('https://api.example.com');
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('API operation failed');
    });

    test('should handle missing API context', async () => {
      const args = {
        url: 'https://api.example.com'
      };

      const result = await getRequestTool.execute(args, { server: mockServer } as ToolContext);

      expect(mockGet).not.toHaveBeenCalled();
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('API context not initialized');
    });
  });

  describe('PostRequestTool', () => {
    test('should make a POST request', async () => {
      const args = {
        url: 'https://api.example.com',
        value: '{"data": "test"}'
      };

      const result = await postRequestTool.execute(args, mockContext);

      expect(mockPost).toHaveBeenCalledWith('https://api.example.com', { data: args.value });
      expect(result.isError).toBe(false);
      expect(result.content[0].text).toContain('POST request to');
    });
  });

  describe('PutRequestTool', () => {
    test('should make a PUT request', async () => {
      const args = {
        url: 'https://api.example.com',
        value: '{"data": "test"}'
      };

      const result = await putRequestTool.execute(args, mockContext);

      expect(mockPut).toHaveBeenCalledWith('https://api.example.com', { data: args.value });
      expect(result.isError).toBe(false);
      expect(result.content[0].text).toContain('PUT request to');
    });
  });

  describe('PatchRequestTool', () => {
    test('should make a PATCH request', async () => {
      const args = {
        url: 'https://api.example.com',
        value: '{"data": "test"}'
      };

      const result = await patchRequestTool.execute(args, mockContext);

      expect(mockPatch).toHaveBeenCalledWith('https://api.example.com', { data: args.value });
      expect(result.isError).toBe(false);
      expect(result.content[0].text).toContain('PATCH request to');
    });
  });

  describe('DeleteRequestTool', () => {
    test('should make a DELETE request', async () => {
      const args = {
        url: 'https://api.example.com/1'
      };

      const result = await deleteRequestTool.execute(args, mockContext);

      expect(mockDelete).toHaveBeenCalledWith('https://api.example.com/1');
      expect(result.isError).toBe(false);
      expect(result.content[0].text).toContain('DELETE request to');
    });
  });
}); 