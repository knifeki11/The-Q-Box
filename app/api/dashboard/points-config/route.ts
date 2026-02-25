import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const pointsPerHourPlayed = Math.max(0, Math.floor(Number(body.pointsPerHourPlayed) || 0));
    const tournamentWinBonus = Math.max(0, Math.floor(Number(body.tournamentWinBonus) || 0));
    const birthdayBonus = Math.max(0, Math.floor(Number(body.birthdayBonus) || 0));
    const yearlyBonus = Math.max(0, Math.floor(Number(body.yearlyBonus) || 0));

    const supabase = createAdminClient();
    const { error } = await supabase
      .from("points_config")
      .update({
        points_per_hour_played: pointsPerHourPlayed,
        tournament_win_bonus: tournamentWinBonus,
        birthday_bonus: birthdayBonus,
        yearly_bonus: yearlyBonus,
      })
      .eq("id", 1);

    if (error) {
      console.error("[points-config] update error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      pointsConfig: {
        pointsPerHourPlayed,
        tournamentWinBonus,
        birthdayBonus,
        yearlyBonus,
      },
    });
  } catch (e) {
    console.error("[points-config] Error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to update points config" },
      { status: 500 }
    );
  }
}
