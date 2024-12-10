import { Tool } from "@modelcontextprotocol/sdk/types.js";

export function createToolDefinitions(): Tool[] {
  return [
    {
      name: "playwright_navigate",
      description: "Navigate to a URL",
      inputSchema: {
        type: "object",
        properties: {
          url: { type: "string" },
        },
        required: ["url"],
      },
    },
    {
      name: "playwright_screenshot",
      description: "Take a screenshot of the current page or a specific element",
      inputSchema: {
        type: "object",
        properties: {
          name: { type: "string", description: "Name for the screenshot" },
          selector: { type: "string", description: "CSS selector for element to screenshot" },
          width: { type: "number", description: "Width in pixels (default: 800)" },
          height: { type: "number", description: "Height in pixels (default: 600)" },
        },
        required: ["name"],
      },
    },
    {
      name: "playwright_click",
      description: "Click an element on the page",
      inputSchema: {
        type: "object",
        properties: {
          selector: { type: "string", description: "CSS selector for element to click" },
        },
        required: ["selector"],
      },
    },
    {
      name: "playwright_fill",
      description: "fill out an input field",
      inputSchema: {
        type: "object",
        properties: {
          selector: { type: "string", description: "CSS selector for input field" },
          value: { type: "string", description: "Value to fill" },
        },
        required: ["selector", "value"],
      },
    },
    {
      name: "playwright_select",
      description: "Select an element on the page with Select tag",
      inputSchema: {
        type: "object",
        properties: {
          selector: { type: "string", description: "CSS selector for element to select" },
          value: { type: "string", description: "Value to select" },
        },
        required: ["selector", "value"],
      },
    },
    {
      name: "playwright_hover",
      description: "Hover an element on the page",
      inputSchema: {
        type: "object",
        properties: {
          selector: { type: "string", description: "CSS selector for element to hover" },
        },
        required: ["selector"],
      },
    },
    {
      name: "playwright_evaluate",
      description: "Execute JavaScript in the browser console",
      inputSchema: {
        type: "object",
        properties: {
          script: { type: "string", description: "JavaScript code to execute" },
        },
        required: ["script"],
      },
    },
    {
      name: "playwright_get",
      description: "Perform an HTTP GET request",
      inputSchema: {
        type: "object",
        properties: {
          url: { type: "string", description: "URL to perform GET operation" }
        },
        required: ["url"],
      },
    },
  ];
}

// Browser-requiring tools for conditional browser launch
export const BROWSER_TOOLS = [
  "playwright_navigate", 
  "playwright_screenshot", 
  "playwright_click", 
  "playwright_fill", 
  "playwright_select", 
  "playwright_hover", 
  "playwright_evaluate"
];