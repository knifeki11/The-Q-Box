import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const TIER_COLORS: Record<string, string> = {
  silver: "#71717a",
  gold: "#f59e0b",
  black: "#e4e4e7",
};

export async function GET() {
  try {
    const supabase = createAdminClient();

    const { data: tiers, error: tiersError } = await supabase
      .from("card_tiers")
      .select("id, name, points_required, visits_required, discount_percent, points_multiplier, free_hours_per_month, guest_passes_per_month")
      .order("points_required", { ascending: true });

    if (tiersError) {
      console.error("[cards] tiers error:", tiersError);
      return NextResponse.json({ error: tiersError.message }, { status: 500 });
    }

    const { data: counts, error: countsError } = await supabase
      .from("profiles")
      .select("card_tier_id")
      .eq("role", "client");

    if (countsError) {
      console.error("[cards] counts error:", countsError);
      return NextResponse.json({ error: countsError.message }, { status: 500 });
    }

    const countByTier: Record<string, number> = {};
    (counts ?? []).forEach((r: { card_tier_id: string }) => {
      const id = r.card_tier_id ?? "silver";
      countByTier[id] = (countByTier[id] ?? 0) + 1;
    });

    const total = Object.values(countByTier).reduce((a, b) => a + b, 0);

    const distribution = (tiers ?? []).map((t) => {
      const count = countByTier[t.id] ?? 0;
      const percent = total > 0 ? Math.round((count / total) * 100) : 0;
      return {
        id: t.id,
        name: t.name?.replace(/\s*Card\s*$/i, "").trim() || t.id,
        fullName: t.name ?? t.id,
        count,
        percent,
        color: TIER_COLORS[t.id] ?? "#71717a",
      };
    });

    const tierDetails = (tiers ?? []).map((t) => {
      const count = countByTier[t.id] ?? 0;
      const percent = total > 0 ? Math.round((count / total) * 100) : 0;
      const requirements =
        t.points_required === 0 && t.visits_required === 0
          ? "Default tier on signup"
          : `${Number(t.points_required).toLocaleString()} points + ${t.visits_required} visits`;
      const privileges: string[] = [];
      if (t.discount_percent > 0) privileges.push(`${t.discount_percent}% discount`);
      if (t.free_hours_per_month > 0) privileges.push(`${t.free_hours_per_month} free hours/month`);
      if (t.guest_passes_per_month > 0) privileges.push("Guest passes");
      if (t.points_multiplier > 1) privileges.push(`${t.points_multiplier}x points`);
      if (privileges.length === 0) {
        privileges.push("Standard pricing", "Basic booking", "Community tournaments");
      }
      return {
        id: t.id,
        name: t.name ?? t.id,
        members: count,
        percent,
        pointsMultiplier: `${Number(t.points_multiplier)}x`,
        requirements,
        privileges,
        points_required: t.points_required,
        visits_required: t.visits_required,
        discount_percent: t.discount_percent,
      };
    });

    let pointsConfig = {
      pointsPerHourPlayed: 10,
      tournamentWinBonus: 500,
      birthdayBonus: 1000,
      yearlyBonus: 500,
    };
    const { data: configRow } = await supabase
      .from("points_config")
      .select("points_per_hour_played, tournament_win_bonus, birthday_bonus, yearly_bonus")
      .eq("id", 1)
      .single();
    if (configRow) {
      pointsConfig = {
        pointsPerHourPlayed: Number(configRow.points_per_hour_played) || 10,
        tournamentWinBonus: Number(configRow.tournament_win_bonus) || 500,
        birthdayBonus: Number(configRow.birthday_bonus) || 1000,
        yearlyBonus: Number(configRow.yearly_bonus) || 500,
      };
    }

    return NextResponse.json({
      distribution,
      tierDetails,
      totalMembers: total,
      pointsConfig,
    });
  } catch (e) {
    console.error("[cards] Error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to fetch cards data" },
      { status: 500 }
    );
  }
}
