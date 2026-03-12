import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import { codegenTools } from './tools/codegen';

export function createToolDefinitions() {
  return [
    // Codegen tools
    {
      name: "start_codegen_session",
      description: "Start a new code generation session to record Playwright actions for automated test creation. Use when the user wants to begin capturing browser interactions that will be converted into test code. Do not use when a session is already active (use clear_codegen_session first) or when you only need to execute single actions without recording (use individual playwright_ tools instead). Accepts `session_id` (optional identifier) and `output_format` (optional: "javascript", "python", "csharp"). e.g., session_id="login_test", output_format="javascript". Raises an error if a session with the same ID already exists.",
      inputSchema: {
        type: "object",
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
      description: "Finalize a code generation session and generate the complete Playwright test file from recorded actions. Use when the user wants to complete their test recording and output the final test code. Do not use when you need to discard the session without generating a test (use clear_codegen_session instead). Accepts `session_id` (required) and `output_format` (optional: "javascript" or "typescript"). e.g., session_id="session_123", output_format="typescript". Raises an error if no active session exists or if the session contains no recorded actions.",
      inputSchema: {
        type: "object",
        properties: {
          sessionId: { 
            type: "string", 
            description: "ID of the session to end" 
          }
        },
        required: ["sessionId"]
      }
    },
    {
      name: "get_codegen_session",
      description: "Retrieve detailed information about the current active code generation session including recorded actions and session state. Use when the user wants to check the status, review recorded steps, or inspect session metadata before ending or clearing a session. Do not use when you need to start a new session (use start_codegen_session instead) or when you want to finalize the session (use end_codegen_session instead). Accepts `session_id` (optional) to query a specific session or defaults to the currently active session. e.g., returns session ID, recorded actions count, and timestamp information. Raises an error if no active code generation session exists.",
      inputSchema: {
        type: "object",
        properties: {
          sessionId: { 
            type: "string", 
            description: "ID of the session to retrieve" 
          }
        },
        required: ["sessionId"]
      }
    },
    {
      name: "clear_codegen_session",
      description: "Clear a code generation session without generating a test file. Use when the user wants to discard recorded Playwright actions and start fresh without saving the current session. Do not use when you want to save the recorded actions as a test (use end_codegen_session instead). Accepts `session_id` (required) to identify which session to clear. e.g., session_id="playwright_session_123". Raises an error if the specified session does not exist or is already cleared.",
      inputSchema: {
        type: "object",
        properties: {
          sessionId: { 
            type: "string", 
            description: "ID of the session to clear" 
          }
        },
        required: ["sessionId"]
      }
    },
    {
      name: "playwright_navigate",
      description: "Navigate to a specified URL in the browser. Use when the user wants to load a new webpage, redirect to a different site, or start browsing from a specific address. Accepts `url` (required string), e.g., "https://example.com" or "https://github.com/login". Do not use when you need to interact with elements on the current page (use playwright_click, playwright_fill, or other interaction tools instead). Raises an error if the URL is malformed or the page fails to load within the timeout period.",
      inputSchema: {
        type: "object",
        properties: {
          url: { type: "string", description: "URL to navigate to the website specified" },
          browserType: { type: "string", description: "Browser type to use (chromium, firefox, webkit). Defaults to chromium", enum: ["chromium", "firefox", "webkit"] },
          width: { type: "number", description: "Viewport width in pixels (default: 1280)" },
          height: { type: "number", description: "Viewport height in pixels (default: 720)" },
          timeout: { type: "number", description: "Navigation timeout in milliseconds" },
          waitUntil: { type: "string", description: "Navigation wait condition" },
          headless: { type: "boolean", description: "Run browser in headless mode (default: false)" }
        },
        required: ["url"],
      },
    },
    {
      name: "playwright_screenshot",
      description: "Capture a screenshot of the current webpage or a specific element on the page. Use when the user wants to visually document, debug, or verify the current state of a web page or UI component. Do not use when you need to interact with page elements (use playwright_click or playwright_fill instead). Accepts `selector` (optional, targets specific element), `full_page` (optional boolean for full-page capture), and `path` (optional, save location). e.g., selector="#login-form" or full_page=true. Raises an error if the specified element selector is not found on the page.",
      inputSchema: {
        type: "object",
        properties: {
          name: { type: "string", description: "Name for the screenshot" },
          selector: { type: "string", description: "CSS selector for element to screenshot" },
          width: { type: "number", description: "Width in pixels (default: 800)" },
          height: { type: "number", description: "Height in pixels (default: 600)" },
          storeBase64: { type: "boolean", description: "Store screenshot in base64 format (default: true)" },
          fullPage: { type: "boolean", description: "Store screenshot of the entire page (default: false)" },
          savePng: { type: "boolean", description: "Save screenshot as PNG file (default: false)" },
          downloadsDir: { type: "string", description: "Custom downloads directory path (default: user's Downloads folder)" },
        },
        required: ["name"],
      },
    },
    {
      name: "playwright_click",
      description: "Click an element on the page to trigger interactions like buttons, links, or clickable components. Use when the user wants to interact with visible page elements to navigate, submit forms, or activate functionality. Do not use when the element is inside an iframe (use playwright_iframe_click instead) or when you need to fill text into input fields (use playwright_fill instead). Accepts `selector` (required CSS selector or text content) and optional `timeout` parameter. e.g., selector="button[type='submit']" or selector="text=Login". Raises an error if the element is not found, not visible, or not clickable within the timeout period.",
      inputSchema: {
        type: "object",
        properties: {
          selector: { type: "string", description: "CSS selector for the element to click" },
        },
        required: ["selector"],
      },
    },
    {
      name: "playwright_iframe_click",
      description: "Click an element within an iframe on the current page. Use when the user wants to interact with buttons, links, or clickable elements that are embedded inside an iframe. Do not use when the element is in the main page content (use playwright_click instead) or when you need to fill text into an iframe element (use playwright_iframe_fill instead). Accepts `iframe_selector` (required, CSS selector for the iframe), `element_selector` (required, CSS selector for the element within the iframe), and `timeout` (optional, milliseconds). e.g., iframe_selector="#payment-frame", element_selector="button[type='submit']". Raises an error if the iframe or target element cannot be found within the timeout period.",
      inputSchema: {
        type: "object",
        properties: {
          iframeSelector: { type: "string", description: "CSS selector for the iframe containing the element to click" },
          selector: { type: "string", description: "CSS selector for the element to click" },
        },
        required: ["iframeSelector", "selector"],
      },
    },
    {
      name: "playwright_iframe_fill",
      description: "Fill text into an input field located within an iframe on the page. Use when the user wants to enter data into form fields that are embedded in iframes or cross-origin content. Do not use when the target element is in the main page content (use playwright_fill instead). Accepts `iframe_selector` (required), `element_selector` (required), and `text` (required). e.g., iframe_selector="#payment-frame", element_selector="input[name='cardNumber']", text="4111111111111111". Raises an error if the iframe cannot be found or the element is not fillable.",
      inputSchema: {
        type: "object",
        properties: {
          iframeSelector: { type: "string", description: "CSS selector for the iframe containing the element to fill" },
          selector: { type: "string", description: "CSS selector for the element to fill" },
          value: { type: "string", description: "Value to fill" },
        },
        required: ["iframeSelector", "selector", "value"],
      },
    },
    {
      name: "playwright_fill",
      description: "Fill text into an input field, textarea, or other form element on the current page. Use when the user wants to enter text data into web forms, search boxes, or editable fields. Do not use when you need to interact with elements inside an iframe (use playwright_iframe_fill instead) or select from dropdown options (use playwright_select instead). Accepts `selector` (required CSS/XPath selector), `text` (required string to enter), and `options` (optional object with delay, timeout settings). e.g., selector="#email", text="user@example.com". Raises an error if the element is not found, not visible, or not editable.",
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
      description: "Select an option from a dropdown element with a Select tag on the page. Use when the user wants to choose a value from a dropdown menu or select list. Do not use when you need to fill text into an input field (use playwright_fill instead) or click regular buttons (use playwright_click instead). Accepts `selector` (required CSS/XPath selector) and `value` (required option value or text to select), e.g., selector="#country-dropdown", value="United States". Raises an error if the select element is not found or the specified option does not exist.",
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
      description: "Hover over an element on the page to trigger hover effects like tooltips, dropdown menus, or visual state changes. Use when the user wants to reveal hidden content, test hover interactions, or simulate mouse-over behavior without clicking. Do not use when you need to actually click an element (use playwright_click instead). Accepts `selector` (required CSS selector or text content) and optional `timeout` parameter. e.g., selector="#menu-button" or "Contact Us". Raises an error if the element is not found or not visible within the timeout period.",
      inputSchema: {
        type: "object",
        properties: {
          selector: { type: "string", description: "CSS selector for element to hover" },
        },
        required: ["selector"],
      },
    },
    {
      name: "playwright_upload_file",
      description: "Upload a file to an input[type='file'] element on the current page. Use when the user wants to attach documents, images, or other files through a file upload form field. Do not use when you need to fill text into regular input fields (use playwright_fill instead). Accepts `selector` (required CSS selector for the file input), `file_path` (required path to the file), and `timeout` (optional milliseconds). e.g., selector="input[type='file']", file_path="/path/to/document.pdf". Raises an error if the file does not exist or the selector does not match a file input element.",
      inputSchema: {
        type: "object",
        properties: {
          selector: { type: "string", description: "CSS selector for the file input element" },
          filePath: { type: "string", description: "Absolute path to the file to upload" }
        },
        required: ["selector", "filePath"],
      },
    },
    {
      name: "playwright_evaluate",
      description: "Execute JavaScript code in the browser console and return the result. Use when the user wants to run custom JavaScript, inspect page elements, or debug web applications programmatically. Do not use when you need to retrieve existing console messages (use playwright_console_logs instead). Accepts `expression` (required JavaScript code string), e.g., "document.title" or "window.location.href" or "document.querySelectorAll('.button').length". Raises an error if the JavaScript contains syntax errors or if no browser page is currently loaded.",
      inputSchema: {
        type: "object",
        properties: {
          script: { type: "string", description: "JavaScript code to execute" },
        },
        required: ["script"],
      },
    },
    {
      name: "playwright_console_logs",
      description: "Retrieve console logs from the browser with optional filtering by log level or message content. Use when the user wants to debug JavaScript errors, monitor console output, or analyze browser-generated messages during page interactions. Do not use when you need to execute JavaScript code in the browser (use playwright_evaluate instead). Accepts `level` (optional: "error", "warn", "info", "debug"), `message_filter` (optional string pattern), and `limit` (optional number of recent logs). e.g., level="error" to show only error messages, or message_filter="API" to find logs containing "API". Raises an error if no browser session is active or the page has not been loaded.",
      inputSchema: {
        type: "object",
        properties: {
          type: {
            type: "string",
            description: "Type of logs to retrieve (all, error, warning, log, info, debug, exception)",
            enum: ["all", "error", "warning", "log", "info", "debug", "exception"]
          },
          search: {
            type: "string",
            description: "Text to search for in logs (handles text with square brackets)"
          },
          limit: {
            type: "number",
            description: "Maximum number of logs to return"
          },
          clear: {
            type: "boolean",
            description: "Whether to clear logs after retrieval (default: false)"
          }
        },
        required: [],
      },
    },
    {
      name: "playwright_resize",
      description: "Resize the browser viewport to specific dimensions or device presets for responsive testing. Use when the user wants to test how a webpage appears on different screen sizes, devices, or orientations. Accepts `width` and `height` (integers) for custom dimensions, or `device` (string) for presets. Supports 143+ device presets such as "iPhone 14", "iPad Pro", "Galaxy S21", or desktop browsers like "Desktop Chrome". Do not use when you need to navigate to a different page first (use playwright_navigate instead). Raises an error if the device preset name is invalid or dimensions are negative.",
      inputSchema: {
        type: "object",
        properties: {
          device: { 
            type: "string", 
            description: "Device preset name (e.g., 'iPhone 13', 'iPad Pro 11', 'Pixel 7', 'Galaxy S24', 'Desktop Chrome'). Automatically configures viewport, user-agent, and device capabilities. Use playwright.devices to see all available devices." 
          },
          width: { 
            type: "number", 
            description: "Viewport width in pixels (for manual resize without device preset)" 
          },
          height: { 
            type: "number", 
            description: "Viewport height in pixels (for manual resize without device preset)" 
          },
          orientation: {
            type: "string",
            description: "Device orientation: 'portrait' or 'landscape' (only applies when using device preset)",
            enum: ["portrait", "landscape"]
          }
        },
        required: [],
      },
    },
    {
      name: "playwright_close",
      description: "Close the browser instance and release all associated resources including memory and processes. Use when the user wants to terminate the browser session after completing web automation tasks or testing. Do not use when you need to navigate to a different page or perform additional browser actions (use other playwright tools instead). Accepts no parameters (`void` function call). e.g., call after finishing a web scraping session or completing automated tests. Fails if no browser instance is currently running or already closed.",
      inputSchema: {
        type: "object",
        properties: {},
        required: [],
      },
    },
    {
      name: "playwright_get",
      description: "Execute an HTTP GET request to retrieve data from a web endpoint. Use when the user wants to fetch API responses, download content, or test HTTP endpoints programmatically. Do not use when you need to interact with page elements after navigation (use playwright_navigate instead). Accepts `url` (required string) and optional headers as key-value pairs. e.g., url="https://api.github.com/users/octocat" or url="https://example.com/data.json". Raises an error if the URL is malformed or the server returns a non-2xx status code.",
      inputSchema: {
        type: "object",
        properties: {
          url: { type: "string", description: "URL to perform GET operation" },
          token: { type: "string", description: "Bearer token for authorization" },
          headers: { 
            type: "object", 
            description: "Additional headers to include in the request",
            additionalProperties: { type: "string" }
          }
        },
        required: ["url"],
      },
    },
    {
      name: "playwright_post",
      description: "Send an HTTP POST request to submit data to a web server endpoint. Use when the user wants to submit form data, send JSON payloads, or interact with REST APIs that require POST methods. Do not use when you need to interact with page elements through the browser UI (use playwright_click or playwright_fill instead). Accepts `url` (required), `data` (optional JSON or form data), `headers` (optional), and `timeout` (optional). e.g., url="https://api.example.com/users", data={"name": "John", "email": "john@example.com"}. Raises an error if the URL is unreachable or the server returns a non-2xx status code.",
      inputSchema: {
        type: "object",
        properties: {
          url: { type: "string", description: "URL to perform POST operation" },
          value: { type: "string", description: "Data to post in the body" },
          token: { type: "string", description: "Bearer token for authorization" },
          headers: { 
            type: "object", 
            description: "Additional headers to include in the request",
            additionalProperties: { type: "string" }
          }
        },
        required: ["url", "value"],
      },
    },
    {
      name: "playwright_put",
      description: "Execute an HTTP PUT request to update or create a resource on a web server. Use when the user wants to send data to modify an existing resource or create a new one at a specific URL endpoint. Do not use when you need to interact with page elements or navigate within a browser (use other playwright tools instead). Accepts `url` (required), `data` (optional request body), `headers` (optional), and `timeout` (optional). e.g., url="https://api.example.com/users/123", data={"name": "John"}. Raises an error if the server returns a non-2xx status code or the request times out.",
      inputSchema: {
        type: "object",
        properties: {
          url: { type: "string", description: "URL to perform PUT operation" },
          value: { type: "string", description: "Data to PUT in the body" },
          token: { type: "string", description: "Bearer token for authorization" },
          headers: { 
            type: "object", 
            description: "Additional headers to include in the request",
            additionalProperties: { type: "string" }
          }
        },
        required: ["url", "value"],
      },
    },
    {
      name: "playwright_patch",
      description: "Send an HTTP PATCH request to update resources on a web server. Use when the user wants to modify existing data through API calls or test PATCH endpoints during web automation. Do not use when you need to interact with page elements (use playwright_click or playwright_fill instead). Accepts `url` (required), `data` (optional request body), and `headers` (optional HTTP headers). e.g., url="https://api.example.com/users/123", data={"name": "John"}. Raises an error if the URL is unreachable or returns a non-2xx status code.",
      inputSchema: {
        type: "object",
        properties: {
          url: { type: "string", description: "URL to perform PATCH operation" },
          value: { type: "string", description: "Data to PATCH in the body" },
          token: { type: "string", description: "Bearer token for authorization" },
          headers: { 
            type: "object", 
            description: "Additional headers to include in the request",
            additionalProperties: { type: "string" }
          }
        },
        required: ["url", "value"],
      },
    },
    {
      name: "playwright_delete",
      description: "Execute an HTTP DELETE request to remove resources from a web server. Use when the user wants to delete data, remove records, or perform cleanup operations via REST API calls. Do not use when you need to interact with page elements (use playwright_click instead). Accepts `url` (required), `headers` (optional object), and `data` (optional request body). e.g., url="https://api.example.com/users/123", headers={"Authorization": "Bearer token"}. Raises an error if the server returns a non-success status code or the URL is unreachable.",
      inputSchema: {
        type: "object",
        properties: {
          url: { type: "string", description: "URL to perform DELETE operation" },
          token: { type: "string", description: "Bearer token for authorization" },
          headers: { 
            type: "object", 
            description: "Additional headers to include in the request",
            additionalProperties: { type: "string" }
          }
        },
        required: ["url"],
      },
    },
    {
      name: "playwright_expect_response",
      description: "Start waiting for an HTTP response without blocking execution during Playwright automation. Use when the user wants to set up response monitoring that will be checked later in the test flow. Do not use when you need to immediately wait for and capture the response data (use playwright_evaluate with page.waitForResponse instead). Accepts `url_pattern` (required string or regex) and `timeout` (optional milliseconds). e.g., url_pattern="**/api/data" or url_pattern=/\.json$/. Returns immediately after starting the wait operation. Raises an error if the URL pattern is invalid or malformed.",
      inputSchema: {
        type: "object",
        properties: {
          id: { type: "string", description: "Unique & arbitrary identifier to be used for retrieving this response later with `Playwright_assert_response`." },
          url: { type: "string", description: "URL pattern to match in the response." }
        },
        required: ["id", "url"],
      },
    },
    {
      name: "playwright_assert_response",
      description: "Validate a previously initiated HTTP response wait operation and assert its properties. Use when the user wants to verify response status codes, headers, or body content after triggering a network request. Do not use when you need to initiate a new navigation or request (use playwright_navigate instead). Accepts `timeout` (optional, milliseconds), `status` (optional, expected status code), and `headers` (optional, object with expected header values). e.g., status=200, headers={"content-type": "application/json"}. Raises an error if the response validation fails or times out before completion.",
      inputSchema: {
        type: "object",
        properties: {
          id: { type: "string", description: "Identifier of the HTTP response initially expected using `Playwright_expect_response`." },
          value: { type: "string", description: "Data to expect in the body of the HTTP response. If provided, the assertion will fail if this value is not found in the response body." }
        },
        required: ["id"],
      },
    },
    {
      name: "playwright_custom_user_agent",
      description: "Set a custom User-Agent string for the browser session to simulate different devices or browsers. Use when the user wants to test how websites respond to specific browsers, mobile devices, or crawlers. Accepts `user_agent` (required string), e.g., "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)" or "Googlebot/2.1". Do not use when you need to navigate to a page first (use playwright_navigate instead). Raises an error if the user agent string is malformed or empty.",
      inputSchema: {
        type: "object",
        properties: {
          userAgent: { type: "string", description: "Custom User Agent for the Playwright browser instance" }
        },
        required: ["userAgent"],
      },
    },
    {
      name: "playwright_get_visible_text",
      description: "Extract the visible text content from the current web page. Use when the user wants to read, analyze, or capture all text displayed on a webpage for content analysis or verification. Do not use when you need to take a visual screenshot (use playwright_screenshot instead) or execute JavaScript to get dynamic content (use playwright_evaluate instead). Accepts no parameters and returns all human-readable text from the page. e.g., extracting article content, form labels, or button text for testing validation. Fails if no page is currently loaded in the browser session.",
      inputSchema: {
        type: "object",
        properties: {},
        required: [],
      },
    },
    {
      name: "playwright_get_visible_html",
      description: "Get the HTML content of the current page for inspection or analysis. Use when the user wants to examine the page structure, debug layout issues, or extract specific HTML elements. Accepts `removeScripts` (optional boolean, defaults to true to exclude script tags). Do not use when you need to interact with page elements (use playwright_click or playwright_fill instead) or capture visual content (use playwright_screenshot instead). e.g., removeScripts=false to include JavaScript code in the output. Raises an error if no page is currently loaded in the browser session.",
      inputSchema: {
        type: "object",
        properties: {
          selector: { type: "string", description: "CSS selector to limit the HTML to a specific container" },
          removeScripts: { type: "boolean", description: "Remove all script tags from the HTML (default: true)" },
          removeComments: { type: "boolean", description: "Remove all HTML comments (default: false)" },
          removeStyles: { type: "boolean", description: "Remove all style tags from the HTML (default: false)" },
          removeMeta: { type: "boolean", description: "Remove all meta tags from the HTML (default: false)" },
          cleanHtml: { type: "boolean", description: "Perform comprehensive HTML cleaning (default: false)" },
          minify: { type: "boolean", description: "Minify the HTML output (default: false)" },
          maxLength: { type: "number", description: "Maximum number of characters to return (default: 20000)" }
        },
        required: [],
      },
    },
    {
      name: "playwright_go_back",
      description: "Navigate back one page in the browser's history stack. Use when the user wants to return to the previously visited page or undo a navigation action. Do not use when you need to navigate to a specific URL (use playwright_navigate instead). Accepts no required parameters - operates on the current browser session context. e.g., after clicking a link or submitting a form, go back to the previous page. Fails if there is no previous page in the browser history stack.",
      inputSchema: {
        type: "object",
        properties: {},
        required: [],
      },
    },
    {
      name: "playwright_go_forward",
      description: "Navigate forward in browser history to the next page. Use when the user wants to move forward through previously visited pages after going back. Do not use when you need to navigate to a specific URL (use playwright_navigate instead). Takes no parameters. e.g., moving forward after using the back button to return to a form submission page. Fails if there is no forward history available in the browser session.",
      inputSchema: {
        type: "object",
        properties: {},
        required: [],
      },
    },
    {
      name: "playwright_drag",
      description: "Drag an element from its current position to a target location on the page. Use when the user wants to perform drag-and-drop interactions, reorder items, or move elements between containers. Do not use when you need to simply click an element (use playwright_click instead) or hover over it (use playwright_hover instead). Accepts `source_selector` (required), `target_selector` (required), and optional positioning parameters like `source_position` and `target_position`. e.g., dragging a file from one folder to another or reordering items in a sortable list. Raises an error if either the source or target element is not found or not visible on the page.",
      inputSchema: {
        type: "object",
        properties: {
          sourceSelector: { type: "string", description: "CSS selector for the element to drag" },
          targetSelector: { type: "string", description: "CSS selector for the target location" }
        },
        required: ["sourceSelector", "targetSelector"],
      },
    },
    {
      name: "playwright_press_key",
      description: "Press a keyboard key or key combination on the current page. Use when the user wants to simulate keyboard input like pressing Enter, Tab, Escape, or keyboard shortcuts. Do not use when you need to type text into a field (use playwright_fill instead). Accepts `key` (required string) such as "Enter", "Tab", "Escape", "Control+A", or "Shift+Tab". e.g., key="Enter" to submit a form or key="Escape" to close a modal. Raises an error if the page is not loaded or the key combination is invalid.",
      inputSchema: {
        type: "object",
        properties: {
          key: { type: "string", description: "Key to press (e.g. 'Enter', 'ArrowDown', 'a')" },
          selector: { type: "string", description: "Optional CSS selector to focus before pressing key" }
        },
        required: ["key"],
      },
    },
    {
      name: "playwright_save_as_pdf",
      description: "Generate a PDF file from the current webpage and save it to disk. Use when the user wants to create a downloadable PDF document of the webpage content for archiving, sharing, or offline viewing. Do not use when you need to capture a visual image of the page (use playwright_screenshot instead). Accepts `path` (required, file destination), `format` (optional: "A4", "Letter"), `landscape` (optional boolean), and `margin` options. e.g., path="report.pdf", format="A4", landscape=true. Raises an error if the page is not loaded or the specified directory path does not exist.",
      inputSchema: {
        type: "object",
        properties: {
          outputPath: { type: "string", description: "Directory path where PDF will be saved" },
          filename: { type: "string", description: "Name of the PDF file (default: page.pdf)" },
          format: { type: "string", description: "Page format (e.g. 'A4', 'Letter')" },
          printBackground: { type: "boolean", description: "Whether to print background graphics" },
          margin: {
            type: "object",
            description: "Page margins",
            properties: {
              top: { type: "string" },
              right: { type: "string" },
              bottom: { type: "string" },
              left: { type: "string" }
            }
          }
        },
        required: ["outputPath"],
      },
    },
    {
      name: "playwright_click_and_switch_tab",
      description: "Click a link element and automatically switch to the newly opened tab or window. Use when the user wants to navigate to a link that opens in a new tab and immediately work with that new page. Do not use when clicking links that stay in the same tab (use playwright_click instead). Accepts `selector` (required CSS selector or text content to identify the link), e.g., 'a[href="/new-page"]' or 'text="Open in New Tab"'. Raises an error if no new tab opens after clicking or if the selector matches multiple elements.",
      inputSchema: {
        type: "object",
        properties: {
          selector: { type: "string", description: "CSS selector for the link to click" },
        },
        required: ["selector"],
      },
    },
  ] as const satisfies Tool[];
}

