import { getUser, json, handleRouteError } from "@/lib/api-helpers";
import { createServerClient } from "@/lib/supabase-server";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getUser(request);
    if (!user) return json({ error: "Unauthorized" }, 401);

    const supabase = createServerClient();
    const { data: giftCard, error } = await supabase
      .from("gift_cards")
      .select("*, transactions:gift_card_transactions(*)")
      .eq("id", id)
      .single();

    if (error || !giftCard) return json({ error: "Gift card not found" }, 404);

    if (giftCard.issuer_id !== user.id && giftCard.recipient_email !== user.email && user.role !== "admin") {
      return json({ error: "Forbidden" }, 403);
    }

    return json(giftCard);
  } catch (error) {
    return handleRouteError(error);
  }
}
