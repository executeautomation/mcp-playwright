# Changelog

All notable changes to the Playwright MCP Server will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.12] - 2025-12-12

### Added
- **Automatic Browser Installation**: Server now automatically detects and installs missing browser binaries on first use
- **Smart Browser Detection**: Detects when Chromium, Firefox, or WebKit executables are missing during launch
- **Auto-Install Function**: Added `installBrowsers()` function that runs `npx playwright install <browser>` automatically
- **Installation Progress**: Clear console messages showing installation progress and status
- **Error Recovery**: Graceful fallback with helpful manual installation instructions if auto-install fails
- **Timeout Protection**: 2-minute timeout for browser installation process
- **Browser Installation Documentation**: Updated README.md with automatic installation section and browser storage locations

### Changed
- **Package Updates**:
  - Updated @modelcontextprotocol/sdk: 1.11.1 → 1.24.3 (major update)
  - Updated playwright: 1.53.1 → 1.57.0
  - Updated @playwright/browser-chromium: 1.53.1 → 1.57.0
  - Updated @playwright/browser-firefox: 1.53.1 → 1.57.0
  - Updated @playwright/browser-webkit: 1.53.1 → 1.57.0
  - Updated @playwright/test: 1.53.1 → 1.57.0
  - Updated express: 4.18.2 → 4.21.1 (patch update for stability)
  - Updated mcp-evals: 1.0.18 → 2.0.1 (major update)
- **Security Improvement**: Removed `shell: true` from spawn() in browser installation for better security
- **Enhanced ensureBrowser()**: Wrapped browser launch in try-catch to detect missing executables
- **Improved Error Messages**: Better error messages when browsers are missing or installation fails

### Fixed
- **"Executable doesn't exist" Error**: Users no longer need to manually run `npx playwright install` before first use
- **First-Run Experience**: Server now works out of the box without any manual browser setup

### Technical Details
- All 150 tests passing with updated packages
- Zero configuration required - fully automatic browser installation
- Backward compatible - no breaking changes
- Installation attempt triggers on any "Executable doesn't exist" or "Failed to launch" errors
- Browser installation attempts in both initial launch and retry scenarios

## [1.0.11] - 2025-12-11

### Added
- **Bearer Token Authentication**: Added `token` parameter to all API request methods (GET, POST, PUT, PATCH, DELETE) for Bearer token authentication
- **Custom Headers Support**: Added `headers` parameter to all API request methods for custom authentication and header management
- **Request Validation**: Added header value validation to ensure all headers are strings
- **Type Safety**: Added `BaseRequestArgs` and `RequestWithBodyArgs` TypeScript interfaces for better type safety
- **Helper Functions**: 
  - `buildHeaders()` - Centralized header building logic with token and custom header support
  - `validateHeaders()` - Validates header values are strings
  - Enhanced `parseJsonSafely()` - Improved JSON parsing with console warnings for debugging
- **Comprehensive Test Coverage**: Added 12 new edge case tests covering header validation, token/header conflicts, and invalid inputs
- **Enhanced Documentation**: 
  - Updated `Supported-Tools.mdx` with authentication parameters for all API methods
  - Added authentication examples to `Examples.md` with Bearer token, Basic auth, and API key examples

### Changed
- **Code Quality**: Refactored duplicate header building logic into shared helper function
- **Error Handling**: Improved error messages for invalid header values
- **Warnings**: Added console warnings when both `token` and custom `Authorization` header are provided
- **JSON Parsing**: Enhanced parseJsonSafely with warning logs for better debugging

### Fixed
- **Authentication Issue**: Fixed missing authentication support for GET, PUT, PATCH, DELETE requests (only POST had it previously)
- **Header Consistency**: Ensured consistent Content-Type header handling across POST, PUT, PATCH methods

### Technical Details
- All 154 tests passing (142 existing + 12 new edge case tests)
- Backward compatible: Existing API calls without token/headers continue to work
- Custom Authorization headers override token parameter when both are provided
- Header validation prevents runtime errors from invalid header types

