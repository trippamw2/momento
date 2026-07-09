import { getUser, json, handleRouteError } from "@/lib/api-helpers";
import { createServerClient } from "@/lib/supabase-server";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getUser(request);
    if (!user) return json({ error: "Unauthorized" }, 401);

    const supabase = createServerClient();
    const { data: payment, error } = await supabase
      .from("payments")
      .select("*, booking:booking_id(*)")
      .eq("id", id)
      .single();

    if (error || !payment) return json({ error: "Payment not found" }, 404);

    if (payment.user_id !== user.id && user.role !== "admin") {
      return json({ error: "Forbidden" }, 403);
    }

    return json(payment);
  } catch (error) {
    return handleRouteError(error);
  }
}
