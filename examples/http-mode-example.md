# HTTP Mode Example

This example demonstrates how to use the Playwright MCP Server in HTTP mode.

## Starting the Server

```bash
# Using npx
npx @executeautomation/playwright-mcp-server --port 8931

# Or after global installation
npm install -g @executeautomation/playwright-mcp-server
playwright-mcp-server --port 8931
```

## Client Configuration

### Claude Desktop

```json
{
  "mcpServers": {
    "playwright": {
      "url": "http://localhost:8931/mcp"
    }
  }
}
```

## Testing

```bash
# Health check
curl http://localhost:8931/health
```
