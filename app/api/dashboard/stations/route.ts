import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export type StationType = "standard_ps5" | "premium_ps5" | "xbox";

export interface StationRow {
  id: string;
  name: string;
  status: string;
  type: StationType;
  price_1_mad: number;
  price_4_mad: number | null;
  current_session_id: string | null;
  current_session?: {
    player_name: string;
    game: string | null;
    started_at: string;
    duration_minutes: number | null;
    member_ids: string[];
    paused_at: string | null;
  } | null;
}

export async function GET() {
  try {
    const supabase = createAdminClient();
    const { data: stations, error } = await supabase
      .from("stations")
      .select("id, name, status, type, price_1_mad, price_4_mad, current_session_id")
      .order("name", { ascending: true });

    if (error) {
      console.error("[stations] Supabase error:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    if (!stations?.length) {
      return NextResponse.json([]);
    }

    const sessionIds = stations
      .map((s) => s.current_session_id)
      .filter(Boolean) as string[];

    let sessionMap: Record<string, { player_name: string; game: string | null; started_at: string; duration_minutes: number | null; member_ids: string[]; paused_at: string | null }> = {};
    if (sessionIds.length > 0) {
      const { data: sessions } = await supabase
        .from("sessions")
        .select("id, member_id, started_at, duration_minutes, game, paused_at")
        .in("id", sessionIds)
        .eq("status", "active");

      if (sessions?.length) {
        const { data: smRows } = await supabase
          .from("session_members")
          .select("session_id, member_id")
          .in("session_id", sessionIds);
        const sessionToMembers: Record<string, string[]> = {};
        (smRows ?? []).forEach((r: { session_id: string; member_id: string }) => {
          if (!sessionToMembers[r.session_id]) sessionToMembers[r.session_id] = [];
          sessionToMembers[r.session_id].push(r.member_id);
        });
        const memberIds = [...new Set([
          ...sessions.map((s) => (s as { member_id?: string }).member_id).filter(Boolean),
          ...(smRows ?? []).map((r: { member_id: string }) => r.member_id),
        ])] as string[];
        let profiles: { id: string; first_name: string | null; last_name: string | null; email: string | null }[] = [];
        if (memberIds.length > 0) {
          const { data: p } = await supabase
            .from("profiles")
            .select("id, first_name, last_name, email")
            .in("id", memberIds);
          profiles = p ?? [];
        }
        // Card display: first name preferred, then last name, then email (so we never show Walk-in when a client is linked)
        const profileMap = Object.fromEntries(
          profiles.map((p) => {
            const first = (p.first_name && p.first_name.trim()) || null;
            const last = (p.last_name && p.last_name.trim()) || null;
            const email = (p.email && p.email.trim()) || null;
            const display = first || last || (email ? email.split("@")[0] : null) || "—";
            return [p.id, display];
          })
        );
        sessions.forEach((s: { id: string; member_id?: string | null; started_at: string; duration_minutes: number | null; game: string | null; paused_at?: string | null }) => {
          const ids = sessionToMembers[s.id]?.length ? sessionToMembers[s.id] : (s.member_id ? [s.member_id] : []);
          const parts = ids.map((id) => profileMap[id] ?? "—").filter((n) => n && n !== "—");
          const player_name = ids.length === 0 ? "Walk-in" : parts.length > 0 ? parts.join(", ") : "Walk-in";
          sessionMap[s.id] = {
            player_name,
            game: s.game ?? null,
            started_at: s.started_at,
            duration_minutes: s.duration_minutes ?? null,
            member_ids: ids,
            paused_at: s.paused_at ?? null,
          };
        });
      }
    }

    const rows = (stations as StationRow[]).map((s) => ({
      ...s,
      price_1_mad: Number(s.price_1_mad),
      price_4_mad: s.price_4_mad != null ? Number(s.price_4_mad) : null,
      current_session: s.current_session_id ? sessionMap[s.current_session_id] ?? null : null,
    }));

    return NextResponse.json(rows);
  } catch (e) {
    console.error("[stations] Error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to fetch stations" },
      { status: 500 }
    );
  }
}
