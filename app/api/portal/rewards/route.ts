import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: rewards, error } = await supabase
      .from("rewards")
      .select("id, name, description, points_cost, tier_required, category")
      .eq("active", true)
      .order("points_cost", { ascending: true });

    if (error) {
      console.error("[portal/rewards] GET error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(rewards ?? []);
  } catch (e) {
    console.error("[portal/rewards] GET Error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to load rewards" },
      { status: 500 }
    );
  }
}
