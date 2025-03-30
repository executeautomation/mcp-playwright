import { Express, Request, Response } from "express";
import SSEManager from "./sse.js";

/**
 * Setup SSE-related endpoints in Express
 * @param app - Express application
 */
export function setupSSEEndpoints(app: Express): void {
  const sseManager = SSEManager.getInstance();

  // SSE connection endpoint
  app.get('/sse', (req: Request, res: Response) => {
    // Set headers for SSE connection
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.flushHeaders();

    // Register client
    const clientId = sseManager.registerClient(res);

    // Handle client disconnect
    req.on('close', () => {
      sseManager.removeClient(clientId);
    });
  });

  // Endpoint to send an event to a specific client
  app.post('/sse/event/:clientId', (req: Request, res: Response) => {
    const { clientId } = req.params;
    const event = req.body;

    if (!event.data) {
      return res.status(400).json({ error: 'Event data is required' });
    }

    const success = sseManager.sendEventToClient(clientId, event);
    
    if (success) {
      res.status(200).json({ success: true });
    } else {
      res.status(404).json({ error: 'Client not found' });
    }
  });

  // Endpoint to broadcast an event to all clients
  app.post('/sse/broadcast', (req: Request, res: Response) => {
    const event = req.body;

    if (!event.data) {
      return res.status(400).json({ error: 'Event data is required' });
    }

    sseManager.broadcast(event);
    res.status(200).json({ success: true, clientCount: sseManager.getClientCount() });
  });

  // Endpoint to get connected client information
  app.get('/sse/clients', (req: Request, res: Response) => {
    res.status(200).json({
      count: sseManager.getClientCount(),
      clients: sseManager.getClientIds()
    });
  });
}