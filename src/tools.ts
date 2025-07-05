
import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import { codegenTools } from './tools/codegen/index.js';

// Define tool categories for better organization
export const BROWSER_TOOLS = [
  "goto", "go_back", "go_forward", "reload",
  "click", "click_and_switch_tab", "iframe_click", "iframe_fill",
  "fill", "select", "hover", "upload_file", "evaluate", "drag",
  "analyze_shadow_dom", "interact_shadow_dom", "pierce_shadow_dom",
  "advanced_dropdown", "custom_dropdown", "analyze_dropdown",
  "mobile_emulation", "touch_gesture", "mobile_interaction",
  "network_interception", "network_monitor", "websocket_tool",
  "cookie_management", "local_storage", "session_storage", "storage_state",
  "accessibility_test", "accessibility_tree", "keyboard_navigation",
  "performance_monitor", "lighthouse_audit", "resource_monitor",
  "debug_tracing", "step_debugger", "devtools_integration",
  "screenshot", "get_page_content", "get_text_content",
  "get_element_attribute", "get_page_title", "get_current_url",
  "wait_for_element", "wait_for_timeout",
  "set_user_agent", "get_visible_page_info", "console_log"
];

export const API_TOOLS = [
  "api_get", "api_post", "api_put", "api_patch", "api_delete"
];

