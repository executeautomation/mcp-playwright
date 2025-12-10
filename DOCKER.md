# Docker Support for Playwright MCP Server

This document provides detailed instructions for running the Playwright MCP Server in Docker.

## Overview

The Playwright MCP Server can be containerized using Docker, providing:
- Isolated execution environment
- Consistent runtime across different systems
- Easy deployment and distribution
- Simplified dependency management

## Prerequisites

- Docker installed on your system ([Install Docker](https://docs.docker.com/get-docker/))
- Docker Compose (optional, usually included with Docker Desktop)
- The project built locally (`npm run build`)

## Building the Docker Image

The Dockerfile is designed to work with pre-built artifacts and dependencies from your local build. Follow these steps:

1. **Install production dependencies and build the project:**
   ```bash
   npm install --omit=dev
   npm run build
   ```

   Or use the provided build script:
   ```bash
   chmod +x docker-build.sh
   ./docker-build.sh
   ```

2. **Manually build the Docker image:**
   ```bash
   docker build -t mcp-playwright:latest .
   ```

   Or with a specific tag:
   ```bash
   docker build -t mcp-playwright:1.0.6 .
   ```

**Important**: The Dockerfile copies `node_modules` and `dist` from your local build directory. Make sure you have installed dependencies with `--omit=dev` flag before building the Docker image to keep the image size minimal.

## Running the Server

### Interactive Mode (Recommended for MCP)

Since MCP servers communicate via stdin/stdout, run the container in interactive mode:

```bash
docker run -i --rm mcp-playwright:latest
```

Flags explained:
- `-i`: Keep STDIN open for interactive communication
- `--rm`: Automatically remove the container when it exits
- `mcp-playwright:latest`: The image name and tag

### Using Docker Compose

A `docker-compose.yml` file is provided for convenience:

```bash
# Start the server
docker compose run --rm playwright-mcp

# Build and run
docker compose build
docker compose run --rm playwright-mcp
```

## Integration with MCP Clients

### Claude Desktop Configuration

To use the Dockerized MCP server with Claude Desktop, update your configuration file:

**Location**: 
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`
- Linux: `~/.config/Claude/claude_desktop_config.json`

**Configuration:**
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

### VS Code MCP Extension

For VS Code with MCP extension:

```json
{
  "name": "playwright-docker",
  "command": "docker",
  "args": ["run", "-i", "--rm", "mcp-playwright:latest"]
}
```

## Environment Variables

You can pass environment variables to configure the server:

```bash
docker run -i --rm \
  -e PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 \
  mcp-playwright:latest
```

In docker-compose.yml:
```yaml
services:
  playwright-mcp:
    environment:
      - PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
      - NODE_ENV=production
```

## Volume Mounts

If you need to persist data or share files with the container:

```bash
docker run -i --rm \
  -v $(pwd)/data:/app/data \
  mcp-playwright:latest
```

In docker-compose.yml:
```yaml
services:
  playwright-mcp:
    volumes:
      - ./data:/app/data
      - ./screenshots:/app/screenshots
```

## Troubleshooting

### Container Exits Immediately

MCP servers wait for input on stdin. Ensure you're running with `-i` flag:
```bash
docker run -i --rm mcp-playwright:latest
```

### Browser Not Found

The Docker image skips browser downloads by default to reduce size. Playwright will download browsers on first use. To pre-install browsers, create a custom Dockerfile:

```dockerfile
FROM mcp-playwright:latest

# Install Playwright browsers
RUN npx playwright install chromium --with-deps
```

### Permission Issues

If you encounter permission issues with mounted volumes:
```bash
docker run -i --rm \
  -v $(pwd)/data:/app/data \
  --user $(id -u):$(id -g) \
  mcp-playwright:latest
```

## Advanced Usage

### Custom Network Configuration

To run the server on a custom network:

```bash
docker network create mcp-network
docker run -i --rm --network mcp-network mcp-playwright:latest
```

### Resource Limits

Limit CPU and memory usage:

```bash
docker run -i --rm \
  --cpus="2.0" \
  --memory="2g" \
  mcp-playwright:latest
```

In docker-compose.yml:
```yaml
services:
  playwright-mcp:
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 2G
```

### Health Checks

Add a health check to your docker-compose.yml:

```yaml
services:
  playwright-mcp:
    healthcheck:
      test: ["CMD", "node", "-e", "process.exit(0)"]
      interval: 30s
      timeout: 10s
      retries: 3
```

## Image Size Optimization

The current Dockerfile is optimized for size:
- Uses Debian-based slim Node.js image (~200MB)
- Copies pre-built artifacts from host
- Production dependencies only
- Skips browser downloads by default

Current image size: ~200MB (without browsers)

## Security Considerations

1. **Run as non-root user** (optional but recommended):
   ```dockerfile
   FROM mcp-playwright:latest
   USER node
   ```

2. **Read-only root filesystem** (if applicable):
   ```bash
   docker run -i --rm --read-only mcp-playwright:latest
   ```

3. **Scan for vulnerabilities:**
   ```bash
   docker scan mcp-playwright:latest
   ```

## Building from Source in Docker

If you prefer to build inside Docker (not using pre-built dist):

```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
RUN npm ci

COPY src ./src
COPY tsconfig.json ./
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
RUN npm ci --only=production
CMD ["node", "dist/index.js"]
```

## Support

For issues related to Docker:
- Check the main [README.md](./README.md) for general information
- Report Docker-specific issues on [GitHub Issues](https://github.com/executeautomation/mcp-playwright/issues)
- Tag your issue with `docker` label
