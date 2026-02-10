"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export function useChat(ticketId: string, userId: string, senderType: 'admin' | 'customer' | 'seller' | 'system') {
  const [messages, setMessages] = useState<any[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    // Fetch initial messages and ticket status
    const fetchInitialData = async () => {
      try {
        console.log(`📥 useChat: Fetching initial data for ticket ${ticketId}`);
        const [msgRes, ticketRes] = await Promise.all([
          fetch(`/api/support/messages?ticketId=${ticketId}`),
          fetch(`/api/support/tickets/${ticketId}`) 
        ]);
        
        if (msgRes.ok) {
          const data = await msgRes.json();
          setMessages(data.docs || []);
        }
        if (ticketRes.ok) {
          const data = await ticketRes.json();
          if (data.ticket) setStatus(data.ticket.status);
        }
      } catch (error) {
        console.error("❌ useChat: Failed to fetch initial data:", error);
      }
    };

    fetchInitialData();

    // Connect to SSE stream
    const initSSE = () => {
      console.log(`🔗 useChat: Connecting to SSE stream for ticket ${ticketId}`);
      
      const url = `/api/support/stream?ticketId=${encodeURIComponent(ticketId)}`;
      const eventSource = new EventSource(url);
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        console.log(`✅ useChat: SSE stream opened for ticket ${ticketId}`);
        setIsConnected(true);
        setError(null);
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log(`📨 useChat: Received SSE event:`, data);

          if (data.type === 'status_updated') {
            console.log(`📌 useChat: Ticket status updated to ${data.status}`);
            setStatus(data.status);
            return;
          }

          if (data.type === 'read_receipt') {
            console.log(`📖 useChat: Messages read by ${data.readerId}`);
            setMessages((prev) => prev.map(m => {
              const senderId = typeof m.sender === 'object' ? m.sender?.id : m.sender;
              return senderId !== data.readerId ? { ...m, deliveryStatus: 'read' } : m;
            }));
            return;
          }

          // Handle regular messages
          const message = data;
          setMessages((prev) => {
            // Check if message already exists (prevent duplicates)
            if (prev.some(m => m.id === message.id)) {
              console.log(`⚠️ useChat: Duplicate message, skipping`);
              return prev;
            }

            // If this is our optimistic message being confirmed, replace it
            const msgSenderId = typeof message.sender === 'object' ? message.sender?.id : message.sender;
            const isMe = msgSenderId === userId;
            
            if (isMe && message.senderType === senderType && message._status === 'received') {
              const index = prev.findIndex(m => m._status === 'pending' && m.sender === userId && m.senderType === senderType);
              if (index >= 0) {
                console.log("✅ useChat: Replaced optimistic message with server response");
                const updated = [...prev];
                updated[index] = { ...message, _status: 'sent' };
                return updated;
              }
            }

            // Add new message
            console.log("📥 useChat: Adding new message");
            return [...prev, message];
          });
        } catch (err) {
          console.error("❌ useChat: Failed to parse SSE message:", err);
        }
      };

      eventSource.onerror = (err) => {
        console.error("❌ useChat: SSE error:", err);
        if (eventSource.readyState === EventSource.CLOSED) {
          console.log(`❌ useChat: SSE stream closed for ticket ${ticketId}`);
          setIsConnected(false);
        }
      };
    };

    initSSE();

    return () => {
      if (eventSourceRef.current) {
        console.log(`🔗 useChat: Closing SSE stream for ticket ${ticketId}`);
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [ticketId, userId, senderType]);

  const sendMessage = useCallback((content: string, orderId?: string) => {
    console.log(`📤 useChat.sendMessage() - ticket: ${ticketId}, user: ${userId}`);

    if (!content.trim()) {
      console.warn("⚠️ useChat: Empty message content");
      return;
    }

    try {
      const tempId = `temp-${Date.now()}`;

      // Add message optimistically
      const optimisticMessage = {
        id: tempId,
        ticketId,
        sender: userId,
        senderType,
        content,
        orderId,
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        deliveryStatus: "sending",
        _status: 'pending',
      };

      setMessages((prev) => [...prev, optimisticMessage]);
      console.log("✅ useChat: Message added optimistically");

      // Send message via HTTP POST (cookie auth)
      fetch('/api/support/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          ticketId,
          content,
          senderType,
          orderId,
        }),
      })
        .then((res) => {
          if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
          }
          return res.json();
        })
        .then((data) => {
          console.log("✅ useChat: Message sent to server:", data);
        })
        .catch((err) => {
          console.error("❌ useChat: Failed to send message:", err);
          setError("Failed to send message");

          // Remove optimistic message on error
          setMessages((prev) =>
            prev.filter((m) => m.id !== tempId)
          );
        });
    } catch (err) {
      console.error("❌ useChat: Error in sendMessage:", err);
      setError("Failed to send message");
    }
  }, [ticketId, userId, senderType]);

  return {
    messages,
    status,
    isConnected,
    sendMessage,
    error,
    setMessages,
  };
}
