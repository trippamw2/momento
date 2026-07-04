import { V2Category, Mood, Intention } from "./types";

export const INTENTIONS = [
  {
    key: "let-eat" as Intention,
    emoji: "🍽",
    label: "Let's Eat",
    description: "I'm hungry / I want food or drinks",
    accent: "from-amber-500 to-orange-500",
  },
  {
    key: "treat-me" as Intention,
    emoji: "✨",
    label: "Treat Me",
    description: "I need to relax and recharge",
    accent: "from-emerald-500 to-teal-500",
  },
  {
    key: "lets-go-out" as Intention,
    emoji: "☀️",
    label: "Let's Go Out",
    description: "I want to have fun and socialize",
    accent: "from-rose-500 to-pink-500",
  },
  {
    key: "together" as Intention,
    emoji: "❤️",
    label: "Together",
    description: "Planning something special for two",
    accent: "from-pink-500 to-rose-500",
  },
  {
    key: "get-away" as Intention,
    emoji: "🌴",
    label: "Get Away",
    description: "I need a change of scenery",
    accent: "from-blue-500 to-cyan-500",
  },
] as const;

export const INTENTION_EMOJI: Record<Intention, string> = Object.fromEntries(
  INTENTIONS.map((i) => [i.key, i.emoji])
) as Record<Intention, string>;

export const INTENTION_LABEL: Record<Intention, string> = Object.fromEntries(
  INTENTIONS.map((i) => [i.key, i.label])
) as Record<Intention, string>;

export const INTENTION_DESCRIPTION: Record<Intention, string> = Object.fromEntries(
  INTENTIONS.map((i) => [i.key, i.description])
) as Record<Intention, string>;

export const INTENTION_ACCENT: Record<Intention, string> = Object.fromEntries(
  INTENTIONS.map((i) => [i.key, i.accent])
) as Record<Intention, string>;

export const INTENTION_DISPLAY_CONFIG = INTENTIONS;

export function mapCategoryToIntentions(cat: V2Category): Intention[] {
  switch (cat) {
    case "Date Night":
      return ["together"];
    case "Pool & Chill":
      return ["lets-go-out"];
    case "Spa & Wellness":
      return ["treat-me"];
    case "Brunch & Dining":
      return ["let-eat"];
    case "Staycation":
      return ["get-away"];
    default:
      return [];
  }
}

export function mapMoodToIntentions(mood: Mood): Intention[] {
  switch (mood) {
    case "Romantic":
      return ["together"];
    case "Relaxed":
      return ["treat-me", "get-away"];
    case "Social":
      return ["lets-go-out"];
    case "Culinary":
      return ["let-eat"];
    case "Active":
      return ["lets-go-out"];
    case "Luxurious":
      return ["treat-me"];
    case "Celebratory":
      return ["together", "lets-go-out"];
    case "Creative":
      return ["treat-me"];
    default:
      return [];
  }
}

export function getIntentionsForExperience(exp: { category: V2Category; mood: Mood[]; intentions?: Intention[] }): Intention[] {
  if (exp.intentions && exp.intentions.length > 0) {
    return exp.intentions;
  }
  const fromCategory = mapCategoryToIntentions(exp.category);
  const fromMood = exp.mood.flatMap(mapMoodToIntentions);
  return [...new Set([...fromCategory, ...fromMood])];
}

export function getIntentionEmoji(intention: Intention): string {
  return INTENTION_EMOJI[intention] ?? "";
}

export function getIntentionLabel(intention: Intention): string {
  return INTENTION_LABEL[intention] ?? "";
}

export function getIntentionDescription(intention: Intention): string {
  return INTENTION_DESCRIPTION[intention] ?? "";
}

export function getIntentionAccent(intention: Intention): string {
  return INTENTION_ACCENT[intention] ?? "";
}