import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date().toISOString();

    const { data: allTournaments, error: tError } = await supabase
      .from("tournaments")
      .select("id, name, game, status, card_eligibility, entry_fee_mad, prize, max_participants, starts_at")
      .in("status", ["upcoming", "ongoing"])
      .or(`status.eq.ongoing,starts_at.gte.${now}`)
      .order("starts_at", { ascending: true })
      .limit(50);

    if (tError) {
      console.error("[portal/tournaments] list error:", tError);
      return NextResponse.json({ error: tError.message }, { status: 500 });
    }

    const tournamentIds = (allTournaments ?? []).map((t) => t.id);

    const { data: allRegs } = await supabase
      .from("tournament_registrations")
      .select("tournament_id");
    const participantCount: Record<string, number> = {};
    (allRegs ?? []).forEach((r: { tournament_id: string }) => {
      participantCount[r.tournament_id] = (participantCount[r.tournament_id] ?? 0) + 1;
    });

    const { data: myRegs } = await supabase
      .from("tournament_registrations")
      .select("tournament_id")
      .eq("member_id", user.id);
    const registeredIds = new Set((myRegs ?? []).map((r: { tournament_id: string }) => r.tournament_id));

    const { data: pastRegs } = await supabase
      .from("tournament_registrations")
      .select("tournament_id")
      .eq("member_id", user.id);
    const pastIds = (pastRegs ?? []).map((r: { tournament_id: string }) => r.tournament_id).filter(Boolean);
    const { data: pastTournaments } =
      pastIds.length > 0
        ? await supabase
            .from("tournaments")
            .select("id, name, game, starts_at, status")
            .in("id", pastIds)
            .or(`status.eq.completed,starts_at.lt.${now}`)
            .order("starts_at", { ascending: false })
            .limit(20)
        : { data: [] };

    const upcoming = (allTournaments ?? []).map((t) => ({
      id: t.id,
      name: t.name,
      game: t.game,
      status: t.status,
      card_eligibility: t.card_eligibility ?? "all",
      entry_fee_mad: Number(t.entry_fee_mad ?? 0),
      prize: t.prize ?? null,
      max_participants: t.max_participants ?? 0,
      participants: participantCount[t.id] ?? 0,
      starts_at: t.starts_at,
      registered: registeredIds.has(t.id),
    }));

    const past = (pastTournaments ?? []).map((t) => ({
      id: t.id,
      name: t.name,
      game: t.game,
      starts_at: t.starts_at,
      status: t.status,
    }));

    return NextResponse.json({
      upcoming,
      past,
      registered_ids: [...registeredIds],
    });
  } catch (e) {
    console.error("[portal/tournaments] Error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to load tournaments" },
      { status: 500 }
    );
  }
}
