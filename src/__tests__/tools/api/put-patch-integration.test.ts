import { PutRequestTool, PatchRequestTool } from '../../../tools/api/requests.js';
import { ToolContext } from '../../../tools/common/types.js';
import { request } from 'playwright';
import { jest } from '@jest/globals';

/**
 * Integration tests for PUT and PATCH requests
 * These tests verify that the fix for the 415 Unsupported Media Type issue works correctly
 */
describe('PUT and PATCH Integration Tests - Issue Fix Verification', () => {
  let putRequestTool: PutRequestTool;
  let patchRequestTool: PatchRequestTool;
  
  // Mock server
  const mockServer = {
    sendMessage: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    putRequestTool = new PutRequestTool(mockServer);
    patchRequestTool = new PatchRequestTool(mockServer);
  });

  describe('PUT Request - Content-Type Header Fix', () => {
    test('should automatically include Content-Type: application/json header', async () => {
      const apiContext = await request.newContext();
      const context: ToolContext = {
        apiContext,
        server: mockServer
      };

      // Mock the put method to verify headers
      const putSpy = jest.spyOn(apiContext, 'put');

      const args = {
        url: 'https://jsonplaceholder.typicode.com/posts/1',
        value: JSON.stringify({
          id: 1,
          title: 'Updated Title',
          body: 'Updated Body',
          userId: 1
        })
      };

      try {
        await putRequestTool.execute(args, context);
      } catch (error) {
        // Ignore network errors in CI, we're just checking the call
      }

      // Verify Content-Type header was included
      expect(putSpy).toHaveBeenCalledWith(
        args.url,
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          })
        })
      );

      await apiContext.dispose();
    });

    test('should include Content-Type with custom headers', async () => {
      const apiContext = await request.newContext();
      const context: ToolContext = {
        apiContext,
        server: mockServer
      };

      const putSpy = jest.spyOn(apiContext, 'put');

      const args = {
        url: 'https://jsonplaceholder.typicode.com/posts/1',
        value: JSON.stringify({ title: 'Updated' }),
        headers: {
          'Accept': 'application/json',
          'X-Custom-Header': 'test-value'
        }
      };

      try {
        await putRequestTool.execute(args, context);
      } catch (error) {
        // Ignore network errors
      }

      // Verify both Content-Type and custom headers are included
      expect(putSpy).toHaveBeenCalledWith(
        args.url,
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-Custom-Header': 'test-value'
          })
        })
      );

      await apiContext.dispose();
    });

    test('should include Content-Type with Bearer token', async () => {
      const apiContext = await request.newContext();
      const context: ToolContext = {
        apiContext,
        server: mockServer
      };

      const putSpy = jest.spyOn(apiContext, 'put');

      const args = {
        url: 'https://jsonplaceholder.typicode.com/posts/1',
        value: JSON.stringify({ title: 'Updated' }),
        token: 'test-bearer-token'
      };

      try {
        await putRequestTool.execute(args, context);
      } catch (error) {
        // Ignore network errors
      }

      // Verify Content-Type and Authorization headers are included
      expect(putSpy).toHaveBeenCalledWith(
        args.url,
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-bearer-token'
          })
        })
      );

      await apiContext.dispose();
    });

    test('should handle object values (not just JSON strings)', async () => {
      const apiContext = await request.newContext();
      const context: ToolContext = {
        apiContext,
        server: mockServer
      };

      const putSpy = jest.spyOn(apiContext, 'put');

      const args = {
        url: 'https://jsonplaceholder.typicode.com/posts/1',
        value: {
          id: 1,
          title: 'Updated with Object'
        }
      };

      try {
        await putRequestTool.execute(args, context);
      } catch (error) {
        // Ignore network errors
      }

      // Verify Content-Type header is included with object value
      expect(putSpy).toHaveBeenCalledWith(
        args.url,
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          data: { id: 1, title: 'Updated with Object' }
        })
      );

      await apiContext.dispose();
    });
  });

  describe('PATCH Request - Content-Type Header Fix', () => {
    test('should automatically include Content-Type: application/json header', async () => {
      const apiContext = await request.newContext();
      const context: ToolContext = {
        apiContext,
        server: mockServer
      };

      const patchSpy = jest.spyOn(apiContext, 'patch');

      const args = {
        url: 'https://jsonplaceholder.typicode.com/posts/1',
        value: JSON.stringify({ title: 'Patched Title' })
      };

      try {
        await patchRequestTool.execute(args, context);
      } catch (error) {
        // Ignore network errors
      }

      // Verify Content-Type header was included
      expect(patchSpy).toHaveBeenCalledWith(
        args.url,
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          })
        })
      );

      await apiContext.dispose();
    });

    test('should include Content-Type with custom headers', async () => {
      const apiContext = await request.newContext();
      const context: ToolContext = {
        apiContext,
        server: mockServer
      };

      const patchSpy = jest.spyOn(apiContext, 'patch');

      const args = {
        url: 'https://jsonplaceholder.typicode.com/posts/1',
        value: JSON.stringify({ title: 'Patched' }),
        headers: {
          'Accept': 'application/json',
          'X-Api-Version': 'v1'
        }
      };

      try {
        await patchRequestTool.execute(args, context);
      } catch (error) {
        // Ignore network errors
      }

      // Verify both Content-Type and custom headers are included
      expect(patchSpy).toHaveBeenCalledWith(
        args.url,
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-Api-Version': 'v1'
          })
        })
      );

      await apiContext.dispose();
    });

    test('should include Content-Type with Bearer token', async () => {
      const apiContext = await request.newContext();
      const context: ToolContext = {
        apiContext,
        server: mockServer
      };

      const patchSpy = jest.spyOn(apiContext, 'patch');

      const args = {
        url: 'https://jsonplaceholder.typicode.com/posts/1',
        value: JSON.stringify({ title: 'Patched' }),
        token: 'test-bearer-token'
      };

      try {
        await patchRequestTool.execute(args, context);
      } catch (error) {
        // Ignore network errors
      }

      // Verify Content-Type and Authorization headers are included
      expect(patchSpy).toHaveBeenCalledWith(
        args.url,
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-bearer-token'
          })
        })
      );

      await apiContext.dispose();
    });
  });

  describe('Issue Verification - FakeRestAPI Scenario', () => {
    test('PUT request to FakeRestAPI with proper headers should not get 415 error', async () => {
      const apiContext = await request.newContext();
      const context: ToolContext = {
        apiContext,
        server: mockServer
      };

      const putSpy = jest.spyOn(apiContext, 'put');

      // This is the exact scenario from the issue
      const args = {
        url: 'https://fakerestapi.azurewebsites.net/api/v1/Activities/1',
        value: JSON.stringify({
          id: 1,
          title: 'string',
          dueDate: '2025-08-18T20:48:58.627Z',
          completed: true
        })
      };

      try {
        await putRequestTool.execute(args, context);
      } catch (error) {
        // Network errors are OK, we're verifying headers
      }

      // The fix ensures Content-Type is automatically included
      // This prevents the 415 Unsupported Media Type error
      expect(putSpy).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          })
        })
      );

      await apiContext.dispose();
    });

    test('PATCH request with custom Accept header should include both headers', async () => {
      const apiContext = await request.newContext();
      const context: ToolContext = {
        apiContext,
        server: mockServer
      };

      const patchSpy = jest.spyOn(apiContext, 'patch');

      const args = {
        url: 'https://fakerestapi.azurewebsites.net/api/v1/Activities/1',
        value: JSON.stringify({ title: 'Updated' }),
        headers: {
          'Accept': 'application/json'
        }
      };

      try {
        await patchRequestTool.execute(args, context);
      } catch (error) {
        // Network errors are OK
      }

      // Both Content-Type (automatic) and Accept (custom) should be present
      expect(patchSpy).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          })
        })
      );

      await apiContext.dispose();
    });
  });
});