export function createToolDefinitions(): Tool[] {
  return [
    // Codegen tools
    {
      name: "start_codegen_session",
      description: "Start a new code generation session to record Playwright actions",
      inputSchema: {
        type: "object" as const,
        properties: {
          options: {
            type: "object",
            description: "Code generation options",
            properties: {
              outputPath: { 
                type: "string", 
                description: "Directory path where generated tests will be saved (use absolute path)" 
              },
              testNamePrefix: { 
                type: "string", 
                description: "Prefix to use for generated test names (default: 'GeneratedTest')" 
              },
              includeComments: { 
                type: "boolean", 
                description: "Whether to include descriptive comments in generated tests" 
              }
            },
            required: ["outputPath"]
          }
        },
        required: ["options"]
      }
    },
    {
      name: "end_codegen_session",
      description: "End a code generation session and generate the test file",
      inputSchema: {
        type: "object" as const,
        properties: {
          sessionId: { 
            type: "string", 
            description: "ID of the session to end" 
          }
        },
        required: ["sessionId"]
      }
    },

    // Browser navigation tools
    {
      name: "goto",
      description: "Navigate to a specific URL in the browser. This is the primary method for loading web pages.",
      inputSchema: {
        type: "object" as const,
        properties: {
          url: { 
            type: "string", 
            description: "The URL to navigate to (must include protocol: http:// or https://)" 
          },
          waitUntil: {
            type: "string",
            enum: ["load", "domcontentloaded", "networkidle"],
            description: "When to consider navigation complete (default: 'load')"
          }
        },
        required: ["url"]
      }
    },
    {
      name: "go_back",
      description: "Navigate back to the previous page in browser history, equivalent to clicking the browser's back button.",
      inputSchema: {
        type: "object" as const,
        properties: {}
      }
    },
    {
      name: "go_forward", 
      description: "Navigate forward to the next page in browser history, equivalent to clicking the browser's forward button.",
      inputSchema: {
        type: "object" as const,
        properties: {}
      }
    },
    {
      name: "reload",
      description: "Reload the current page, equivalent to pressing F5 or clicking the browser's refresh button.",
      inputSchema: {
        type: "object" as const,
        properties: {
          ignoreCache: {
            type: "boolean",
            description: "Whether to ignore cache when reloading (default: false)"
          }
        }
      }
    },

    // Browser interaction tools
    {
      name: "click",
      description: "Click on an element identified by a CSS selector. This is the most common interaction for buttons, links, and clickable elements.",
      inputSchema: {
        type: "object" as const,
        properties: {
          selector: { 
            type: "string", 
            description: "CSS selector to identify the element to click (e.g., '#button-id', '.class-name', 'button[type=\"submit\"]')" 
          },
          timeout: {
            type: "number",
            description: "Maximum time to wait for element in milliseconds (default: 30000)"
          }
        },
        required: ["selector"]
      }
    },
    {
      name: "click_and_switch_tab",
      description: "Click on a link that opens in a new tab and automatically switch focus to that new tab. Useful for handling target='_blank' links.",
      inputSchema: {
        type: "object" as const,
        properties: {
          selector: { 
            type: "string", 
            description: "CSS selector for the link that will open a new tab" 
          }
        },
        required: ["selector"]
      }
    },
    {
      name: "iframe_click",
      description: "Click on an element inside an iframe. Use this when the target element is within an iframe on the page.",
      inputSchema: {
        type: "object" as const,
        properties: {
          iframeSelector: { 
            type: "string", 
            description: "CSS selector to identify the iframe element" 
          },
          selector: { 
            type: "string", 
            description: "CSS selector for the element inside the iframe to click" 
          }
        },
        required: ["iframeSelector", "selector"]
      }
    },
    {
      name: "iframe_fill",
      description: "Fill a form field inside an iframe. Use this when the input element is within an iframe on the page.",
      inputSchema: {
        type: "object" as const,
        properties: {
          iframeSelector: { 
            type: "string", 
            description: "CSS selector to identify the iframe element" 
          },
          selector: { 
            type: "string", 
            description: "CSS selector for the input element inside the iframe" 
          },
          value: { 
            type: "string", 
            description: "Text to fill into the input field" 
          }
        },
        required: ["iframeSelector", "selector", "value"]
      }
    },
    {
      name: "fill",
      description: "Fill a form input field with text. This clears any existing content and types the new value.",
      inputSchema: {
        type: "object" as const,
        properties: {
          selector: { 
            type: "string", 
            description: "CSS selector for the input field (e.g., 'input[name=\"username\"]', '#email')" 
          },
          value: { 
            type: "string", 
            description: "Text to fill into the input field" 
          }
        },
        required: ["selector", "value"]
      }
    },
    {
      name: "select",
      description: "Select an option from a dropdown menu (HTML select element). Works with standard HTML select elements.",
      inputSchema: {
        type: "object" as const,
        properties: {
          selector: { 
            type: "string", 
            description: "CSS selector for the select element" 
          },
          value: { 
            type: "string", 
            description: "Value of the option to select (the 'value' attribute of the option element)" 
          }
        },
        required: ["selector", "value"]
      }
    },
    {
      name: "hover",
      description: "Hover the mouse over an element. This triggers hover effects and can reveal hidden menus or tooltips.",
      inputSchema: {
        type: "object" as const,
        properties: {
          selector: { 
            type: "string", 
            description: "CSS selector for the element to hover over" 
          }
        },
        required: ["selector"]
      }
    },
    {
      name: "upload_file",
      description: "Upload a file to a file input element. The file must exist on the system.",
      inputSchema: {
        type: "object" as const,
        properties: {
          selector: { 
            type: "string", 
            description: "CSS selector for the file input element (input[type=\"file\"])" 
          },
          filePath: { 
            type: "string", 
            description: "Absolute path to the file to upload" 
          }
        },
        required: ["selector", "filePath"]
      }
    },
    {
      name: "evaluate",
      description: "Execute JavaScript code in the browser context and return the result. Useful for complex interactions or data extraction.",
      inputSchema: {
        type: "object" as const,
        properties: {
          script: { 
            type: "string", 
            description: "JavaScript code to execute in the browser" 
          }
        },
        required: ["script"]
      }
    },
    {
      name: "drag",
      description: "Drag an element from one location to another. Useful for drag-and-drop interactions.",
      inputSchema: {
        type: "object" as const,
        properties: {
          sourceSelector: { 
            type: "string", 
            description: "CSS selector for the element to drag" 
          },
          targetSelector: { 
            type: "string", 
            description: "CSS selector for the target location to drop the element" 
          }
        },
        required: ["sourceSelector", "targetSelector"]
      }
    },

    // Shadow DOM tools
    {
      name: "analyze_shadow_dom",
      description: "Analyze and extract comprehensive information about Shadow DOM elements on the page. This tool finds all elements with shadow roots and provides detailed information including CSS selectors, XPath selectors, and text content.",
      inputSchema: {
        type: "object" as const,
        properties: {
          tagNames: {
            type: "array",
            items: { type: "string" },
            description: "Optional array of tag names to filter analysis (e.g., ['custom-element', 'my-component']). If not provided, analyzes all elements."
          }
        }
      }
    },
    {
      name: "interact_shadow_dom",
      description: "Interact with elements inside Shadow DOM using JavaScript evaluation. This tool can click, fill, or extract information from shadow DOM elements.",
      inputSchema: {
        type: "object" as const,
        properties: {
          hostSelector: {
            type: "string",
            description: "CSS selector for the shadow host element (the element that contains the shadow root)"
          },
          shadowSelector: {
            type: "string", 
            description: "CSS selector for the element inside the shadow DOM"
          },
          action: {
            type: "string",
            enum: ["click", "fill", "getText", "getAttribute", "hover"],
            description: "Action to perform on the shadow DOM element"
          },
          value: {
            type: "string",
            description: "Value to use for 'fill' action or attribute name for 'getAttribute' action"
          }
        },
        required: ["hostSelector", "shadowSelector", "action"]
      }
    },
    {
      name: "pierce_shadow_dom",
      description: "Use Playwright's built-in shadow DOM piercing capabilities to interact with elements across shadow boundaries. Playwright automatically pierces through open shadow roots.",
      inputSchema: {
        type: "object" as const,
        properties: {
          selector: {
            type: "string",
            description: "CSS selector that may cross shadow DOM boundaries. Playwright will automatically pierce through open shadow roots."
          },
          action: {
            type: "string",
            enum: ["click", "fill", "getText", "getAttribute", "hover", "isVisible", "count"],
            description: "Action to perform on the element"
          },
          value: {
            type: "string",
            description: "Value for 'fill' action or attribute name for 'getAttribute' action"
          }
        },
        required: ["selector", "action"]
      }
    },

    // Advanced dropdown tools
    {
      name: "advanced_dropdown",
      description: "Advanced dropdown interactions for HTML select elements with multiple selection methods and comprehensive option management.",
      inputSchema: {
        type: "object" as const,
        properties: {
          selector: {
            type: "string",
            description: "CSS selector for the select element"
          },
          action: {
            type: "string",
            enum: ["selectByValue", "selectByLabel", "selectByIndex", "selectMultiple", "getOptions", "getSelectedOptions", "clearSelection"],
            description: "Type of dropdown operation to perform"
          },
          options: {
            type: "object",
            description: "Options specific to the action",
            properties: {
              value: { type: "string", description: "Option value for selectByValue" },
              label: { type: "string", description: "Option label for selectByLabel" },
              index: { type: "number", description: "Option index for selectByIndex" },
              values: { 
                type: "array", 
                items: { type: "string" },
                description: "Array of values for selectMultiple" 
              }
            }
          }
        },
        required: ["selector", "action"]
      }
    },
    {
      name: "custom_dropdown",
      description: "Interact with custom dropdown implementations that don't use HTML select elements (e.g., div-based dropdowns).",
      inputSchema: {
        type: "object" as const,
        properties: {
          triggerSelector: {
            type: "string",
            description: "CSS selector for the element that opens the dropdown"
          },
          optionSelector: {
            type: "string",
            description: "CSS selector for dropdown options (will match multiple elements)"
          },
          optionText: {
            type: "string",
            description: "Text content of the option to select"
          },
          waitForOptions: {
            type: "boolean",
            description: "Whether to wait for options to appear after clicking trigger (default: true)"
          }
        },
        required: ["triggerSelector", "optionSelector"]
      }
    },
    {
      name: "analyze_dropdown",
      description: "Analyze dropdown structure and extract all available options with their properties.",
      inputSchema: {
        type: "object" as const,
        properties: {
          selector: {
            type: "string",
            description: "CSS selector for the dropdown element (select or custom dropdown container)"
          }
        },
        required: ["selector"]
      }
    },

    // Mobile and touch tools
    {
      name: "mobile_emulation",
      description: "Emulate mobile devices or set custom viewport for mobile testing. This changes the browser's viewport, user agent, and touch capabilities.",
      inputSchema: {
        type: "object" as const,
        properties: {
          device: {
            type: "string",
            description: "Predefined device name (e.g., 'iPhone 13', 'Pixel 7', 'iPad'). Use this for standard device emulation."
          },
          customViewport: {
            type: "object",
            description: "Custom viewport settings when not using a predefined device",
            properties: {
              width: { type: "number", description: "Viewport width in pixels" },
              height: { type: "number", description: "Viewport height in pixels" },
              userAgent: { type: "string", description: "Custom user agent string" }
            }
          }
        }
      }
    },
    {
      name: "touch_gesture",
      description: "Perform touch gestures for mobile testing including tap, swipe, pinch, and long press.",
      inputSchema: {
        type: "object" as const,
        properties: {
          gesture: {
            type: "string",
            enum: ["tap", "doubleTap", "longPress", "swipe", "pinch"],
            description: "Type of touch gesture to perform"
          },
          selector: {
            type: "string",
            description: "CSS selector for the target element (alternative to coordinates)"
          },
          coordinates: {
            type: "object",
            description: "Coordinate-based gesture parameters",
            properties: {
              x: { type: "number", description: "X coordinate" },
              y: { type: "number", description: "Y coordinate" },
              startX: { type: "number", description: "Start X for swipe" },
              startY: { type: "number", description: "Start Y for swipe" },
              endX: { type: "number", description: "End X for swipe" },
              endY: { type: "number", description: "End Y for swipe" },
              centerX: { type: "number", description: "Center X for pinch" },
              centerY: { type: "number", description: "Center Y for pinch" },
              startDistance: { type: "number", description: "Start distance for pinch" },
              endDistance: { type: "number", description: "End distance for pinch" }
            }
          },
          options: {
            type: "object",
            description: "Additional gesture options",
            properties: {
              duration: { type: "number", description: "Duration for long press (ms)" },
              steps: { type: "number", description: "Number of steps for smooth gestures" },
              stepDelay: { type: "number", description: "Delay between steps (ms)" }
            }
          }
        },
        required: ["gesture"]
      }
    },
    {
      name: "mobile_interaction",
      description: "Mobile-specific interactions like orientation changes, geolocation, and network simulation.",
      inputSchema: {
        type: "object" as const,
        properties: {
          action: {
            type: "string",
            enum: ["setOrientation", "setGeolocation", "simulateNetworkCondition", "hideKeyboard"],
            description: "Type of mobile interaction"
          },
          options: {
            type: "object",
            description: "Action-specific options",
            properties: {
              orientation: { 
                type: "string", 
                enum: ["portrait", "landscape"],
                description: "Device orientation" 
              },
              latitude: { type: "number", description: "Latitude for geolocation" },
              longitude: { type: "number", description: "Longitude for geolocation" },
              condition: { 
                type: "string", 
                enum: ["slow3g", "fast3g", "offline"],
                description: "Network condition to simulate" 
              }
            }
          }
        },
        required: ["action"]
      }
    },

    // Network tools
    {
      name: "network_interception",
      description: "Intercept, mock, modify, or block network requests. Essential for testing with controlled API responses.",
      inputSchema: {
        type: "object" as const,
        properties: {
          action: {
            type: "string",
            enum: ["mock", "block", "modify", "delay", "redirect", "unroute"],
            description: "Type of network interception"
          },
          pattern: {
            type: "string",
            description: "URL pattern to intercept (string, glob pattern, or regex)"
          },
          response: {
            type: "object",
            description: "Mock response data for 'mock' action",
            properties: {
              status: { type: "number", description: "HTTP status code" },
              headers: { type: "object", description: "Response headers" },
              body: { type: "string", description: "Response body" },
              contentType: { type: "string", description: "Content-Type header" }
            }
          },
          options: {
            type: "object",
            description: "Additional options for specific actions",
            properties: {
              delay: { type: "number", description: "Delay in milliseconds" },
              redirectUrl: { type: "string", description: "URL to redirect to" },
              replaceText: {
                type: "object",
                properties: {
                  from: { type: "string", description: "Text to replace" },
                  to: { type: "string", description: "Replacement text" }
                }
              }
            }
          }
        },
        required: ["action", "pattern"]
      }
    },
    {
      name: "network_monitor",
      description: "Monitor network activity, capture requests and responses, and wait for specific network events.",
      inputSchema: {
        type: "object" as const,
        properties: {
          action: {
            type: "string",
            enum: ["startMonitoring", "getRequests", "waitForRequest", "waitForResponse"],
            description: "Type of network monitoring action"
          },
          options: {
            type: "object",
            description: "Monitoring options",
            properties: {
              urlPattern: { type: "string", description: "URL pattern to wait for or filter" },
              timeout: { type: "number", description: "Timeout in milliseconds (default: 30000)" }
            }
          }
        },
        required: ["action"]
      }
    },
    {
      name: "websocket_tool",
      description: "Monitor and interact with WebSocket connections for real-time application testing.",
      inputSchema: {
        type: "object" as const,
        properties: {
          action: {
            type: "string",
            enum: ["monitor", "mock", "getMessages"],
            description: "WebSocket operation type"
          },
          options: {
            type: "object",
            description: "WebSocket options",
            properties: {
              url: { type: "string", description: "WebSocket URL pattern" },
              mockResponse: { type: "string", description: "Mock response message" }
            }
          }
        },
        required: ["action"]
      }
    },

    // Storage management tools
    {
      name: "cookie_management",
      description: "Comprehensive cookie management including get, set, delete, import, and export operations.",
      inputSchema: {
        type: "object" as const,
        properties: {
          action: {
            type: "string",
            enum: ["get", "set", "delete", "export", "import"],
            description: "Cookie operation type"
          },
          cookieData: {
            type: "object",
            description: "Cookie data for set/delete/import operations",
            properties: {
              name: { type: "string", description: "Cookie name" },
              value: { type: "string", description: "Cookie value" },
              domain: { type: "string", description: "Cookie domain" },
              path: { type: "string", description: "Cookie path" },
              expires: { type: "number", description: "Expiration timestamp" },
              httpOnly: { type: "boolean", description: "HTTP only flag" },
              secure: { type: "boolean", description: "Secure flag" },
              sameSite: { 
                type: "string", 
                enum: ["Strict", "Lax", "None"],
                description: "SameSite attribute" 
              },
              cookies: { 
                type: "array", 
                description: "Array of cookies for import operation" 
              }
            }
          },
          options: {
            type: "object",
            description: "Additional options",
            properties: {
              url: { type: "string", description: "URL to filter cookies for get operation" }
            }
          }
        },
        required: ["action"]
      }
    },
    {
      name: "local_storage",
      description: "Manage browser localStorage with get, set, remove, and utility operations.",
      inputSchema: {
        type: "object" as const,
        properties: {
          action: {
            type: "string",
            enum: ["get", "set", "remove", "length", "keys"],
            description: "localStorage operation type"
          },
          key: {
            type: "string",
            description: "Storage key (required for get, set, remove operations)"
          },
          value: {
            type: "string",
            description: "Storage value (required for set operation)"
          }
        },
        required: ["action"]
      }
    },
    {
      name: "session_storage",
      description: "Manage browser sessionStorage with get, set, remove, and utility operations.",
      inputSchema: {
        type: "object" as const,
        properties: {
          action: {
            type: "string",
            enum: ["get", "set", "remove", "length", "keys"],
            description: "sessionStorage operation type"
          },
          key: {
            type: "string",
            description: "Storage key (required for get, set, remove operations)"
          },
          value: {
            type: "string",
            description: "Storage value (required for set operation)"
          }
        },
        required: ["action"]
      }
    },
    {
      name: "storage_state",
      description: "Manage browser storage state (cookies, localStorage, sessionStorage) for session persistence and testing.",
      inputSchema: {
        type: "object" as const,
        properties: {
          action: {
            type: "string",
            enum: ["save", "load", "clear"],
            description: "Storage state operation"
          },
          filePath: {
            type: "string",
            description: "File path for save/load operations"
          },
          storageData: {
            type: "object",
            description: "Storage state data for load operation"
          }
        },
        required: ["action"]
      }
    },

    // Accessibility tools
    {
      name: "accessibility_test",
      description: "Perform comprehensive accessibility testing using axe-core engine. Tests for WCAG compliance and accessibility violations.",
      inputSchema: {
        type: "object" as const,
        properties: {
          action: {
            type: "string",
            enum: ["scan", "checkElement"],
            description: "Type of accessibility test"
          },
          options: {
            type: "object",
            description: "Accessibility testing options",
            properties: {
              include: { type: "string", description: "CSS selector to include in scan" },
              exclude: { type: "string", description: "CSS selector to exclude from scan" },
              tags: { 
                type: "array", 
                items: { type: "string" },
                description: "Accessibility rule tags (e.g., ['wcag2a', 'wcag2aa'])" 
              },
              disableRules: { 
                type: "array", 
                items: { type: "string" },
                description: "Rule IDs to disable" 
              },
              selector: { type: "string", description: "Element selector for checkElement action" }
            }
          }
        },
        required: ["action"]
      }
    },
    {
      name: "accessibility_tree",
      description: "Analyze the accessibility tree and find elements by accessibility properties.",
      inputSchema: {
        type: "object" as const,
        properties: {
          action: {
            type: "string",
            enum: ["getTree", "findByRole"],
            description: "Accessibility tree operation"
          },
          selector: {
            type: "string",
            description: "CSS selector for root element (optional for getTree)"
          },
          role: {
            type: "string",
            description: "ARIA role to search for (required for findByRole)"
          },
          name: {
            type: "string",
            description: "Accessible name to filter by (optional for findByRole)"
          }
        },
        required: ["action"]
      }
    },
    {
      name: "keyboard_navigation",
      description: "Test keyboard navigation, tab sequences, and focus management for accessibility compliance.",
      inputSchema: {
        type: "object" as const,
        properties: {
          action: {
            type: "string",
            enum: ["tabSequence", "testTabNavigation", "checkFocusTraps"],
            description: "Keyboard navigation test type"
          },
          options: {
            type: "object",
            description: "Navigation test options"
          }
        },
        required: ["action"]
      }
    },

    // Performance monitoring tools
    {
      name: "performance_monitor",
      description: "Monitor page performance, collect metrics, and analyze Core Web Vitals for performance optimization.",
      inputSchema: {
        type: "object" as const,
        properties: {
          action: {
            type: "string",
            enum: ["startTracing", "stopTracing", "getMetrics", "getCoreWebVitals", "getResourceTiming", "measurePageLoad"],
            description: "Performance monitoring action"
          },
          options: {
            type: "object",
            description: "Performance monitoring options",
            properties: {
              screenshots: { type: "boolean", description: "Include screenshots in trace" },
              path: { type: "string", description: "File path for trace output" }
            }
          }
        },
        required: ["action"]
      }
    },
    {
      name: "lighthouse_audit",
      description: "Perform Lighthouse-style audits for performance, accessibility, SEO, and best practices.",
      inputSchema: {
        type: "object" as const,
        properties: {
          action: {
            type: "string",
            enum: ["basicAudit", "performanceScore"],
            description: "Type of audit to perform"
          },
          options: {
            type: "object",
            description: "Audit options"
          }
        },
        required: ["action"]
      }
    },
    {
      name: "resource_monitor",
      description: "Monitor memory usage, network resources, and DOM complexity for performance analysis.",
      inputSchema: {
        type: "object" as const,
        properties: {
          action: {
            type: "string",
            enum: ["memoryUsage", "networkResources", "domComplexity"],
            description: "Resource monitoring type"
          },
          options: {
            type: "object",
            description: "Monitoring options"
          }
        },
        required: ["action"]
      }
    },

    // Debugging and tracing tools
    {
      name: "debug_tracing",
      description: "Advanced debugging with tracing, console capture, error monitoring, and element inspection.",
      inputSchema: {
        type: "object" as const,
        properties: {
          action: {
            type: "string",
            enum: ["startTrace", "stopTrace", "captureConsole", "getConsoleLogs", "captureErrors", "getErrors", "debugElement", "inspectLocator", "waitForCondition"],
            description: "Debugging action type"
          },
          options: {
            type: "object",
            description: "Debugging options",
            properties: {
              screenshots: { type: "boolean", description: "Include screenshots in trace" },
              path: { type: "string", description: "File path for trace output" },
              categories: { 
                type: "array", 
                items: { type: "string" },
                description: "Trace categories" 
              },
              selector: { type: "string", description: "Element selector for debugging" },
              locatorString: { type: "string", description: "Locator string to inspect" },
              condition: { type: "string", description: "JavaScript condition to wait for" },
              timeout: { type: "number", description: "Timeout in milliseconds" }
            }
          }
        },
        required: ["action"]
      }
    },
    {
      name: "step_debugger",
      description: "Step-by-step debugging with pause, resume, step execution, and element inspection capabilities.",
      inputSchema: {
        type: "object" as const,
        properties: {
          action: {
            type: "string",
            enum: ["pause", "resume", "step", "inspect", "screenshot"],
            description: "Step debugger action"
          },
          options: {
            type: "object",
            description: "Step debugger options",
            properties: {
              stepAction: { 
                type: "string", 
                enum: ["click", "fill", "hover"],
                description: "Action to perform in step mode" 
              },
              selector: { type: "string", description: "Element selector" },
              value: { type: "string", description: "Value for fill action" },
              path: { type: "string", description: "Screenshot file path" }
            }
          }
        },
        required: ["action"]
      }
    },
    {
      name: "devtools_integration",
      description: "Integrate with Chrome DevTools Protocol for advanced debugging, breakpoints, and performance profiling.",
      inputSchema: {
        type: "object" as const,
        properties: {
          action: {
            type: "string",
            enum: ["enableDomains", "setBreakpoint", "evaluateExpression", "getCallStack", "profilePerformance"],
            description: "DevTools integration action"
          },
          options: {
            type: "object",
            description: "DevTools options",
            properties: {
              domains: { 
                type: "array", 
                items: { type: "string" },
                description: "DevTools domains to enable" 
              },
              url: { type: "string", description: "URL for breakpoint" },
              lineNumber: { type: "number", description: "Line number for breakpoint" },
              expression: { type: "string", description: "JavaScript expression to evaluate" },
              duration: { type: "number", description: "Profiling duration in milliseconds" }
            }
          }
        },
        required: ["action"]
      }
    },

    // Output and information tools
    {
      name: "screenshot",
      description: "Take a screenshot of the current page or a specific element. Useful for visual verification and debugging.",
      inputSchema: {
        type: "object" as const,
        properties: {
          selector: {
            type: "string",
            description: "CSS selector for element to screenshot (optional - if not provided, screenshots the full page)"
          },
          path: {
            type: "string",
            description: "File path to save the screenshot (optional)"
          },
          fullPage: {
            type: "boolean",
            description: "Whether to take a full page screenshot (default: false)"
          }
        }
      }
    },
    {
      name: "get_page_content",
      description: "Get the full HTML content of the current page. Useful for content analysis and verification.",
      inputSchema: {
        type: "object" as const,
        properties: {}
      }
    },
    {
      name: "get_text_content",
      description: "Extract visible text content from the page or a specific element. Filters out HTML tags and returns clean text.",
      inputSchema: {
        type: "object" as const,
        properties: {
          selector: {
            type: "string",
            description: "CSS selector for element to extract text from (optional - if not provided, gets all page text)"
          }
        }
      }
    },
    {
      name: "get_element_attribute",
      description: "Get the value of a specific attribute from an element. Useful for extracting data attributes, URLs, IDs, etc.",
      inputSchema: {
        type: "object" as const,
        properties: {
          selector: {
            type: "string",
            description: "CSS selector for the target element"
          },
          attribute: {
            type: "string",
            description: "Name of the attribute to retrieve (e.g., 'href', 'src', 'data-id', 'class')"
          }
        },
        required: ["selector", "attribute"]
      }
    },
    {
      name: "get_page_title",
      description: "Get the title of the current page (the content of the <title> tag).",
      inputSchema: {
        type: "object" as const,
        properties: {}
      }
    },
    {
      name: "get_current_url",
      description: "Get the current URL of the page, including any hash fragments or query parameters.",
      inputSchema: {
        type: "object" as const,
        properties: {}
      }
    },

    // Wait and timing tools
    {
      name: "wait_for_element",
      description: "Wait for an element to appear, become visible, or meet specific conditions. Essential for handling dynamic content.",
      inputSchema: {
        type: "object" as const,
        properties: {
          selector: {
            type: "string",
            description: "CSS selector for the element to wait for"
          },
          state: {
            type: "string",
            enum: ["attached", "detached", "visible", "hidden"],
            description: "State to wait for (default: 'visible')"
          },
          timeout: {
            type: "number",
            description: "Maximum time to wait in milliseconds (default: 30000)"
          }
        },
        required: ["selector"]
      }
    },
    {
      name: "wait_for_timeout",
      description: "Wait for a specified amount of time. Use sparingly - prefer waiting for specific conditions when possible.",
      inputSchema: {
        type: "object" as const,
        properties: {
          timeout: {
            type: "number",
            description: "Time to wait in milliseconds"
          }
        },
        required: ["timeout"]
      }
    },

    // Browser management tools
    {
      name: "set_user_agent",
      description: "Set a custom user agent string for the browser. Useful for testing different browser/device detection.",
      inputSchema: {
        type: "object" as const,
        properties: {
          userAgent: {
            type: "string",
            description: "Custom user agent string to set"
          }
        },
        required: ["userAgent"]
      }
    },
    {
      name: "get_visible_page_info",
      description: "Get comprehensive information about the current page including title, URL, viewport size, and basic metrics.",
      inputSchema: {
        type: "object" as const,
        properties: {}
      }
    },
    {
      name: "console_log",
      description: "Get console logs from the browser. Useful for debugging JavaScript errors and monitoring console output.",
      inputSchema: {
        type: "object" as const,
        properties: {
          clear: {
            type: "boolean",
            description: "Whether to clear the console logs after retrieving them (default: false)"
          }
        }
      }
    }
  ];
}
