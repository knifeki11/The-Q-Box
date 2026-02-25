import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params();
    if (!id) {
      return NextResponse.json({ error: "Tournament ID is required" }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const name = typeof body.name === "string" ? body.name.trim() : undefined;
    const game = typeof body.game === "string" ? body.game.trim() : undefined;
    const status =
      body.status === "ongoing" || body.status === "completed" ? body.status : body.status === "upcoming" ? "upcoming" : undefined;
    const cardEligibility = ["all", "silver", "gold", "black"].includes(body.card_eligibility)
      ? body.card_eligibility
      : undefined;
    const entryFeeMad = body.entry_fee_mad != null ? Math.max(0, Number(body.entry_fee_mad)) : undefined;
    const prize = body.prize !== undefined ? (typeof body.prize === "string" ? body.prize.trim() || null : null) : undefined;
    const maxParticipants =
      body.max_participants != null ? Math.max(1, Math.floor(Number(body.max_participants) || 1)) : undefined;
    const startsAtRaw = body.starts_at;
    const startsAt = startsAtRaw ? new Date(startsAtRaw) : undefined;

    const supabase = createAdminClient();

    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name;
    if (game !== undefined) updates.game = game;
    if (status !== undefined) updates.status = status;
    if (cardEligibility !== undefined) updates.card_eligibility = cardEligibility;
    if (entryFeeMad !== undefined) updates.entry_fee_mad = entryFeeMad;
    if (prize !== undefined) updates.prize = prize;
    if (maxParticipants !== undefined) updates.max_participants = maxParticipants;
    if (startsAt !== undefined && !Number.isNaN(startsAt.getTime())) {
      updates.starts_at = startsAt.toISOString();
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const { data: tournament, error } = await supabase
      .from("tournaments")
      .update(updates)
      .eq("id", id)
      .select("id, name, game, status, starts_at")
      .single();

    if (error) {
      console.error("[tournaments] PATCH error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(tournament);
  } catch (e) {
    console.error("[tournaments] PATCH Error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to update tournament" },
      { status: 500 }
    );
  }
}
