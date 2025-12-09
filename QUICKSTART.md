# Quick Start - Testing HTTP Mode Locally

## 🚀 Fastest Way to Test (30 seconds)

### Step 1: Build the project
```bash
npm run build
```

### Step 2: Run the automated test
```bash
./test-http-mode.sh
```

That's it! The script will:
- ✅ Start the HTTP server
- ✅ Run 7 different tests
- ✅ Show you the results
- ✅ Clean up automatically

---

## 🧪 Manual Testing (5 minutes)

### Terminal 1: Start the Server

```bash
# Start HTTP server
node dist/index.js --port 8931
```

**You should see:**
```
==============================================
Playwright MCP Server (HTTP Mode)
==============================================
Port: 8931
...
```

### Terminal 2: Test the Server

**Test 1: Health Check** (should return status: ok)
```bash
curl http://localhost:8931/health
```

**Test 2: Try the MCP endpoint** (will show SSE stream)
```bash
curl -N http://localhost:8931/mcp
# Press Ctrl+C after a few seconds
```

**Test 3: Check help**
```bash
node dist/index.js --help
```

**Test 4: Test default mode (stdio)**
```bash
# Stop the HTTP server (Ctrl+C in Terminal 1)
# Then run without --port flag:
node dist/index.js
# Press Ctrl+C to stop
```

---

## 🎯 Real-World Testing with Claude Desktop

### 1. Start the server
```bash
node dist/index.js --port 8931
```

### 2. Configure Claude Desktop

**macOS:**
```bash
code ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

**Windows:**
```powershell
notepad %APPDATA%\Claude\claude_desktop_config.json
```

**Add this:**
```json
{
  "mcpServers": {
    "playwright-http": {
      "url": "http://localhost:8931/mcp"
    }
  }
}
```

### 3. Restart Claude Desktop

### 4. Test it!

Ask Claude:
```
Can you use playwright to navigate to https://example.com and take a screenshot?
```

You should see activity in your server terminal! 🎉

---

## 📊 Monitoring While Testing

While the server is running, you can check:

**Active sessions:**
```bash
curl http://localhost:8931/health | jq
```

**Server metrics:**
```bash
curl http://localhost:8932/metrics | jq
```

**Server logs:**
```bash
tail -f /tmp/playwright-mcp-test.log
```

---

## 🔍 What to Look For

### ✅ Success Indicators:

1. **Server starts without errors**
   - No error messages in terminal
   - Endpoints listed correctly

2. **Health endpoint returns 200**
   ```json
   {
     "status": "ok",
     "version": "1.0.6",
     "activeSessions": 0
   }
   ```

3. **SSE endpoint streams events**
   ```
   event: endpoint
   data: /mcp?sessionId=<uuid>
   ```

4. **Logs show successful operations**
   ```
   {"level":"info","message":"MCP SSE connection request received"}
   {"level":"info","message":"MCP SSE transport connected"}
   ```

### ❌ Common Issues:

| Issue | Solution |
|-------|----------|
| Port already in use | Use different port: `--port 9000` |
| Connection refused | Check if server is running: `lsof -i :8931` |
| Module not found | Rebuild: `npm run build` |
| Browser errors | Install browsers: `npx playwright install` |

---

## 🎓 Learning Path

1. **Start here:** Run `./test-http-mode.sh` ✅ **(You are here)**
2. **Next:** Test with Claude Desktop
3. **Then:** Read [TESTING_GUIDE.md](TESTING_GUIDE.md) for advanced testing
4. **Finally:** Check [examples/http-mode-example.md](examples/http-mode-example.md) for production setup

---

## 💡 Pro Tips

### Keep Server Running
```bash
# Run in background
nohup node dist/index.js --port 8931 > server.log 2>&1 &

# Check it's running
curl http://localhost:8931/health

# View logs
tail -f server.log
```

### Quick Restart
```bash
# Kill and restart
pkill -f "node dist/index.js" && node dist/index.js --port 8931
```

### Test Multiple Ports
```bash
# Terminal 1
node dist/index.js --port 8931

# Terminal 2  
node dist/index.js --port 8932

# Terminal 3
node dist/index.js --port 8933
```

---

## 🆘 Need Help?

1. **Check logs:** `tail -f /tmp/playwright-mcp-test.log`
2. **Verify build:** `npm run build`
3. **Run tests:** `npm test`
4. **Read full guide:** [TESTING_GUIDE.md](TESTING_GUIDE.md)

---

## ✨ Next Steps

Once everything works locally:

- [ ] Test with real browser automation
- [ ] Try different browsers (chromium, firefox, webkit)
- [ ] Test multiple concurrent sessions
- [ ] Deploy to remote server
- [ ] Set up with Docker

Happy testing! 🚀
