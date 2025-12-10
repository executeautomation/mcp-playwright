import { SSEServerConfig, SSEEvent, SSEClient } from './types';

/**
 * Server-Sent Events Server Class
 * Handles real-time event streaming to connected clients
 */
export class SSEServer {
  private config: SSEServerConfig;
  private clients: Map<string, SSEClient> = new Map();
  private server: any; // Will be Express server instance
  private actualPort?: number;

  constructor(config: SSEServerConfig) {
    this.config = config;
  }

  /**
   * Start the SSE server
   * @param config Server configuration
   * @returns Promise resolving to the actual port number used
   */
  async start(config: SSEServerConfig): Promise<number> {
    this.config = { ...this.config, ...config };
    // Implementation will be added in later tasks
    throw new Error('SSEServer.start() implementation pending');
  }

  /**
   * Broadcast an event to all connected clients
   * @param event Event to broadcast
   */
  broadcast(event: SSEEvent): void {
    // Implementation will be added in later tasks
    throw new Error('SSEServer.broadcast() implementation pending');
  }

  /**
   * Send an event to a specific client
   * @param clientId Target client ID
   * @param event Event to send
   */
  sendToClient(clientId: string, event: SSEEvent): void {
    // Implementation will be added in later tasks
    throw new Error('SSEServer.sendToClient() implementation pending');
  }

  /**
   * Get list of connected client IDs
   * @returns Array of client IDs
   */
  getConnectedClients(): string[] {
    return Array.from(this.clients.keys());
  }

  /**
   * Stop the SSE server and cleanup resources
   */
  async stop(): Promise<void> {
    // Implementation will be added in later tasks
    throw new Error('SSEServer.stop() implementation pending');
  }

  /**
   * Get the actual port the server is running on
   */
  getPort(): number | undefined {
    return this.actualPort;
  }

  /**
   * Get connected clients count
   */
  getClientCount(): number {
    return this.clients.size;
  }
}