import { V2Category, ExperioCategory } from "./types";

export const Experio_CATEGORIES = [
  { key: "Date" as ExperioCategory, emoji: "â¤ï¸", label: "Date", description: "Romantic dinners, sunset spots, couples activities", accent: "from-rose-400 to-pink-500" },
  { key: "Chill" as ExperioCategory, emoji: "ðŸŒ¿", label: "Chill", description: "Coffee shops, spas, beaches, cafÃ©s", accent: "from-emerald-400 to-teal-500" },
  { key: "Celebrate" as ExperioCategory, emoji: "ðŸŽ‰", label: "Celebrate", description: "Birthdays, nightlife, concerts, private dining", accent: "from-amber-400 to-orange-500" },
  { key: "Escape" as ExperioCategory, emoji: "ðŸŒ", label: "Escape", description: "Weekend getaways, lodges, safaris, adventures", accent: "from-blue-400 to-cyan-500" },
] as const;

export function mapV2CategoryToExperio(cat: V2Category): ExperioCategory {
  switch (cat) {
    case "Date Night": return "Date";
    case "Pool & Chill": return "Chill";
    case "Spa & Wellness": return "Chill";
    case "Brunch & Dining": return "Celebrate";
    case "Staycation": return "Escape";
    default: return "Chill";
  }
}
