import { json, handleRouteError, getQueryParams } from "@/lib/api-helpers";
import { createAdminClient } from "@/lib/supabase-admin";
import type { Experience, Mood, ExperioCategory } from "@/lib/types";

const GEMINI_MODEL = "gemini-2.0-flash";
const GEMINI_MODEL_FALLBACK = "gemini-1.5-flash";
const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

interface GeminiResponse {
  candidates?: {
    content?: {
      parts?: { text?: string }[];
    };
    finishReason?: string;
  }[];
}

interface DbExperience {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  price: number;
  currency: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  duration: string;
  tags: string[];
  category: string;
  rating: number;
  review_count: number;
  featured: boolean;
  includes: string[];
  capacity: number;
}

const GALLERY_IMAGES: Record<string, string> = {
  Date: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80",
  Chill: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&q=80",
  Celebrate: "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=600&q=80",
  Escape: "https://images.unsplash.com/photo-1540541338287-41700207dee6?w=600&q=80",
};

const GALLERY_SETS: Record<string, string[]> = {
  Date: [
    "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&q=80",
    "https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=1200&q=80",
    "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=1200&q=80",
  ],
  Chill: [
    "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&q=80",
    "https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?w=1200&q=80",
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&q=80",
  ],
  Celebrate: [
    "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=1200&q=80",
    "https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?w=1200&q=80",
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&q=80",
  ],
  Escape: [
    "https://images.unsplash.com/photo-1540541338287-41700207dee6?w=1200&q=80",
    "https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=1200&q=80",
    "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1200&q=80",
  ],
};

const COORDINATES: Record<string, { lat: number; lng: number }> = {
  Lilongwe: { lat: -13.9626, lng: 33.7741 },
  Blantyre: { lat: -15.7861, lng: 35.0058 },
};

const PARTNER_NAMES: Record<string, string> = {
  "Sunset Cruise": "Lake Malawi Cruises",
  "Pool & Lunch": "Lilongwe Club & Spa",
  "Intimate Date Night": "Lilongwe Private Dining Co.",
  "Spa Day": "Blantyre Wellness Collective",
  "Brunch Experience": "The Velvet Fork",
  "Lakeside Staycation": "Lakeside Lodge & Spa",
  "Girl's Day Out": "Lilongwe Luxe Collective",
  "Birthday Experience": "Celebrate Malawi Events",
  "Wellness Retreat": "Blantyre Sanctuary Spa",
};

function dbExpToExperience(db: DbExperience): Experience {
  const cat = db.category as ExperioCategory;
  const images = GALLERY_SETS[cat] || GALLERY_SETS.Date;
  const coords = COORDINATES[db.location] || COORDINATES.Lilongwe;
    return {
      id: db.slug || db.id,
    title: db.title,
    subtitle: db.subtitle,
    description: db.description,
    image: GALLERY_IMAGES[cat] || GALLERY_IMAGES.Date,
    images,
    price: db.price,
    currency: db.currency,
    partner: PARTNER_NAMES[db.title] || `${db.title} by Experio`,
    location: db.location,
    city: db.location,
    distance: "",
    duration: db.duration,
    mood: (db.tags || []) as Mood[],
    rating: Number(db.rating),
    reviewCount: db.review_count,
    category: cat,
    featured: db.featured,
    includes: db.includes?.length ? db.includes : [],
    capacity: db.capacity,
    coordinates: coords,
    reviews: [],
  };
}

/**
 * Fetch published experiences from the database.
 */
async function fetchExperiences(): Promise<DbExperience[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("experiences")
    .select("id, slug, title, subtitle, description, price, currency, location, latitude, longitude, duration, tags, category, rating, review_count, featured, includes, capacity")
    .eq("status", "published");
  if (error) throw error;
  return (data || []) as DbExperience[];
}

/**
 * Build a condensed experience catalog for Gemini context.
 * Uses slug as the identifier.
 */
function buildExperiencesContext(expList: DbExperience[]): string {
  return expList
    .map(
      (e) =>
        `[ID:${e.slug}] ${e.title} — ${e.subtitle}. ${(e.description || "").slice(0, 120)}... ` +
        `Category: ${e.category}. Mood: ${(e.tags || []).join(", ")}. ` +
        `Location: ${e.location}. Price: MK ${Number(e.price).toLocaleString()}. Rating: ${e.rating}/5.`
    )
    .join("\n");
}

/**
 * Call Gemini API and return the text response, or null on failure.
 */
async function callGemini(query: string, apiKey: string, model: string, expList: DbExperience[]): Promise<string | null> {
  try {
    const geminiUrl = `${GEMINI_API_BASE}/${model}:generateContent?key=${apiKey}`;
    const experienceCatalog = buildExperiencesContext(expList);

    const prompt = `You are an AI lifestyle companion for Experio.life — an experience discovery platform that helps people answer "What do you feel like doing today?" Your job is to understand what the user is looking for and recommend the best matching experiences from the catalog below.

USER QUERY: "${query}"

EXPERIENCE CATALOG:
${experienceCatalog}

Respond ONLY with a JSON object in this exact format (no markdown, no code fences):
{
  "explanation": "A warm, personalized 2-3 sentence explanation of why you chose these experiences. Reference the user's request.",
  "resultIds": ["id1", "id2", "id3", "id4", "id5"]
}

Rules:
- Select 1-5 experiences that best match the user's query (title, description, tags, category, price, location).
- If the user mentions a budget, prefer experiences within that range.
- If the user mentions a mood or category, prefer matching experiences.
- If the user mentions a location, prefer experiences in that city.
- If nothing matches well, select the closest options and explain honestly.
- The "explanation" must be in natural, warm language. Do NOT list IDs or technical details.
- Use the ID (slug) values exactly as shown (e.g., "momento-sunset-cruise"), not short codes.
- Keep resultIds to at most 5 IDs.`;

    const res = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
        },
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`Gemini API error (${model}):`, res.status, errorText.slice(0, 300));
      return null;
    }

    const data: GeminiResponse = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
  } catch (error) {
    console.error(`Gemini fetch error (${model}):`, error);
    return null;
  }
}

