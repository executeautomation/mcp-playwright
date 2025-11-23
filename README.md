<div align="center" markdown="1">
  <table>
    <tr>
      <td align="center" valign="middle">
        <a href="https://mseep.ai/app/executeautomation-mcp-playwright">
          <img src="https://mseep.net/pr/executeautomation-mcp-playwright-badge.png" alt="MseeP.ai Security Assessment Badge" height="80"/>
        </a>
      </td>
      <td align="center" valign="middle">
        <a href="https://www.warp.dev/?utm_source=github&utm_medium=referral&utm_campaign=mcp-playwright">
          <img alt="Warp sponsorship" width="200" src="https://github.com/user-attachments/assets/ab8dd143-b0fd-4904-bdc5-dd7ecac94eae"/>
        </a>
      </td>
    </tr>
    <tr>
      <td align="center"><sub>MseeP.ai Security Assessment</sub></td>
      <td align="center"><sub>Special thanks to <a href="https://www.warp.dev/?utm_source=github&utm_medium=referral&utm_campaign=mcp-playwright">Warp, the AI terminal for developers</a></sub></td>
    </tr>
  </table>
</div>
<hr>

# Playwright MCP Server 🎭

> 🚀 Active Fork of executeautomation/mcp-playwright  
>  This repository is an actively maintained continuation of the original MCP Playwright server:
> 👉 https://github.com/executeautomation/mcp-playwright

