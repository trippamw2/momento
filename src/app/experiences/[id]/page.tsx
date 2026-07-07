import { notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase-server";
import ErrorBoundaryWrapper from "./ErrorBoundaryWrapper";
import ExperienceDetailClient from "@/components/ExperienceDetailClient";
import { transformExperience } from "@/lib/transform";
import { experiences as mockExperiences } from "@/lib/data";

function getMockExperience(id: string) {
  // Direct match by id
  const direct = mockExperiences.find((e) => e.id === id);
  if (direct) return direct;
  // Fallback: if id is a UUID (DB slug fallback) or unknown, try matching by
  // extracting the slug-like tail or by title slug
  const slugified = id.replace(/^.*[/#]/, "").toLowerCase().replace(/\s+/g, "-");
  return mockExperiences.find((e) => e.id === slugified) ?? null;
}

async function tryFetchExperience(id: string) {
  try {
    const supabase = createServerClient();

    // First try lookup by UUID (primary key)
    let { data: raw, error } = await supabase
      .from("experiences")
      .select("*, partner:partner_id(business_name, business_logo, business_description, business_city, business_phone, business_email), images:experience_images(url, alt, is_primary, sort_order), moods:experience_moods(mood_id, moods(id, label, emoji))")
      .eq("id", id)
      .single();

    // If not found by UUID, try by slug (for AI Concierge links etc.)
    if (error || !raw) {
      const { data: slugResult } = await supabase
        .from("experiences")
        .select("*, partner:partner_id(business_name, business_logo, business_description, business_city, business_phone, business_email), images:experience_images(url, alt, is_primary, sort_order), moods:experience_moods(mood_id, moods(id, label, emoji))")
        .eq("slug", id)
        .single();
      if (slugResult) raw = slugResult;
    }

    if (error && !raw) return null;

    const { data: reviews } = await supabase
      .from("reviews")
      .select("*, user:user_id(full_name, avatar_url)")
      .eq("experience_id", id)
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(20);

    const exp = transformExperience({ ...raw, reviews: reviews ?? [] });

    const rawMoods = (raw.moods as Array<unknown>) ?? [];
    const { data: moodExps } = rawMoods.length > 0
      ? await supabase
          .from("experiences")
          .select("id")
          .limit(10)
          .neq("id", id)
          .eq("status", "published")
      : await supabase
          .from("experiences")
          .select("id")
          .limit(10)
          .neq("id", id)
          .eq("status", "published");

    const similarIds = (moodExps ?? []).map((e: { id: string }) => e.id);

    const { data: allSimilar } = await supabase
      .from("experiences")
      .select("*, partner:partner_id(business_name, business_logo, business_city), images:experience_images(url, alt, is_primary, sort_order), moods:experience_moods(mood_id, moods(id, label, emoji))")
      .in("id", similarIds.length > 0 ? similarIds : [""])
      .limit(10);

    const sameMood = (allSimilar ?? []).map((e: Record<string, unknown>) => transformExperience(e));

    return { experience: exp, similar: sameMood };
  } catch {
    return null;
  }
}

export default async function ExperienceDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Try Supabase first (wrapped in try-catch for missing env vars or network errors)
  const result = await tryFetchExperience(id);

  if (result) {
    return (
      <ErrorBoundaryWrapper>
        <ExperienceDetailClient experience={result.experience} similarExperiences={result.similar} />
      </ErrorBoundaryWrapper>
    );
  }

  // Fall back to mock data
  const mock = getMockExperience(id);
  if (!mock) notFound();

  const similar = mockExperiences
    .filter((e) => e.id !== id)
    .slice(0, 8);

  return (
    <ErrorBoundaryWrapper>
      <ExperienceDetailClient experience={mock} similarExperiences={similar} />
    </ErrorBoundaryWrapper>
  );
}
