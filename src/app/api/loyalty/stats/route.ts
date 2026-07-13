import { getUser, json, handleRouteError } from "@/lib/api-helpers";
import { createAdminClient } from "@/lib/supabase-admin";

export async function GET(request: Request) {
  try {
    const user = await getUser(request);
    if (!user) return json({ error: "Unauthorized" }, 401);

    const admin = createAdminClient();

    // Total bookings (confirmed + completed)
    const { count: totalBookings } = await admin
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .in("status", ["confirmed", "completed"]);

    // Total spent
    const { data: bookingData } = await admin
      .from("bookings")
      .select("total_price")
      .eq("user_id", user.id)
      .in("status", ["confirmed", "completed"]);

    const totalSpent = (bookingData || []).reduce(
      (sum: number, b: { total_price: number }) => sum + (b.total_price || 0),
      0
    );

    // Total reviews
    const { count: totalReviews } = await admin
      .from("reviews")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    // Total gift cards sent
    const { count: totalGifts } = await admin
      .from("gift_cards")
      .select("*", { count: "exact", head: true })
      .eq("issuer_id", user.id);

    // Days since signup
    const { data: profile } = await admin
      .from("profiles")
      .select("created_at")
      .eq("id", user.id)
      .single();

    const daysSinceSignup = profile
      ? Math.floor(
          (Date.now() - new Date(profile.created_at).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : 0;

    // Cities visited (from booking experience locations)
    const { data: bookingExpData } = await admin
      .from("bookings")
      .select("experiences(location)")
      .eq("user_id", user.id)
      .in("status", ["confirmed", "completed"]);

    const citiesVisited = [
      ...new Set(
        (bookingExpData || [])
          .map((b: Record<string, unknown>) => {
            const exp = b.experiences as Record<string, unknown> | null;
            return exp?.location as string;
          })
          .filter(Boolean)
      ),
    ];

    // Categories tried
    const { data: bookingCatData } = await admin
      .from("bookings")
      .select("experiences(category)")
      .eq("user_id", user.id)
      .in("status", ["confirmed", "completed"]);

    const categories = [
      ...new Set(
        (bookingCatData || [])
          .map((b: Record<string, unknown>) => {
            const exp = b.experiences as Record<string, unknown> | null;
            return exp?.category as string;
          })
          .filter(Boolean)
      ),
    ];

    return json({
      totalBookings: totalBookings || 0,
      totalSpent,
      totalReviews: totalReviews || 0,
      totalReferrals: 0, // No referrals table yet
      totalGifts: totalGifts || 0,
      totalGifted: 0, // Would need gift_card_transactions sum
      totalShares: 0, // No share tracking yet
      daysSinceSignup,
      citiesVisited,
      categories,
      consecutiveBookings: 0, // Would need date analysis
      birthdayBooked: false, // Would need birthdate + booking_date match
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
