"use client";

import { useState } from "react";
import { Mood } from "@/lib/types";
import MoodPill from "./MoodPill";

const MOODS_DATA: { label: Mood; description: string; accent: string }[] = [
  { label: "Romantic", description: "For two", accent: "from-rose-500 to-pink-500" },
  { label: "Relaxed", description: "Unwind", accent: "from-emerald-500 to-teal-500" },
  { label: "Social", description: "With friends", accent: "from-amber-500 to-orange-500" },
  { label: "Culinary", description: "Food lovers", accent: "from-amber-600 to-orange-600" },
  { label: "Active", description: "Get moving", accent: "from-blue-500 to-cyan-500" },
  { label: "Luxurious", description: "Premium", accent: "from-fuchsia-500 to-purple-500" },
  { label: "Celebratory", description: "Special moments", accent: "from-pink-500 to-rose-500" },
  { label: "Creative", description: "Artsy fun", accent: "from-violet-500 to-purple-500" },
];

export default function MoodPillWrapper() {
  const [activeMood, setActiveMood] = useState<string | null>(null);

  return (
    <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
      {MOODS_DATA.map((mood) => (
        <MoodPill
          key={mood.label}
          label={mood.label}
          active={activeMood === mood.label}
          onClick={() => setActiveMood(activeMood === mood.label ? null : mood.label)}
        />
      ))}
    </div>
  );
}
