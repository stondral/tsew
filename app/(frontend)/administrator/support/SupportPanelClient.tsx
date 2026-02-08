"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { 
  Search, 
  MessageCircle, 
  Clock, 
  AlertTriangle,
  UserPlus,
  CheckCircle2,
  WifiOff,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ChatWindow } from "@/components/admin/ChatWindow";
import { OrderHistory } from "@/components/admin/OrderHistory";

interface SupportPanelClientProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialTickets: any[];
  adminId: string;
}

export function SupportPanelClient({ initialTickets, adminId }: SupportPanelClientProps) {
  const [tickets, setTickets] = useState(initialTickets);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [isConnected, setIsConnected] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const eventSourceRef = useRef<EventSource | null>(null);

  const selectedTicket = useMemo(() => 
    tickets.find(t => t.id === selectedTicketId),
    [tickets, selectedTicketId]
  );

  // ✅ Initialize SSE stream for admin notifications
  useEffect(() => {
    const initSSE = async () => {
      try {
        console.log("📡 SupportPanelClient: Initializing SSE stream for admin notifications...");
        
        // Get token for authentication
        const token = typeof window !== 'undefined' 
          ? localStorage.getItem('payload-token')
          : null;
        
        if (!token) {
          console.warn("⚠️ SupportPanelClient: No auth token found - SSE will not connect");
          setIsConnected(false);
          return;
        }

        console.log("🔑 SupportPanelClient: Token found, connecting to SSE stream");
        
        // Connect to admin notifications stream
        const url = `/api/support/stream?ticketId=admin-notifications`;
        const eventSource = new EventSource(url);
        eventSourceRef.current = eventSource;

        eventSource.onopen = () => {
          console.log("✅ SupportPanelClient: SSE stream connected");
          setIsConnected(true);
        };

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log("📬 SupportPanelClient: New notification:", data);
            
            if (data.type === "new_message") {
              const { ticketId } = data;
              
              // ✅ Mark ticket as having unread messages
              if (ticketId !== selectedTicketId) {
                setUnreadCounts(prev => ({
                  ...prev,
                  [ticketId]: (prev[ticketId] || 0) + 1,
                }));
              }

              // ✅ Move ticket to top (most recent first)
              setTickets(prev => {
                const updated = [...prev];
                const index = updated.findIndex(t => t.id === ticketId);
                if (index > 0) {
                  const [ticket] = updated.splice(index, 1);
                  updated.unshift(ticket);
                }
                return updated;
              });

              // ✅ Show browser notification
              if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('New Support Message', {
                  body: data.senderType ? `from ${data.senderType}: ${data.content}` : data.content,
                  tag: `ticket-${ticketId}`,
                });
              }
            }
          } catch (err) {
            console.error("❌ SupportPanelClient: Failed to parse notification:", err);
          }
        };

        eventSource.onerror = (err) => {
          console.error("❌ SupportPanelClient: SSE error:", err);
          if (eventSource.readyState === EventSource.CLOSED) {
            console.log("❌ SupportPanelClient: SSE stream closed");
            setIsConnected(false);
          }
        };
      } catch (error) {
        console.error("❌ SupportPanelClient: Failed to init SSE:", error);
      }
    };

    initSSE();

    return () => {
      if (eventSourceRef.current) {
        console.log("🔗 SupportPanelClient: Closing SSE stream");
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [selectedTicketId]);

  const filteredTickets = useMemo(() => {
    return tickets.filter(t => {
      const matchesSearch = 
        t.ticketNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.customer?.email?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = filterStatus === "all" || t.status === filterStatus;
      
      return matchesSearch && matchesStatus;
    });
  }, [tickets, searchQuery, filterStatus]);

  const handleSelectTicket = (ticketId: string) => {
    setSelectedTicketId(ticketId);
    // Clear unread count for this ticket
    setUnreadCounts(prev => {
      const updated = { ...prev };
      delete updated[ticketId];
      return updated;
    });
  };

  return (
    <div className="flex-1 flex gap-4 overflow-hidden min-h-0 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4">
      {/* Sidebar - Ticket List */}
      <div className="w-96 flex flex-col gap-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-lg">
        {/* Header with Connection Status */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">Support Tickets</h2>
            <div className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider",
              isConnected 
                ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400" 
                : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
            )}>
              {isConnected ? (
                <>
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Connected</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-3 w-3" />
                  <span>Offline</span>
                </>
              )}
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search by name, email..." 
              className="pl-10 pr-4 bg-slate-100 dark:bg-slate-800 border-none rounded-lg text-sm h-10 focus:ring-2 focus:ring-indigo-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            {["all", "open", "pending", "closed"].map((status) => (
              <Button 
                key={status}
                onClick={() => setFilterStatus(status)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider transition-all",
                  filterStatus === status 
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30" 
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                )}
              >
                {status}
              </Button>
            ))}
          </div>
        </div>

        {/* Tickets List */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2 custom-scrollbar">
          {filteredTickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <MessageCircle className="h-12 w-12 text-slate-300 mb-3" />
              <p className="text-sm font-bold text-slate-400">No tickets found</p>
            </div>
          ) : (
            filteredTickets.map((ticket) => (
              <button
                key={ticket.id}
                onClick={() => handleSelectTicket(ticket.id)}
                className={cn(
                  "w-full text-left p-3.5 rounded-xl border-2 transition-all duration-200 group relative overflow-hidden",
                  selectedTicketId === ticket.id 
                    ? "bg-gradient-to-r from-indigo-50 to-indigo-100/50 dark:from-indigo-500/20 dark:to-indigo-600/10 border-indigo-400 dark:border-indigo-500 shadow-lg" 
                    : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                )}
              >
                <div className="flex gap-3 mb-2">
                  {/* Avatar */}
                  <div className={cn(
                    "h-10 w-10 rounded-full flex items-center justify-center text-white font-black text-sm flex-shrink-0 shadow-sm",
                    ticket.priority === 'urgent' 
                      ? 'bg-gradient-to-br from-rose-500 to-red-600' 
                      : 'bg-gradient-to-br from-indigo-500 to-indigo-600'
                  )}>
                    {ticket.customer?.username?.[0]?.toUpperCase() || ticket.customer?.email?.[0]?.toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h4 className="text-sm font-black text-slate-900 dark:text-white truncate">
                        {ticket.customer?.username || ticket.customer?.email?.split('@')[0]}
                      </h4>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {unreadCounts[ticket.id] > 0 && (
                          <Badge className="bg-red-500 text-white text-[8px] font-black px-2">
                            {unreadCounts[ticket.id]}
                          </Badge>
                        )}
                        <Badge className={cn(
                          "text-[7px] font-black uppercase px-2",
                          ticket.priority === 'urgent' 
                            ? 'bg-rose-500 text-white' 
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                        )}>
                          {ticket.priority}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-[12px] font-bold text-slate-600 dark:text-slate-400 truncate mb-1">
                      {ticket.subject}
                    </p>
                    <div className="flex items-center justify-between text-[10px]">
                      <div className={cn(
                        "flex items-center gap-1 px-2 py-0.5 rounded-full font-bold",
                        ticket.status === 'open' 
                          ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' 
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                      )}>
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        {ticket.status}
                      </div>
                      <div className="text-slate-400 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(ticket.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 flex flex-col overflow-hidden relative shadow-sm">
        {selectedTicket ? (
            <>
                {/* Chat Header */}
                <div className="p-6 border-b border-slate-50 dark:border-slate-800/50 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-lg">
                            {selectedTicket.customer?.username?.[0] || selectedTicket.customer?.email?.[0]}
                        </div>
                        <div>
                            <h3 className="text-lg font-black tracking-tight">{selectedTicket.customer?.username || 'Client'}</h3>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{selectedTicket.customer?.email}</span>
                                {selectedTicket.order && (
                                    <Badge variant="outline" className="text-[8px] font-black border-indigo-500/20 text-indigo-500 uppercase h-4">
                                        Order: {typeof selectedTicket.order === 'object' ? selectedTicket.order.orderNumber : selectedTicket.order}
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" className="h-10 w-10 p-0 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-indigo-500">
                            <UserPlus className="h-5 w-5" />
                        </Button>
                        <Button className="bg-emerald-500 hover:bg-emerald-600 text-white font-black text-[10px] uppercase rounded-xl h-10 px-6">
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Close Ticket
                        </Button>
                    </div>
                </div>

                {/* Chat and Order History Layout */}
                <div className="flex-1 overflow-hidden flex gap-4 p-4">
                  {/* Chat Area */}
                  <div className="flex-1 overflow-hidden">
                      <ChatWindow 
                          ticketId={selectedTicket.id}
                          userId={adminId}
                          senderType="admin"
                          orderContext={selectedTicket.order}
                      />
                  </div>

                  {/* Order History Sidebar */}
                  <div className="w-72 overflow-y-auto pr-2 custom-scrollbar border-l border-slate-100 dark:border-slate-800 pl-4">
                    {selectedTicket.customer && (
                      <OrderHistory 
                        customerId={
                          selectedTicket.customer && typeof selectedTicket.customer === 'object' 
                            ? selectedTicket.customer.id 
                            : selectedTicket.customer
                        }
                        selectedOrderId={
                          selectedTicket.order && typeof selectedTicket.order === 'object' 
                            ? selectedTicket.order.id 
                            : selectedTicket.order
                        }
                      />
                    )}
                  </div>
                </div>
            </>
        ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-20 text-center opacity-30 grayscale pointer-events-none">
                <div className="h-32 w-32 bg-slate-50 dark:bg-slate-800 rounded-[3rem] flex items-center justify-center mb-8 border-2 border-dashed border-slate-200 dark:border-slate-700">
                    <MessageCircle className="h-16 w-16 text-slate-300" />
                </div>
                <h3 className="text-2xl font-black tracking-tighter mb-4">Select Communication Node</h3>
                <p className="max-w-xs text-xs font-bold text-slate-400 uppercase tracking-widest leading-loose">
                    Initialize connection with a customer ticket to begin administrative resolution protocol.
                </p>
                <div className="mt-8 flex items-center gap-3 text-indigo-500">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">SLA Clock Active</span>
                </div>
            </div>
        )}
      </div>
    </div>
  );
}
