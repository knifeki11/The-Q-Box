import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = createAdminClient();
    const { data: settings, error } = await supabase
      .from("business_settings")
      .select("*")
      .eq("id", 1)
      .maybeSingle();

    if (error) throw new Error(error.message);

    const x1 = settings?.xbox_price_1_mad != null ? Number(settings.xbox_price_1_mad) : 20;
    const x4 = settings?.xbox_price_4_mad != null ? Number(settings.xbox_price_4_mad) : null;
    const s1 =
      settings?.standard_ps5_price_1_mad != null ? Number(settings.standard_ps5_price_1_mad) : 40;
    const s4 =
      settings?.standard_ps5_price_4_mad != null ? Number(settings.standard_ps5_price_4_mad) : 55;
    const p1 =
      settings?.premium_ps5_price_1_mad != null ? Number(settings.premium_ps5_price_1_mad) : 50;
    const p4 =
      settings?.premium_ps5_price_4_mad != null ? Number(settings.premium_ps5_price_4_mad) : 70;
    const membership =
      settings?.membership_price_mad != null ? Number(settings.membership_price_mad) : 900;

    return NextResponse.json({
      pricing_by_type: {
        xbox: { price_1_mad: x1, price_4_mad: x4 },
        standard_ps5: { price_1_mad: s1, price_4_mad: s4 },
        premium_ps5: { price_1_mad: p1, price_4_mad: p4 },
      },
      membership_price_mad: membership,
    });
  } catch (e) {
    console.error("[pricing] Error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to load pricing" },
      { status: 500 }
    );
  }
}
