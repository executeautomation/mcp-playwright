#!/bin/bash

# Add required dependencies
echo "Installing dependencies..."
npm install --save uuid express cors

# Copy updated request handler
echo "Updating requestHandler.ts..."
mv src/requestHandler.updated.ts src/requestHandler.ts

# Install TypeScript type definitions
echo "Installing TypeScript type definitions..."
npm install --save-dev @types/uuid @types/express

echo "Setup completed successfully!"
echo "To run the server with SSE support, execute: npm start"