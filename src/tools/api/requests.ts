import { ApiToolBase } from './base.js';
import { ToolContext, ToolResponse, createSuccessResponse, createErrorResponse } from '../common/types.js';

/**
 * Tool for making GET requests
 */
export class GetRequestTool extends ApiToolBase {
  /**
   * Execute the GET request tool
   */
  async execute(args: any, context: ToolContext): Promise<ToolResponse> {
    return this.safeExecute(context, async (apiContext) => {
      const response = await apiContext.get(args.url, {
        headers: {
          ...(args.token ? { 'Authorization': `Bearer ${args.token}` } : {}),
          ...(args.headers || {})
        }
      });
      
      let responseText;
      try {
        responseText = await response.text();
      } catch (error) {
        responseText = "Unable to get response text";
      }
      
      return createSuccessResponse([
        `GET request to ${args.url}`,
        `Status: ${response.status()} ${response.statusText()}`,
        `Response: ${responseText.substring(0, 1000)}${responseText.length > 1000 ? '...' : ''}`
      ]);
    });
  }
}

/**
 * Tool for making POST requests
 */
export class PostRequestTool extends ApiToolBase {
  /**
   * Execute the POST request tool
   */
  async execute(args: any, context: ToolContext): Promise<ToolResponse> {
    return this.safeExecute(context, async (apiContext) => {
      // Check if the value is valid JSON if it starts with { or [
      if (args.value && typeof args.value === 'string' && 
          (args.value.startsWith('{') || args.value.startsWith('['))) {
        try {
          JSON.parse(args.value);
        } catch (error) {
          return createErrorResponse(`Failed to parse request body: ${(error as Error).message}`);
        }
      }
      
      const response = await apiContext.post(args.url, {
        data: typeof args.value === 'string' ? JSON.parse(args.value) : args.value,
        headers: {
          'Content-Type': 'application/json',
          ...(args.token ? { 'Authorization': `Bearer ${args.token}` } : {}),
          ...(args.headers || {})
        }
      });
      
      let responseText;
      try {
        responseText = await response.text();
      } catch (error) {
        responseText = "Unable to get response text";
      }
      
      return createSuccessResponse([
        `POST request to ${args.url}`,
        `Status: ${response.status()} ${response.statusText()}`,
        `Response: ${responseText.substring(0, 1000)}${responseText.length > 1000 ? '...' : ''}`
      ]);
    });
  }
}

/**
 * Tool for making PUT requests
 */
export class PutRequestTool extends ApiToolBase {
  /**
   * Execute the PUT request tool
   */
  async execute(args: any, context: ToolContext): Promise<ToolResponse> {
    return this.safeExecute(context, async (apiContext) => {
      // Check if the value is valid JSON if it starts with { or [
      if (args.value && typeof args.value === 'string' && 
          (args.value.startsWith('{') || args.value.startsWith('['))) {
        try {
          JSON.parse(args.value);
        } catch (error) {
          return createErrorResponse(`Failed to parse request body: ${(error as Error).message}`);
        }
      }
      
      const response = await apiContext.put(args.url, {
        data: typeof args.value === 'string' ? JSON.parse(args.value) : args.value,
        headers: {
          'Content-Type': 'application/json',
          ...(args.token ? { 'Authorization': `Bearer ${args.token}` } : {}),
          ...(args.headers || {})
        }
      });
      
      let responseText;
      try {
        responseText = await response.text();
      } catch (error) {
        responseText = "Unable to get response text";
      }
      
      return createSuccessResponse([
        `PUT request to ${args.url}`,
        `Status: ${response.status()} ${response.statusText()}`,
        `Response: ${responseText.substring(0, 1000)}${responseText.length > 1000 ? '...' : ''}`
      ]);
    });
  }
}

/**
 * Tool for making PATCH requests
 */
export class PatchRequestTool extends ApiToolBase {
  /**
   * Execute the PATCH request tool
   */
  async execute(args: any, context: ToolContext): Promise<ToolResponse> {
    return this.safeExecute(context, async (apiContext) => {
      // Check if the value is valid JSON if it starts with { or [
      if (args.value && typeof args.value === 'string' && 
          (args.value.startsWith('{') || args.value.startsWith('['))) {
        try {
          JSON.parse(args.value);
        } catch (error) {
          return createErrorResponse(`Failed to parse request body: ${(error as Error).message}`);
        }
      }
      
      const response = await apiContext.patch(args.url, {
        data: typeof args.value === 'string' ? JSON.parse(args.value) : args.value,
        headers: {
          'Content-Type': 'application/json',
          ...(args.token ? { 'Authorization': `Bearer ${args.token}` } : {}),
          ...(args.headers || {})
        }
      });
      
      let responseText;
      try {
        responseText = await response.text();
      } catch (error) {
        responseText = "Unable to get response text";
      }
      
      return createSuccessResponse([
        `PATCH request to ${args.url}`,
        `Status: ${response.status()} ${response.statusText()}`,
        `Response: ${responseText.substring(0, 1000)}${responseText.length > 1000 ? '...' : ''}`
      ]);
    });
  }
}

/**
 * Tool for making DELETE requests
 */
export class DeleteRequestTool extends ApiToolBase {
  /**
   * Execute the DELETE request tool
   */
  async execute(args: any, context: ToolContext): Promise<ToolResponse> {
    return this.safeExecute(context, async (apiContext) => {
      const response = await apiContext.delete(args.url, {
        headers: {
          ...(args.token ? { 'Authorization': `Bearer ${args.token}` } : {}),
          ...(args.headers || {})
        }
      });
      
      let responseText;
      try {
        responseText = await response.text();
      } catch (error) {
        responseText = "Unable to get response text";
      }
      
      return createSuccessResponse([
        `DELETE request to ${args.url}`,
        `Status: ${response.status()} ${response.statusText()}`,
        `Response: ${responseText.substring(0, 1000)}${responseText.length > 1000 ? '...' : ''}`
      ]);
    });
  }
} 