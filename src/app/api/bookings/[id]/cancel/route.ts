import { getUser, json, handleRouteError, parseBody } from "@/lib/api-helpers";
import { createAdminClient } from "@/lib/supabase-admin";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getUser(request);
    if (!user) return json({ error: "Unauthorized" }, 401);

    const body = await parseBody<{ reason?: string }>(request);

    const admin = createAdminClient();
    const { data: booking } = await admin
      .from("bookings")
      .select("user_id, experience_id, status")
      .eq("id", id)
      .single();

    if (!booking) return json({ error: "Booking not found" }, 404);

    if (booking.user_id !== user.id && user.role !== "admin") {
      return json({ error: "Forbidden" }, 403);
    }

    if (["cancelled", "completed", "refunded"].includes(booking.status)) {
      return json({ error: `Cannot cancel a ${booking.status} booking` }, 400);
    }

    const { error } = await admin
      .from("bookings")
      .update({
        status: "cancelled",
        cancelled_at: new Date().toISOString(),
        cancel_reason: body.reason ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) return json({ error: error.message }, 400);

    await admin.from("notifications").insert({
      user_id: booking.user_id,
      type: "booking_cancelled",
      title: "Booking cancelled",
      body: body.reason ? `Reason: ${body.reason}` : "Your booking has been cancelled.",
      data: { booking_id: id, experience_id: booking.experience_id },
    });

    return json({ message: "Booking cancelled" });
  } catch (error) {
    return handleRouteError(error);
  }
}
