"use client";

import { Mood } from "@/lib/types";

interface MoodPillProps {
  label: Mood;
  emoji: string;
  active?: boolean;
  onClick?: () => void;
}

export default function MoodPill({ label, emoji, active, onClick }: MoodPillProps) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-2 px-5 py-2.5 rounded-full text-body-sm font-medium
        whitespace-nowrap transition-all duration-300
        ${
          active
            ? "gradient-brand text-text-on-gradient shadow-brand-glow"
            : "bg-surface-tertiary text-text-secondary hover:bg-surface-elevated hover:text-text-primary border border-border-subtle"
        }
      `}
    >
      <span className="text-base leading-none">{emoji}</span>
      {label}
    </button>
  );
}
