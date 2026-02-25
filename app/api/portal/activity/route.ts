import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type ActivityItem = {
  id: string;
  type: "session" | "reward" | "tournament";
  title: string;
  description: string;
  date: string;
  points?: number;
  pointsType?: "earned" | "spent";
};

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const activities: ActivityItem[] = [];
    const now = new Date().toISOString();

    const { data: sessions } = await supabase
      .from("sessions")
      .select("id, station_id, ended_at, duration_minutes, game, points_earned")
      .eq("member_id", user.id)
      .not("ended_at", "is", null)
      .order("ended_at", { ascending: false })
      .limit(50);

    const stationIds = [...new Set((sessions ?? []).map((s) => s.station_id).filter(Boolean))];
    const { data: stations } =
      stationIds.length > 0
        ? await supabase.from("stations").select("id, name").in("id", stationIds)
        : { data: [] };
    const stationMap = Object.fromEntries((stations ?? []).map((s) => [s.id, s.name]));

    for (const s of sessions ?? []) {
      const stationName = stationMap[s.station_id] ?? "Station";
      const duration = s.duration_minutes ?? 0;
      const durationStr = duration < 60 ? `${duration}m` : `${Math.floor(duration / 60)}h${duration % 60 ? ` ${duration % 60}m` : ""}`;
      activities.push({
        id: `session-${s.id}`,
        type: "session",
        title: "Gaming Session",
        description: `${stationName} - ${s.game ?? "—"} - ${durationStr}`,
        date: s.ended_at!,
        points: s.points_earned ?? 0,
        pointsType: "earned",
      });
    }

    const { data: redemptions } = await supabase
      .from("reward_redemptions")
      .select("id, reward_id, points_spent, redeemed_at")
      .eq("member_id", user.id)
      .order("redeemed_at", { ascending: false })
      .limit(30);

    const rewardIds = [...new Set((redemptions ?? []).map((r) => r.reward_id).filter(Boolean))];
    const { data: rewards } =
      rewardIds.length > 0
        ? await supabase.from("rewards").select("id, name").in("id", rewardIds)
        : { data: [] };
    const rewardMap = Object.fromEntries((rewards ?? []).map((r) => [r.id, r.name]));

    for (const r of redemptions ?? []) {
      activities.push({
        id: `reward-${r.id}`,
        type: "reward",
        title: "Reward Redeemed",
        description: rewardMap[r.reward_id] ?? "Reward",
        date: r.redeemed_at,
        points: r.points_spent ?? 0,
        pointsType: "spent",
      });
    }

    const { data: regs } = await supabase
      .from("tournament_registrations")
      .select("tournament_id")
      .eq("member_id", user.id);
    const tIds = (regs ?? []).map((r: { tournament_id: string }) => r.tournament_id).filter(Boolean);
    const { data: pastTournaments } =
      tIds.length > 0
        ? await supabase
            .from("tournaments")
            .select("id, name, game, starts_at")
            .in("id", tIds)
            .lt("starts_at", now)
            .order("starts_at", { ascending: false })
            .limit(20)
        : { data: [] };

    for (const t of pastTournaments ?? []) {
      activities.push({
        id: `tournament-${t.id}`,
        type: "tournament",
        title: "Tournament Played",
        description: `${t.name} - ${t.game}`,
        date: t.starts_at,
        points: undefined,
        pointsType: undefined,
      });
    }

    activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const limited = activities.slice(0, 80);

    const { count: sessionCount } = await supabase
      .from("sessions")
      .select("id", { count: "exact", head: true })
      .eq("member_id", user.id)
      .not("ended_at", "is", null);
    const { data: earnedRows } = await supabase
      .from("sessions")
      .select("points_earned")
      .eq("member_id", user.id)
      .not("ended_at", "is", null);
    const totalEarned = (earnedRows ?? []).reduce((sum, s) => sum + (Number(s.points_earned) || 0), 0);
    const { data: spentRows } = await supabase
      .from("reward_redemptions")
      .select("points_spent")
      .eq("member_id", user.id);
    const totalSpent = (spentRows ?? []).reduce((sum, r) => sum + (Number(r.points_spent) || 0), 0);

    return NextResponse.json({
      activities: limited,
      total_sessions: sessionCount ?? 0,
      total_earned: totalEarned,
      total_spent: totalSpent,
    });
  } catch (e) {
    console.error("[portal/activity] Error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to load activity" },
      { status: 500 }
    );
  }
}
