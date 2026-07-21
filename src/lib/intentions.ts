import { Intention, Mood, Experience, INTENTIONS } from "./types";

// Mood → Intentions mapping
export function mapMoodToIntentions(mood: Mood): Intention[] {
  const map: Record<Mood, Intention[]> = {
    Romantic: ["together"],
    Relaxed: ["treat-me", "get-away"],
    Social: ["lets-go-out"],
    Culinary: ["let-eat"],
    Active: ["lets-go-out"],
    Luxurious: ["treat-me"],
    Celebratory: ["together", "lets-go-out"],
    Creative: ["treat-me"],
  };
  return map[mood] ?? [];
}

// Get deduplicated intentions from a mood array
export function getIntentionsFromMoods(moods: Mood[]): Intention[] {
  const result = moods.flatMap((m) => mapMoodToIntentions(m));
  return [...new Set(result)];
}

// Get intentions for an Experience (using mood)
export function getIntentionsForExperience(exp: Pick<Experience, "mood">): Intention[] {
  return getIntentionsFromMoods(exp.mood);
}

export function getIntentionEmoji(intention: Intention): string {
  const found = INTENTIONS.find((i) => i.key === intention);
  return found?.emoji ?? "✦";
}

export function getIntentionLabel(intention: Intention): string {
  const found = INTENTIONS.find((i) => i.key === intention);
  return found?.label ?? intention;
}

export function getIntentionCta(intention: Intention): string {
  const found = INTENTIONS.find((i) => i.key === intention);
  return found?.ctaDefault ?? "Let's Go";
}

// Display config for UI grids (5 intention cards)
export const INTENTION_DISPLAY_CONFIG = INTENTIONS.map((i) => ({
  key: i.key,
  emoji: i.emoji,
  label: i.label,
  description: i.description,
  accent: i.accent,
  href: `/experiences?intention=${i.key}`,
}));
