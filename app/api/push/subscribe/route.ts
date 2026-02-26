import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const endpoint = typeof body.endpoint === "string" ? body.endpoint.trim() : "";
    const keys = body.keys;
    const p256dh = typeof keys?.p256dh === "string" ? keys.p256dh : "";
    const auth = typeof keys?.auth === "string" ? keys.auth : "";

    if (!endpoint || !p256dh || !auth) {
      return NextResponse.json(
        { error: "Invalid subscription: endpoint, keys.p256dh, keys.auth required." },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const admin = createAdminClient();
    const { error } = await admin.from("push_subscriptions").upsert(
      {
        user_id: user?.id ?? null,
        endpoint,
        p256dh,
        auth,
        user_agent: request.headers.get("user-agent") ?? null,
      },
      { onConflict: "endpoint", ignoreDuplicates: false }
    );

    if (error) {
      console.error("Push subscribe error:", error);
      return NextResponse.json({ error: "Failed to save subscription." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Push subscribe:", e);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
