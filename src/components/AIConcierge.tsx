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
  } catch {}
  return next;
}

export default function AIConcierge() {
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState<{ explanation: string; results: Experience[] } | null>(null);
  const [thinking, setThinking] = useState(false);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    setSavedIds(loadSaved());
  }, []);

  const handleSuggestion = (s: string) => {
    setQuery(s);
    setTimeout(() => formRef.current?.requestSubmit(), 100);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setThinking(true);
    setResponse(null);

    try {
      const res = await fetch(`/api/ai?query=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResponse(data);
    } catch {
      // fallback silently
    } finally {
      setThinking(false);
    }
  };

  const suggestions = [
    "I want a romantic date night",
    "Something relaxing",
    "Planning a birthday",
    "On a budget, under 50k",
    "Fun for the whole family",
    "I want an adventure",
  ];

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="p-5 sm:p-6 rounded-2xl bg-[#0A101B] border border-white/[0.06]">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF0F73] to-[#F82D7B] flex items-center justify-center shadow-[0_4px_16px_rgba(255, 15, 115, 0.3)] overflow-hidden">
            <Image src="/experio-logo.png" alt="Experio" width={24} height={24} className="object-contain" />
          </div>
          <div>
            <p className="text-body font-semibold text-white">AI Concierge</p>
            <p className="text-caption text-[#6B7280]">Tell me what you&apos;re looking for</p>
          </div>
        </div>

        <form ref={formRef} onSubmit={handleSubmit} className="mb-3">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              placeholder="e.g. &quot;I want something romantic for our anniversary&quot;"
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

        {!response && !thinking && (
          <div className="flex flex-wrap gap-1.5">
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

        {response && (
          <div className="concierge-response mt-4">
            <div className="p-4 rounded-xl bg-[#111827] border border-white/[0.06] mb-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FF0F73] to-[#F82D7B] flex items-center justify-center flex-shrink-0 overflow-hidden">
                  <Image src="/experio-logo.png" alt="Experio" width={20} height={20} className="object-contain" />
                </div>
                <p className="text-body-sm text-[#A1A1AA] leading-relaxed">{response.explanation}</p>
              </div>
            </div>

            <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2">
              {response.results.slice(0, 5).map((exp) => {
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
                          <p className="text-white/50 text-caption mt-0.5 line-clamp-1">{exp.subtitle}</p>
                          <p className="text-white font-semibold text-body-sm mt-1">MK {exp.price.toLocaleString()}</p>
                        </div>
                      </div>
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
