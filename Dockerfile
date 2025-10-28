# Multi-stage Dockerfile for MCP Playwright Server
# This Dockerfile expects the project to be built before running docker build
# Run `npm install --omit=dev && npm run build` before building the image

FROM node:20-slim AS base

# Set working directory
WORKDIR /app

# Copy package files for reference
COPY package*.json ./

# Copy node_modules from host (production dependencies only)
# Make sure to run `npm install --omit=dev` before building
COPY node_modules ./node_modules

# Copy the pre-built application
COPY dist ./dist

# Expose stdio for MCP communication
# MCP servers communicate via stdio, so no port exposure needed

# Run the server
CMD ["node", "dist/index.js"]