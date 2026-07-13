import { getUser, json, handleRouteError } from "@/lib/api-helpers";
import { createAdminClient } from "@/lib/supabase-admin";

interface TierInfo {
  name: string;
  min_lifetime_points: number;
  multiplier: number;
  color_start: string;
  color_end: string;
  icon: string;
  benefits: unknown;
  cashback_rate: number;
  discount_percent: number;
}

export async function GET(request: Request) {
  try {
    const user = await getUser(request);
    if (!user) return json({ error: "Unauthorized" }, 401);

    const admin = createAdminClient();

    // Get loyalty points
    const { data: pointsData } = await admin
      .from("loyalty_points")
      .select("balance, lifetime_points, tier, updated_at")
      .eq("user_id", user.id)
      .maybeSingle();

    const balance = pointsData?.balance ?? 0;
    const lifetimePoints = pointsData?.lifetime_points ?? 0;
    const currentTierName = pointsData?.tier ?? "bronze";

    // Get all tiers for progress calculation
    const { data: tiers } = await admin
      .from("loyalty_tiers")
      .select("*")
      .order("min_lifetime_points", { ascending: true });

    const allTiers: TierInfo[] = (tiers || []).map((t: Record<string, unknown>) => ({
      name: String(t.name),
      min_lifetime_points: Number(t.min_lifetime_points),
      multiplier: Number(t.multiplier),
      color_start: String(t.color_start),
      color_end: String(t.color_end),
      icon: String(t.icon || ""),
      benefits: t.benefits,
      cashback_rate: Number(t.cashback_rate || 0),
      discount_percent: Number(t.discount_percent || 0),
    }));

    // Find current tier and next tier
    let currentTier: TierInfo | null = null;
    let nextTier: TierInfo | null = null;
    let tierProgress = 100;
    let pointsToNextTier = 0;

    for (let i = allTiers.length - 1; i >= 0; i--) {
      if (lifetimePoints >= allTiers[i].min_lifetime_points) {
        currentTier = allTiers[i];
        if (i + 1 < allTiers.length) {
          nextTier = allTiers[i + 1];
          const currentMin = currentTier.min_lifetime_points;
          const nextMin = nextTier.min_lifetime_points;
          const range = nextMin - currentMin;
          if (range > 0) {
            tierProgress = Math.min(100, ((lifetimePoints - currentMin) / range) * 100);
          }
          pointsToNextTier = nextMin - lifetimePoints;
        }
        break;
      }
    }

    if (!currentTier && allTiers.length > 0) {
      currentTier = allTiers[0];
      nextTier = allTiers.length > 1 ? allTiers[1] : null;
      tierProgress = lifetimePoints > 0 ? (lifetimePoints / nextTier!.min_lifetime_points) * 100 : 0;
      pointsToNextTier = nextTier ? nextTier.min_lifetime_points - lifetimePoints : 0;
    }

    // Get user badges
    const { data: badges } = await admin
      .from("user_badges")
      .select("count", { count: "exact", head: true })
      .eq("user_id", user.id);

    const badgeCount = badges?.length ?? 0;

    // Get cashback summary
    const { data: cashbackData } = await admin
      .from("cashback_transactions")
      .select("amount")
      .eq("user_id", user.id)
      .eq("status", "credited");

    const totalCashback = (cashbackData || []).reduce((sum: number, c: Record<string, unknown>) => sum + Number(c.amount), 0);

    return json({
      userId: user.id,
      points: balance,
      lifetimePoints,
      tier: currentTier?.name || "bronze",
      tierIcon: currentTier?.icon || "",
      tierColorStart: currentTier?.color_start || "",
      tierColorEnd: currentTier?.color_end || "",
      tierProgress: Math.round(tierProgress),
      nextTier: nextTier?.name || null,
      pointsToNextTier,
      multiplier: currentTier?.multiplier || 1,
      discountPercent: currentTier?.discount_percent || 0,
      cashbackRate: currentTier?.cashback_rate || 0,
      totalCashback,
      badgeCount,
      allTiers,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
