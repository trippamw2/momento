import { json, handleRouteError, getQueryParams } from "@/lib/api-helpers";
import { createServerClient } from "@/lib/supabase-server";

export async function GET(request: Request) {
  try {
    const params = getQueryParams(request.url);
    const limit = Math.min(20, Math.max(1, parseInt(params.limit ?? "10")));
    const lat = params.lat ? parseFloat(params.lat) : null;
    const lng = params.lng ? parseFloat(params.lng) : null;
    const radiusKm = parseFloat(params.radius_km ?? "25");

    const supabase = createServerClient();

    // Fetch published experiences with images, moods, and booking counts
    let query = supabase
      .from("experiences")
      .select(`
        *,
        partner:partner_id(business_name, business_logo, cities),
        images:experience_images(url, alt, is_primary, sort_order),
        moods:experience_moods(mood_id, moods(id, label, emoji)),
        bookings:bookings!experience_id(count)
      `, { count: "exact" })
      .eq("status", "published");

    const { data: experiences, error } = await query.limit(200);

    if (error) throw error;
    if (!experiences || experiences.length === 0) return json({ recommendations: [], trending: [], near_you: [] });

    // Score each experience
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay();
    const isWeekend = day === 5 || day === 6 || day === 0;

    const scored = experiences.map((exp) => {
      let score = 0;

      // Rating quality (0-5 scale, boost above 4)
      score += (exp.rating || 0) * 2;
      if ((exp.rating || 0) >= 4.5) score += 5;
      if ((exp.rating || 0) >= 4.0) score += 2;

      // Booking popularity
      const bookingCount = exp.bookings?.[0]?.count ?? 0;
      score += Math.min(bookingCount * 0.5, 10);

      // Time of day bonus
      if (hour >= 17 && hour < 22) {
        if (exp.category === "Date") score += 4;
        if (exp.category === "Escape") score += 2;
      } else if (hour >= 6 && hour < 12) {
        if (exp.category === "Chill") score += 3;
        if (exp.category === "Celebrate") score += 2;
      } else if (hour >= 12 && hour < 17) {
        if (exp.category === "Chill") score += 2;
      }

      // Weekend bonus
      if (isWeekend) {
        if (exp.category === "Date" || exp.category === "Escape") score += 2;
        if (exp.category === "Celebrate") score += 3;
      }

      // Proximity bonus (if user location provided)
      let distance = Infinity;
      if (lat && lng && exp.coordinates) {
        const expCoords = exp.coordinates as { lat: number; lng: number };
        const R = 6371;
        const dLat = ((expCoords.lat - lat) * Math.PI) / 180;
        const dLng = ((expCoords.lng - lng) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) ** 2 +
          Math.cos((lat * Math.PI) / 180) *
            Math.cos((expCoords.lat * Math.PI) / 180) *
            Math.sin(dLng / 2) ** 2;
        distance = 2 * R * Math.asin(Math.sqrt(a));
        if (distance < 2) score += 5;
        else if (distance < 5) score += 3;
        else if (distance < 10) score += 2;
        else if (distance < 15) score += 1;
      }

      // Recency: newer experiences get a boost
      const created = new Date(exp.created_at).getTime();
      const ageDays = (now.getTime() - created) / (1000 * 60 * 60 * 24);
      if (ageDays < 7) score += 3;
      else if (ageDays < 30) score += 1;

      // Has images bonus
      if (exp.images && exp.images.length > 0) score += 1;

      return { exp, score, distance };
    });

    // Sort by score
    scored.sort((a, b) => b.score - a.score);

    // Build response sets
    const recommendations = scored.slice(0, limit).map(({ exp }) => ({
      id: exp.id,
      title: exp.title,
      subtitle: exp.subtitle,
      price: exp.price,
      currency: exp.currency || "MK",
      location: exp.location,
      category: exp.category,
      rating: exp.rating,
      duration: exp.duration,
      images: exp.images,
      partner: exp.partner,
      slug: exp.slug,
    }));

    // Trending: top by booking count
    const trending = [...experiences]
      .sort((a, b) => (b.bookings?.[0]?.count ?? 0) - (a.bookings?.[0]?.count ?? 0))
      .slice(0, limit)
      .map((exp) => ({
        id: exp.id,
        title: exp.title,
        subtitle: exp.subtitle,
        price: exp.price,
        currency: exp.currency || "MK",
        location: exp.location,
        category: exp.category,
        rating: exp.rating,
        duration: exp.duration,
        images: exp.images,
        partner: exp.partner,
        slug: exp.slug,
      }));

    // Near you: top scored within radius, only if location provided
    let nearYou: typeof recommendations = [];
    if (lat && lng) {
      nearYou = scored
        .filter(({ distance }) => distance <= radiusKm)
        .slice(0, limit)
        .map(({ exp }) => ({
          id: exp.id,
          title: exp.title,
          subtitle: exp.subtitle,
          price: exp.price,
          currency: exp.currency || "MK",
          location: exp.location,
          category: exp.category,
          rating: exp.rating,
          duration: exp.duration,
          images: exp.images,
          partner: exp.partner,
          slug: exp.slug,
        }));
    }

    return json({ recommendations, trending, near_you: nearYou });
  } catch (error) {
    return handleRouteError(error);
  }
}
