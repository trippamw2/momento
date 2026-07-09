import { getUser, json, handleRouteError, getQueryParams } from "@/lib/api-helpers";
import { createServerClient } from "@/lib/supabase-server";

export async function GET(request: Request) {
  try {
    const user = await getUser(request);
    if (!user) return json({ error: "Unauthorized" }, 401);

    const params = getQueryParams(request.url);
    const code = params.code;
    if (!code) return json({ error: "code query parameter is required" }, 400);

    const supabase = createServerClient();
    const { data: giftCard } = await supabase
      .from("gift_cards")
      .select("id, amount, balance, currency, status, expires_at, recipient_name, sender_name")
      .eq("code", code.toUpperCase())
      .single();

    if (!giftCard) return json({ error: "Invalid gift card code" }, 404);

    return json(giftCard);
  } catch (error) {
    return handleRouteError(error);
  }
}
