import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const stationId = body.stationId as string | undefined;

    if (!stationId) {
      return NextResponse.json(
        { error: "stationId is required" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    const { data: station, error: stationError } = await supabase
      .from("stations")
      .select("id, current_session_id")
      .eq("id", stationId)
      .single();

    if (stationError || !station?.current_session_id) {
      return NextResponse.json(
        { error: "No active session on this station" },
        { status: 404 }
      );
    }

    const { error: updateError } = await supabase
      .from("sessions")
      .update({ paused_at: new Date().toISOString() })
      .eq("id", station.current_session_id)
      .eq("status", "active");

    if (updateError) {
      console.error("[pause-session] update error:", updateError);
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[pause-session] Error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to pause session" },
      { status: 500 }
    );
  }
}
