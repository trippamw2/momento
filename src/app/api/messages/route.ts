import { getUser, json, handleRouteError, badRequest } from "@/lib/api-helpers";
import { createServerClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";

export async function GET(request: Request) {
  try {
    const user = await getUser(request);
    if (!user) return json({ error: "Unauthorized" }, 401);

    const url = new URL(request.url);
    const conversation_id = url.searchParams.get("conversation_id");
    if (!conversation_id) return badRequest("conversation_id is required");

    const supabase = createServerClient();

    // Verify user is part of this conversation
    const { data: conv } = await supabase
      .from("conversations")
      .select("id, user_id, participant_id")
      .eq("id", conversation_id)
      .single();

    if (!conv || (conv.user_id !== user.id && conv.participant_id !== user.id)) {
      return json({ error: "Forbidden" }, 403);
    }

    const { data: messages, error } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversation_id)
      .order("created_at", { ascending: true })
      .limit(100);

    if (error) throw error;

    // Mark messages as read if they're from the other participant
    const admin = createAdminClient();
    await admin
      .from("messages")
      .update({ read: true })
      .eq("conversation_id", conversation_id)
      .eq("sender_id", conv.user_id === user.id ? conv.participant_id : conv.user_id)
      .eq("read", false);

    return json({ messages: messages || [] });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await getUser(request);
    if (!user) return json({ error: "Unauthorized" }, 401);

    const { conversation_id, content } = await request.json();
    if (!conversation_id || !content?.trim()) return badRequest("conversation_id and content are required");

    const supabase = createServerClient();

    // Verify user is part of this conversation
    const { data: conv } = await supabase
      .from("conversations")
      .select("id, user_id, participant_id")
      .eq("id", conversation_id)
      .single();

    if (!conv || (conv.user_id !== user.id && conv.participant_id !== user.id)) {
      return json({ error: "Forbidden" }, 403);
    }

    const admin = createAdminClient();
    const { data: message, error } = await admin
      .from("messages")
      .insert({
        conversation_id,
        sender_id: user.id,
        content: content.trim(),
        created_at: new Date().toISOString(),
        read: false,
      })
      .select()
      .single();

    if (error) return badRequest(error.message);

    // Update conversation timestamp
    await admin
      .from("conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", conversation_id);

    // Create notification for the other participant
    const recipientId = conv.user_id === user.id ? conv.participant_id : conv.user_id;
    await admin.from("notifications").insert({
      user_id: recipientId,
      type: "new_message",
      title: "New message",
      body: content.trim().slice(0, 100),
      data: { conversation_id, sender_id: user.id },
    }).maybeSingle();

    return json(message, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
