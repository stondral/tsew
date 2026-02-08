"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { 
  Send, 
  Paperclip, 
  Smile, 
  Command,
  CheckCircle2,
  MessageCircle,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useChat } from "@/hooks/useChat";

interface ChatWindowProps {
  ticketId: string;
  userId: string;
  senderType: 'admin' | 'customer' | 'seller' | 'system';
  orderContext?: string | { id: string };
  status?: string;
  onNewTicket?: () => void;
}

const MOST_USED_TEMPLATES = [
  { id: '1', title: 'Greeting', text: 'Hello! How can I help you today?' },
  { id: '2', title: 'Shipping Update', text: 'Your order has been shipped and is on its way to you!' },
  { id: '3', title: 'Refund Info', text: 'We have processed your refund. It should appear in your account within 3-5 business days.' },
  { id: '4', title: 'Address Check', text: 'Could you please confirm your shipping address?' },
  { id: '5', title: 'Closing', text: 'Is there anything else I can help you with?' },
];

export function ChatWindow({ ticketId, userId, senderType, orderContext, status, onNewTicket }: ChatWindowProps) {
  const [inputValue, setInputValue] = useState("");
  const [showTemplates, setShowTemplates] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(status || 'open');
  const scrollRef = useRef<HTMLDivElement>(null);
  const { messages, status: realTimeStatus, sendMessage, isConnected } = useChat(ticketId, userId, senderType);

  // Sync status from hook or props
  useEffect(() => {
    if (realTimeStatus) setCurrentStatus(realTimeStatus);
    else if (status) setCurrentStatus(status);
  }, [status, realTimeStatus]);

  // Mark as read when messages change and window is focused
  useEffect(() => {
    const unreadMessages = messages.filter(m => m.sender !== userId && m.deliveryStatus !== 'read');
    if (unreadMessages.length > 0 && isConnected) {
      fetch('/api/support/read', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId }),
      }).catch(err => console.error("Failed to mark as read:", err));
    }
  }, [messages, ticketId, userId, isConnected]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (inputValue.trim()) {
      const orderId = typeof orderContext === 'object' ? orderContext.id : orderContext;
      sendMessage(inputValue, orderId);
      setInputValue("");
    }
  };

  // Group messages by sender and time proximity
  const groupedMessages = useMemo(() => {
    interface ChatMessage {
      id?: string;
      content: string;
      createdAt: string;
      deliveryStatus?: string;
      sender?: string | { id: string };
      senderType: string;
    }
    interface MessageGroup {
      isMe: boolean;
      senderType: string;
      messages: ChatMessage[];
      timestamp: string;
    }
    const groups: MessageGroup[] = [];
    messages.forEach((msg, i) => {
      const prevMsg = messages[i - 1];
      const isMe = msg.sender === userId || msg.sender?.id === userId;
      const prevIsMe = prevMsg ? (prevMsg.sender === userId || prevMsg.sender?.id === userId) : null;
      
      const isSameSender = prevMsg && prevIsMe === isMe;
      const isRecent = prevMsg && (new Date(msg.createdAt).getTime() - new Date(prevMsg.createdAt).getTime() < 5 * 60 * 1000);

      if (isSameSender && isRecent) {
        groups[groups.length - 1].messages.push(msg);
      } else {
        groups.push({
          isMe,
          senderType: msg.senderType,
          messages: [msg],
          timestamp: msg.createdAt
        });
      }
    });
    return groups;
  }, [messages, userId]);

  return (
    <div className="flex flex-col h-full bg-[#efeae2] dark:bg-[#0b141a] relative">
      {/* WhatsApp Style Wallpaper Layer */}
      <div className="absolute inset-0 opacity-[0.4] pointer-events-none mix-blend-multiply dark:mix-blend-overlay" 
           style={{ backgroundImage: 'radial-gradient(#075e54 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }} 
      />

      {/* Templates Overlay - Admin Only */}
      {senderType === 'admin' && showTemplates && (
        <div className="absolute bottom-[104px] left-0 right-0 px-10 z-30 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="max-w-5xl mx-auto bg-white/95 dark:bg-[#202c33] backdrop-blur-xl rounded-[2.5rem] shadow-[0_20px_50px_-20px_rgba(0,0,0,0.3)] ring-1 ring-black/5 dark:ring-white/10 p-6">
            <div className="flex items-center justify-between mb-6 px-4">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#075e54] dark:text-emerald-400">Response_Templates</h4>
              <button 
                onClick={() => setShowTemplates(false)}
                className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600"
              >
                Close
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {MOST_USED_TEMPLATES.map((tmpl) => (
                <button
                  key={tmpl.id}
                  onClick={() => {
                    setInputValue(tmpl.text);
                    setShowTemplates(false);
                  }}
                  className="group flex flex-col items-start text-left p-5 rounded-3xl bg-emerald-50/50 dark:bg-emerald-900/10 hover:bg-[#075e54] dark:hover:bg-emerald-600 transition-all duration-300 ring-1 ring-emerald-500/10"
                >
                  <span className="text-[11px] font-black uppercase tracking-widest text-[#075e54] dark:text-emerald-400 group-hover:text-emerald-50 mb-1">{tmpl.title}</span>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 group-hover:text-emerald-100/80 line-clamp-1">{tmpl.text}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-10 pt-4 pb-6 space-y-8 custom-scrollbar relative z-10"
      >
        {groupedMessages.map((group, idx) => (
            <div
                key={idx}
                className={cn(
                    "flex flex-col max-w-[70%] gap-1.5",
                    group.isMe ? "ml-auto items-end" : "items-start"
                )}
            >
                {/* Sender Tag - Vibrant Color */}
                {!group.isMe && (
                    <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.2em] mb-1 px-2 italic">
                        {group.senderType}_INBOUND
                    </span>
                )}

                <div className={cn("flex flex-col gap-1 w-full", group.isMe ? "items-end" : "items-start")}>
                    {group.messages.map((msg: { id?: string; content: string; createdAt: string; deliveryStatus?: string; sender?: string | { id: string } }, i: number) => {
                        const isFirst = i === 0;
                        const isLast = i === group.messages.length - 1;
                        
                        return (
                            <div 
                                key={msg.id || i}
                                className={cn(
                                    "px-6 py-4 text-[14px] leading-relaxed font-medium transition-all relative group shadow-sm ring-1 ring-black/[0.03] dark:ring-white/[0.05]",
                                    group.isMe 
                                        ? "bg-[#dcf8c6] dark:bg-[#005c4b] text-slate-800 dark:text-emerald-50 rounded-tr-[4px]" 
                                        : "bg-white dark:bg-[#202c33] text-slate-700 dark:text-slate-300 rounded-tl-[4px]",
                                    // Bubble Tails & Shape
                                    group.isMe 
                                        ? cn(
                                            "rounded-2xl",
                                            !isFirst && "rounded-tr-2xl",
                                            !isLast && "rounded-br-2xl"
                                          )
                                        : cn(
                                            "rounded-2xl",
                                            !isFirst && "rounded-tl-2xl",
                                            !isLast && "rounded-bl-2xl"
                                          )
                                )}
                            >
                                {msg.content}
                                
                                {/* Info Metadata row within bubble */}
                                <div className="flex items-center justify-end gap-1.5 mt-1 opacity-40 group-hover:opacity-100 transition-opacity">
                                    <span className="text-[9px] font-bold tabular-nums">
                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    {group.isMe && (
                                        <div className="flex -space-x-1">
                                            <CheckCircle2 className={cn("h-2.5 w-2.5 transition-colors", msg.deliveryStatus === 'read' ? "text-blue-500" : "text-slate-400")} />
                                            {(msg.deliveryStatus === 'read' || msg.deliveryStatus === 'delivered') && (
                                                <CheckCircle2 className={cn("h-2.5 w-2.5 translate-x-0.5 transition-colors", msg.deliveryStatus === 'read' ? "text-blue-500" : "text-slate-400")} />
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        ))}
        
        {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center opacity-20 grayscale py-32">
                 <div className="h-24 w-24 bg-emerald-100 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mb-8 animate-bounce">
                    <MessageCircle className="h-10 w-10 text-emerald-500" />
                 </div>
                 <p className="text-[12px] font-black uppercase tracking-[0.4em] text-emerald-600">Secure_Encryption_Live</p>
                 <p className="text-[11px] font-bold uppercase tracking-[0.3em] mt-3 opacity-60 italic">Double-check resolution before protocol end</p>
            </div>
        )}
      </div>

      {/* Closed State Banner */}
      {currentStatus === 'closed' && (
        <div className="bg-white/95 dark:bg-[#202c33] backdrop-blur-3xl border-t border-black/5 dark:border-white/5 p-6 z-20 animate-in slide-in-from-bottom-5 duration-500">
            <div className="max-w-5xl mx-auto flex flex-col items-center text-center">
                <div className="h-12 w-12 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-4">
                    <X className="h-6 w-6 text-slate-400" />
                </div>
                <h4 className="text-[14px] font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2">Conversation Closed</h4>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed mb-6">This inquiry has been finalized. Thank you for reaching out.</p>
                
                {senderType === 'customer' && onNewTicket && (
                    <Button 
                        onClick={onNewTicket}
                        className="h-12 px-10 rounded-full bg-[#075e54] text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-emerald-900/20 hover:scale-105 active:scale-95 transition-all"
                    >
                        Start New Conversation
                    </Button>
                )}
            </div>
        </div>
      )}

      {/* Input Area Bar - Vibrant WhatsApp Vibe */}
      {currentStatus !== 'closed' && (
        <div className="bg-white/95 dark:bg-[#202c33] backdrop-blur-3xl border-t border-black/5 dark:border-white/5 p-4 z-20">
        <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-4 bg-[#f0f2f5] dark:bg-[#111b21] p-2 rounded-2xl ring-1 ring-black/5 dark:ring-white/5 transition-all focus-within:ring-emerald-500/30 duration-500">
                <div className="flex items-center">
                    <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-400 hover:text-emerald-500 rounded-full hover:bg-emerald-50 dark:hover:bg-emerald-900/10">
                        <Paperclip className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-400 hover:text-yellow-500 rounded-full hover:bg-yellow-50 dark:hover:bg-yellow-900/10">
                        <Smile className="h-5 w-5" />
                    </Button>
                </div>

                <div className="h-6 w-[1px] bg-slate-300 dark:bg-white/10" />

                <Input 
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            handleSend();
                        }
                    }}
                    placeholder="Type a message..."
                    className="flex-1 bg-transparent border-none shadow-none focus-visible:ring-0 text-[14px] font-medium h-12 py-3 px-4 placeholder:text-slate-400"
                />

                <div className="flex items-center gap-3 pr-1">
                    {senderType === 'admin' && (
                        <Button 
                            variant="ghost" 
                            onClick={() => setShowTemplates(!showTemplates)}
                            className={cn(
                                "h-10 px-4 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all",
                                showTemplates 
                                    ? "bg-[#075e54] text-white" 
                                    : "text-[#075e54] dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                            )}
                            disabled={currentStatus === 'closed'}
                        >
                            Templates
                        </Button>
                    )}
                    <Button 
                        onClick={handleSend}
                        disabled={currentStatus === 'closed'}
                        className="h-12 w-12 bg-[#075e54] dark:bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-900/20 p-0 hover:scale-105 active:scale-95 transition-all group/send disabled:opacity-50"
                    >
                        <Send className="h-5 w-5" />
                    </Button>
                </div>
            </div>
            
            {/* Help Key Hint */}
            <div className="mt-3 flex items-center justify-center gap-6 text-[8px] font-black uppercase tracking-[0.4em] text-emerald-600/30">
                <div className="flex items-center gap-1.5">
                    <Command className="h-2.5 w-2.5" />
                    <span>Quick_Reply</span>
                </div>
                <div className="h-1 w-1 rounded-full bg-emerald-600/20" />
                <div className="flex items-center gap-1.5">
                    <Command className="h-2.5 w-2.5" />
                    <span>Search_Log</span>
                </div>
            </div>
        </div>
      </div>
      )}
    </div>
  );
}
