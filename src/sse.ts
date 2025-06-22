import { v4 as uuidv4 } from 'uuid';

interface SSEClient {
  id: string;
  res: any;
}

interface SSEEvent {
  id?: string;
  event?: string;
  data: string;
  retry?: number;
}

class SSEManager {
  private static instance: SSEManager;
  private clients: Map<string, SSEClient>;
  
  private constructor() {
    this.clients = new Map();
  }

  public static getInstance(): SSEManager {
    if (!SSEManager.instance) {
      SSEManager.instance = new SSEManager();
    }
    return SSEManager.instance;
  }

  /**
   * Register a new SSE client connection
   * @param res - Express response object
   * @returns Client ID
   */
  public registerClient(res: any): string {
    // Set headers for SSE
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no'
    });

    // Send initial connection established message
    res.write('retry: 10000\n\n');
    
    // Generate unique ID for this client
    const clientId = uuidv4();
    
    // Store client connection
    this.clients.set(clientId, { id: clientId, res });
    
    // Send initial connection successful event
    this.sendEventToClient(clientId, {
      event: 'connected',
      data: JSON.stringify({ clientId })
    });
    
    console.log(`SSE client connected: ${clientId}`);
    return clientId;
  }

  /**
   * Remove a client connection
   * @param clientId - ID of client to remove
   */
  public removeClient(clientId: string): void {
    if (this.clients.has(clientId)) {
      this.clients.delete(clientId);
      console.log(`SSE client disconnected: ${clientId}`);
    }
  }

  /**
   * Send an event to a specific client
   * @param clientId - ID of client to send to
   * @param event - Event to send
   */
  public sendEventToClient(clientId: string, event: SSEEvent): boolean {
    const client = this.clients.get(clientId);
    if (!client) {
      return false;
    }

    try {
      // Format SSE message
      let message = '';
      if (event.id) message += `id: ${event.id}\n`;
      if (event.event) message += `event: ${event.event}\n`;
      message += `data: ${event.data}\n`;
      if (event.retry) message += `retry: ${event.retry}\n`;
      message += '\n';

      // Send to client
      client.res.write(message);
      return true;
    } catch (error) {
      console.error(`Error sending event to client ${clientId}:`, error);
      this.removeClient(clientId);
      return false;
    }
  }

  /**
   * Send an event to all connected clients
   * @param event - Event to send
   */
  public broadcast(event: SSEEvent): void {
    this.clients.forEach((client) => {
      this.sendEventToClient(client.id, event);
    });
  }

  /**
   * Get the number of connected clients
   * @returns Number of connected clients
   */
  public getClientCount(): number {
    return this.clients.size;
  }

  /**
   * Get all connected client IDs
   * @returns Array of client IDs
   */
  public getClientIds(): string[] {
    return Array.from(this.clients.keys());
  }
}

export default SSEManager; 