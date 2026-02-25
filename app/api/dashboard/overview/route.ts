import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = createAdminClient();

    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);
    const todayEnd = new Date(todayStart);
    todayEnd.setUTCDate(todayEnd.getUTCDate() + 1);

    const { data: stations } = await supabase
      .from("stations")
      .select("id, status");
    const totalStations = stations?.length ?? 0;
    const occupiedCount = stations?.filter((s) => s.status === "occupied").length ?? 0;

    const { data: activeSessions } = await supabase
      .from("sessions")
      .select("id")
      .eq("status", "active");
    const activePlayersCount = activeSessions?.length ?? 0;

    const { data: todaySessions } = await supabase
      .from("sessions")
      .select("id, cost_mad, ended_at")
      .eq("status", "completed")
      .gte("ended_at", todayStart.toISOString())
      .lt("ended_at", todayEnd.toISOString());
    const todayRevenue = (todaySessions ?? []).reduce((sum, s) => sum + Number(s.cost_mad ?? 0), 0);

    const hourlyBuckets: Record<number, number> = {};
    for (let h = 0; h < 24; h++) hourlyBuckets[h] = 0;
    (todaySessions ?? []).forEach((s) => {
      if (s.ended_at) {
        const hour = new Date(s.ended_at).getUTCHours();
        hourlyBuckets[hour] = (hourlyBuckets[hour] ?? 0) + Number(s.cost_mad ?? 0);
      }
    });
    const revenueData = Array.from({ length: 24 }, (_, i) => ({
      time: `${i === 0 ? 12 : i > 12 ? i - 12 : i}${i === 0 ? "AM" : i >= 12 ? "PM" : "AM"}`,
      hour: i,
      revenue: Math.round(hourlyBuckets[i] ?? 0),
    }));
    const hourLabel = (h: number) => {
      if (h === 0) return "12AM";
      if (h < 12) return `${h}AM`;
      if (h === 12) return "12PM";
      return `${h - 12}PM`;
    };
    const revenueChartData = revenueData.map((d) => ({ time: hourLabel(d.hour), revenue: d.revenue }));

    const { data: upcomingTournaments } = await supabase
      .from("tournaments")
      .select("id, name, starts_at, max_participants, card_eligibility")
      .eq("status", "upcoming")
      .gte("starts_at", new Date().toISOString())
      .order("starts_at", { ascending: true })
      .limit(5);

    const { data: regs } = upcomingTournaments?.length
      ? await supabase
          .from("tournament_registrations")
          .select("tournament_id")
          .in("tournament_id", (upcomingTournaments ?? []).map((t) => t.id))
      : { data: [] };
    const countByT: Record<string, number> = {};
    (regs ?? []).forEach((r: { tournament_id: string }) => {
      countByT[r.tournament_id] = (countByT[r.tournament_id] ?? 0) + 1;
    });

    const tournamentsList = (upcomingTournaments ?? []).map((t) => {
      const d = new Date(t.starts_at);
      const dateStr = d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
      const timeStr = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
      return {
        name: t.name,
        date: `${dateStr}, ${timeStr}`,
        players: `${countByT[t.id] ?? 0}/${t.max_participants ?? 0}`,
        tier: (t.card_eligibility === "all" ? "All" : t.card_eligibility?.charAt(0).toUpperCase() + (t.card_eligibility ?? "").slice(1)) ?? "All",
      };
    });

    const { data: recentSessions } = await supabase
      .from("sessions")
      .select("id, station_id, started_at, ended_at, status")
      .order("started_at", { ascending: false })
      .limit(10);

    const stationIds = [...new Set((recentSessions ?? []).map((s) => s.station_id))];
    const { data: stationNames } = stationIds.length
      ? await supabase.from("stations").select("id, name").in("id", stationIds)
      : { data: [] };
    const stationMap = Object.fromEntries((stationNames ?? []).map((s: { id: string; name: string }) => [s.id, s.name]));

    const now = Date.now();
    const recentActivity = (recentSessions ?? []).slice(0, 5).map((s) => {
      const started = new Date(s.started_at).getTime();
      const mins = Math.floor((now - started) / 60_000);
      const timeAgo = mins < 1 ? "Just now" : mins < 60 ? `${mins} min ago` : mins < 1440 ? `${Math.floor(mins / 60)}h ago` : `${Math.floor(mins / 1440)} day(s) ago`;
      const stationName = stationMap[s.station_id] ?? "Station";
      const text = s.status === "active"
        ? `${stationName} session started`
        : `${stationName} session ended`;
      return { text, time: timeAgo };
    });

    const { data: unpaidRows } = await supabase
      .from("sessions")
      .select("id")
      .eq("status", "completed")
      .eq("payment_status", "unpaid");
    const unpaidCount = unpaidRows?.length ?? 0;

    const alerts: { text: string; type: "warning" | "info" | "success" }[] = [];
    if (unpaidCount > 0) {
      alerts.push({ text: `${unpaidCount} completed session(s) unpaid`, type: "warning" });
    }
    if (totalStations > 0 && occupiedCount >= totalStations) {
      alerts.push({ text: "All stations in use", type: "info" });
    }
    if (alerts.length === 0) {
      alerts.push({ text: "No pending alerts", type: "success" });
    }

    return NextResponse.json({
      activePlayersCount,
      stationsInUse: occupiedCount,
      totalStations,
      todayRevenue: Math.round(todayRevenue * 100) / 100,
      revenueChartData,
      upcomingTournaments: tournamentsList,
      recentActivity,
      alerts,
    });
  } catch (e) {
    console.error("[overview] Error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to load overview" },
      { status: 500 }
    );
  }
}
