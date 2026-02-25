import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = createAdminClient();

    const { data: tournaments, error: tournamentsError } = await supabase
      .from("tournaments")
      .select("id, name, game, status, card_eligibility, entry_fee_mad, prize, max_participants, starts_at")
      .order("starts_at", { ascending: true });

    if (tournamentsError) {
      console.error("[tournaments] list error:", tournamentsError);
      return NextResponse.json({ error: tournamentsError.message }, { status: 500 });
    }

    const ids = (tournaments ?? []).map((t) => t.id);
    if (ids.length === 0) {
      return NextResponse.json(
        (tournaments ?? []).map((t) => ({
          id: t.id,
          name: t.name,
          game: t.game,
          status: t.status,
          cardEligibility: t.card_eligibility ?? "all",
          entryFeeMad: Number(t.entry_fee_mad ?? 0),
          prize: t.prize ?? null,
          maxParticipants: t.max_participants ?? 0,
          participants: 0,
          startsAt: t.starts_at,
        }))
      );
    }

    const { data: regs } = await supabase
      .from("tournament_registrations")
      .select("tournament_id");
    const countByTournament: Record<string, number> = {};
    (regs ?? []).forEach((r: { tournament_id: string }) => {
      countByTournament[r.tournament_id] = (countByTournament[r.tournament_id] ?? 0) + 1;
    });

    const list = (tournaments ?? []).map((t) => ({
      id: t.id,
      name: t.name,
      game: t.game,
      status: t.status,
      cardEligibility: t.card_eligibility ?? "all",
      entryFeeMad: Number(t.entry_fee_mad ?? 0),
      prize: t.prize ?? null,
      maxParticipants: t.max_participants ?? 0,
      participants: countByTournament[t.id] ?? 0,
      startsAt: t.starts_at,
    }));

    return NextResponse.json(list);
  } catch (e) {
    console.error("[tournaments] Error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to fetch tournaments" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const game = typeof body.game === "string" ? body.game.trim() : "";
    const status = body.status === "ongoing" || body.status === "completed" ? body.status : "upcoming";
    const cardEligibility = ["all", "silver", "gold", "black"].includes(body.card_eligibility)
      ? body.card_eligibility
      : "all";
    const entryFeeMad = Math.max(0, Number(body.entry_fee_mad) || 0);
    const prize = typeof body.prize === "string" ? body.prize.trim() || null : null;
    const maxParticipants = Math.max(1, Math.floor(Number(body.max_participants) || 1));
    const startsAtRaw = body.starts_at;
    const startsAt = startsAtRaw ? new Date(startsAtRaw) : null;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    if (!game) {
      return NextResponse.json({ error: "Game is required" }, { status: 400 });
    }
    if (!startsAt || Number.isNaN(startsAt.getTime())) {
      return NextResponse.json({ error: "Valid start date and time is required" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data: tournament, error } = await supabase
      .from("tournaments")
      .insert({
        name,
        game,
        status,
        card_eligibility: cardEligibility,
        entry_fee_mad: entryFeeMad,
        prize,
        max_participants: maxParticipants,
        starts_at: startsAt.toISOString(),
      })
      .select("id, name, game, status, starts_at")
      .single();

    if (error) {
      console.error("[tournaments] insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(tournament);
  } catch (e) {
    console.error("[tournaments] POST Error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to create tournament" },
      { status: 500 }
    );
  }
}
