import { getUser, json, handleRouteError } from "@/lib/api-helpers";
import { getWallet, setWalletStatus, adminAdjustBalance } from "@/lib/wallet-engine";
import { createAdminClient } from "@/lib/supabase-admin";

export async function GET(request: Request, { params }: { params: { userId: string } }) {
  try {
    const user = await getUser(request);
    if (!user || user.role !== "admin") return json({ error: "Unauthorized" }, 401);

    const wallet = await getWallet(params.userId);
    if (!wallet) return json({ error: "Wallet not found" }, 404);

    // Fetch transactions
    const admin = createAdminClient();
    const { data: txns } = await admin
      .from("wallet_transactions")
      .select("*")
      .eq("user_id", params.userId)
      .order("created_at", { ascending: false })
      .range(0, 49);

    // Fetch user profile
    const { data: userProfile } = await admin
      .from("users")
      .select("id, email, full_name, phone, role, created_at")
      .eq("id", params.userId)
      .single();

    return json({
      wallet,
      user: userProfile || null,
      recentTransactions: txns || [],
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: Request, { params }: { params: { userId: string } }) {
  try {
    const user = await getUser(request);
    if (!user || user.role !== "admin") return json({ error: "Unauthorized" }, 401);

    const body = await request.json();
    const { action } = body;

    if (!action) return json({ error: "action is required (freeze, unfreeze, adjust)" }, 400);

    switch (action) {
      case "freeze": {
        const result = await setWalletStatus(params.userId, "frozen", user.id);
        if ("error" in result) return json({ error: result.error }, 400);
        return json({ success: true, status: "frozen" });
      }

      case "unfreeze": {
        const result = await setWalletStatus(params.userId, "active", user.id);
        if ("error" in result) return json({ error: result.error }, 400);
        return json({ success: true, status: "active" });
      }

      case "adjust": {
        const { amount, reason } = body;
        if (typeof amount !== "number" || amount === 0) {
          return json({ error: "A non-zero amount is required" }, 400);
        }
        if (!reason || typeof reason !== "string") {
          return json({ error: "A reason is required for balance adjustment" }, 400);
        }
        const result = await adminAdjustBalance(params.userId, amount, reason, user.id);
        if ("error" in result) return json({ error: result.error }, 400);
        return json({ success: true, newBalance: result.newBalance, amount, reason });
      }

      default:
        return json({ error: `Unknown action: ${action}` }, 400);
    }
  } catch (error) {
    return handleRouteError(error);
  }
}
