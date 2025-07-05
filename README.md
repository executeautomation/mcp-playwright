
# mcp-playwright_Mod - Extended Playwright MCP Server

A comprehensive Model Context Protocol (MCP) server that provides extensive browser automation capabilities using Playwright. This extended version includes advanced features for Shadow DOM interaction, mobile testing, accessibility testing, performance monitoring, and much more.

## 🚀 Features

### Core Browser Automation
- **Navigation**: Go to URLs, back/forward navigation, page reload
- **Element Interaction**: Click, fill forms, hover, drag & drop, file uploads
- **Content Extraction**: Get text, HTML, attributes, page title, current URL
- **Screenshots**: Full page or element-specific screenshots
- **Waiting**: Wait for elements, timeouts, and custom conditions

### 🔍 Advanced Shadow DOM Support
- **Shadow DOM Analysis**: Comprehensive analysis of Shadow DOM structures with CSS and XPath selectors
- **Shadow DOM Interaction**: Direct interaction with elements inside Shadow DOM
- **Automatic Piercing**: Leverage Playwright's built-in Shadow DOM piercing capabilities
- **Extended Selector Support**: Enhanced selectors that work across shadow boundaries

### 📱 Mobile & Touch Testing
- **Device Emulation**: Emulate popular mobile devices (iPhone, Android, iPad)
- **Touch Gestures**: Tap, swipe, pinch, long press, and multi-touch gestures
- **Mobile Interactions**: Orientation changes, geolocation, network simulation
- **Responsive Testing**: Custom viewport configurations

### 🎯 Enhanced Dropdown Support
- **Advanced Dropdowns**: Multiple selection methods (by value, label, index)
- **Custom Dropdowns**: Support for non-select element dropdowns
- **Dropdown Analysis**: Comprehensive dropdown structure analysis
- **Multi-select Support**: Handle multiple selections in dropdowns

### 🌐 Network Control
- **Request Interception**: Mock, block, modify, or delay network requests
- **Network Monitoring**: Capture and analyze network traffic
- **WebSocket Support**: Monitor and mock WebSocket connections
- **HAR Integration**: Record and replay network interactions

### 💾 Storage Management
- **Cookie Management**: Full CRUD operations for cookies with import/export
- **Local Storage**: Complete localStorage management
- **Session Storage**: Full sessionStorage control
- **Storage State**: Save and restore complete browser state

### ♿ Accessibility Testing
- **axe-core Integration**: Comprehensive accessibility testing with WCAG compliance
- **Accessibility Tree**: Analyze and navigate the accessibility tree
- **Keyboard Navigation**: Test tab sequences and focus management
- **ARIA Support**: Find elements by accessibility roles and properties

### ⚡ Performance Monitoring
- **Core Web Vitals**: Measure LCP, FID, CLS, and other performance metrics
- **Resource Timing**: Analyze network resource performance
- **Memory Monitoring**: Track JavaScript heap usage and memory leaks
- **Lighthouse Audits**: Basic Lighthouse-style performance audits

### 🐛 Advanced Debugging
- **Tracing**: Record detailed execution traces with screenshots
- **Console Capture**: Monitor and capture console messages and errors
- **Step Debugging**: Step-by-step execution with visual feedback
- **DevTools Integration**: Chrome DevTools Protocol integration
- **Element Inspection**: Detailed element debugging and analysis

### 🔧 Code Generation
- **Test Recording**: Record user interactions and generate Playwright test code
- **Multiple Formats**: Support for different test frameworks and languages
- **Smart Selectors**: Generate robust, maintainable selectors

## 📦 Installation

```bash
npm install
```

## 🔧 Configuration

Create or update your MCP configuration file:

```json
{
  "mcpServers": {
    "playwright_mod": {
      "command": "node",
      "args": ["path/to/mcp-playwright_Mod/build/index.js"],
      "env": {
        "HEADLESS": "false"
      }
    }
  }
}
```

### Environment Variables

- `HEADLESS`: Set to "false" to run browser in headed mode (default: "true")
- `BROWSER`: Browser to use - "chromium", "firefox", or "webkit" (default: "chromium")
- `VIEWPORT_WIDTH`: Default viewport width (default: 1280)
- `VIEWPORT_HEIGHT`: Default viewport height (default: 720)

## 🛠️ Usage Examples

### Basic Navigation and Interaction

```javascript
// Navigate to a website
await goto({ url: "https://example.com" });

// Fill a form and submit
await fill({ selector: "#username", value: "user@example.com" });
await fill({ selector: "#password", value: "password123" });
await click({ selector: "button[type='submit']" });

// Take a screenshot
await screenshot({ path: "result.png", fullPage: true });
```

### Shadow DOM Interaction

```javascript
// Analyze Shadow DOM structure
await analyze_shadow_dom({ tagNames: ["custom-element"] });

// Interact with Shadow DOM elements
await interact_shadow_dom({
  hostSelector: "custom-element",
  shadowSelector: "button.internal",
  action: "click"
});

// Use Playwright's automatic piercing
await pierce_shadow_dom({
  selector: "custom-element button.internal",
  action: "click"
});
```

### Mobile Testing

```javascript
// Emulate iPhone
await mobile_emulation({ device: "iPhone 13" });

// Perform touch gestures
await touch_gesture({
  gesture: "swipe",
  coordinates: {
    startX: 100, startY: 300,
    endX: 300, endY: 300
  }
});

// Test orientation changes
await mobile_interaction({
  action: "setOrientation",
  options: { orientation: "landscape" }
});
```

### Advanced Dropdown Handling

