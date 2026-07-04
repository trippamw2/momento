import { createAdminClient } from "@/lib/supabase-admin";
import { experiences } from "@/lib/data";
import { json, handleRouteError } from "@/lib/api-helpers";
import { createHash } from "crypto";

function deterministicUUID(seed: string): string {
  const hash = createHash("md5").update(seed).digest("hex");
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-a${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
}

const DEFAULT_PARTNER_ID = "00000000-0000-4000-a000-000000000001";
const DEFAULT_PARTNER_USER_ID = "00000000-0000-4000-a000-000000000000";

const CATEGORIES = [
  { name: "Date", slug: "date", description: "Romantic dinners & sunset spots", icon: "❤️", sort_order: 1 },
  { name: "Chill", slug: "chill", description: "Coffee shops, spas & cafés", icon: "🌿", sort_order: 2 },
  { name: "Celebrate", slug: "celebrate", description: "Birthdays, nightlife & dining", icon: "🎉", sort_order: 3 },
  { name: "Escape", slug: "escape", description: "Weekend getaways & adventures", icon: "🌍", sort_order: 4 },
];

export async function POST() {
  try {
    const admin = createAdminClient();

    // 1. Ensure default partner exists (referenced by experiences)
    const { data: existingPartner } = await admin
      .from("partners")
      .select("id")
      .eq("id", DEFAULT_PARTNER_ID)
      .single();

    if (!existingPartner) {
      // Check if users table has the default user
      const { data: existingUser } = await admin
        .from("users")
        .select("id")
        .eq("id", DEFAULT_PARTNER_USER_ID)
        .single();

      if (!existingUser) {
        const { error: userErr } = await admin.from("users").insert({
          id: DEFAULT_PARTNER_USER_ID,
          role: "partner",
          full_name: "Momento Platform",
          email: "platform@momento.mw",
          country: "Malawi",
          preferred_currency: "MWK",
        });
        if (userErr && !userErr.message.includes("duplicate")) {
          return json({ error: `Failed to create default user: ${userErr.message}` }, 500);
        }
      }

      const { error: partnerErr } = await admin.from("partners").insert({
        id: DEFAULT_PARTNER_ID,
        user_id: DEFAULT_PARTNER_USER_ID,
        business_name: "Momento Platform",
        business_description: "Curated experiences across Malawi",
        partner_type: "individual",
        countries: ["Malawi"],
        cities: ["Lilongwe", "Blantyre"],
        currencies: ["MWK"],
        verification_status: "verified",
        is_active: true,
      });
      if (partnerErr && !partnerErr.message.includes("duplicate")) {
        return json({ error: `Failed to create default partner: ${partnerErr.message}` }, 500);
      }
    }

    // 2. Seed categories
    for (const cat of CATEGORIES) {
      const { error } = await admin
        .from("experience_categories")
        .upsert(cat, { onConflict: "slug", ignoreDuplicates: false });

      if (error) {
        return json({ error: `Failed to seed category '${cat.slug}': ${error.message}` }, 500);
      }
    }

    // 3. Build category ID map
    const { data: catRows } = await admin
      .from("experience_categories")
      .select("id, slug");

    const catMap: Record<string, number> = {};
    if (catRows) {
      for (const row of catRows) {
        catMap[row.slug] = row.id;
      }
    }

    // 4. Seed experiences
    const experienceRows = experiences.map((exp) => {
      const slug = `momento-${exp.id}`;
      const catSlug = exp.category.toLowerCase().replace(/[\s&]+/g, "-");
      return {
        id: deterministicUUID(exp.id),
        partner_id: DEFAULT_PARTNER_ID,
        slug,
        title: exp.title,
        subtitle: exp.subtitle,
        description: exp.description,
        short_description: exp.description.slice(0, 120),
        category_id: catMap[catSlug] || null,
        category: exp.category,
        tags: exp.mood,
        moods: exp.mood,
        price: exp.price,
        currency: exp.currency as "MWK",
        location: exp.location,
        country: "Malawi",
        latitude: exp.coordinates.lat,
        longitude: exp.coordinates.lng,
        duration: exp.duration,
        capacity: exp.capacity,
        max_guests: exp.capacity,
        images: exp.images,
        status: "published",
        featured: exp.featured,
        rating: exp.rating,
        review_count: exp.reviewCount,
        includes: exp.includes,
      };
    });

    // Insert in batches of 10
    const BATCH_SIZE = 10;
    for (let i = 0; i < experienceRows.length; i += BATCH_SIZE) {
      const batch = experienceRows.slice(i, i + BATCH_SIZE);
      const { error } = await admin.from("experiences").upsert(batch, {
        onConflict: "slug",
        ignoreDuplicates: false,
      });
      if (error) {
        return json({ error: `Failed to seed experiences batch ${i / BATCH_SIZE}: ${error.message}` }, 500);
      }
    }

    return json({
      success: true,
      categories: CATEGORIES.length,
      experiences: experienceRows.length,
      message: "Database seeded successfully",
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