## [1.0.10] - 2025-12-10

### Added
- **Device Preset Support**: `playwright_resize` now supports 143 pre-configured device presets from Playwright's device library
- **Orientation Support**: Portrait and landscape orientation switching for device presets
- **Enhanced Device Emulation**: Automatic configuration of viewport, user-agent, touch support, and device pixel ratio
- **Natural Language Support**: AI assistants can now use simple prompts like "Test on iPhone 13" or "Switch to iPad view"
- **Device Discovery Tool**: Added `scripts/list-devices.cjs` to list all available device presets
- **Comprehensive Documentation**: 
  - `docs/docs/playwright-web/Resize-Prompts-Guide.md` - Natural language prompt guide for AI assistants
  - `docs/docs/playwright-web/Device-Quick-Reference.md` - Quick reference card with popular devices
- **23 New Tests**: Comprehensive test coverage for device presets, orientation, and validation

### Changed
- **Enhanced `playwright_resize` Tool**: Updated to support both device presets and manual dimensions
- **Updated Tool Schema**: Added `device` and `orientation` parameters to `playwright_resize`
- **Improved Documentation**: Enhanced `Supported-Tools.mdx` with device preset examples and usage

### Technical Details
- Device presets include: iPhone (SE to 15 Pro Max), iPad (Mini to Pro 12.9), Pixel, Galaxy, Desktop browsers
- Backward compatible: Manual width/height dimensions still work exactly as before
- Test coverage: 134 total tests passing (111 existing + 23 new)
- Code coverage: 98% for resize.ts

## [1.0.9] - 2025-12-09

### Fixed
- **Critical Fix**: Console output buffering when running via `npx`
- Replaced `console.log()` with `process.stdout.write()` for immediate, unbuffered output
- Users now see immediate console output including server startup information and endpoints

### Changed
- Updated `src/index.ts` initialization message
- Updated `src/http-server.ts` startup banner

## [1.0.8] - 2025-12-08

### Changed
- Console output visibility improvements in HTTP mode
- Changed output from `stderr` to `stdout`
- Added initialization message display
- Improved user experience when starting server with `--port` flag

## [1.0.7] - 2025-12-07

### Added
- **HTTP/SSE Transport Mode**: Standalone HTTP server mode for enhanced deployment
- Multiple concurrent client sessions with automatic session management
- Health check endpoint (`/health`) for monitoring
- Dual endpoint support: `/sse` + `/messages` and `/mcp` (unified)
- Comprehensive request logging middleware
- Session lifecycle tracking

### Security
- **Critical**: Server now binds to 127.0.0.1 (localhost only) by default
- Prevents external network access and accidental exposure
- SSH tunneling documented for secure remote access

### Changed
- Logging in stdio mode now writes to file only (not stdout)
- Monitoring system disabled in stdio mode to prevent console output
- 40% code reduction in endpoint handlers through DRY refactoring

### Fixed
- Clean JSON-RPC communication with Claude Desktop in stdio mode
- Log file path uses home directory to avoid permission issues

## [1.0.6] - 2024-11-30

### Added
- **New Tool**: `playwright_upload_file` - Upload files to file input elements
- **New Tool**: `playwright_get_visible_html` - Retrieve full HTML content
- Enhanced `playwright_get_visible_text` for more accurate text extraction
- Support for locally installed browsers via Chrome executable path

### Changed
- `playwright_get_visible_html` now removes `<script>` tags by default
- HTML output truncated to 20,000 characters by default to prevent LLM issues
- Updated `playwright_hover` functionality

### Documentation
- Added local setup and installation guide
- Updated examples for new tools

## [1.0.5] - 2024-11-25

### Removed
- All SSE (Server-Sent Events) support and related code
- Server now only supports STDIO transport

### Changed
- Complete codebase cleanup removing SSE references

