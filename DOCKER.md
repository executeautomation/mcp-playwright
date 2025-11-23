# Docker Support for Playwright MCP Server

This document explains how to build and run the Playwright MCP Server in Docker.

## Overview
- Isolated, reproducible runtime with browsers and system deps included
- Easy deployment behind MCP gateways via Streamable HTTP transport
- Minimal host setup: only Docker/Compose required

## Prerequisites
- Docker installed ([Install Docker](https://docs.docker.com/get-docker/))
- Docker Compose (optional, usually bundled with Docker Desktop)

## Building the Docker Image
The provided multi-stage Dockerfile builds the app inside the container using the official Playwright base image (browsers and native deps preinstalled).

```bash
docker build -t mcp-playwright:latest .
# or with a specific tag
docker build -t mcp-playwright:1.0.6 .
```

Why the official Playwright image?
- Browsers are already there—no slow first-run downloads
- Matches Playwright's supported environment for stable, reproducible runs
- Simpler Dockerfile: no extra `playwright install` or system packages

## Running the Server

### STDIO (default MCP transport)
Run interactively so stdin/stdout stay open:
```bash
docker run -i --rm mcp-playwright:latest
```
Flags: `-i` keeps stdin open; `--rm` cleans up the container.

### Docker Compose
A `docker-compose.yml` is included:
```bash
docker compose run --rm playwright-mcp
```

### Streamable HTTP mode
Expose the HTTP transport (default port `8000`, path `/mcp`):
```bash
docker run --rm -p 8000:8000 -v /data:/data \
  mcp-playwright:latest \
  node dist/index.js --http --insecure --host-name localhost --listen 0.0.0.0 --path /mcp
```
- `--host-name` should match the public hostname clients/gateways use; `--insecure` keeps links `http`, omit for `https` behind a proxy.
- Resource URLs look like `http://<host>:8000/mcp/resources/<session>/<resourceId>/<filename>`.
- Mount `/data` if you want session-scoped artifacts persisted outside the container.

## Integration with MCP Clients

### Claude Desktop
```json
{
  "mcpServers": {
    "playwright-docker": {
      "command": "docker",
      "args": ["run", "-i", "--rm", "mcp-playwright:latest"]
    }
  }
}
```

### VS Code MCP extension
```json
{
  "name": "playwright-docker",
  "command": "docker",
  "args": ["run", "-i", "--rm", "mcp-playwright:latest"]
}
```

## Environment Variables
- `PLAYWRIGHT_HEADLESS=1` is set in the image by default; override it to see a headed browser if you add a display.
- Pass additional env vars with `-e` or via Compose `environment` entries.

## Volume Mounts
Persist or inspect generated artifacts by mounting `/data`:
```bash
docker run -i --rm -v $(pwd)/data:/data mcp-playwright:latest
```

## Troubleshooting
- **Container exits immediately**: run with `-i` so stdin stays open (`docker run -i --rm ...`).
- **No download URL in HTTP mode**: ensure you started with `--http` and set `--host-name`/`--insecure` appropriately; check the exposed port/path.
- **Port already in use**: change `--port` (and publish it) when starting in HTTP mode.
- **Permission issues on volumes**: mount with a user id/group that can write to the host path (e.g., `--user $(id -u):$(id -g)` on Linux).

## Image Notes
- Built from the official Playwright base image with browsers preinstalled.
- Multi-stage build prunes dev dependencies for a lean runtime layer.

## Security Considerations
- Run as a non-root user if your environment requires it:
  ```dockerfile
  FROM mcp-playwright:latest
  USER pwuser
  ```
- Consider read-only root fs when suitable: `docker run -i --rm --read-only mcp-playwright:latest`
- Scan images regularly (`docker scan mcp-playwright:latest`).

## Support
- See the main README for general usage
- File Docker-specific issues on GitHub with the `docker` label