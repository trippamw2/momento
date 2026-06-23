import { json, handleRouteError, getQueryParams } from "@/lib/api-helpers";
import { createServerClient } from "@/lib/supabase-server";

const CONCIERGE_RESPONSES: Record<string, { explanation: string }> = {
  romantic: {
    explanation: "For a romantic experience, I recommend these intimate and beautiful moments perfect for two.",
  },
  relax: {
    explanation: "Unwind and recharge with these calming experiences designed to melt your stress away.",
  },
  celebrate: {
    explanation: "Time to celebrate! These experiences are perfect for marking life's special moments.",
  },
  adventure: {
    explanation: "Feed your adventurous spirit with these thrilling and exciting experiences.",
  },
  food: {
    explanation: "For food lovers, here are the best culinary experiences that will delight your taste buds.",
  },
  family: {
    explanation: "Perfect for the whole family! These experiences have something for everyone to enjoy together.",
  },
  budget: {
    explanation: "Great experiences that won't break the bank. Here are affordable options you'll love.",
  },
};

function classifyQuery(query: string): string {
  const q = query.toLowerCase();
  if (q.includes("relax") || q.includes("calm") || q.includes("stress") || q.includes("unwind")) return "relax";
  if (q.includes("celebrate") || q.includes("birthday") || q.includes("party")) return "celebrate";
  if (q.includes("adventure") || q.includes("thrill") || q.includes("active") || q.includes("sport")) return "adventure";
  if (q.includes("food") || q.includes("eat") || q.includes("dinner") || q.includes("brunch") || q.includes("wine")) return "food";
  if (q.includes("family") || q.includes("kid") || q.includes("child")) return "family";
  if (q.includes("budget") || q.includes("cheap") || q.includes("affordable")) return "budget";
  return "romantic";
}

export async function GET(request: Request) {
  try {
    const params = getQueryParams(request.url);
    const query = params.query || "";
    const key = classifyQuery(query);

    const supabase = createServerClient();

    // Map concierge categories to experience moods
    const moodMap: Record<string, string[]> = {
      romantic: ["Romantic"],
      relax: ["Relax", "Self Care"],
      celebrate: ["Celebrate"],
      adventure: ["Adventure"],
      food: ["Food & Drink"],
      family: ["Family"],
      budget: [],
    };

    const moods = moodMap[key] || [];

    let experienceQuery = supabase
      .from("experiences")
      .select("*, images:experience_images(url, alt, is_primary)", { count: "exact" })
      .eq("status", "published");

    if (moods.length > 0) {
      experienceQuery = experienceQuery.overlaps("mood_tags", moods);
    }

    if (key === "budget") {
      experienceQuery = experienceQuery.lte("price", 50000).order("price", { ascending: true });
    } else {
      experienceQuery = experienceQuery.order("rating", { ascending: false });
    }

    experienceQuery = experienceQuery.limit(5);

    const { data: experiences, error } = await experienceQuery;
    if (error) throw error;

    const response = CONCIERGE_RESPONSES[key] || CONCIERGE_RESPONSES.romantic;

    return json({
      explanation: response.explanation,
      results: experiences || [],
      query,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
