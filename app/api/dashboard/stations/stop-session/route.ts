import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const stationId = body.stationId as string | undefined;
    const durationMinutes = body.durationMinutes as number | undefined;
    const extraItemsMad = Number(body.extraItemsMad) || 0;
    const totalCostMad = body.totalCostMad != null ? Number(body.totalCostMad) : undefined;
    const paymentStatus = (body.paymentStatus === "paid" ? "paid" : "unpaid") as "paid" | "unpaid";
    const memberIdsFromBody = Array.isArray(body.memberIds)
      ? (body.memberIds as string[]).filter((id: unknown) => typeof id === "string" && id.trim() !== "")
      : null;

    if (!stationId) {
      return NextResponse.json(
        { error: "stationId is required" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    const { data: station, error: stationError } = await supabase
      .from("stations")
      .select("id, name, current_session_id")
      .eq("id", stationId)
      .single();

    if (stationError || !station?.current_session_id) {
      return NextResponse.json(
        { error: "No active session on this station" },
        { status: 404 }
      );
    }

    const sessionId = station.current_session_id;

    const { data: session, error: sessionError } = await supabase
      .from("sessions")
      .select("id, started_at")
      .eq("id", sessionId)
      .eq("status", "active")
      .single();

    if (sessionError || !session) {
      await supabase
        .from("stations")
        .update({ status: "free", current_session_id: null, updated_at: new Date().toISOString() })
        .eq("id", stationId);
      return NextResponse.json({ ok: true });
    }

    if (memberIdsFromBody !== null) {
      await supabase.from("session_members").delete().eq("session_id", sessionId);
      if (memberIdsFromBody.length > 0) {
        const { error: insErr } = await supabase
          .from("session_members")
          .insert(memberIdsFromBody.map((member_id: string) => ({ session_id: sessionId, member_id })));
        if (insErr) {
          console.error("[stop-session] session_members sync error:", insErr);
          return NextResponse.json({ error: insErr.message }, { status: 500 });
        }
      }
    }

    const startedAt = new Date(session.started_at).getTime();
    const durationMinutesNum =
      durationMinutes != null && Number(durationMinutes) >= 0
        ? Math.round(Number(durationMinutes))
        : Math.floor((Date.now() - startedAt) / 60_000);
    const endedAt = startedAt + durationMinutesNum * 60_000;

    const costToUse = totalCostMad != null && totalCostMad >= 0
      ? Math.round(totalCostMad * 100) / 100
      : null;

    // 1. Points per hour from config
    const { data: configRow } = await supabase
      .from("points_config")
      .select("points_per_hour_played")
      .eq("id", 1)
      .maybeSingle();
    const pointsPerHour = Math.max(0, Number(configRow?.points_per_hour_played) ?? 0);

    // 2. Session duration in hours
    const durationHours = durationMinutesNum / 60;

    // 3. Total points this session brings (points_per_hour × hours)
    const totalSessionPoints = Math.floor(pointsPerHour * durationHours);

    // 4. All clients related to this session (for splitting points)
    const { data: sessionMembers } = await supabase
      .from("session_members")
      .select("member_id")
      .eq("session_id", sessionId);
    const memberIdsFromDb = (sessionMembers ?? []).map((r: { member_id: string }) => r.member_id);
    const { data: sessionRow } = await supabase
      .from("sessions")
      .select("member_id")
      .eq("id", sessionId)
      .single();
    const fallbackIds = sessionRow?.member_id ? [sessionRow.member_id] : [];
    const participantIds =
      memberIdsFromDb.length > 0
        ? [...new Set(memberIdsFromDb)]
        : [...new Set(fallbackIds)];

    // 5. Split total session points among all participants (even split, remainder to first)
    if (participantIds.length > 0 && totalSessionPoints > 0) {
      const perPerson = Math.floor(totalSessionPoints / participantIds.length);
      let remainder = totalSessionPoints - perPerson * participantIds.length;
      for (const pid of participantIds) {
        const share = perPerson + (remainder > 0 ? 1 : 0);
        if (remainder > 0) remainder--;
        const { data: profile } = await supabase
          .from("profiles")
          .select("points, total_visits")
          .eq("id", pid)
          .single();
        const currentPoints = Number(profile?.points ?? 0);
        const currentVisits = Number(profile?.total_visits ?? 0);
        await supabase
          .from("profiles")
          .update({
            points: currentPoints + share,
            total_visits: currentVisits + 1,
            updated_at: new Date().toISOString(),
          })
          .eq("id", pid);
      }
    }

    const pointsEarnedValue = Number.isFinite(totalSessionPoints) ? totalSessionPoints : 0;
    const updatePayload: Record<string, unknown> = {
      ended_at: new Date(endedAt).toISOString(),
      duration_minutes: durationMinutesNum,
      cost_mad: costToUse ?? 0,
      extra_items_mad: Math.round(extraItemsMad * 100) / 100,
      payment_status: paymentStatus,
      status: "completed",
      points_earned: pointsEarnedValue,
      paused_at: null,
    };
    if (costToUse == null) {
      const { data: stationRow } = await supabase
        .from("stations")
        .select("price_1_mad")
        .eq("id", stationId)
        .single();
      const pricePerHour = Number(stationRow?.price_1_mad ?? 0);
      const base = (pricePerHour / 60) * durationMinutesNum;
      updatePayload.cost_mad = Math.round((base + extraItemsMad) * 100) / 100;
      updatePayload.extra_items_mad = Math.round(extraItemsMad * 100) / 100;
    }

    const { error: updateSessionError } = await supabase
      .from("sessions")
      .update(updatePayload)
      .eq("id", sessionId);

    if (updateSessionError) {
      console.error("[stop-session] session update error:", updateSessionError);
      return NextResponse.json(
        { error: updateSessionError.message },
        { status: 500 }
      );
    }

    const { error: updateStationError } = await supabase
      .from("stations")
      .update({
        status: "free",
        current_session_id: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", stationId);

    if (updateStationError) {
      console.error("[stop-session] station update error:", updateStationError);
      return NextResponse.json(
        { error: updateStationError.message },
        { status: 500 }
      );
    }

    const { data: settings } = await supabase
      .from("business_settings")
      .select("session_alerts")
      .eq("id", 1)
      .maybeSingle();
    if (settings?.session_alerts && station?.name && paymentStatus === "unpaid") {
      await supabase.from("admin_notifications").insert({
        title: "Unpaid session ended",
        message: `Session on ${station.name} has ended and is unpaid.`,
        type: "session_alert",
        link_url: "/dashboard/sessions",
      });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[stop-session] Error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to stop session" },
      { status: 500 }
    );
  }
}
