import { getUser, json, handleRouteError } from "@/lib/api-helpers";
import {
  getCorporateAccountByAdmin,
  updateCorporateMember,
} from "@/lib/corporate-engine";
import { createAdminClient } from "@/lib/supabase-admin";

export async function PATCH(request: Request, { params }: { params: Promise<{ memberId: string }> }) {
  try {
    const user = await getUser(request);
    if (!user) return json({ error: "Unauthorized" }, 401);

    const { memberId } = await params;

    const body = await request.json();

    // Verify ownership
    if (user.role !== "admin") {
      const account = await getCorporateAccountByAdmin(user.id);
      if (!account) return json({ error: "No corporate account found" }, 404);

      const supabase = createAdminClient();
      const { data: member } = await supabase
        .from("corporate_members")
        .select("corporate_account_id")
        .eq("id", memberId)
        .single();

      if (!member || member.corporate_account_id !== account.id) {
        return json({ error: "Forbidden" }, 403);
      }
    }

    const result = await updateCorporateMember(memberId, {
      role: body.role,
      spendingLimit: body.spending_limit,
      isActive: body.is_active,
    });

    if ("error" in result) return json({ error: result.error }, 400);
    return json(result);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ memberId: string }> }) {
  try {
    const user = await getUser(request);
    if (!user) return json({ error: "Unauthorized" }, 401);

    const { memberId } = await params;

    // Verify ownership
    if (user.role !== "admin") {
      const account = await getCorporateAccountByAdmin(user.id);
      if (!account) return json({ error: "No corporate account found" }, 404);

      const supabase = createAdminClient();
      const { data: member } = await supabase
        .from("corporate_members")
        .select("corporate_account_id")
        .eq("id", memberId)
        .single();

      if (!member || member.corporate_account_id !== account.id) {
        return json({ error: "Forbidden" }, 403);
      }
    }

    const supabase = createAdminClient();
    const { error } = await supabase
      .from("corporate_members")
      .delete()
      .eq("id", memberId);

    if (error) return json({ error: error.message }, 400);
    return json({ success: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
