# Claude Desktop Configuration for HTTP Mode

## ⚠️ Important: Current Limitation

**As of December 2025**, Claude Desktop's stable version may not fully support the HTTP/SSE transport with the simple `url` configuration. The error you're seeing is because Claude Desktop expects a `command` field.

## 🔧 Workaround Solutions

### Solution 1: Use stdio Mode (Recommended for Claude Desktop)

Claude Desktop works best with stdio transport. Use this configuration instead:

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

**No need to start a separate server** - Claude Desktop will manage the process.

### Solution 2: Wait for Claude Desktop Update

The HTTP transport mode is primarily designed for:
- VS Code Copilot
- Custom MCP clients
- Remote server deployments
- IDE worker processes

Claude Desktop support for HTTP transport may come in future updates.

### Solution 3: Use HTTP Mode with Other Clients

The HTTP mode works perfectly with:

#### A. **MCP Inspector** (Official testing tool)
```bash
# Start your server
node dist/index.js --port 8931

# In another terminal, use MCP Inspector
npx @modelcontextprotocol/inspector http://localhost:8931/mcp
```

#### B. **VS Code GitHub Copilot**
```json
{
  "github.copilot.chat.mcp.servers": {
    "playwright": {
      "url": "http://localhost:8931/mcp"
    }
  }
}
```

#### C. **Custom Client**
See [TESTING_GUIDE.md](TESTING_GUIDE.md) for examples.

---

## 🎯 Recommended Setup by Use Case

### For Claude Desktop → Use stdio Mode
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

### For VS Code → Use HTTP Mode
```bash
# Terminal 1: Start server
node dist/index.js --port 8931
```

```json
// VS Code settings
{
  "github.copilot.chat.mcp.servers": {
    "playwright": {
      "url": "http://localhost:8931/mcp"
    }
  }
}
```

### For Remote Servers → Use HTTP Mode
```bash
# On remote server
node dist/index.js --port 8931

# In your client config
{
  "mcpServers": {
    "playwright": {
      "url": "http://remote-server:8931/mcp"
    }
  }
}
```

---

## 🧪 Testing HTTP Mode

Even though Claude Desktop doesn't support HTTP mode yet, you can still test it:

### Method 1: Automated Tests
```bash
./test-http-mode.sh
```

### Method 2: Manual Testing
```bash
# Terminal 1
node dist/index.js --port 8931

# Terminal 2
curl http://localhost:8931/health
curl -N http://localhost:8931/mcp | head -10
```

### Method 3: MCP Inspector
```bash
# Start server
node dist/index.js --port 8931

# Test with inspector
npx @modelcontextprotocol/inspector http://localhost:8931/mcp
```

---

## 📊 Client Compatibility Matrix

| Client | stdio Mode | HTTP Mode | Status |
|--------|-----------|-----------|--------|
| Claude Desktop | ✅ Yes | ⏳ Coming Soon | Use stdio |
| VS Code Copilot | ✅ Yes | ✅ Yes | Both work |
| MCP Inspector | ❌ No | ✅ Yes | HTTP only |
| Custom Clients | ✅ Yes | ✅ Yes | Both work |
| Remote Servers | ❌ No | ✅ Yes | HTTP only |

---

## 🔍 Why This Happens

The error message:
```
"code": "invalid_type",
"expected": "string",
"received": "undefined",
"path": ["mcpServers", "playwright", "command"],
"message": "Required"
```

Means Claude Desktop is looking for a `command` field (stdio mode) and doesn't recognize the `url` field (HTTP mode) in the current version.

This is because:
1. **stdio transport** is the original MCP transport method
2. **HTTP/SSE transport** is newer (MCP Protocol version 2024-11-05+)
3. Claude Desktop may be using an older protocol version

---

## ✅ Working Configuration for Claude Desktop

Use this **tested and working** configuration:

**File:** `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS)

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

**No server needed!** Just restart Claude Desktop and it will work.

---

## 🚀 Future: When Claude Supports HTTP Mode

When Claude Desktop adds HTTP transport support, you'll use:

```json
{
  "mcpServers": {
    "playwright": {
      "url": "http://localhost:8931/mcp"
    }
  }
}
```

Until then, HTTP mode is available for:
- VS Code
- Custom integrations
- Remote deployments
- CI/CD pipelines
- Multiple client scenarios

---

## 🎓 Summary

**For Now:**
- **Claude Desktop** → Use stdio mode (command/args)
- **VS Code** → Use HTTP mode (url)
- **Testing** → Use automated script or MCP Inspector

**HTTP Mode Benefits** (when supported):
- Run on remote servers
- Multiple concurrent clients
- Better for production deployments
- Easier debugging with health endpoints

**stdio Mode Benefits:**
- Works with Claude Desktop today
- Simpler setup (no separate server)
- Automatic process management

---

## 📞 Need Help?

1. **For Claude Desktop**: Use stdio mode (command/args)
2. **For HTTP testing**: Run `./test-http-mode.sh`
3. **For VS Code**: HTTP mode works great!
4. **For issues**: Check [TESTING_GUIDE.md](TESTING_GUIDE.md)

---

## 🔗 Related Documentation

- [README.md](README.md) - Main documentation
- [QUICKSTART.md](QUICKSTART.md) - Quick start guide
- [TESTING_GUIDE.md](TESTING_GUIDE.md) - Testing guide
- [TEST_OPTIONS.md](TEST_OPTIONS.md) - All testing options
