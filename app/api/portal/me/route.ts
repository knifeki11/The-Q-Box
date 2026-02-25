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

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select(
        "id, first_name, last_name, email, phone, card_tier_id, points, total_visits, total_spent"
      )
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: profileError?.message ?? "Profile not found" },
        { status: 404 }
      );
    }

    const { data: tiers } = await supabase
      .from("card_tiers")
      .select("id, name, points_required")
      .order("points_required", { ascending: true });

    const tierList = tiers ?? [];
    const currentTier = tierList.find((t) => t.id === profile.card_tier_id) ?? tierList[0];
    const currentIndex = tierList.findIndex((t) => t.id === currentTier.id);
    const nextTier = currentIndex >= 0 && currentIndex < tierList.length - 1 ? tierList[currentIndex + 1] : null;
    const pointsToNext = nextTier
      ? Math.max(0, (nextTier.points_required ?? 0) - (profile.points ?? 0))
      : 0;
    const progressPercent =
      nextTier && currentTier
        ? Math.min(
            100,
            Math.round(
              ((profile.points ?? 0) - (currentTier.points_required ?? 0)) /
                Math.max(1, (nextTier.points_required ?? 0) - (currentTier.points_required ?? 0)) *
                100
            )
          )
        : 100;

    const now = new Date().toISOString();
    const { data: bookings } = await supabase
      .from("bookings")
      .select("id, station_id, start_time, end_time, duration_minutes, game, status")
      .eq("member_id", user.id)
      .gte("start_time", now)
      .in("status", ["pending", "confirmed"])
      .order("start_time", { ascending: true })
      .limit(10);

    const stationIds = [...new Set((bookings ?? []).map((b) => b.station_id).filter(Boolean))];
    const { data: stations } =
      stationIds.length > 0
        ? await supabase.from("stations").select("id, name").in("id", stationIds)
        : { data: [] };
    const stationMap = Object.fromEntries((stations ?? []).map((s) => [s.id, s.name]));

    const upcomingBookings = (bookings ?? []).map((b) => ({
      id: b.id,
      station_id: b.station_id,
      station_name: stationMap[b.station_id] ?? "Station",
      start_time: b.start_time,
      end_time: b.end_time,
      game: b.game ?? null,
      status: b.status,
    }));

    const { data: regs } = await supabase
      .from("tournament_registrations")
      .select("tournament_id")
      .eq("member_id", user.id);

    const tournamentIds = (regs ?? []).map((r) => r.tournament_id).filter(Boolean);
    const { data: tournaments } =
      tournamentIds.length > 0
        ? await supabase
            .from("tournaments")
            .select("id, name, game, starts_at, status")
            .in("id", tournamentIds)
            .gte("starts_at", now)
            .order("starts_at", { ascending: true })
            .limit(5)
        : { data: [] };

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const { data: sessionsThisMonth } = await supabase
      .from("sessions")
      .select("points_earned")
      .eq("member_id", user.id)
      .not("ended_at", "is", null)
      .gte("ended_at", startOfMonth.toISOString());

    const pointsThisMonth = (sessionsThisMonth ?? []).reduce(
      (sum, s) => sum + (Number(s.points_earned) || 0),
      0
    );

    const displayName = [profile.first_name, profile.last_name]
      .filter(Boolean)
      .join(" ")
      .trim() || profile.email || profile.phone || "Member";
    const shortName =
      profile.first_name && profile.last_name
        ? `${profile.first_name} ${profile.last_name.charAt(0)}.`
        : displayName;

    return NextResponse.json({
      profile: {
        id: profile.id,
        first_name: profile.first_name,
        last_name: profile.last_name,
        display_name: displayName,
        short_name: shortName,
        email: profile.email,
        phone: profile.phone,
        card_tier_id: profile.card_tier_id,
        tier_name: (currentTier?.name ?? "Silver").replace(/\s*Card\s*$/i, "").trim(),
        points: profile.points ?? 0,
        points_this_month: pointsThisMonth,
        total_visits: profile.total_visits ?? 0,
        total_spent: Number(profile.total_spent ?? 0),
      },
      tier: {
        current: currentTier?.id ?? "silver",
        current_name: (currentTier?.name ?? "Silver").replace(/\s*Card\s*$/i, "").trim(),
        next: nextTier?.id ?? null,
        next_name: nextTier ? (nextTier.name ?? "").replace(/\s*Card\s*$/i, "").trim() : null,
        points_to_next: pointsToNext,
        progress_percent: progressPercent,
        next_threshold: nextTier?.points_required ?? null,
        current_threshold: currentTier?.points_required ?? 0,
      },
      upcoming_bookings: upcomingBookings,
      upcoming_tournaments: tournaments ?? [],
      booking_count: upcomingBookings.length,
      tournament_count: (tournaments ?? []).length,
    });
  } catch (e) {
    console.error("[portal/me] Error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to load" },
      { status: 500 }
    );
  }
}
