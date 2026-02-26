import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { id: tournamentId } = await Promise.resolve(params);
    if (!tournamentId) {
      return NextResponse.json({ error: "Tournament ID required" }, { status: 400 });
    }

    const supabaseAuth = await createClient();
    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { data: profile } = await supabaseAuth
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Admin required" }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const matchId = body.matchId as string | undefined;
    const winnerId = body.winnerId as string | undefined;
    if (!matchId || !winnerId) {
      return NextResponse.json({ error: "matchId and winnerId required" }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data: match, error: matchErr } = await supabase
      .from("tournament_matches")
      .select("id, tournament_id, round, match_index, player1_id, player2_id")
      .eq("id", matchId)
      .eq("tournament_id", tournamentId)
      .single();

    if (matchErr || !match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    if (winnerId !== match.player1_id && winnerId !== match.player2_id) {
      return NextResponse.json({ error: "Winner must be one of the match players" }, { status: 400 });
    }

    const { error: updateErr } = await supabase
      .from("tournament_matches")
      .update({ winner_id: winnerId })
      .eq("id", matchId);

    if (updateErr) {
      console.error("[validate-winner] update error:", updateErr);
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    // Create next round match if this isn't the final
    const { data: allMatches } = await supabase
      .from("tournament_matches")
      .select("id, round, match_index, winner_id")
      .eq("tournament_id", tournamentId)
      .order("round")
      .order("match_index");

    const roundMatches = (allMatches ?? []).filter((m: { round: number }) => m.round === match.round);
    const nextRound = match.round + 1;
    const nextMatchIndex = Math.floor(match.match_index / 2);
    const isLeftSlot = match.match_index % 2 === 0;

    const nextRoundMatches = (allMatches ?? []).filter((m: { round: number }) => m.round === nextRound);
    const existingNext = nextRoundMatches.find((m: { match_index: number }) => m.match_index === nextMatchIndex);

    if (existingNext) {
      const updates: { player1_id?: string; player2_id?: string } = {};
      if (isLeftSlot) updates.player1_id = winnerId;
      else updates.player2_id = winnerId;
      await supabase
        .from("tournament_matches")
        .update(updates)
        .eq("id", existingNext.id);
    } else {
      const newMatch: Record<string, unknown> = {
        tournament_id: tournamentId,
        round: nextRound,
        match_index: nextMatchIndex,
        player1_id: isLeftSlot ? winnerId : null,
        player2_id: isLeftSlot ? null : winnerId,
      };
      await supabase.from("tournament_matches").insert(newMatch);
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[validate-winner] Error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to validate winner" },
      { status: 500 }
    );
  }
}
