import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const stationId = body.stationId as string | undefined;
    const memberIdsRaw = body.memberIds;
    const memberIds = Array.isArray(memberIdsRaw)
      ? (memberIdsRaw as string[]).filter((id) => typeof id === "string" && id.trim() !== "")
      : [];
    const legacyMemberId = (body.memberId as string | undefined) || null;
    const memberId = memberIds.length > 0 ? memberIds[0] : legacyMemberId;

    if (!stationId) {
      return NextResponse.json(
        { error: "stationId is required" },
        { status: 400 }
      );
    }

    const startTime = startTimeRaw ? new Date(startTimeRaw) : new Date();
    if (Number.isNaN(startTime.getTime()) || startTime.getTime() < Date.now() - 60_000) {
      return NextResponse.json(
        { error: "startTime must be a valid date/time (now or in the future)" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    const { data: station, error: stationError } = await supabase
      .from("stations")
      .select("id, status, price_1_mad")
      .eq("id", stationId)
      .single();

    if (stationError || !station) {
      return NextResponse.json(
        { error: "Station not found" },
        { status: 404 }
      );
    }

    const endTime = new Date(startTime.getTime() + durationMinutes * 60_000);
    const pricePerHour = Number(station.price_1_mad ?? 0);
    const costMad = Math.round((pricePerHour / 60) * durationMinutes * 100) / 100;

    const { data: booking, error: insertError } = await supabase
      .from("bookings")
      .insert({
        member_id: memberId || null,
        station_id: stationId,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        duration_minutes: durationMinutes,
        cost_mad: costMad,
        status: "confirmed",
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("[bookings] insert error:", insertError);
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      );
    }

    const idsToInsert = memberIds.length > 0 ? memberIds : (memberId ? [memberId] : []);
    if (idsToInsert.length > 0) {
      const { error: membersError } = await supabase
        .from("booking_members")
        .insert(idsToInsert.map((mid) => ({ booking_id: booking.id, member_id: mid })));
      if (membersError) {
        console.error("[bookings] booking_members insert error:", membersError);
        await supabase.from("bookings").delete().eq("id", booking.id);
        return NextResponse.json(
          { error: membersError.message },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ bookingId: booking.id });
  } catch (e) {
    console.error("[bookings] Error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to create booking" },
      { status: 500 }
    );
  }
}
