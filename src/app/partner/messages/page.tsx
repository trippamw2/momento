"use client";

import { useState, useEffect } from "react";
import { useAuthGuard } from "@/lib/use-auth-guard";

interface Conversation {
  id: string;
  guestName: string;
  guestAvatar: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  messages: Message[];
}

interface Message {
  id: string;
  sender: "host" | "guest";
  content: string;
  timestamp: string;
}

const mockConversations: Conversation[] = [
  {
    id: "1",
    guestName: "Sarah Johnson",
    guestAvatar: "SJ",
    lastMessage: "Hi! I'm really excited about the cooking class tomorrow.",
    lastMessageTime: "10:32 AM",
    unreadCount: 2,
    messages: [
      { id: "1", sender: "guest", content: "Hi! I'm really excited about the cooking class tomorrow.", timestamp: "10:30 AM" },
      { id: "2", sender: "guest", content: "What should I bring? Any dietary restrictions I should know about?", timestamp: "10:31 AM" },
      { id: "3", sender: "guest", content: "Also, is there parking available at the venue?", timestamp: "10:32 AM" },
      { id: "4", sender: "host", content: "Hi Sarah! Great to hear you're excited. Just bring yourself and an appetite!", timestamp: "10:35 AM" },
      { id: "5", sender: "host", content: "No dietary restrictions for this class - we'll be making traditional Malawian dishes.", timestamp: "10:36 AM" },
      { id: "6", sender: "host", content: "Yes, there's free parking right in front of the kitchen studio.", timestamp: "10:37 AM" },
    ],
  },
  {
    id: "2",
    guestName: "Michael Chen",
    guestAvatar: "MC",
    lastMessage: "Thanks for the quick response! See you Saturday.",
    lastMessageTime: "Yesterday",
    unreadCount: 0,
    messages: [
      { id: "1", sender: "guest", content: "Hi, I booked the sunset boat tour for Saturday. What time should I arrive?", timestamp: "Yesterday 2:15 PM" },
      { id: "2", sender: "host", content: "Hi Michael! Please arrive by 4:30 PM at the Lake Malawi dock. The boat leaves at 5 PM sharp.", timestamp: "Yesterday 2:18 PM" },
      { id: "3", sender: "guest", content: "Thanks for the quick response! See you Saturday.", timestamp: "Yesterday 2:20 PM" },
    ],
  },
  {
    id: "3",
    guestName: "Emily Davis",
    guestAvatar: "ED",
    lastMessage: "Can I add one more person to the booking?",
    lastMessageTime: "Monday",
    unreadCount: 1,
    messages: [
      { id: "1", sender: "guest", content: "Hi! We loved the hiking tour. Can I add one more person to our booking for next week?", timestamp: "Monday 9:00 AM" },
      { id: "2", sender: "host", content: "Hi Emily! Thanks for the kind words. Let me check availability for next week.", timestamp: "Monday 9:15 AM" },
      { id: "3", sender: "guest", content: "Can I add one more person to the booking?", timestamp: "Monday 10:30 AM" },
    ],
  },
  {
    id: "4",
    guestName: "James Wilson",
    guestAvatar: "JW",
    lastMessage: "The pottery workshop was amazing! Will leave a review.",
    lastMessageTime: "Last week",
    unreadCount: 0,
    messages: [
      { id: "1", sender: "guest", content: "The pottery workshop was amazing! Will leave a review.", timestamp: "Last week" },
      { id: "2", sender: "host", content: "So glad you enjoyed it James! Your pieces turned out beautifully.", timestamp: "Last week" },
    ],
  },
  {
    id: "5",
    guestName: "Lisa Anderson",
    guestAvatar: "LA",
    lastMessage: "Question about the dietary options for the food tour",
    lastMessageTime: "Last week",
    unreadCount: 0,
    messages: [
      { id: "1", sender: "guest", content: "Hi! I'm vegetarian - are there options on the food tour?", timestamp: "Last week" },
      { id: "2", sender: "host", content: "Absolutely! We have vegetarian options at every stop. Let me know of any other restrictions.", timestamp: "Last week" },
    ],
  },
];