/**
 * Keyword-based fallback that queries the DB experiences array.
 */
function keywordFallback(query: string, expList: DbExperience[]): { explanation: string; results: Experience[] } {
  const q = query.toLowerCase();
  let key = "date_night";
  if (q.includes("pool") || q.includes("chill") || q.includes("swim") || q.includes("relax")) key = "pool_chill";
  else if (q.includes("spa") || q.includes("wellness") || q.includes("yoga") || q.includes("massage")) key = "spa_wellness";
  else if (q.includes("brunch") || q.includes("food") || q.includes("dinner") || q.includes("cook")) key = "brunch_dining";
  else if (q.includes("stay") || q.includes("weekend") || q.includes("escape") || q.includes("night")) key = "staycation";
  else if (q.includes("celebrate") || q.includes("birthday") || q.includes("party") || q.includes("girls")) key = "celebrate";
  else if (q.includes("budget") || q.includes("cheap") || q.includes("affordable")) key = "budget";
  else if (q.includes("date") || q.includes("romantic") || q.includes("couple") || q.includes("together")) key = "date_night";

  const categoryMap: Record<string, string> = {
    date_night: "Date",
    pool_chill: "Chill",
    spa_wellness: "Chill",
    brunch_dining: "Celebrate",
    staycation: "Escape",
    celebrate: "Celebrate",
    budget: "Celebrate",
  };

  const matchCategory = categoryMap[key] || "Date";
  const matches = expList
    .filter((e) => e.category === matchCategory)
    .slice(0, 5)
    .map(dbExpToExperience);

  const explanations: Record<string, string> = {
    date_night: "For a romantic evening, I recommend these intimate experiences perfect for two.",
    pool_chill: "Looking to relax and unwind? These poolside and laid-back experiences are just the ticket.",
    spa_wellness: "Time to recharge! These wellness experiences will melt your stress away.",
    brunch_dining: "For food lovers, here are the best culinary experiences that will delight your taste buds.",
    staycation: "Escape without going far. These staycation experiences are perfect for a reset.",
    celebrate: "Time to celebrate! These experiences are perfect for marking life's special moments.",
    budget: "Great experiences that won't break the bank. Here are affordable options you'll love.",
  };

  return {
    explanation: explanations[key] || "Here are some experiences you might enjoy:",
    results: matches,
  };
}

export async function GET(request: Request) {
  try {
    const params = getQueryParams(request.url);
    const query = params.query || "";
    if (!query.trim()) {
      return json({ explanation: "Please tell me what you're looking for.", results: [] });
    }

    // Fetch experiences from DB
    const dbExperiences = await fetchExperiences();
    if (dbExperiences.length === 0) {
      return json({ explanation: "No experiences available right now. Please check back later.", results: [] });
    }

    // Build slug lookup for mapping Gemini resultIds to DB rows
    const slugToDb = new Map(dbExperiences.map((e) => [e.slug, e]));

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      // No API key — fall back to keyword matching against DB data
      return json(keywordFallback(query, dbExperiences));
    }

    // Try Gemini with primary model, fallback to secondary model
    let geminiResult = await callGemini(query, apiKey, GEMINI_MODEL, dbExperiences);
    if (!geminiResult) {
      geminiResult = await callGemini(query, apiKey, GEMINI_MODEL_FALLBACK, dbExperiences);
    }

    // If Gemini succeeded, parse and return its response
    if (geminiResult) {
      const text = geminiResult;

      // Parse JSON from Gemini response (handle possible markdown fences)
      let jsonStr = text.trim();
      if (jsonStr.startsWith("```")) {
        jsonStr = jsonStr.replace(/```(?:json)?\n?/g, "").trim();
      }

      let parsed: { explanation?: string; resultIds?: string[] };
      try {
        parsed = JSON.parse(jsonStr);
      } catch {
        const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            parsed = JSON.parse(jsonMatch[0]);
          } catch {
            return json(keywordFallback(query, dbExperiences));
          }
        } else {
          return json(keywordFallback(query, dbExperiences));
        }
      }

      const explanation = parsed.explanation || "Here are some experiences you might enjoy:";
      const resultIds = parsed.resultIds || [];

      const results: Experience[] = resultIds
        .map((id) => slugToDb.get(id))
        .filter((e): e is DbExperience => e !== undefined)
        .map(dbExpToExperience);

      return json({ explanation, results, query });
    }

    // Gemini failed — fall back to keyword-based matching
    console.warn("Gemini unavailable, using keyword fallback for:", query);
    return json(keywordFallback(query, dbExperiences));
  } catch (error) {
    return handleRouteError(error);
  }
}
