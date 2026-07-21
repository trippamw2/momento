"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Experience } from "@/lib/types";

function loadSaved(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("experio-saved");
    if (!raw) return [];
    return JSON.parse(raw).savedIds || [];
  } catch { return []; }
}

function toggleSave(id: string, current: string[]): string[] {
  const next = current.includes(id) ? current.filter((s) => s !== id) : [...current, id];
  try {
    const raw = localStorage.getItem("experio-saved");
    const state = raw ? JSON.parse(raw) : { savedIds: [], collections: [] };
    state.savedIds = next;
    localStorage.setItem("experio-saved", JSON.stringify(state));
  } catch (e) { console.warn("Failed to save saved state:", e); }
  return next;
}

type Message = {
  role: "user" | "assistant";
  content: string;
  results?: Experience[];
};

export default function AIConcierge() {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [thinking, setThinking] = useState(false);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSavedIds(loadSaved());
  }, []);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages, thinking]);

  const handleSuggestion = (s: string) => {
    setQuery(s);
    setTimeout(() => formRef.current?.requestSubmit(), 100);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const userQuery = query.trim();
    setQuery("");
    setMessages((prev) => [...prev, { role: "user", content: userQuery }]);
    setThinking(true);

    try {
      const res = await fetch(`/api/ai?query=${encodeURIComponent(userQuery)}`);
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      setMessages((prev) => [...prev, {
        role: "assistant",
        content: data.explanation || "Here are some suggestions for you:",
        results: data.results || [],
      }]);
    } catch {
      setMessages((prev) => [...prev, {
        role: "assistant",
        content: "Sorry, I couldn't process that. Please try again.",
        results: [],
      }]);
    } finally {
      setThinking(false);
    }
  };

  const handleAskAnother = () => {
    inputRef.current?.focus();
  };

  const suggestions = [
    "I'm planning a date night 🍽",
    "I need to relax and recharge ✨",
    "Planning a celebration ❤️",
    "I want to get out and have fun ☀️",
    "I need to escape for a bit 🌍",
    "I have MWK 50,000 💰",
  ];

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="p-5 sm:p-6 rounded-2xl bg-[#0A101B] border border-white/[0.06]">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF0F73] to-[#F82D7B] flex items-center justify-center shadow-[0_4px_16px_rgba(255, 15, 115, 0.3)] overflow-hidden">
            <Image src="/experio-icon.svg" alt="Momento" width={24} height={24} className="object-contain" />
          </div>
          <div>
            <p className="text-body font-semibold text-white">AI Concierge</p>
            <p className="text-caption text-[#6B7280]">Ask me anything — I'll find your perfect experience</p>
          </div>
        </div>

        {/* ─── Chat Messages ─── */}
        <div ref={chatRef} className="space-y-4 mb-4 max-h-96 overflow-y-auto pr-1">
          {messages.length === 0 && !thinking && (
            <p className="text-caption text-[#6B7280] text-center py-6">
              Ask me anything about experiences in Malawi!
            </p>
          )}

          {messages.map((msg, i) => (
            <div key={i}>
              {msg.role === "user" ? (
                <div className="flex justify-end">
                  <div className="max-w-[80%] px-4 py-2.5 rounded-2xl bg-gradient-to-r from-[#FF0F73] to-[#F82D7B] text-white text-body-sm leading-relaxed shadow-[0_2px_8px_rgba(255,15,115,0.2)]">
                    {msg.content}
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FF0F73] to-[#F82D7B] flex items-center justify-center flex-shrink-0 overflow-hidden shadow-[0_2px_8px_rgba(255,15,115,0.2)]">
                    <Image src="/experio-icon.svg" alt="Momento" width={20} height={20} className="object-contain" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="p-4 rounded-xl bg-[#111827] border border-white/[0.06] mb-3">
                      <p className="text-body-sm text-[#A1A1AA] leading-relaxed">{msg.content}</p>
                    </div>
                    {msg.results && msg.results.length > 0 && (
                      <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2">
                        {msg.results.slice(0, 5).map((exp) => {
                          const saved = savedIds.includes(exp.id);
                          return (
                            <div key={exp.id} className="w-44 flex-shrink-0 group">
                              <Link href={`/experiences/${exp.id}`}>
                                <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-[#111827] transition-all duration-500 group-hover:scale-[1.02]">
                                  <Image
                                    src={exp.image}
                                    alt={exp.title}
                                    fill
                                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                                    sizes="176px"
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-[#05070B] via-transparent to-transparent" />
                                  <button
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSavedIds(toggleSave(exp.id, savedIds)); }}
                                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-[#FF0F73]/60"
                                  >
                                    <span className="text-caption font-bold" style={{ color: saved ? "#FF0F73" : "white" }}>
                                      {saved ? "♥" : "♡"}
                                    </span>
                                  </button>
                                  <div className="absolute bottom-0 left-0 right-0 p-2.5">
                                    <p className="text-white font-semibold text-body-sm leading-tight line-clamp-1">{exp.title}</p>
                                    <p className="text-[#64748B] text-caption mt-0.5 line-clamp-1">{exp.subtitle}</p>
                                    <p className="text-white font-semibold text-body-sm mt-1">MK {exp.price.toLocaleString()}</p>
                                  </div>
                                </div>
                              </Link>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {/* Ask another question */}
                    {i === messages.length - 1 && (
                      <button
                        onClick={handleAskAnother}
                        className="mt-2 px-4 py-1.5 rounded-full bg-[#111827] border border-white/[0.06] text-caption text-[#A1A1AA] hover:bg-[#1a2235] hover:text-white transition-all"
                      >
                        Ask another question
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Thinking indicator */}
          {thinking && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FF0F73] to-[#F82D7B] flex items-center justify-center flex-shrink-0 overflow-hidden">
                <Image src="/experio-icon.svg" alt="Momento" width={20} height={20} className="object-contain" />
              </div>
              <div className="p-4 rounded-xl bg-[#111827] border border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#FF0F73] animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-2 h-2 rounded-full bg-[#FF0F73] animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-2 h-2 rounded-full bg-[#FF0F73] animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ─── Suggestion Chips (when no messages) ─── */}
        {messages.length === 0 && !thinking && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => handleSuggestion(s)}
                className="px-3 py-1.5 rounded-full bg-[#111827] border border-white/[0.06] text-caption text-[#A1A1AA] hover:bg-[#1a2235] hover:text-white transition-all"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* ─── Input ─── */}
        <form ref={formRef} onSubmit={handleSubmit}>
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              placeholder="Ask me anything..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="concierge-input pr-12"
            />
            <button
              type="submit"
              disabled={!query.trim() || thinking}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-gradient-to-r from-[#FF0F73] via-[#F82D7B] to-[#515BD4] flex items-center justify-center disabled:opacity-30 transition-all hover:shadow-[0_4px_16px_rgba(255, 15, 115, 0.3)]"
            >
              {thinking ? (
                <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              ) : (
                <span className="text-body font-bold text-white">→</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