export default function MessagesPage() {
  const { allowed: isPartner, loading: authLoading } = useAuthGuard({ requiredRole: "partner" });
  const [conversations, setConversations] = useState<Conversation[]>(mockConversations);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");

  const sendMessage = () => {
    if (!newMessage.trim() || !selectedConversation) return;
    const newMsg: Message = {
      id: Date.now().toString(),
      sender: "host",
      content: newMessage.trim(),
      timestamp: new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
    };
    setConversations((prev) =>
      prev.map((c) =>
        c.id === selectedConversation.id
          ? { ...c, messages: [...c.messages, newMsg], lastMessage: newMsg.content, lastMessageTime: newMsg.timestamp }
          : c
      )
    );
    setSelectedConversation((prev) =>
      prev ? { ...prev, messages: [...prev.messages, newMsg], lastMessage: newMsg.content, lastMessageTime: newMsg.timestamp } : null
    );
    setNewMessage("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timeStr: string) => timeStr;

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 rounded-full border-2 border-[#FF0F73]/30 border-t-[#FF0F73] animate-spin" />
      </div>
    );
  }

  if (!isPartner) return null;

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between h-16 px-4 border-b border-white/[0.08] bg-[#111827]/95 backdrop-blur-xl z-10">
        <div className="flex items-center gap-3">
          <h1 className="text-heading-sm font-bold text-white">Messages</h1>
          <span className="px-2 py-0.5 text-caption font-medium bg-[#FF0F73]/20 text-[#FF0F73] rounded-full">
            {conversations.reduce((sum, c) => sum + c.unreadCount, 0)} unread
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 rounded-xl border border-white/[0.08] hover:bg-white/[0.04] transition-colors">
            <svg className="w-5 h-5 text-[#64748B]" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Conversation List */}
        <aside className={`${mobileView === "chat" ? "hidden md:block" : "md:w-80"} flex-shrink-0 flex flex-col border-r border-white/[0.08] bg-[#0F0F0F] overflow-y-auto`}>
          <div className="p-4 border-b border-white/[0.06]">
            <input
              type="text"
              placeholder="Search conversations..."
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/[0.08] text-white placeholder-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#FF0F73]/30 focus:border-[#FF0F73] text-body-sm"
            />
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => {
                  setSelectedConversation(conv);
                  setMobileView("chat");
                }}
                className={`w-full px-4 py-3 hover:bg-white/[0.02] transition-colors border-b border-white/[0.03] flex items-center gap-3 ${
                  selectedConversation?.id === conv.id ? "bg-white/[0.04]" : ""
                }`}
              >
                <div className="relative flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FF0F73] to-[#FF7A1A] flex items-center justify-center text-white font-bold text-body">
                    {conv.guestAvatar}
                  </div>
                  {conv.unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#FF0F73] text-white text-caption font-bold flex items-center justify-center">
                      {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-body-sm font-semibold text-white truncate">{conv.guestName}</p>
                    <span className="text-caption text-[#64748B] whitespace-nowrap flex-shrink-0">{formatTime(conv.lastMessageTime)}</span>
                  </div>
                  <p className="text-caption text-[#64748B] truncate mt-0.5">{conv.lastMessage}</p>
                </div>
              </button>
            ))}
          </div>
        </aside>

        {/* Chat View */}
        <main className={`flex-1 flex flex-col ${mobileView === "list" ? "md:hidden" : ""}`}>
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <header className="flex items-center justify-between h-16 px-4 border-b border-white/[0.08] bg-[#111827]/95 backdrop-blur-xl z-10">
                <div className="flex items-center gap-3">
                  {mobileView === "chat" && (
                    <button
                      onClick={() => setMobileView("list")}
                      className="md:hidden p-2 rounded-xl hover:bg-white/[0.04] transition-colors"
                    >
                      <svg className="w-5 h-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  )}
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF0F73] to-[#FF7A1A] flex items-center justify-center text-white font-bold text-body">
                    {selectedConversation.guestAvatar}
                  </div>
                  <div>
                    <p className="text-body-sm font-semibold text-white">{selectedConversation.guestName}</p>
                    <p className="text-caption text-[#64748B]">Guest</p>
                  </div>
                </div>
                <button className="p-2 rounded-xl hover:bg-white/[0.04] transition-colors">
                  <svg className="w-5 h-5 text-[#64748B]" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                  </svg>
                </button>
              </header>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ display: "flex", flexDirection: "column-reverse" }}>
                {selectedConversation.messages.slice().reverse().map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender === "host" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                        msg.sender === "host"
                          ? "bg-gradient-to-r from-[#FF0F73] to-[#FF7A1A] text-white rounded-br-md"
                          : "bg-white/5 text-white rounded-bl-md border border-white/[0.08]"
                      }`}
                    >
                      <p className="text-body-sm">{msg.content}</p>
                      <p className={`text-caption mt-1 text-right ${msg.sender === "host" ? "text-white/70" : "text-[#64748B]"}`}>
                        {msg.timestamp}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-white/[0.08] bg-[#111827]">
                <div className="flex items-end gap-3">
                  <button className="p-2 rounded-xl hover:bg-white/[0.04] transition-colors flex-shrink-0">
                    <svg className="w-5 h-5 text-[#64748B]" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10.293 5.707a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L12.586 6H5a1 1 0 110-2h7.586l-3.293-3.293a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414z" />
                      <path d="M4 12a2 2 0 00-2 2v4a2 2 0 002 2h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.586l1.293-1.293a1 1 0 10-1.414-1.414l-4 4a1 1 0 000 1.414l4 4a1 1 0 001.414-1.414L13.414 14H18a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4a2 2 0 012-2h2.586z" />
                    </svg>
                  </button>
                  <div className="flex-1 relative">
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Type a message..."
                      rows={1}
                      className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/[0.08] text-white placeholder-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#FF0F73]/30 focus:border-[#FF0F73] text-body-sm resize-none max-h-32"
                    />
                  </div>
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim()}
                    className="px-5 py-3 rounded-xl bg-gradient-to-r from-[#FF0F73] to-[#FF7A1A] text-white font-semibold text-body-sm hover:shadow-[0_4px_16px_rgba(255,15,115,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Send
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
              <svg className="w-20 h-20 text-white/10 mb-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" />
              </svg>
              <h2 className="text-heading-md font-bold text-white mb-2">Select a conversation</h2>
              <p className="text-[#64748B] text-body-sm max-w-xs">Choose a conversation from the list to start messaging</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}