## [1.0.4] - 2024-11-20

### Added
- **New Tool**: `playwright_iframe_fill` - Fill input fields inside iframes
- **New Tool**: `playwright_click_and_switch_tab` - Click link and switch to new tab
- Improved error logging for uncaught exceptions and unhandled Promise rejections

### Documentation
- Added documentation for new tools
- Improved installation and configuration instructions

## [1.0.3] - 2024-11-15

### Added
- **Code Generation Capabilities**:
  - `start_codegen_session` - Start recording Playwright actions
  - `end_codegen_session` - Generate test file from recording
  - `get_codegen_session` - Retrieve session information
  - `clear_codegen_session` - Clear session without generating test
- **Navigation Tools**:
  - `playwright_go_back` - Navigate back in browser history
  - `playwright_go_forward` - Navigate forward in browser history
- **Interaction Tools**:
  - `playwright_drag` - Drag elements from one location to another
  - `playwright_press_key` - Press keyboard keys with optional element focus
- **Output Tools**:
  - `playwright_save_as_pdf` - Save page as PDF with customizable options
- **Content Extraction Tools**:
  - `playwright_get_visible_text` - Extract visible text content
  - `playwright_get_visible_html` - Get complete HTML content

## [1.0.2] - 2024-11-10

### Added
- **Multi-Browser Support**: Firefox and WebKit in addition to Chromium
- New `browserType` parameter for `playwright_navigate` tool
- Supported browser types: "chromium" (default), "firefox", "webkit"
- Enhanced test coverage for different browser engines

## [1.0.0] - 2024-11-01

### Added
- First major release with refactored tool structure
- Optional Bearer Authorization for API POST requests
- Three new tools: `playwright_expect_response`, `playwright_assert_response`, `playwright_custom_user_agent`

### Fixed
- Headless mode in Playwright (#62)
- Navigation failed: Target page, context or browser has been closed (#63)
- Exit process on host close

### Changed
- Completed RFC: Refactored handleToolCall for better maintainability (#46)

## [0.3.1] - 2024-10-25

### Fixed
- BROWSER_TOOLS array - removed unnecessary Playwright_console_logs requirement

### Added
- Comprehensive tests for all Playwright MCP Server tools
- AI Course documentation links

## [0.3.0] - 2024-10-20

### Added
- `Playwright_console_logs` tool to get browser console logs
- Support for log types: log, info, warn, error, debug, exception, all
- `Playwright_close` tool to close browser and release resources

## Earlier Versions

See [release.mdx](docs/docs/release.mdx) for complete version history.

---

[1.0.10]: https://github.com/executeautomation/mcp-playwright/compare/v1.0.9...v1.0.10
[1.0.9]: https://github.com/executeautomation/mcp-playwright/compare/v1.0.8...v1.0.9
[1.0.8]: https://github.com/executeautomation/mcp-playwright/compare/v1.0.7...v1.0.8
[1.0.7]: https://github.com/executeautomation/mcp-playwright/compare/v1.0.6...v1.0.7
[1.0.6]: https://github.com/executeautomation/mcp-playwright/compare/v1.0.5...v1.0.6
[1.0.5]: https://github.com/executeautomation/mcp-playwright/compare/v1.0.4...v1.0.5
[1.0.4]: https://github.com/executeautomation/mcp-playwright/compare/v1.0.3...v1.0.4
[1.0.3]: https://github.com/executeautomation/mcp-playwright/compare/v1.0.2...v1.0.3
[1.0.2]: https://github.com/executeautomation/mcp-playwright/compare/v1.0.0...v1.0.2
[1.0.0]: https://github.com/executeautomation/mcp-playwright/compare/v0.3.1...v1.0.0
[0.3.1]: https://github.com/executeautomation/mcp-playwright/compare/v0.3.0...v0.3.1
[0.3.0]: https://github.com/executeautomation/mcp-playwright/releases/tag/v0.3.0
