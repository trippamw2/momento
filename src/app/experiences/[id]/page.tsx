import { notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase-server";
import ExperienceDetailClient from "@/components/ExperienceDetailClient";
import { transformExperience } from "@/lib/transform";
import { experiences as mockExperiences } from "@/lib/data";

export default async function ExperienceDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Try Supabase first
  const supabase = createServerClient();
  const { data: raw, error } = await supabase
    .from("experiences")
    .select("*, partner:partner_id(business_name, business_logo, business_description, business_city, business_phone, business_email), images:experience_images(url, alt, is_primary, sort_order), moods:experience_moods(mood_id, moods(id, label, emoji))")
    .eq("id", id)
    .single();

  // Fall back to mock data if Supabase fails
  if (error || !raw) {
    const mock = mockExperiences.find((e) => e.id === id);
    if (!mock) notFound();
    return <ExperienceDetailClient experience={mock} similarExperiences={mockExperiences.filter((e) => e.id !== id).slice(0, 8)} />;
  }

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

  return <ExperienceDetailClient experience={exp} similarExperiences={sameMood} />;
}
