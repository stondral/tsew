
export interface RealtimeMessage {
  roomId: string;
  senderId: string;
  senderType: 'customer' | 'admin' | 'system' | 'seller';
  content: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface RealtimeAdapter {
  connect(ticketId?: string): void;
  on(event: string, callback: (data: unknown) => void): void;
  send(event: string, data: unknown): Promise<void>;
  join(room: string): void;
  leave(room: string): void;
  disconnect(): void;
}

// SSE Implementation
export class SSEAdapter implements RealtimeAdapter {
  private eventSource: EventSource | null = null;
  private eventHandlers: Map<string, ((data: unknown) => void)[]> = new Map();
  private currentTicketId: string = 'admin-notifications';

  connect(ticketId?: string) {
    if (ticketId) this.currentTicketId = ticketId;

    // ✅ Prevent duplicate connections
    if (this.eventSource && (this.eventSource.readyState === EventSource.OPEN || this.eventSource.readyState === EventSource.CONNECTING)) {
      console.warn('⚠️ SSEAdapter: Already connecting or connected, skipping');
      return;
    }

    // ✅ Get token from localStorage for authentication
    const token = typeof window !== 'undefined' 
      ? localStorage.getItem('payload-token')
      : null;

    console.log(`🔗 SSEAdapter.connect() - Ticket: ${this.currentTicketId}, Token exists: ${!!token}`);
    
    if (!token) {
      console.warn('⚠️ SSEAdapter.connect() - NO TOKEN FOUND - connection might lack auth context');
    }

    const url = `/api/support/stream?ticketId=${this.currentTicketId}`;
    this.eventSource = new EventSource(url);

    this.eventSource.onopen = () => {
      console.log('✅ SSE connected to:', this.currentTicketId);
      const handlers = this.eventHandlers.get("connect") || [];
      handlers.forEach(h => h(null));
    };

    this.eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log(`📨 SSE message received:`, data);
        
        // SSE often uses 'data' field, we map it to our internal 'message' or 'notification' logic
        const eventType = data.type || "message";
        const handlers = this.eventHandlers.get(eventType) || [];
        handlers.forEach(h => h(data));

        // Also trigger general 'message' handler if it's a message
        if (eventType === "new_message" || eventType === "message") {
           const genericHandlers = this.eventHandlers.get("message") || [];
           genericHandlers.forEach(h => h(data));
        }
      } catch (err) {
        console.error("❌ SSE: Failed to parse message:", err);
      }
    };

    this.eventSource.onerror = (err) => {
      console.error('❌ SSE error:', err);
      const handlers = this.eventHandlers.get("error") || [];
      handlers.forEach(h => h({ error: err }));
      
      if (this.eventSource?.readyState === EventSource.CLOSED) {
        setIsConnectedState(false);
      }
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  on(event: string, callback: (data: any) => void) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)?.push(callback);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async send(event: string, data: any) {
    console.log(`📤 Sending message via API POST (SSE is unidirectional):`, data);
    
    try {
      const response = await fetch('/api/support/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('payload-token')}`
        },
        body: JSON.stringify({
          ticketId: data.ticketId || data.roomId || this.currentTicketId,
          content: data.content,
          senderType: data.senderType || 'admin',
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.statusText}`);
      }
      
      console.log('✅ Message sent successfully via API');
    } catch (err) {
      console.error('❌ Error sending message:', err);
      throw err;
    }
  }

  join(room: string) {
    console.log(`� SSEAdapter.join() called for room: ${room}`);
    this.disconnect();
    this.connect(room);
  }

  leave(room: string) {
    console.log(`📍 SSEAdapter.leave() called for room: ${room}`);
    if (this.currentTicketId === room) {
       this.disconnect();
    }
  }

  disconnect() {
    if (this.eventSource) {
      console.log('� SSEAdapter: Closing connection');
      this.eventSource.close();
      this.eventSource = null;
    }
  }
}

// Helper to keep track of state if needed (optional)
function setIsConnectedState(connected: boolean) {
    // This could be integrated with a global state or simple internal flag
    console.log(`🌐 Global Realtime Connectivity: ${connected}`);
}
