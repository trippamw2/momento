import { getUser, json, handleRouteError } from "@/lib/api-helpers";
import { createAdminClient } from "@/lib/supabase-admin";
import { creditBookingPoints } from "@/lib/loyalty-server";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getUser(request);
    if (!user) return json({ error: "Unauthorized" }, 401);

    const admin = createAdminClient();
    const { data: booking } = await admin
      .from("bookings")
      .select("user_id, experience_id, status, total_price")
      .eq("id", id)
      .single();

    if (!booking) return json({ error: "Booking not found" }, 404);

    const { data: partner } = await admin
      .from("partners")
      .select("id")
      .eq("user_id", user.id)
      .single();

    const { data: experience } = await admin
      .from("experiences")
      .select("partner_id, title")
      .eq("id", booking.experience_id)
      .single();

    if (!partner || experience?.partner_id !== partner.id) {
      if (user.role !== "admin") return json({ error: "Forbidden" }, 403);
    }

    if (booking.status !== "pending") {
      return json({ error: `Cannot confirm a ${booking.status} booking` }, 400);
    }

    const { error } = await admin
      .from("bookings")
      .update({
        status: "confirmed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) return json({ error: error.message }, 400);

    await admin.from("notifications").insert({
      user_id: booking.user_id,
      type: "booking_confirmed",
      title: "Booking confirmed!",
      body: "Your experience booking has been confirmed.",
      data: { booking_id: id, experience_id: booking.experience_id },
    });

    // Credit loyalty points for the booking
    const pointsResult = await creditBookingPoints(
      booking.user_id,
      booking.total_price || 0,
      id,
      experience?.title || "Experience"
    );
    if ("error" in pointsResult) {
      console.error("Failed to credit loyalty points:", pointsResult.error);
    }

    return json({ message: "Booking confirmed" });
  } catch (error) {
    return handleRouteError(error);
  }
}
