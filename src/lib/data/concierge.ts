import { Experience } from "../types";
import { experiences } from "./experiences";

export const AI_CONCIERGE_RESPONSES: Record<string, { explanation: string; experienceIds: string[] }> = {
  date_night: {
    explanation: "For a romantic evening, I recommend these intimate experiences perfect for two.",
    experienceIds: ["sunset-cruise", "date-night", "private-beach-dinner", "rooftop-dining", "couples-massage"],
  },
  pool_chill: {
    explanation: "Looking to relax and unwind? These poolside and laid-back experiences are just the ticket.",
    experienceIds: ["pool-lunch", "lake-kayaking", "family-picnic", "paint-sip", "coffee-brunch"],
  },
  spa_wellness: {
    explanation: "Time to recharge! These wellness experiences will melt your stress away.",
    experienceIds: ["spa-day", "wellness-retreat", "yoga-retreat", "couples-massage", "pool-lunch"],
  },
  brunch_dining: {
    explanation: "For food lovers, here are the best culinary experiences that will delight your taste buds.",
    experienceIds: ["brunch-experience", "wine-tasting", "cooking-class", "rooftop-dining", "coffee-brunch"],
  },
  staycation: {
    explanation: "Escape without going far. These staycation experiences are perfect for a reset.",
    experienceIds: ["staycation", "glamping-weekend", "wellness-retreat", "spa-day", "private-beach-dinner"],
  },
  celebrate: {
    explanation: "Time to celebrate! These experiences are perfect for marking life's special moments.",
    experienceIds: ["birthday-experience", "girls-day-out", "paint-sip", "mixology-class", "live-music-night"],
  },
  budget: {
    explanation: "Great experiences that won't break the bank. Here are affordable options you'll love.",
    experienceIds: ["coffee-brunch", "lake-kayaking", "paint-sip", "brunch-experience", "wine-tasting"],
  },
};

export function getConciergeResponse(query: string): { explanation: string; results: Experience[] } {
  const q = query.toLowerCase();
  let key = "date_night";
  if (q.includes("pool") || q.includes("chill") || q.includes("swim") || q.includes("relax")) key = "pool_chill";
  else if (q.includes("spa") || q.includes("wellness") || q.includes("yoga") || q.includes("massage")) key = "spa_wellness";
  else if (q.includes("brunch") || q.includes("food") || q.includes("dinner") || q.includes("cook")) key = "brunch_dining";
  else if (q.includes("stay") || q.includes("weekend") || q.includes("escape") || q.includes("night")) key = "staycation";
  else if (q.includes("celebrate") || q.includes("birthday") || q.includes("party") || q.includes("girls")) key = "celebrate";
  else if (q.includes("budget") || q.includes("cheap") || q.includes("affordable")) key = "budget";
  else if (q.includes("date") || q.includes("romantic") || q.includes("couple") || q.includes("together")) key = "date_night";

  const response = AI_CONCIERGE_RESPONSES[key] || AI_CONCIERGE_RESPONSES.date_night;
  return {
    explanation: response.explanation,
    results: response.experienceIds.map((id) => experiences.find((e) => e.id === id)).filter(Boolean) as Experience[],
  };
}
