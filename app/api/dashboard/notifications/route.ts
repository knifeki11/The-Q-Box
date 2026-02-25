import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const serverSupabase = await createClient();
    const { data: { user } } = await serverSupabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: notifications, error: notifError } = await admin
      .from("admin_notifications")
      .select("id, title, message, type, link_url, created_at")
      .order("created_at", { ascending: false })
      .limit(50);

    if (notifError) {
      console.error("[notifications] fetch error:", notifError);
      return NextResponse.json({ error: notifError.message }, { status: 500 });
    }

    const ids = (notifications ?? []).map((n: { id: string }) => n.id);
    const { data: reads } = ids.length
      ? await admin
          .from("admin_notification_reads")
          .select("notification_id, read_at")
          .eq("user_id", user.id)
          .in("notification_id", ids)
      : { data: [] };
    const readSet = new Set((reads ?? []).map((r: { notification_id: string }) => r.notification_id));

    const list = (notifications ?? []).map((n: { id: string; title: string; message: string; type: string; link_url: string | null; created_at: string }) => ({
      id: n.id,
      title: n.title,
      message: n.message,
      type: n.type,
      link_url: n.link_url ?? null,
      created_at: n.created_at,
      read: readSet.has(n.id),
    }));

    return NextResponse.json({ notifications: list, unread_count: list.filter((x) => !x.read).length });
  } catch (e) {
    console.error("[notifications] Error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to load notifications" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const serverSupabase = await createClient();
    const { data: { user } } = await serverSupabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const markAll = body.mark_all === true;
    const notificationId = typeof body.notification_id === "string" ? body.notification_id : null;

    if (markAll) {
      const { data: list } = await admin
        .from("admin_notifications")
        .select("id")
        .order("created_at", { ascending: false })
        .limit(100);
      const ids = (list ?? []).map((n: { id: string }) => n.id);
      for (const id of ids) {
        await admin.from("admin_notification_reads").upsert(
          { notification_id: id, user_id: user.id, read_at: new Date().toISOString() },
          { onConflict: "notification_id,user_id" }
        );
      }
      return NextResponse.json({ ok: true });
    }

    if (notificationId) {
      const { error } = await admin.from("admin_notification_reads").upsert(
        { notification_id: notificationId, user_id: user.id, read_at: new Date().toISOString() },
        { onConflict: "notification_id,user_id" }
      );
      if (error) {
        console.error("[notifications] mark read error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Provide notification_id or mark_all" }, { status: 400 });
  } catch (e) {
    console.error("[notifications] PATCH Error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to update" },
      { status: 500 }
    );
  }
}
