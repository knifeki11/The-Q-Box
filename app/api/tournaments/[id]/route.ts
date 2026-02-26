import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function nextPowerOf2(n: number): number {
  let p = 1;
  while (p < n) p *= 2;
  return p;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { id } = await Promise.resolve(params);
    if (!id) {
      return NextResponse.json({ error: "Tournament ID required" }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data: tournament, error: tErr } = await supabase
      .from("tournaments")
      .select("id, name, game, status, max_participants, entry_fee_mad, prize, starts_at")
      .eq("id", id)
      .single();

    if (tErr || !tournament) {
      return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
    }

    const { data: regs } = await supabase
      .from("tournament_registrations")
      .select("member_id")
      .eq("tournament_id", id)
      .order("registered_at", { ascending: true });

    const memberIds = [...new Set((regs ?? []).map((r: { member_id: string }) => r.member_id))];
    let profiles: { id: string; first_name: string | null; last_name: string | null }[] = [];
    if (memberIds.length > 0) {
      const { data: p } = await supabase
        .from("profiles")
        .select("id, first_name, last_name")
        .in("id", memberIds);
      profiles = p ?? [];
    }
    const profileMap = Object.fromEntries(
      profiles.map((p) => [
        p.id,
        {
          id: p.id,
          firstName: p.first_name ?? "",
          lastName: p.last_name ?? "",
          displayName: [p.first_name, p.last_name].filter(Boolean).join(" ").trim() || "—",
        },
      ])
    );

    const players = memberIds.map((mid) => profileMap[mid]).filter(Boolean);

    const { data: matches, error: matchesErr } = await supabase
      .from("tournament_matches")
      .select("id, round, match_index, player1_id, player2_id, winner_id")
      .eq("tournament_id", id)
      .order("round", { ascending: true })
      .order("match_index", { ascending: true });

    if (matchesErr) {
      console.error("[tournaments/id] tournament_matches fetch error:", matchesErr);
      return NextResponse.json(
        { error: "Could not load bracket. Run the migration: supabase/migrations/20260226100000_tournament_matches.sql" },
        { status: 500 }
      );
    }

    let matchesList = (matches ?? []) as {
      id: string;
      round: number;
      match_index: number;
      player1_id: string | null;
      player2_id: string | null;
      winner_id: string | null;
    }[];

    // Initialize bracket if no matches but we have registrations
    if (matchesList.length === 0 && players.length >= 2) {
      const slots = nextPowerOf2(players.length);
      const byes = slots - players.length;
      const round1Matches = slots / 2;
      const inserts: { tournament_id: string; round: number; match_index: number; player1_id: string | null; player2_id: string | null }[] = [];
      let idx = 0;
      for (let i = 0; i < round1Matches; i++) {
        const p1 = idx < players.length ? players[idx].id : null;
        idx++;
        const p2 = idx < players.length ? players[idx].id : null;
        idx++;
        inserts.push({
          tournament_id: id,
          round: 1,
          match_index: i,
          player1_id: p1,
          player2_id: p2,
        });
      }
      const { data: inserted, error: insertErr } = await supabase
        .from("tournament_matches")
        .insert(inserts)
        .select("id, round, match_index, player1_id, player2_id, winner_id");

      if (insertErr) {
        console.error("[tournaments/id] tournament_matches insert error:", insertErr);
        return NextResponse.json(
          { error: `Could not create bracket: ${insertErr.message}. Ensure the tournament_matches table exists.` },
          { status: 500 }
        );
      }
      matchesList = (inserted ?? []) as typeof matchesList;
    }

    const rounds = Array.from(new Set(matchesList.map((m) => m.round))).sort((a, b) => a - b);

    let canValidate = false;
    try {
      const supabaseAuth = await createClient();
      const { data: { user } } = await supabaseAuth.auth.getUser();
      if (user) {
        const { data: profile } = await supabaseAuth.from("profiles").select("role").eq("id", user.id).single();
        canValidate = profile?.role === "admin";
      }
    } catch {
      // ignore
    }

    return NextResponse.json({
      tournament: {
        id: tournament.id,
        name: tournament.name,
        game: tournament.game,
        status: tournament.status,
        maxParticipants: tournament.max_participants ?? 0,
        entryFeeMad: Number(tournament.entry_fee_mad ?? 0),
        prize: tournament.prize ?? null,
        startsAt: tournament.starts_at,
      },
      players,
      profileMap,
      matches: matchesList,
      rounds,
      canValidate,
    });
  } catch (e) {
    console.error("[tournaments/id] Error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to load tournament" },
      { status: 500 }
    );
  }
}
