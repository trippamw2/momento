import { getUser, json, handleRouteError } from "@/lib/api-helpers";
import { createServerClient } from "@/lib/supabase-server";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getUser(request);
    if (!user) return json({ error: "Unauthorized" }, 401);

    const supabase = createServerClient();
    const { data: booking, error } = await supabase
      .from("bookings")
      .select("*, experience:experience_id(*, images:experience_images(*)), payment:payments(*)")
      .eq("id", id)
      .single();

    if (error || !booking) return json({ error: "Booking not found" }, 404);

    if (booking.user_id !== user.id) {
      const { data: partner } = await supabase
        .from("partners")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (partner) {
        const { data: exp } = await supabase
          .from("experiences")
          .select("partner_id")
          .eq("id", booking.experience_id)
          .single();

        if (exp?.partner_id !== partner.id && user.role !== "admin") {
          return json({ error: "Forbidden" }, 403);
        }
      } else if (user.role !== "admin") {
        return json({ error: "Forbidden" }, 403);
      }
    }

    return json(booking);
  } catch (error) {
    return handleRouteError(error);
  }
}
