import { getUser, json, handleRouteError, parseBody } from "@/lib/api-helpers";
import { createServerClient } from "@/lib/supabase-server";

export async function POST(request: Request) {
  try {
    const user = await getUser(request);

    const body = await parseBody<{
      event_name: string;
      session_id?: string;
      page?: string;
      referrer?: string;
      metadata?: Record<string, unknown>;
    }>(request);

    if (!body.event_name) return json({ error: "event_name is required" }, 400);

    const supabase = createServerClient();
    const { error } = await supabase
      .from("analytics_events")
      .insert({
        event_name: body.event_name,
        user_id: user?.id ?? null,
        session_id: body.session_id ?? null,
        page: body.page ?? null,
        referrer: body.referrer ?? null,
        metadata: body.metadata ?? {},
      });

    if (error) return json({ error: error.message }, 400);
    return json({ message: "Event tracked" }, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
