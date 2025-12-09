# Quick Reference - Configuration Guide

## ✅ Working Configurations

### For Claude Desktop (stdio mode)

**Config File:** `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS)

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

✅ **Works with Claude Desktop**  
❌ **No separate server needed**  
✅ **Automatic process management**

---

### For VS Code Copilot (HTTP mode)

**Step 1:** Start the server
```bash
node dist/index.js --port 8931
```

**Step 2:** Add to VS Code settings
```json
{
  "github.copilot.chat.mcp.servers": {
    "playwright": {
      "url": "http://localhost:8931/mcp"
    }
  }
}
```

✅ **Works with VS Code**  
⚠️ **Requires server running**  
✅ **Supports multiple clients**

---

## 🔧 Testing

### Quick Test
```bash
npm run build
./test-http-mode.sh
```

### Manual Test
```bash
node dist/index.js --port 8931
curl http://localhost:8931/health
```

---

## 🆘 Troubleshooting

### "invalid_type" error in Claude Desktop
**Problem:** Used HTTP config instead of stdio  
**Solution:** Use the stdio configuration above (command/args)

### "Port already in use"
```bash
lsof -i :8931
# Use different port
node dist/index.js --port 9000
```

### "Module not found"
```bash
npm run build
```

---

## 📚 More Documentation

- [CLAUDE_DESKTOP_CONFIG.md](CLAUDE_DESKTOP_CONFIG.md) - Claude Desktop guide
- [QUICKSTART.md](QUICKSTART.md) - Quick start
- [TESTING_GUIDE.md](TESTING_GUIDE.md) - Full testing guide
- [README.md](README.md) - Main documentation
