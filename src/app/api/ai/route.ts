import { json, handleRouteError, getQueryParams } from "@/lib/api-helpers";
import { experiences, getConciergeResponse } from "@/lib/data";
import type { Experience } from "@/lib/types";

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

/**
 * Build a condensed experience catalog for Gemini context.
 * Includes id, title, subtitle, description snippet, price, mood, category, location, rating.
 */
function buildExperiencesContext(expList: typeof experiences): string {
  return expList
    .map(
      (e) =>
        `[ID:${e.id}] ${e.title} — ${e.subtitle}. ${e.description.slice(0, 120)}... ` +
        `Category: ${e.category}. Mood: ${e.mood.join(", ")}. ` +
        `Location: ${e.location}. Price: MK ${e.price.toLocaleString()}. Rating: ${e.rating}/5.` +
        (e.bestTimeToVisit ? ` Best time: ${e.bestTimeToVisit}.` : "")
    )
    .join("\n");
}

/**
 * Call Gemini API and return the text response, or null on failure.
 */
async function callGemini(query: string, apiKey: string, model: string): Promise<string | null> {
  try {
    const geminiUrl = `${GEMINI_API_BASE}/${model}:generateContent?key=${apiKey}`;
    const experienceCatalog = buildExperiencesContext(experiences);

    const prompt = `You are an AI lifestyle companion for Momento.life — an experience discovery platform that helps people answer "What do you feel like doing today?" Your job is to understand what the user is looking for and recommend the best matching experiences from the catalog below.

USER QUERY: "${query}"

EXPERIENCE CATALOG:
${experienceCatalog}

Respond ONLY with a JSON object in this exact format (no markdown, no code fences):
{
  "explanation": "A warm, personalized 2-3 sentence explanation of why you chose these experiences. Reference the user's request.",
  "resultIds": ["id1", "id2", "id3", "id4", "id5"]
}

Rules:
- Select 1-5 experiences that best match the user's query (title, description, mood, category, price, location).
- If the user mentions a budget, prefer experiences within that range.
- If the user mentions a mood or category, prefer matching experiences.
- If the user mentions a location, prefer experiences in that city.
- If nothing matches well, select the closest options and explain honestly.
- The "explanation" must be in natural, warm language. Do NOT list IDs or technical details.
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

export async function GET(request: Request) {
  try {
    const params = getQueryParams(request.url);
    const query = params.query || "";
    if (!query.trim()) {
      return json({ explanation: "Please tell me what you're looking for.", results: [] });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      // No API key — fall back to built-in keyword matching
      return json(getConciergeResponse(query));
    }

    // Try Gemini with primary model, fallback to secondary model
    let geminiResult = await callGemini(query, apiKey, GEMINI_MODEL);
    if (!geminiResult) {
      geminiResult = await callGemini(query, apiKey, GEMINI_MODEL_FALLBACK);
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
            // Fall through to keyword matcher below
            return json(getConciergeResponse(query));
          }
        } else {
          return json(getConciergeResponse(query));
        }
      }

      const explanation = parsed.explanation || "Here are some experiences you might enjoy:";
      const resultIds = parsed.resultIds || [];

      const idToExp = new Map(experiences.map((e) => [e.id, e]));
      const results: Experience[] = resultIds
        .map((id) => idToExp.get(id))
        .filter((e): e is Experience => e !== undefined);

      return json({ explanation, results, query });
    }

    // Gemini failed — fall back to keyword-based matching
    console.warn("Gemini unavailable, using keyword fallback for:", query);
    return json(getConciergeResponse(query));
  } catch (error) {
    return handleRouteError(error);
  }
}
