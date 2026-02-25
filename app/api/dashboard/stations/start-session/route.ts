import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const stationId = body.stationId as string | undefined;
    const clientIdsRaw = body.clientIds;
    const clientIds = Array.isArray(clientIdsRaw)
      ? (clientIdsRaw as string[]).filter((id) => typeof id === "string" && id.trim() !== "")
      : [];
    const legacyClientId = body.clientId as string | null | undefined;
    const singleId = clientIds.length > 0 ? clientIds[0] : legacyClientId && legacyClientId.trim() !== "" ? legacyClientId : null;
    const memberId = singleId || null;

    if (!stationId) {
      return NextResponse.json(
        { error: "stationId is required" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    const { data: station, error: stationError } = await supabase
      .from("stations")
      .select("id, status, price_1_mad, price_4_mad")
      .eq("id", stationId)
      .single();

    if (stationError || !station) {
      return NextResponse.json(
        { error: "Station not found" },
        { status: 404 }
      );
    }

    if (station.status !== "free") {
      return NextResponse.json(
        { error: "Station is not free" },
        { status: 409 }
      );
    }

    const { data: session, error: sessionError } = await supabase
      .from("sessions")
      .insert({
        member_id: memberId,
        station_id: stationId,
        started_at: new Date().toISOString(),
        status: "active",
        cost_mad: 0,
        points_earned: 0,
      })
      .select("id")
      .single();

    if (sessionError) {
      console.error("[start-session] insert error:", sessionError);
      return NextResponse.json(
        { error: sessionError.message },
        { status: 500 }
      );
    }

    const idsToInsert = clientIds.length > 0 ? clientIds : (memberId ? [memberId] : []);
    if (idsToInsert.length > 0) {
      const { error: membersError } = await supabase
        .from("session_members")
        .insert(idsToInsert.map((mid) => ({ session_id: session.id, member_id: mid })));
      if (membersError) {
        console.error("[start-session] session_members insert error:", membersError);
        await supabase.from("sessions").delete().eq("id", session.id);
        return NextResponse.json(
          { error: membersError.message },
          { status: 500 }
        );
      }
    }

    const { error: updateError } = await supabase
      .from("stations")
      .update({
        status: "occupied",
        current_session_id: session.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", stationId);

    if (updateError) {
      console.error("[start-session] station update error:", updateError);
      await supabase.from("sessions").update({ status: "completed" }).eq("id", session.id);
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ sessionId: session.id });
  } catch (e) {
    console.error("[start-session] Error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to start session" },
      { status: 500 }
    );
  }
}
