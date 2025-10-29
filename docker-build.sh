#!/bin/bash
# Build script for Docker image
# This ensures the project and dependencies are properly prepared

set -e

echo "Building MCP Playwright Server for Docker..."

# Clean and install production dependencies
echo "Installing production dependencies..."
npm install --omit=dev

# Build the TypeScript project
echo "Building TypeScript project..."
npm run build

# Build the Docker image
echo "Building Docker image..."
docker build -t mcp-playwright:latest .

echo "Build complete! Image: mcp-playwright:latest"
echo ""
echo "Run with: docker run -i --rm mcp-playwright:latest"
