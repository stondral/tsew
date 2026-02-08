import { NextRequest, NextResponse } from 'next/server';
import { ticketConnections } from './manager';

export async function GET(request: NextRequest) {
  const ticketId = request.nextUrl.searchParams.get('ticketId');
  
  if (!ticketId) {
    return NextResponse.json({ error: 'Missing ticketId' }, { status: 400 });
  }

  console.log(`📡 SSE: New connection to ticket ${ticketId}`);

  // Create a new response with streaming
  const encoder = new TextEncoder();
  let controller: ReadableStreamDefaultController;

  const stream = new ReadableStream({
    start(ctrl) {
      controller = ctrl;
      
      // Register this connection for the ticket
      if (!ticketConnections.has(ticketId)) {
        ticketConnections.set(ticketId, new Set());
      }
      ticketConnections.get(ticketId)!.add(controller);
      
      console.log(`✅ SSE: Client connected to ticket ${ticketId}, total connections: ${ticketConnections.get(ticketId)?.size}`);

      // Send initial connection message
      const message = `:connected\n\n`;
      try {
        controller.enqueue(encoder.encode(message));
      } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        console.error(`❌ SSE: Error sending initial message to ticket ${ticketId}:`, err);
      }
    },
    cancel() {
      // Remove this connection when client disconnects
      const connections = ticketConnections.get(ticketId);
      if (connections) {
        connections.delete(controller);
        console.log(`❌ SSE: Client disconnected from ticket ${ticketId}, remaining: ${connections.size}`);
        
        if (connections.size === 0) {
          ticketConnections.delete(ticketId);
        }
      }
    },
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

