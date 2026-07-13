// ─── Server-Side Loyalty Points Accrual ───
// Used by booking confirmation and webhook handlers to credit loyalty points.

import { createAdminClient } from "./supabase-admin";

const POINTS_PER_1000_MWK = 10; // 10 pts per MK 1,000 spent

/**
 * Credit loyalty points to a user after a booking is confirmed.
 * Upserts the loyalty_points balance and inserts a loyalty_transactions record.
 */
export async function creditBookingPoints(
  userId: string,
  bookingAmount: number,
  bookingId: string,
  experienceTitle: string
): Promise<{ success: boolean; pointsEarned: number; newBalance: number } | { error: string }> {
  if (bookingAmount <= 0) return { error: "Invalid booking amount" };

  const pointsEarned = Math.floor(bookingAmount / 1000) * POINTS_PER_1000_MWK;
  if (pointsEarned <= 0) return { success: true, pointsEarned: 0, newBalance: 0 };

  const admin = createAdminClient();

  // Get current loyalty record
  const { data: existing } = await admin
    .from("loyalty_points")
    .select("id, balance, lifetime_points")
    .eq("user_id", userId)
    .maybeSingle();

  const balanceBefore = existing?.balance ?? 0;
  const lifetimeBefore = existing?.lifetime_points ?? 0;
  const balanceAfter = balanceBefore + pointsEarned;
  const lifetimeAfter = lifetimeBefore + pointsEarned;

  // Determine tier based on lifetime points
  const tier = getTierFromPoints(lifetimeAfter);

  if (existing) {
    // Update existing record
    const { error } = await admin
      .from("loyalty_points")
      .update({
        balance: balanceAfter,
        lifetime_points: lifetimeAfter,
        tier,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);

    if (error) return { error: error.message };
  } else {
    // Insert new record
    const { error } = await admin
      .from("loyalty_points")
      .insert({
        user_id: userId,
        balance: balanceAfter,
        lifetime_points: lifetimeAfter,
        tier,
        currency: "MWK",
      });

    if (error) return { error: error.message };
  }

  // Record the transaction
  await admin.from("loyalty_transactions").insert({
    user_id: userId,
    type: "earn",
    amount: pointsEarned,
    balance_before: balanceBefore,
    balance_after: balanceAfter,
    description: `Booking: ${experienceTitle}`,
    reference_type: "booking",
    reference_id: bookingId,
  });

  // Create notification
  await admin.from("notifications").insert({
    user_id: userId,
    type: "points_earned",
    title: "Points earned!",
    body: `You earned ${pointsEarned} points for booking "${experienceTitle}".`,
    data: { points: pointsEarned, booking_id: bookingId, experience_title: experienceTitle },
  });

  return { success: true, pointsEarned, newBalance: balanceAfter };
}

/**
 * Credit loyalty points for writing a review.
 */
export async function creditReviewPoints(
  userId: string,
  reviewId: string,
  experienceTitle: string
): Promise<{ success: boolean; pointsEarned: number } | { error: string }> {
  const pointsEarned = 50; // Fixed: 50 pts per review

  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("loyalty_points")
    .select("id, balance, lifetime_points")
    .eq("user_id", userId)
    .maybeSingle();

  const balanceBefore = existing?.balance ?? 0;
  const lifetimeBefore = existing?.lifetime_points ?? 0;
  const balanceAfter = balanceBefore + pointsEarned;
  const lifetimeAfter = lifetimeBefore + pointsEarned;
  const tier = getTierFromPoints(lifetimeAfter);

  if (existing) {
    await admin
      .from("loyalty_points")
      .update({ balance: balanceAfter, lifetime_points: lifetimeAfter, tier, updated_at: new Date().toISOString() })
      .eq("id", existing.id);
  } else {
    await admin
      .from("loyalty_points")
      .insert({ user_id: userId, balance: balanceAfter, lifetime_points: lifetimeAfter, tier, currency: "MWK" });
  }

  await admin.from("loyalty_transactions").insert({
    user_id: userId,
    type: "earn",
    amount: pointsEarned,
    balance_before: balanceBefore,
    balance_after: balanceAfter,
    description: `Review: ${experienceTitle}`,
    reference_type: "review",
    reference_id: reviewId,
  });

  await admin.from("notifications").insert({
    user_id: userId,
    type: "points_earned",
    title: "Points earned!",
    body: `You earned ${pointsEarned} points for writing a review.`,
    data: { points: pointsEarned, review_id: reviewId },
  });

  return { success: true, pointsEarned };
}

/**
 * Get the tier name from lifetime points.
 */
function getTierFromPoints(lifetimePoints: number): string {
  if (lifetimePoints >= 5000) return "vip";
  if (lifetimePoints >= 2000) return "platinum";
  if (lifetimePoints >= 1000) return "gold";
  if (lifetimePoints >= 500) return "silver";
  return "bronze";
}
