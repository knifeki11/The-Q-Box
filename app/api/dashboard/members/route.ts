import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = createAdminClient();

    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, email, card_tier_id, points, total_visits, total_spent")
      .eq("role", "client")
      .order("first_name", { ascending: true });

    if (profilesError) {
      console.error("[members] profiles error:", profilesError);
      return NextResponse.json({ error: profilesError.message }, { status: 500 });
    }

    const ids = (profiles ?? []).map((p) => p.id).filter(Boolean);
    if (ids.length === 0) return NextResponse.json([]);

    const { data: tiers } = await supabase
      .from("card_tiers")
      .select("id, name");
    const tierMap: Record<string, string> = {};
    (tiers ?? []).forEach((t: { id: string; name: string | null }) => {
      tierMap[t.id] = t.name?.replace(/\s*Card\s*$/i, "").trim() || t.id;
    });

    const { data: sessionMemberRows } = await supabase
      .from("session_members")
      .select("session_id, member_id")
      .in("member_id", ids);
    const visitsMap: Record<string, number> = {};
    (sessionMemberRows ?? []).forEach((r: { member_id: string }) => {
      visitsMap[r.member_id] = (visitsMap[r.member_id] ?? 0) + 1;
    });
    const { data: legacySessions } = await supabase
      .from("sessions")
      .select("id, member_id")
      .in("member_id", ids);
    const sessionIdsWithJunction = new Set((sessionMemberRows ?? []).map((r: { session_id: string }) => r.session_id));
    (legacySessions ?? []).forEach((s: { id: string; member_id: string | null }) => {
      if (!s.member_id || sessionIdsWithJunction.has(s.id)) return;
      visitsMap[s.member_id] = (visitsMap[s.member_id] ?? 0) + 1;
    });

    const { data: unpaidSessions } = await supabase
      .from("sessions")
      .select("id, member_id, cost_mad")
      .eq("payment_status", "unpaid")
      .eq("status", "completed");
    const unpaidSessionIds = (unpaidSessions ?? []).map((x: { id: string }) => x.id);
    const unpaidMap: Record<string, number> = {};
    const totalUnpaidMadMap: Record<string, number> = {};
    if (unpaidSessionIds.length > 0) {
      const { data: unpaidRows } = await supabase
        .from("session_members")
        .select("session_id, member_id")
        .in("session_id", unpaidSessionIds);
      const sessionToMembers: Record<string, string[]> = {};
      (unpaidRows ?? []).forEach((r: { session_id: string; member_id: string }) => {
        if (!sessionToMembers[r.session_id]) sessionToMembers[r.session_id] = [];
        sessionToMembers[r.session_id].push(r.member_id);
      });
      (unpaidSessions ?? []).forEach((s: { id: string; member_id: string | null; cost_mad: number | null }) => {
        const memberIdsForSession = sessionToMembers[s.id]?.length
          ? sessionToMembers[s.id]
          : s.member_id
            ? [s.member_id]
            : [];
        const cost = Number(s.cost_mad ?? 0);
        const share = memberIdsForSession.length > 0 ? cost / memberIdsForSession.length : 0;
        memberIdsForSession.forEach((mid) => {
          if (!ids.includes(mid)) return;
          unpaidMap[mid] = (unpaidMap[mid] ?? 0) + 1;
          totalUnpaidMadMap[mid] = (totalUnpaidMadMap[mid] ?? 0) + share;
        });
      });
    }

    const members = (profiles ?? []).map((p) => {
      const cardName = tierMap[p.card_tier_id] ?? p.card_tier_id ?? "Silver";
      return {
        id: p.id,
        first_name: p.first_name ?? null,
        last_name: p.last_name ?? null,
        name: [p.first_name, p.last_name].filter(Boolean).join(" ").trim() || "—",
        email: p.email ?? "—",
        card: cardName,
        points: p.points ?? 0,
        visits: visitsMap[p.id] ?? 0,
        totalSpent: Number(p.total_spent ?? 0),
        unpaid: unpaidMap[p.id] ?? 0,
        totalUnpaidMad: Math.round((totalUnpaidMadMap[p.id] ?? 0) * 100) / 100,
      };
    });

    return NextResponse.json(members);
  } catch (e) {
    console.error("[members] Error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to fetch members" },
      { status: 500 }
    );
  }
}
