import { getUser, json, handleRouteError, getQueryParams } from "@/lib/api-helpers";
import { createServerClient } from "@/lib/supabase-server";

export async function GET(request: Request) {
  try {
    const user = await getUser(request);
    if (!user) return json({ error: "Unauthorized" }, 401);

    const params = getQueryParams(request.url);
    const period = params.period ?? "30d";

    const supabase = createServerClient();

    if (user.role === "admin") {
      const { count: totalUsers } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true });

      const { count: totalPartners } = await supabase
        .from("partner_profiles")
        .select("id", { count: "exact", head: true })
        .eq("verification_status", "verified");

      const { count: totalExperiences } = await supabase
        .from("experiences")
        .select("id", { count: "exact", head: true })
        .eq("status", "published");

      const { count: totalBookings } = await supabase
        .from("bookings")
        .select("id", { count: "exact", head: true });

      const { count: pendingBookings } = await supabase
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending");

      const { data: revenue } = await supabase
        .from("payments")
        .select("amount")
        .eq("status", "succeeded");

      const totalRevenue = (revenue ?? []).reduce((sum, p) => sum + p.amount, 0);

      return json({
        totalUsers: totalUsers ?? 0,
        totalPartners: totalPartners ?? 0,
        totalExperiences: totalExperiences ?? 0,
        totalBookings: totalBookings ?? 0,
        pendingBookings: pendingBookings ?? 0,
        totalRevenue,
        period,
      });
    }

    const { data: partner } = await supabase
      .from("partner_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!partner) return json({ error: "Partner profile not found" }, 400);

    const { data: myExperiences } = await supabase
      .from("experiences")
      .select("id")
      .eq("partner_id", partner.id);

    const experienceIds = (myExperiences ?? []).map((e) => e.id);

    const { count: totalBookings } = await supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .in("experience_id", experienceIds.length > 0 ? experienceIds : ["none"]);

    const { count: confirmedBookings } = await supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .in("experience_id", experienceIds.length > 0 ? experienceIds : ["none"])
      .eq("status", "confirmed");

    const { count: completedBookings } = await supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .in("experience_id", experienceIds.length > 0 ? experienceIds : ["none"])
      .eq("status", "completed");

    const { data: myReviews } = await supabase
      .from("reviews")
      .select("rating")
      .in("experience_id", experienceIds.length > 0 ? experienceIds : ["none"])
      .eq("status", "approved");

    const reviews = myReviews ?? [];
    const avgRating = reviews.length > 0
      ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(2)
      : "0.00";

    return json({
      totalExperiences: (myExperiences ?? []).length,
      totalBookings: totalBookings ?? 0,
      confirmedBookings: confirmedBookings ?? 0,
      completedBookings: completedBookings ?? 0,
      averageRating: parseFloat(avgRating),
      totalReviews: (myReviews ?? []).length,
      period,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
