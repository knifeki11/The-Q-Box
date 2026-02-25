import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function formatTime(iso: string): string {
  const d = new Date(iso);
  const h = d.getHours();
  const m = d.getMinutes();
  const am = h < 12;
  const h12 = h % 12 || 12;
  return `${h12}:${m.toString().padStart(2, "0")} ${am ? "AM" : "PM"}`;
}

function formatDuration(minutes: number | null): string {
  if (minutes == null) return "—";
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}min` : `${h}h`;
}

export async function GET() {
  try {
    const supabase = createAdminClient();

    const { data: sessions, error: sessionsError } = await supabase
      .from("sessions")
      .select("id, member_id, station_id, started_at, ended_at, duration_minutes, cost_mad, game, status, payment_status")
      .order("started_at", { ascending: false });

    if (sessionsError) {
      console.error("[sessions] Supabase error:", sessionsError);
      return NextResponse.json(
        { error: sessionsError.message },
        { status: 500 }
      );
    }

    const sessionIds = (sessions ?? []).map((s) => s.id);
    const { data: sessionMembersRows } = sessionIds.length > 0
      ? await supabase.from("session_members").select("session_id, member_id").in("session_id", sessionIds)
      : { data: [] };
    const sessionToMemberIds: Record<string, string[]> = {};
    (sessionMembersRows ?? []).forEach((r: { session_id: string; member_id: string }) => {
      if (!sessionToMemberIds[r.session_id]) sessionToMemberIds[r.session_id] = [];
      sessionToMemberIds[r.session_id].push(r.member_id);
    });
    const memberIdsFromSessions = [...new Set((sessions ?? []).map((s) => s.member_id).filter(Boolean))] as string[];
    const memberIdsFromJunction = [...new Set((sessionMembersRows ?? []).map((r: { member_id: string }) => r.member_id))];
    const memberIds = [...new Set([...memberIdsFromSessions, ...memberIdsFromJunction])];
    const stationIds = [...new Set((sessions ?? []).map((s) => s.station_id))];

    let profileMap: Record<string, string> = {};
    if (memberIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, first_name, last_name")
        .in("id", memberIds);
      profileMap = Object.fromEntries(
        (profiles ?? []).map((p) => [
          p.id,
          [p.first_name, p.last_name].filter(Boolean).join(" ").trim() || "—",
        ])
      );
    }

    const playerLabel = (s: { id: string; member_id: string | null }) => {
      const ids = sessionToMemberIds[s.id]?.length ? sessionToMemberIds[s.id] : (s.member_id ? [s.member_id] : []);
      if (ids.length === 0) return "Walk-in";
      return ids.map((id) => profileMap[id] ?? "—").join(", ");
    };

    let stationMap: Record<string, string> = {};
    if (stationIds.length > 0) {
      const { data: stations } = await supabase
        .from("stations")
        .select("id, name")
        .in("id", stationIds);
      stationMap = Object.fromEntries((stations ?? []).map((s) => [s.id, s.name]));
    }

    const now = Date.now();
    const active = (sessions ?? [])
      .filter((s) => s.status === "active")
      .map((s) => {
        const elapsedMs = now - new Date(s.started_at).getTime();
        const elapsedMinutes = elapsedMs / 60_000;
        return {
          id: s.id,
          player: playerLabel(s),
          station: stationMap[s.station_id] ?? "—",
          game: s.game ?? "—",
          status: "active" as const,
          startTime: formatTime(s.started_at),
          duration: formatDuration(s.duration_minutes ?? Math.floor(elapsedMinutes)),
          durationMinutes: s.duration_minutes ?? elapsedMinutes,
          payment: Number(s.cost_mad),
          startedAt: s.started_at,
        };
      });

    const completed = (sessions ?? [])
      .filter((s) => s.status === "completed")
      .map((s) => ({
        id: s.id,
        player: playerLabel(s),
        station: stationMap[s.station_id] ?? "—",
        game: s.game ?? "—",
        status: "completed" as const,
        startTime: formatTime(s.started_at),
        duration: formatDuration(s.duration_minutes),
        durationMinutes: s.duration_minutes,
        payment: Number(s.cost_mad),
        paymentStatus: (s.payment_status === "paid" ? "paid" : "unpaid") as "paid" | "unpaid",
        startedAt: s.started_at,
      }));

    const { data: bookings, error: bookingsError } = await supabase
      .from("bookings")
      .select("id, member_id, station_id, start_time, end_time, duration_minutes, cost_mad, game, status")
      .in("status", ["pending", "confirmed"])
      .gte("start_time", new Date().toISOString())
      .order("start_time", { ascending: true });

    if (bookingsError) {
      console.error("[sessions] bookings error:", bookingsError);
    }

    const bookingIds = (bookings ?? []).map((b) => b.id);
    const { data: bookingMembersRows } = bookingIds.length > 0
      ? await supabase.from("booking_members").select("booking_id, member_id").in("booking_id", bookingIds)
      : { data: [] };
    const bookingToMemberIds: Record<string, string[]> = {};
    (bookingMembersRows ?? []).forEach((r: { booking_id: string; member_id: string }) => {
      if (!bookingToMemberIds[r.booking_id]) bookingToMemberIds[r.booking_id] = [];
      bookingToMemberIds[r.booking_id].push(r.member_id);
    });
    const reservedMemberIdsFromJunction = [...new Set((bookingMembersRows ?? []).map((r: { member_id: string }) => r.member_id))];
    const reservedMemberIds = [...new Set([...(bookings ?? []).map((b) => b.member_id).filter(Boolean), ...reservedMemberIdsFromJunction])];
    const reservedStationIds = [...new Set((bookings ?? []).map((b) => b.station_id))];
    const allMemberIds = [...new Set([...memberIds, ...reservedMemberIds])];
    if (reservedMemberIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, first_name, last_name")
        .in("id", reservedMemberIds);
      (profiles ?? []).forEach((p) => {
        profileMap[p.id] = [p.first_name, p.last_name].filter(Boolean).join(" ").trim() || "—";
      });
    }
    if (reservedStationIds.length > 0) {
      const { data: stations } = await supabase
        .from("stations")
        .select("id, name")
        .in("id", reservedStationIds);
      (stations ?? []).forEach((s) => {
        stationMap[s.id] = s.name;
      });
    }

    const reservedPlayerLabel = (b: { id: string; member_id: string | null }) => {
      const ids = bookingToMemberIds[b.id]?.length ? bookingToMemberIds[b.id] : (b.member_id ? [b.member_id] : []);
      if (ids.length === 0) return "Walk-in";
      return ids.map((id) => profileMap[id] ?? "—").join(", ");
    };

    const reserved = (bookings ?? []).map((b) => ({
      id: b.id,
      player: reservedPlayerLabel(b),
      station: stationMap[b.station_id] ?? "—",
      game: b.game ?? "TBD",
      status: "reserved" as const,
      startTime: formatTime(b.start_time),
      duration: formatDuration(b.duration_minutes),
      durationMinutes: b.duration_minutes,
      payment: Number(b.cost_mad),
      startTimeIso: b.start_time,
    }));

    const totalActiveRevenue = active.reduce((sum, s) => sum + s.payment, 0);

    return NextResponse.json({
      active,
      completed,
      reserved,
      totalActiveRevenue,
    });
  } catch (e) {
    console.error("[sessions] Error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to fetch sessions" },
      { status: 500 }
    );
  }
}
