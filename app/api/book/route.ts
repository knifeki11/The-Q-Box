import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const STATION_TYPES = ["standard_ps5", "premium_ps5", "xbox"] as const;

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const admin = createAdminClient();

    const body = await request.json().catch(() => ({}));
    const stationTypeRaw = typeof body.station_type === "string" ? body.station_type.trim() : "";
    const stationType = STATION_TYPES.includes(stationTypeRaw as (typeof STATION_TYPES)[number])
      ? (stationTypeRaw as (typeof STATION_TYPES)[number])
      : null;
    const startTimeRaw = typeof body.start_time === "string" ? body.start_time.trim() : "";
    const durationMinutes = Math.floor(Number(body.duration_minutes) || 0);

    if (!stationType) {
      return NextResponse.json(
        { error: "Please choose PS5 Standard, PS5 Premium, or Xbox." },
        { status: 400 }
      );
    }
    if (!startTimeRaw) {
      return NextResponse.json({ error: "Start date and time are required" }, { status: 400 });
    }
    if (durationMinutes < 30 || durationMinutes > 480) {
      return NextResponse.json(
        { error: "Duration must be between 30 minutes and 8 hours" },
        { status: 400 }
      );
    }

    const startTime = new Date(startTimeRaw);
    if (Number.isNaN(startTime.getTime())) {
      return NextResponse.json({ error: "Invalid start date/time" }, { status: 400 });
    }
    const minStart = Date.now() + 15 * 60 * 1000;
    if (startTime.getTime() < minStart) {
      return NextResponse.json(
        { error: "Start time must be at least 15 minutes from now" },
        { status: 400 }
      );
    }

    const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);
    const startIso = startTime.toISOString();
    const endIso = endTime.toISOString();

    const { data: stationsOfType, error: stationsError } = await admin
      .from("stations")
      .select("id, name, price_1_mad")
      .eq("type", stationType);

    if (stationsError || !stationsOfType?.length) {
      return NextResponse.json(
        { error: "No stations available for this console type. Try another time or type." },
        { status: 404 }
      );
    }

    const { data: overlappingBookings } = await admin
      .from("bookings")
      .select("station_id")
      .in("status", ["pending", "confirmed"])
      .lt("start_time", endIso)
      .gt("end_time", startIso);

    const busyStationIds = new Set((overlappingBookings ?? []).map((b) => b.station_id));
    const available = stationsOfType.filter((s) => !busyStationIds.has(s.id));
    if (available.length === 0) {
      return NextResponse.json(
        { error: "All stations of this type are booked for the chosen time. Try another time or console type." },
        { status: 409 }
      );
    }

    const station = available[Math.floor(Math.random() * available.length)];
    const pricePerHour = Number(station.price_1_mad ?? 0);
    const costMad = Math.round((pricePerHour / 60) * durationMinutes * 100) / 100;

    const { data: booking, error: insertError } = await admin
      .from("bookings")
      .insert({
        member_id: user?.id ?? null,
        station_id: station.id,
        start_time: startIso,
        end_time: endIso,
        duration_minutes: durationMinutes,
        cost_mad: costMad,
        game: null,
        status: "pending",
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("[book] insert error:", insertError);
      return NextResponse.json(
        { error: insertError.message ?? "Failed to create booking" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      id: booking.id,
      station_name: station.name,
      start_time: startIso,
      end_time: endIso,
      duration_minutes: durationMinutes,
    });
  } catch (e) {
    console.error("[book] Error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to create booking" },
      { status: 500 }
    );
  }
}
