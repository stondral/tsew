// Store active SSE connections per ticket
export const ticketConnections = new Map<string, Set<ReadableStreamDefaultController>>();

// Function to broadcast message to all connections on a ticket
export function broadcastToTicket(ticketId: string, data: unknown) {
  const connections = ticketConnections.get(ticketId);
  if (!connections || connections.size === 0) {
    console.log(`📤 SSE: No active connections for ticket ${ticketId}`);
    return;
  }

  const encoder = new TextEncoder();
  const sseMessage = `data: ${JSON.stringify(data)}\n\n`;
  
  console.log(`📢 SSE: Broadcasting to ${connections.size} clients on ticket ${ticketId}`);
  
  const failedConnections: ReadableStreamDefaultController[] = [];
  connections.forEach((controller) => {
    try {
      controller.enqueue(encoder.encode(sseMessage));
    } catch (err) {
      console.error(`❌ SSE: Failed to send to connection:`, err);
      failedConnections.push(controller);
    }
  });

  // Remove failed connections
  failedConnections.forEach((ctrl) => connections.delete(ctrl));
}

// Function to get all active ticket connections (for admin notifications)
export function getActiveTickets(): string[] {
  return Array.from(ticketConnections.keys());
}
