import { getUser, json, handleRouteError, getQueryParams } from "@/lib/api-helpers";
import { getWalletTransactions } from "@/lib/wallet-engine";

export async function GET(request: Request) {
  try {
    const user = await getUser(request);
    if (!user) return json({ error: "Unauthorized" }, 401);

    const params = getQueryParams(request.url);
    const limit = Math.min(50, Math.max(1, parseInt(params.limit ?? "20")));
    const offset = Math.max(0, parseInt(params.offset ?? "0"));
    const type = params.type || undefined;

    const result = await getWalletTransactions(user.id, { limit, offset, type });
    return json(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
