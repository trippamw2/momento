import { V2Category, Mood, ExperioCategory } from "./types";

export const EXPERIO_CATEGORIES = [
  {
    key: "Date" as ExperioCategory,
    emoji: "❤️",
    label: "Date",
    description: "Romantic dinners, sunset spots, couples activities",
    accent: "from-rose-400 to-pink-500",
  },
  {
    key: "Chill" as ExperioCategory,
    emoji: "🌿",
    label: "Chill",
    description: "Coffee shops, spas, beaches, cafés",
    accent: "from-emerald-400 to-teal-500",
  },
  {
    key: "Celebrate" as ExperioCategory,
    emoji: "🎉",
    label: "Celebrate",
    description: "Birthdays, nightlife, concerts, private dining",
    accent: "from-amber-400 to-orange-500",
  },
  {
    key: "Escape" as ExperioCategory,
    emoji: "🌍",
    label: "Escape",
    description: "Weekend getaways, lodges, safaris, adventures",
    accent: "from-blue-400 to-cyan-500",
  },
] as const;

export const EXPERIO_EMOJI: Record<ExperioCategory, string> = Object.fromEntries(
  EXPERIO_CATEGORIES.map((c) => [c.key, c.emoji])
) as Record<ExperioCategory, string>;

export const EXPERIO_LABEL: Record<ExperioCategory, string> = Object.fromEntries(
  EXPERIO_CATEGORIES.map((c) => [c.key, c.label])
) as Record<ExperioCategory, string>;

export const EXPERIO_DESCRIPTION: Record<ExperioCategory, string> = Object.fromEntries(
  EXPERIO_CATEGORIES.map((c) => [c.key, c.description])
) as Record<ExperioCategory, string>;

export const EXPERIO_ACCENT: Record<ExperioCategory, string> = Object.fromEntries(
  EXPERIO_CATEGORIES.map((c) => [c.key, c.accent])
) as Record<ExperioCategory, string>;

export const EXPERIO_DISPLAY_CONFIG = EXPERIO_CATEGORIES;

export function mapV2CategoryToExperio(cat: V2Category): ExperioCategory {
  switch (cat) {
    case "Date Night":
      return "Date";
    case "Pool & Chill":
      return "Chill";
    case "Spa & Wellness":
      return "Chill";
    case "Brunch & Dining":
      return "Celebrate";
    case "Staycation":
      return "Escape";
    default:
      return "Chill";
  }
}

export function mapMoodToExperio(mood: Mood): ExperioCategory[] {
  switch (mood) {
    case "Romantic":
      return ["Date"];
    case "Relaxed":
      return ["Chill"];
    case "Social":
      return ["Celebrate"];
    case "Culinary":
      return ["Celebrate"];
    case "Active":
      return ["Escape"];
    case "Luxurious":
      return ["Chill", "Date"];
    case "Celebratory":
      return ["Celebrate"];
    case "Creative":
      return ["Chill"];
    default:
      return ["Chill"];
  }
}

export function getExperioCategoryForExperience(exp: {
  category: ExperioCategory | V2Category;
  mood: Mood[];
}): ExperioCategory {
  // If it's already an ExperioCategory (not a legacy V2Category), return it
  if (isExperioCategory(exp.category)) {
    return exp.category;
  }
  // Fallback: map from V2Category
  return mapV2CategoryToExperio(exp.category as V2Category);
}

function isExperioCategory(cat: string): cat is ExperioCategory {
  return ["Date", "Chill", "Celebrate", "Escape"].includes(cat);
}

export function getExperioEmoji(category: ExperioCategory): string {
  return EXPERIO_EMOJI[category] ?? "";
}

export function getExperioLabel(category: ExperioCategory): string {
  return EXPERIO_LABEL[category] ?? "";
}

export function getExperioDescription(category: ExperioCategory): string {
  return EXPERIO_DESCRIPTION[category] ?? "";
}

export function getExperioAccent(category: ExperioCategory): string {
  return EXPERIO_ACCENT[category] ?? "";
}
