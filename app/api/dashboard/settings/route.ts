import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SupabaseClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

async function buildSettingsResponse(supabase: SupabaseClient) {
  const { data: settings, error: settingsError } = await supabase
    .from("business_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();

  if (settingsError) throw new Error(settingsError.message);

  const { data: hours, error: hoursError } = await supabase
    .from("opening_hours")
    .select("day_of_week, open_time, close_time")
    .order("day_of_week", { ascending: true });

  if (hoursError) console.error("[settings] opening_hours error:", hoursError);

  const { data: tiers } = await supabase
    .from("card_tiers")
    .select("id, name, discount_percent")
    .in("id", ["silver", "gold", "black"]);

  const tierMap = Object.fromEntries((tiers ?? []).map((t: { id: string; name: string; discount_percent: number }) => [t.id, t]));
  const standardRate = Number(settings?.standard_rate_mad ?? 40);
  const goldTier = tierMap["gold"] as { discount_percent: number } | undefined;
  const blackTier = tierMap["black"] as { discount_percent: number } | undefined;
  const goldDiscount = goldTier?.discount_percent ?? 10;
  const blackDiscount = blackTier?.discount_percent ?? 25;

  return {
    pricing: {
      standard_rate_mad: standardRate,
      gold_rate_mad: Math.round(standardRate * (1 - goldDiscount / 100) * 100) / 100,
      black_rate_mad: Math.round(standardRate * (1 - blackDiscount / 100) * 100) / 100,
      gold_discount_percent: goldDiscount,
      black_discount_percent: blackDiscount,
      weekend_surcharge_mad: Number(settings?.weekend_surcharge_mad ?? 0),
    },
    pricing_by_type: {
      xbox: {
        price_1_mad: settings?.xbox_price_1_mad != null ? Number(settings.xbox_price_1_mad) : 20,
        price_4_mad: settings?.xbox_price_4_mad != null ? Number(settings.xbox_price_4_mad) : null,
      },
      standard_ps5: {
        price_1_mad: settings?.standard_ps5_price_1_mad != null ? Number(settings.standard_ps5_price_1_mad) : 40,
        price_4_mad: settings?.standard_ps5_price_4_mad != null ? Number(settings.standard_ps5_price_4_mad) : 55,
      },
      premium_ps5: {
        price_1_mad: settings?.premium_ps5_price_1_mad != null ? Number(settings.premium_ps5_price_1_mad) : 50,
        price_4_mad: settings?.premium_ps5_price_4_mad != null ? Number(settings.premium_ps5_price_4_mad) : 70,
      },
    },
    session: {
      default_session_minutes: settings?.default_session_minutes ?? 60,
      auto_end_warning_minutes: settings?.auto_end_warning_minutes ?? 5,
      auto_extend_sessions: settings?.auto_extend_sessions ?? false,
    },
    notifications: {
      session_alerts: settings?.session_alerts ?? true,
      low_station_alerts: settings?.low_station_alerts ?? true,
      tournament_reminders: settings?.tournament_reminders ?? true,
      revenue_milestones: settings?.revenue_milestones ?? false,
      new_member_alerts: settings?.new_member_alerts ?? true,
      maintenance_alerts: settings?.maintenance_alerts ?? true,
    },
    opening_hours: (hours ?? []).map((h: { day_of_week: number; open_time: string; close_time: string }) => ({
      day_of_week: h.day_of_week,
      open_time: h.open_time,
      close_time: h.close_time,
    })),
  };
}

export async function GET() {
  try {
    const supabase = createAdminClient();
    const data = await buildSettingsResponse(supabase);
    return NextResponse.json(data);
  } catch (e) {
    console.error("[settings] Error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to load settings" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const supabase = createAdminClient();

    const updates: Record<string, unknown> = {};
    if (typeof body.standard_rate_mad === "number" && body.standard_rate_mad >= 0) {
      updates.standard_rate_mad = body.standard_rate_mad;
    }
    if (typeof body.weekend_surcharge_mad === "number" && body.weekend_surcharge_mad >= 0) {
      updates.weekend_surcharge_mad = body.weekend_surcharge_mad;
    }
    const pt = body.pricing_by_type;
    if (pt && typeof pt === "object") {
      if (typeof pt.xbox?.price_1_mad === "number" && pt.xbox.price_1_mad >= 0) updates.xbox_price_1_mad = pt.xbox.price_1_mad;
      if (pt.xbox && "price_4_mad" in pt.xbox) updates.xbox_price_4_mad = pt.xbox.price_4_mad == null ? null : Number(pt.xbox.price_4_mad);
      if (typeof pt.standard_ps5?.price_1_mad === "number" && pt.standard_ps5.price_1_mad >= 0) updates.standard_ps5_price_1_mad = pt.standard_ps5.price_1_mad;
      if (pt.standard_ps5 && "price_4_mad" in pt.standard_ps5) updates.standard_ps5_price_4_mad = pt.standard_ps5.price_4_mad == null ? null : Number(pt.standard_ps5.price_4_mad);
      if (typeof pt.premium_ps5?.price_1_mad === "number" && pt.premium_ps5.price_1_mad >= 0) updates.premium_ps5_price_1_mad = pt.premium_ps5.price_1_mad;
      if (pt.premium_ps5 && "price_4_mad" in pt.premium_ps5) updates.premium_ps5_price_4_mad = pt.premium_ps5.price_4_mad == null ? null : Number(pt.premium_ps5.price_4_mad);
    }
    if (typeof body.default_session_minutes === "number" && body.default_session_minutes >= 1) {
      updates.default_session_minutes = body.default_session_minutes;
    }
    if (typeof body.auto_end_warning_minutes === "number" && body.auto_end_warning_minutes >= 0) {
      updates.auto_end_warning_minutes = body.auto_end_warning_minutes;
    }
    if (typeof body.auto_extend_sessions === "boolean") updates.auto_extend_sessions = body.auto_extend_sessions;
    if (typeof body.session_alerts === "boolean") updates.session_alerts = body.session_alerts;
    if (typeof body.low_station_alerts === "boolean") updates.low_station_alerts = body.low_station_alerts;
    if (typeof body.tournament_reminders === "boolean") updates.tournament_reminders = body.tournament_reminders;
    if (typeof body.revenue_milestones === "boolean") updates.revenue_milestones = body.revenue_milestones;
    if (typeof body.new_member_alerts === "boolean") updates.new_member_alerts = body.new_member_alerts;
    if (typeof body.maintenance_alerts === "boolean") updates.maintenance_alerts = body.maintenance_alerts;

    updates.updated_at = new Date().toISOString();

    if (Object.keys(updates).length > 1) {
      const { error } = await supabase
        .from("business_settings")
        .update(updates)
        .eq("id", 1);
      if (error) {
        console.error("[settings] update error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    if (Array.isArray(body.opening_hours)) {
      for (const row of body.opening_hours) {
        if (typeof row.day_of_week !== "number" || row.day_of_week < 0 || row.day_of_week > 6) continue;
        const openTime = typeof row.open_time === "string" ? row.open_time.trim() : null;
        const closeTime = typeof row.close_time === "string" ? row.close_time.trim() : null;
        if (!openTime || !closeTime) continue;
        const { error } = await supabase
          .from("opening_hours")
          .upsert({ day_of_week: row.day_of_week, open_time: openTime, close_time: closeTime }, { onConflict: "day_of_week" });
        if (error) console.error("[settings] opening_hours upsert error:", error);
      }
    }

    const data = await buildSettingsResponse(supabase);
    return NextResponse.json(data);
  } catch (e) {
    console.error("[settings] PATCH Error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to update settings" },
      { status: 500 }
    );
  }
}
