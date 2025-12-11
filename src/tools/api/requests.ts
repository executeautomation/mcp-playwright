import { ApiToolBase } from './base.js';
import { ToolContext, ToolResponse, createSuccessResponse, createErrorResponse } from '../common/types.js';

/**
 * Base arguments for all API requests
 */
export interface BaseRequestArgs {
  url: string;
  token?: string;
  headers?: Record<string, string>;
}

/**
 * Arguments for requests with body (POST, PUT, PATCH)
 */
export interface RequestWithBodyArgs extends BaseRequestArgs {
  value: string | object;
}

/**
 * Helper function to safely parse JSON string or return the value as-is
 * @param value The value to parse (can be string or object)
 * @returns Parsed JSON object or the original value
 */
function parseJsonSafely(value: any): any {
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch (error) {
      // Log warning for debugging
      console.warn('Failed to parse JSON, using raw string:', error instanceof Error ? error.message : 'Unknown error');
      return value;
    }
  }
  return value;
}

/**
 * Helper function to build request headers with optional token and custom headers
 * @param token Optional Bearer token for authorization
 * @param customHeaders Optional custom headers to include
 * @param includeContentType Whether to include Content-Type: application/json header
 * @returns Merged headers object
 */
function buildHeaders(token?: string, customHeaders?: Record<string, string>, includeContentType: boolean = false): Record<string, string> {
  const headers: Record<string, string> = {};
  
  if (includeContentType) {
    headers['Content-Type'] = 'application/json';
  }
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  if (customHeaders) {
    // Warn if both token and Authorization header are provided
    if (token && customHeaders['Authorization']) {
      console.warn('Both token and Authorization header provided. Custom Authorization header will override token.');
    }
    Object.assign(headers, customHeaders);
  }
  
  return headers;
}

/**
 * Validate headers are all strings
 * @param headers Headers to validate
 * @returns Error message if invalid, null if valid
 */
function validateHeaders(headers?: Record<string, string>): string | null {
  if (!headers) return null;
  
  for (const [key, value] of Object.entries(headers)) {
    if (typeof value !== 'string') {
      return `Header '${key}' must be a string, got ${typeof value}`;
    }
  }
  
  return null;
}

/**
 * Tool for making GET requests
 */
export class GetRequestTool extends ApiToolBase {
  /**
   * Execute the GET request tool
   */
  async execute(args: BaseRequestArgs, context: ToolContext): Promise<ToolResponse> {
    return this.safeExecute(context, async (apiContext) => {
      // Validate headers
      const headerError = validateHeaders(args.headers);
      if (headerError) {
        return createErrorResponse(headerError);
      }
      
      const response = await apiContext.get(args.url, {
        headers: buildHeaders(args.token, args.headers)
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
  async execute(args: RequestWithBodyArgs, context: ToolContext): Promise<ToolResponse> {
    return this.safeExecute(context, async (apiContext) => {
      // Validate headers
      const headerError = validateHeaders(args.headers);
      if (headerError) {
        return createErrorResponse(headerError);
      }
      
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
        data: parseJsonSafely(args.value),
        headers: buildHeaders(args.token, args.headers, true)
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
  async execute(args: RequestWithBodyArgs, context: ToolContext): Promise<ToolResponse> {
    return this.safeExecute(context, async (apiContext) => {
      // Validate headers
      const headerError = validateHeaders(args.headers);
      if (headerError) {
        return createErrorResponse(headerError);
      }
      
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
        data: parseJsonSafely(args.value),
        headers: buildHeaders(args.token, args.headers, true)
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
  async execute(args: RequestWithBodyArgs, context: ToolContext): Promise<ToolResponse> {
    return this.safeExecute(context, async (apiContext) => {
      // Validate headers
      const headerError = validateHeaders(args.headers);
      if (headerError) {
        return createErrorResponse(headerError);
      }
      
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
        data: parseJsonSafely(args.value),
        headers: buildHeaders(args.token, args.headers, true)
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
  async execute(args: BaseRequestArgs, context: ToolContext): Promise<ToolResponse> {
    return this.safeExecute(context, async (apiContext) => {
      // Validate headers
      const headerError = validateHeaders(args.headers);
      if (headerError) {
        return createErrorResponse(headerError);
      }
      
      const response = await apiContext.delete(args.url, {
        headers: buildHeaders(args.token, args.headers)
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