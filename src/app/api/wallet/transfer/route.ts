import { getUser, json, handleRouteError, parseBody, badRequest } from "@/lib/api-helpers";
import { createAdminClient } from "@/lib/supabase-admin";
import { transferBetweenWallets } from "@/lib/wallet-engine";

export async function POST(request: Request) {
  try {
    const user = await getUser(request);
    if (!user) return json({ error: "Unauthorized" }, 401);

    const body = await parseBody<{
      recipient_email: string;
      amount: number;
      note?: string;
    }>(request);

    if (!body.recipient_email || !body.amount) {
      return badRequest("recipient_email and amount are required");
    }

    if (body.amount < 100) {
      return badRequest("Minimum transfer amount is 100 MWK");
    }

    if (body.recipient_email.toLowerCase() === user.email.toLowerCase()) {
      return badRequest("Cannot transfer to yourself");
    }

    // Resolve recipient user by email
    const admin = createAdminClient();
    const { data: recipient } = await admin
      .from("users")
      .select("id")
      .eq("email", body.recipient_email.toLowerCase())
      .maybeSingle();

    if (!recipient) {
      return badRequest("Recipient user not found");
    }

    const result = await transferBetweenWallets(
      user.id,
      recipient.id,
      body.amount,
      body.note
    );

    if ("error" in result) {
      return badRequest(result.error);
    }

    // Notify sender
    await admin.from("notifications").insert({
      user_id: user.id,
      type: "wallet_transfer_out",
      title: "Transfer sent",
      body: `MWK ${body.amount.toLocaleString()} sent to ${body.recipient_email}.${body.note ? ` Note: ${body.note}` : ""}`,
      data: { amount: body.amount, recipient_email: body.recipient_email, transfer_id: result.transferId },
    });

    // Notify recipient
    await admin.from("notifications").insert({
      user_id: recipient.id,
      type: "wallet_transfer_in",
      title: "Money received",
      body: `MWK ${body.amount.toLocaleString()} received from ${user.email}.${body.note ? ` Note: ${body.note}` : ""}`,
      data: { amount: body.amount, sender_email: user.email, transfer_id: result.transferId },
    });

    return json({ success: true, transfer_id: result.transferId }, 200);
  } catch (error) {
    return handleRouteError(error);
  }
}