```javascript
// Analyze dropdown structure
await analyze_dropdown({ selector: "#country-select" });

// Select by different methods
await advanced_dropdown({
  selector: "#country-select",
  action: "selectByLabel",
  options: { label: "United States" }
});

// Handle custom dropdowns
await custom_dropdown({
  triggerSelector: ".custom-dropdown-trigger",
  optionSelector: ".dropdown-option",
  optionText: "Option 2"
});
```

### Network Control

```javascript
// Mock API responses
await network_interception({
  action: "mock",
  pattern: "**/api/users",
  response: {
    status: 200,
    body: JSON.stringify({ users: [] }),
    contentType: "application/json"
  }
});

// Monitor network requests
await network_monitor({ action: "startMonitoring" });
await network_monitor({
  action: "waitForRequest",
  options: { urlPattern: "/api/data" }
});
```

### Accessibility Testing

```javascript
// Run accessibility scan
await accessibility_test({
  action: "scan",
  options: {
    tags: ["wcag2a", "wcag2aa"],
    include: "main"
  }
});

// Test keyboard navigation
await keyboard_navigation({ action: "tabSequence" });

// Find elements by accessibility role
await accessibility_tree({
  action: "findByRole",
  role: "button",
  name: "Submit"
});
```

### Performance Monitoring

```javascript
// Start performance tracing
await performance_monitor({
  action: "startTracing",
  options: { screenshots: true }
});

// Get Core Web Vitals
await performance_monitor({ action: "getCoreWebVitals" });

// Monitor memory usage
await resource_monitor({ action: "memoryUsage" });

// Stop tracing
await performance_monitor({ action: "stopTracing" });
```

### Debugging

```javascript
// Start step-by-step debugging
await step_debugger({ action: "pause" });

// Inspect an element
await debug_tracing({
  action: "debugElement",
  options: { selector: "#problematic-element" }
});

// Capture console logs
await debug_tracing({ action: "captureConsole" });
await debug_tracing({ action: "getConsoleLogs" });
```

## 🏗️ Architecture

The server is built with a modular architecture:

```
src/
├── tools/
│   ├── browser/
│   │   ├── navigation.ts      # Navigation tools
│   │   ├── interaction.ts     # Basic interactions
│   │   ├── shadowdom.ts       # Shadow DOM tools
│   │   ├── dropdown.ts        # Dropdown tools
│   │   ├── mobile.ts          # Mobile & touch tools
│   │   ├── network.ts         # Network tools
│   │   ├── storage.ts         # Storage management
│   │   ├── accessibility.ts   # Accessibility tools
│   │   ├── performance.ts     # Performance monitoring
│   │   ├── debugging.ts       # Debugging tools
│   │   └── output.ts          # Output & extraction
│   ├── codegen/              # Code generation
│   └── common/               # Shared utilities
├── requestHandler.ts         # Main request handler
└── tools.ts                 # Tool definitions
```

## 🔄 Merge Strategy

This extended version is designed to be easily mergeable with updates from the original repository:

1. **Modular Extensions**: New features are in separate files
2. **Non-Breaking Changes**: Existing APIs remain unchanged
3. **Additive Approach**: Only adds new tools, doesn't modify existing ones
4. **Clear Separation**: Extended tools are clearly marked and documented

To merge updates from the original repository:

```bash
# Add original repository as upstream
git remote add upstream https://github.com/original/mcp-playwright.git

# Fetch latest changes
git fetch upstream

# Merge changes (resolve conflicts in favor of extensions)
git merge upstream/main
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:browser
npm run test:mobile
npm run test:accessibility
npm run test:performance

# Run with coverage
npm run test:coverage
```

## 📚 API Reference

### Tool Categories

1. **Navigation Tools**: `goto`, `go_back`, `go_forward`, `reload`
2. **Interaction Tools**: `click`, `fill`, `select`, `hover`, `drag`, `upload_file`
3. **Shadow DOM Tools**: `analyze_shadow_dom`, `interact_shadow_dom`, `pierce_shadow_dom`
4. **Dropdown Tools**: `advanced_dropdown`, `custom_dropdown`, `analyze_dropdown`
5. **Mobile Tools**: `mobile_emulation`, `touch_gesture`, `mobile_interaction`
6. **Network Tools**: `network_interception`, `network_monitor`, `websocket_tool`
7. **Storage Tools**: `cookie_management`, `local_storage`, `session_storage`, `storage_state`
8. **Accessibility Tools**: `accessibility_test`, `accessibility_tree`, `keyboard_navigation`
9. **Performance Tools**: `performance_monitor`, `lighthouse_audit`, `resource_monitor`
10. **Debugging Tools**: `debug_tracing`, `step_debugger`, `devtools_integration`
11. **Output Tools**: `screenshot`, `get_page_content`, `get_text_content`, etc.

### Error Handling

All tools include comprehensive error handling with detailed error messages and suggestions for resolution.

### Timeouts

Default timeouts can be configured globally or per-tool:
- Element interactions: 30 seconds
- Network requests: 30 seconds
- Page loads: 30 seconds

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🔗 Related Projects

- [Playwright](https://playwright.dev/) - The underlying browser automation library
- [MCP SDK](https://github.com/modelcontextprotocol/sdk) - Model Context Protocol SDK
- [axe-core](https://github.com/dequelabs/axe-core) - Accessibility testing engine

## 📞 Support

For issues and questions:
1. Check the [documentation](./docs/)
2. Search existing [issues](../../issues)
3. Create a new issue with detailed reproduction steps

---

**Note**: This is an extended version of the original mcp-playwright server with comprehensive additional features for modern web testing needs.