// Browser-requiring tools for conditional browser launch
export const BROWSER_TOOLS = [
  "playwright_navigate",
  "playwright_screenshot",
  "playwright_click",
  "playwright_iframe_click",
  "playwright_iframe_fill",
  "playwright_fill",
  "playwright_select",
  "playwright_hover",
  "playwright_upload_file",
  "playwright_evaluate",
  "playwright_resize",
  "playwright_close",
  "playwright_expect_response",
  "playwright_assert_response",
  "playwright_custom_user_agent",
  "playwright_get_visible_text",
  "playwright_get_visible_html",
  "playwright_go_back",
  "playwright_go_forward",
  "playwright_drag",
  "playwright_press_key",
  "playwright_save_as_pdf",
  "playwright_click_and_switch_tab"
];

// API Request tools for conditional launch
export const API_TOOLS = [
  "playwright_get",
  "playwright_post",
  "playwright_put",
  "playwright_delete",
  "playwright_patch"
];

// Codegen tools
export const CODEGEN_TOOLS = [
  'start_codegen_session',
  'end_codegen_session',
  'get_codegen_session',
  'clear_codegen_session'
];

// All available tools
export const tools = [
  ...BROWSER_TOOLS,
  ...API_TOOLS,
  ...CODEGEN_TOOLS
];
