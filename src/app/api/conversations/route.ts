import { getUser, json, handleRouteError, badRequest } from "@/lib/api-helpers";
import { createServerClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";

export async function GET(request: Request) {
  try {
    const user = await getUser(request);
    if (!user) return json({ error: "Unauthorized" }, 401);

    const supabase = createServerClient();

    const { data: conversations, error } = await supabase
      .from("conversations")
      .select(`
        *,
        participant:participant_id(id, email, full_name, avatar_url),
        last_message:messages(
          id, content, created_at, sender_id
        )
      `)
      .or(`user_id.eq.${user.id},participant_id.eq.${user.id}`)
      .order("updated_at", { ascending: false });

    if (error) throw error;

    // Get last message for each conversation
    const enriched = await Promise.all(
      (conversations || []).map(async (conv) => {
        const { data: msgs } = await supabase
          .from("messages")
          .select("id, content, created_at, sender_id, read")
          .eq("conversation_id", conv.id)
          .order("created_at", { ascending: false })
          .limit(1);

        const unread = await supabase
          .from("messages")
          .select("id", { count: "exact", head: true })
          .eq("conversation_id", conv.id)
          .eq("sender_id", conv.participant_id?.id || conv.user_id)
          .eq("read", false);

        return {
          ...conv,
          last_message: msgs?.[0] || null,
          unread_count: unread.count || 0,
        };
      })
    );

    return json({ conversations: enriched });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await getUser(request);
    if (!user) return json({ error: "Unauthorized" }, 401);

    const { participant_id, experience_id, initial_message } = await request.json();
    if (!participant_id) return badRequest("participant_id is required");

    const supabase = createServerClient();

    // Check for existing conversation
    const { data: existing } = await supabase
      .from("conversations")
      .select("*")
      .or(`and(user_id.eq.${user.id},participant_id.eq.${participant_id}),and(user_id.eq.${participant_id},participant_id.eq.${user.id})`)
      .maybeSingle();

    let conversationId: string;

    if (existing) {
      conversationId = existing.id;
      // Update timestamp
      await supabase
        .from("conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", conversationId);
    } else {
      // Create new conversation
      const admin = createAdminClient();
      const { data: conv, error } = await admin
        .from("conversations")
        .insert({
          user_id: user.id,
          participant_id,
          experience_id: experience_id || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) return badRequest(error.message);
      conversationId = conv.id;
    }

    // If there's an initial message, create it
    if (initial_message) {
      const admin = createAdminClient();
      const { error: msgError } = await admin
        .from("messages")
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content: initial_message,
          created_at: new Date().toISOString(),
        });

      if (msgError) console.error("Failed to create initial message:", msgError);
    }

    return json({ id: conversationId }, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
