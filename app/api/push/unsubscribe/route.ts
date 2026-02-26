import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const endpoint = typeof body.endpoint === "string" ? body.endpoint.trim() : "";

    if (!endpoint) {
      return NextResponse.json(
        { error: "Endpoint is required." },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const { error } = await admin
      .from("push_subscriptions")
      .delete()
      .eq("endpoint", endpoint);

    if (error) {
      console.error("Push unsubscribe error:", error);
      return NextResponse.json({ error: "Failed to remove subscription." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Push unsubscribe:", e);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
