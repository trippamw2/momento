import { V2Category, MomentoCategory } from "./types";

export const MOMENTO_CATEGORIES = [
  { key: "Date" as MomentoCategory, emoji: "❤️", label: "Date", description: "Romantic dinners, sunset spots, couples activities", accent: "from-rose-400 to-pink-500" },
  { key: "Chill" as MomentoCategory, emoji: "🌿", label: "Chill", description: "Coffee shops, spas, beaches, cafés", accent: "from-emerald-400 to-teal-500" },
  { key: "Celebrate" as MomentoCategory, emoji: "🎉", label: "Celebrate", description: "Birthdays, nightlife, concerts, private dining", accent: "from-amber-400 to-orange-500" },
  { key: "Escape" as MomentoCategory, emoji: "🌍", label: "Escape", description: "Weekend getaways, lodges, safaris, adventures", accent: "from-blue-400 to-cyan-500" },
] as const;

export function mapV2CategoryToMomento(cat: V2Category): MomentoCategory {
  switch (cat) {
    case "Date Night": return "Date";
    case "Pool & Chill": return "Chill";
    case "Spa & Wellness": return "Chill";
    case "Brunch & Dining": return "Celebrate";
    case "Staycation": return "Escape";
    default: return "Chill";
  }
}
