"use client";

import { moods } from "@/lib/data";
import MoodPill from "./MoodPill";
import { useState } from "react";

export default function MoodPillWrapper() {
  const [activeMood, setActiveMood] = useState<string | null>(null);

  return (
    <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
      {moods.map((mood) => (
        <MoodPill
          key={mood.label}
          label={mood.label}
          emoji={mood.emoji}
          active={activeMood === mood.label}
          onClick={() => setActiveMood(activeMood === mood.label ? null : mood.label)}
        />
      ))}
    </div>
  );
}