![Release](https://img.shields.io/github/v/release/aakashh242/mcp-playwright?sort=semver)
![Latest Tag](https://img.shields.io/github/v/tag/aakashh242/mcp-playwright?label=tag)
![Build](https://img.shields.io/github/actions/workflow/status/aakashh242/mcp-playwright/build.yml?branch=main&label=build)
![Lint](https://img.shields.io/github/actions/workflow/status/aakashh242/mcp-playwright/build.yml?branch=main&label=lint)
![Unit Tests](https://img.shields.io/github/actions/workflow/status/aakashh242/mcp-playwright/build.yml?branch=main&label=tests)
[![Coverage](https://codecov.io/gh/aakashh242/mcp-playwright/graph/badge.svg)](https://codecov.io/gh/aakashh242/mcp-playwright)
[![Release Please](https://img.shields.io/github/actions/workflow/status/aakashh242/mcp-playwright/release-please.yml?branch=main&label=release-please)](https://github.com/aakashh242/mcp-playwright/actions/workflows/release-please.yml)
[![Docker Publish](https://img.shields.io/github/actions/workflow/status/aakashh242/mcp-playwright/docker-publish.yml?branch=main&label=docker)](https://github.com/aakashh242/mcp-playwright/actions/workflows/docker-publish.yml)

A Model Context Protocol server that provides browser automation capabilities using Playwright. This server enables LLMs to interact with web pages, take screenshots, generate test code, web scraps the page and execute JavaScript in a real browser environment.
It is optimized for QA and E2E automation: screenshots, logs, assertions, API testing, plus full MCP HTTP/gateway support — built on the same Playwright foundations, complementary to Microsoft’s server.

<a href="https://glama.ai/mcp/servers/yh4lgtwgbe"><img width="380" height="200" src="https://glama.ai/mcp/servers/yh4lgtwgbe/badge" alt="mcp-playwright MCP server" /></a>

## Screenshot
![Playwright + Claude](image/playwright_claude.png)

## [Documentation](https://aakashh242.github.io/mcp-playwright/) | [API reference](https://aakashh242.github.io/mcp-playwright/docs/playwright-web/Supported-Tools)

## Installation

You can install the package using either npm, mcp-get, or Smithery:

Using npm:
```bash
npm install -g @executeautomation/playwright-mcp-server
```

Using mcp-get:
```bash
npx @michaellatman/mcp-get@latest install @executeautomation/playwright-mcp-server
```
Using Smithery

To install Playwright MCP for Claude Desktop automatically via [Smithery](https://smithery.ai/server/@executeautomation/playwright-mcp-server):

```bash
npx @smithery/cli install @executeautomation/playwright-mcp-server --client claude
```
#### Installation in VS Code

Install the Playwright MCP server in VS Code using one of these buttons:

<!--
// Generate using?:
const config = JSON.stringify({ name: 'playwright', command: 'npx', args: ["-y", "@executeautomation/playwright-mcp-server"] });
const urlForWebsites = `vscode:mcp/install?${encodeURIComponent(config)}`;
// Github markdown does not allow linking to `vscode:` directly, so you can use our redirect:
const urlForGithub = `https://insiders.vscode.dev/redirect?url=${encodeURIComponent(urlForWebsites)}`;
-->

[<img src="https://img.shields.io/badge/VS_Code-VS_Code?style=flat-square&label=Install%20Server&color=0098FF" alt="Install in VS Code">](https://insiders.vscode.dev/redirect?url=vscode%3Amcp%2Finstall%3F%257B%2522name%2522%253A%2522playwright%2522%252C%2522command%2522%253A%2522npx%2522%252C%2522args%2522%253A%255B%2522-y%2522%252C%2522%2540executeautomation%252Fplaywright-mcp-server%2522%255D%257D) 
[<img alt="Install in VS Code Insiders" src="https://img.shields.io/badge/VS_Code_Insiders-VS_Code_Insiders?style=flat-square&label=Install%20Server&color=24bfa5">](https://insiders.vscode.dev/redirect?url=vscode-insiders%3Amcp%2Finstall%3F%257B%2522name%2522%253A%2522playwright%2522%252C%2522command%2522%253A%2522npx%2522%252C%2522args%2522%253A%255B%2522-y%2522%252C%2522%2540executeautomation%252Fplaywright-mcp-server%2522%255D%257D)

Alternatively, you can install the Playwright MCP server using the VS Code CLI:

```bash
# For VS Code
code --add-mcp '{"name":"playwright","command":"npx","args":["@executeautomation/playwright-mcp-server"]}'
```

```bash
# For VS Code Insiders
code-insiders --add-mcp '{"name":"playwright","command":"npx","args":["@executeautomation/playwright-mcp-server"]}'
```

After installation, the ExecuteAutomation Playwright MCP server will be available for use with your GitHub Copilot agent in VS Code.

## Configuration to use Playwright Server
Here's the Claude Desktop configuration to use the Playwright server:

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["-y", "@executeautomation/playwright-mcp-server"]
    }
  }
}
```

## Streamable HTTP mode

The server supports the MCP Streamable HTTP transport so it can run behind gateways.

- Start in HTTP mode (defaults to port `8000` and path `/mcp`):
  ```bash
  npx @executeautomation/playwright-mcp-server --http
  ```
- Override the port or path:
  ```bash
  npx @executeautomation/playwright-mcp-server --http --port 3000 --path /custom-mcp
  ```

### How files are shared in HTTP mode
- Generated artifacts (screenshots, PDFs, console logs, generated tests) are written into `/data/<session>/<resourceId>.<ext>` on the server.
- Each Streamable HTTP session gets its own isolated resource namespace; links are only valid for that session and expire after the configured TTL (`--resource-ttl`, default 600s). Session close or TTL expiry removes the files and their directories.
- Tool results return `resourceLinks` pointing to download URLs:  
  `{scheme}://{host}:{port}{path}/resources/{sessionId}/{resourceId}/{filename}`  
  (host from `--host-name`, scheme from `--insecure`, path from `--path`, default `/mcp`).
- In stdio mode, resource linking is disabled; tools only emit local paths.

This scope-based sharing prevents content leakage between sessions/clients while still giving HTTP clients and gateways stable download URIs.

### Uploads in HTTP mode
- The `playwright_upload_file` tool accepts a local `filePath` only in stdio mode. In HTTP mode, you must first upload the file and pass `uploadResourceUri`.
- Get the session-scoped upload URL by calling `construct_upload_url` (HTTP mode only). It returns a POST multipart endpoint like `{path}/uploads/{sessionId}`; the session ID is embedded in the URL so no header is usually needed.
- Upload with `multipart/form-data` (field `file`). On success, the server responds with a session-scoped `resourceUri` such as `mcp-uploads://<session>/<id>`.
- Then call `playwright_upload_file` with `uploadResourceUri` to attach the uploaded file to the file input. Uploads are isolated per session/client like other resources.
- Agents must be able to run terminal/CLI commands (curl on Linux/macOS, `Invoke-WebRequest`/`iwr` on Windows) to upload the file before calling `playwright_upload_file` in HTTP mode.
- Stdio mode continues to use local `filePath`; HTTP mode prefers uploaded resources.

### Client Configuration

Claude Desktop / VS Code (`mcp.json`):
```json
{
  "mcpServers": {
    "playwright": {
      "transport": {
        "type": "http",
        "url": "http://localhost:8000/mcp"
      }
    }
  }
}
```
Adjust `url` to match your host/port/path and use `https` if terminated by a proxy.


## CLI flags
- `--http`: Enable Streamable HTTP transport (default: off; stdio is used when omitted).
- `--port <number>`: HTTP port (default: `8000`, only relevant when `--http` is set).
- `--path <path>`: Base HTTP path (default: `/mcp`, only relevant when `--http` is set).
- `--host-name <hostname>`: Hostname used in generated download URLs (default: system hostname, only relevant when `--http` is set).
- `--listen <address>`: Bind address for the HTTP server (default: `0.0.0.0`, only relevant when `--http` is set).
- `--insecure`: Use `http` scheme for download links; omit to use `https` (only relevant when `--http` is set).
- `--resource-ttl <seconds>`: TTL for generated resources (default: `600` seconds; only affects HTTP mode).
- `--static-user-agent`: Disable the default randomized User-Agent rotation (by default, each new browser launch picks a modern UA to reduce bot detection/CAPTCHAs).

## Agents / Prompts
- A starter agent prompt is provided in [`AGENTS.md`](AGENTS.md). Create an agent in VS Code (or your client) using that prompt as a template; customize as needed.
- For file uploads in HTTP mode, ensure the agent has permission to run terminal/CLI commands (curl on Linux/macOS, `Invoke-WebRequest`/`iwr` on Windows) because uploads are performed via the session-specific HTTP endpoint before calling `playwright_upload_file`.

## Contributing
- Read the [CONTRIBUTING.md](CONTRIBUTING.md) guidelines for required tooling (pre-commit hooks, lint/test/build steps, conventional commits, documentation updates).
- The CI workflow enforces the same standards; please mirror them locally before opening a PR.

## Available Tools
| Tool | Purpose | Notes |
| --- | --- | --- |
| `playwright_navigate` | Open a URL with optional viewport/headless/browser type | Browser launched if needed |
| `playwright_screenshot` | Capture screenshot of page/element | HTTP mode returns resource link |
| `playwright_save_as_pdf` | Save page as PDF | HTTP mode returns resource link |
| `playwright_console_logs` | Retrieve browser console logs with filters | Log file registered when saved |
| `playwright_upload_file` | Set a file into an `<input type="file">` | In HTTP mode, upload file via `construct_upload_url` then pass `uploadResourceUri`; stdio uses `filePath` |
| `construct_upload_url` (HTTP) | Return session-scoped upload URL/instructions | Use POST multipart (`file` field) to get `uploadResourceUri` |
| `playwright_click` / `playwright_fill` / `playwright_select` / `playwright_hover` / `playwright_drag` / `playwright_press_key` | Core page interactions | Browser required |
| `playwright_iframe_click` / `playwright_iframe_fill` | Interact inside iframes | Provide iframe selector |
| `playwright_get_visible_text` / `playwright_get_visible_html` | Read visible page content | HTML tool supports cleaning options |
| `playwright_custom_user_agent` | Override User-Agent for browser context | |
| `playwright_go_back` / `playwright_go_forward` / `playwright_close` | Navigation or close browser | |
| `playwright_evaluate` | Execute JS in page | |
| `playwright_expect_response` / `playwright_assert_response` | Wait for and assert network responses | |
| `playwright_get` / `playwright_post` / `playwright_put` / `playwright_patch` / `playwright_delete` | HTTP API helpers | |
| `start_codegen_session` / `end_codegen_session` / `get_codegen_session` / `clear_codegen_session` | Record and generate Playwright tests | Generated tests are exposed as resources in HTTP mode |

## Docker Support

The Playwright MCP Server ships with a multi-stage Dockerfile that builds the app inside the container and uses the official Playwright base image. Browsers and system dependencies are already present, which avoids slow first-run downloads and version drift you can hit with slim Node images plus ad-hoc installs.

### Building the Docker Image

The Docker build handles dependencies and the TypeScript build for you:

```bash
docker build -t mcp-playwright .
```

### Running with Docker

You can run the MCP server using Docker in several ways:

#### Using Docker directly

```bash
# Run the server (stdin/stdout communication)
docker run -i mcp-playwright
```

#### Streamable HTTP mode in Docker

```bash
docker run --rm -p 8000:8000 -v /data:/data \
  mcp-playwright \
  node dist/index.js --http --insecure --host-name localhost --listen 0.0.0.0 --path /mcp
```

- Mount `/data` to persist session-scoped artifacts if desired.
- Adjust `--host-name` to the public hostname your clients/gateways use. Use `--insecure` for `http`; omit it for `https` behind a terminating proxy.
- Resource download URLs will be `http://<host>:8000/mcp/resources/<session>/<resourceId>/<filename>` by default.
- The container default is headless (`PLAYWRIGHT_HEADLESS=1`) and the Playwright base image already includes browsers.

#### Using Docker Compose (recommended for production HTTP)

Use the provided `docker-compose.yml` to run streamable HTTP with sensible defaults:

```bash
docker compose up -d
```
Defaults:
- HTTP mode with `--path=/mcp`, `--listen=0.0.0.0`, `--port=8000`, and a `--host-name` placeholder (replace with your public hostname).
- Ports: `8000:8000`
- Volumes: `./data/app-data:/app/data` and `./data/resource-data:/data` for persisted session artifacts.

### Using Docker with MCP Clients

To use the Dockerized server with Claude Desktop or other MCP clients, you can configure them to use Docker:

```json
{
  "mcpServers": {
    "playwright": {
      "command": "docker",
      "args": ["run", "-i", "--rm", "mcp-playwright"]
    }
  }
}
```

## Testing

This project uses Jest for testing. The tests are located in the `src/__tests__` directory.

### Running Tests

You can run the tests using one of the following commands:

```bash
# Run tests using the custom script (with coverage)
node run-tests.cjs

# Run tests using npm scripts
npm test           # Run tests without coverage
npm run test:coverage  # Run tests with coverage
npm run test:custom    # Run tests with custom script (same as node run-tests.cjs)
```

The test coverage report will be generated in the `coverage` directory.

### Running evals

The evals package loads an mcp client that then runs the index.ts file, so there is no need to rebuild between tests. You can load environment variables by prefixing the npx command. Full documentation can be found [here](https://www.mcpevals.io/docs).

```bash
OPENAI_API_KEY=your-key  npx mcp-eval src/evals/evals.ts src/tools/codegen/index.ts
```

## Contributing

When adding new tools, please be mindful of the tool name length. Some clients, like Cursor, have a 60-character limit for the combined server and tool name (`server_name:tool_name`).

Our server name is `playwright-mcp`. Please ensure your tool names are short enough to not exceed this limit.

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=aakashh242/mcp-playwright&type=Date)](https://star-history.com/#aakashh242/mcp-playwright&Date)
