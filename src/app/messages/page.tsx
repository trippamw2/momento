"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Conversation {
  id: string;
  user_id: string;
  participant_id: string;
  experience_id: string | null;
  updated_at: string;
  participant: {
    id: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
  last_message: {
    id: string;
    content: string;
    created_at: string;
    sender_id: string;
  } | null;
  unread_count: number;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read: boolean;
}

function TimeAgo({ date }: { date: string }) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function MessagesPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [inputText, setInputText] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval>>();

  // Fetch conversations
  useEffect(() => {
    const token = localStorage.getItem("momento-auth-token");
    if (!token) {
      router.push("/bookings");
      return;
    }

    fetch("/api/conversations", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.ok ? res.json() : Promise.reject())
      .then((data) => setConversations(data.conversations || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [router]);

  // Extract current user ID from first message or conversation
  useEffect(() => {
    if (!userId && messages.length > 0) {
      const token = localStorage.getItem("momento-auth-token");
      // Decode JWT to get user id (simple approach: fetch profile)
      fetch("/api/auth/me", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
        .then((r) => r.ok ? r.json() : null)
        .then((data) => {
          if (data?.id) setUserId(data.id);
        })
        .catch(() => {});
    }
  }, [messages, userId]);

  // Fetch messages when conversation selected
  useEffect(() => {
    if (!activeConv) return;

    const token = localStorage.getItem("momento-auth-token");
    if (!token) return;

    const fetchMessages = () => {
      fetch(`/api/messages?conversation_id=${activeConv}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.ok ? res.json() : Promise.reject())
        .then((data) => {
          setMessages(data.messages || []);
          // Update unread count
          setConversations((prev) =>
            prev.map((c) =>
              c.id === activeConv ? { ...c, unread_count: 0 } : c
            )
          );
        })
        .catch(() => {});
    };

    fetchMessages();

    // Poll for new messages every 5 seconds
    pollRef.current = setInterval(fetchMessages, 5000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [activeConv]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim() || !activeConv || sending) return;

    const token = localStorage.getItem("momento-auth-token");
    if (!token) return;

    setSending(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          conversation_id: activeConv,
          content: inputText.trim(),
        }),
      });

      if (res.ok) {
        const newMsg = await res.json();
        setMessages((prev) => [...prev, newMsg]);
        setInputText("");
      }
    } catch {} finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const activeConversation = conversations.find((c) => c.id === activeConv);
  const otherParticipant = activeConversation?.participant;
  const isParticipantSender = (senderId: string) => senderId === userId;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20 bg-[#05070B]">
        <div className="w-8 h-8 rounded-full border-2 border-[#FF0F73]/30 border-t-[#FF0F73] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-16 bg-[#05070B]">
      <div className="max-w-5xl mx-auto px-4 sm:px-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-heading-xl font-bold text-[#F1F5F9]">Messages</h1>
          <Link
            href="/bookings"
            className="text-body-sm text-[#64748B] hover:text-[#CBD5E1] transition-colors"
          >
            ← Back to Bookings
          </Link>
        </div>

        {conversations.length === 0 ? (
          <div className="rounded-2xl bg-[#111827] border border-white/[0.08] p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-white/[0.06] flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-[#64748B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <h2 className="text-heading-lg font-bold text-[#F1F5F9] mb-2">No messages yet</h2>
            <p className="text-[#CBD5E1] text-body-sm max-w-sm mx-auto">
              Messages from your experience hosts and customer inquiries will appear here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[65vh]">
            {/* Conversation List */}
            <div className="md:col-span-1 rounded-2xl bg-[#111827] border border-white/[0.08] overflow-hidden">
              <div className="p-3 border-b border-white/[0.08]">
                <input
                  type="text"
                  placeholder="Search conversations..."
                  className="w-full px-3 py-2 rounded-lg bg-[#0A0E17] border border-white/[0.1] text-white text-caption placeholder:text-[#64748B] focus:outline-none focus:border-[#FF0F73] transition-all"
                />
              </div>
              <div className="overflow-y-auto h-[calc(65vh-56px)]">
                {conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => setActiveConv(conv.id)}
                    className={`w-full p-4 text-left border-b border-white/[0.04] transition-all hover:bg-white/[0.03] ${
                      activeConv === conv.id ? "bg-white/[0.06] border-l-2 border-l-[#FF0F73]" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF0F73] to-[#FF7A1A] flex items-center justify-center text-white font-bold text-caption shrink-0">
                        {conv.participant?.full_name?.[0] || conv.participant?.email[0]?.toUpperCase() || "?"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-body-sm font-semibold text-[#F1F5F9] truncate">
                            {conv.participant?.full_name || conv.participant?.email || "Unknown"}
                          </p>
                          {conv.last_message && (
                            <span className="text-caption text-[#64748B] shrink-0">
                              <TimeAgo date={conv.last_message.created_at} />
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between mt-0.5">
                          <p className="text-caption text-[#64748B] truncate">
                            {conv.last_message?.content || "No messages yet"}
                          </p>
                          {conv.unread_count > 0 && (
                            <span className="ml-2 px-1.5 py-0.5 rounded-full bg-[#FF0F73] text-white text-[10px] font-bold min-w-[18px] text-center">
                              {conv.unread_count}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Chat Area */}
            <div className="md:col-span-2 rounded-2xl bg-[#111827] border border-white/[0.08] flex flex-col overflow-hidden">
              {!activeConv ? (
                <div className="flex-1 flex items-center justify-center p-8 text-center">
                  <div>
                    <div className="w-16 h-16 rounded-full bg-white/[0.06] flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-[#64748B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <h3 className="text-heading-md font-bold text-[#F1F5F9] mb-1">Select a conversation</h3>
                    <p className="text-[#CBD5E1] text-body-sm">Choose a conversation from the left to start chatting</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b border-white/[0.08] flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF0F73] to-[#FF7A1A] flex items-center justify-center text-white font-bold text-caption">
                      {otherParticipant?.full_name?.[0] || otherParticipant?.email[0]?.toUpperCase() || "?"}
                    </div>
                    <div>
                      <p className="text-body-sm font-semibold text-[#F1F5F9]">
                        {otherParticipant?.full_name || otherParticipant?.email || "Unknown"}
                      </p>
                      {activeConversation?.experience_id && (
                        <p className="text-caption text-[#64748B]">Regarding experience booking</p>
                      )}
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {messages.length === 0 && (
                      <div className="text-center py-8">
                        <p className="text-[#64748B] text-body-sm">Start a conversation</p>
                      </div>
                    )}
                    {messages.map((msg) => {
                      const isMe = isParticipantSender(msg.sender_id);
                      return (
                        <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                          <div
                            className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-body-sm ${
                              isMe
                                ? "bg-gradient-to-r from-[#FF0F73] to-[#FF7A1A] text-white rounded-br-md"
                                : "bg-[#1E293B] text-[#CBD5E1] border border-white/[0.06] rounded-bl-md"
                            }`}
                          >
                            <p>{msg.content}</p>
                            <p className={`text-caption mt-1 ${isMe ? "text-white/60" : "text-[#64748B]"}`}>
                              {new Date(msg.created_at).toLocaleTimeString("en-US", {
                                hour: "numeric",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input */}
                  <div className="p-4 border-t border-white/[0.08]">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type a message..."
                        className="flex-1 px-4 py-2.5 rounded-xl bg-[#0A0E17] border border-white/[0.1] text-white text-body-sm placeholder:text-[#64748B] focus:outline-none focus:border-[#FF0F73] transition-all"
                      />
                      <button
                        onClick={handleSend}
                        disabled={!inputText.trim() || sending}
                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF0F73] to-[#FF7A1A] text-white font-semibold text-body-sm hover:shadow-[0_4px_16px_rgba(255,15,115,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {sending ? (
                          <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                        ) : (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
