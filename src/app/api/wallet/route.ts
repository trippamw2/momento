import { getUser, json, handleRouteError } from "@/lib/api-helpers";
import { getWalletSummary } from "@/lib/wallet-engine";

export async function GET(request: Request) {
  try {
    const user = await getUser(request);
    if (!user) return json({ error: "Unauthorized" }, 401);

    const summary = await getWalletSummary(user.id);
    if (!summary) return json({ error: "Wallet not found" }, 404);

    return json(summary);
  } catch (error) {
    return handleRouteError(error);
  }
}
