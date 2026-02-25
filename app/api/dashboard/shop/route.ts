import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  return { admin };
}

export async function GET() {
  try {
    const result = await requireAdmin();
    if (result.error) return result.error;
    const { admin } = result;

    const { data: rewards, error } = await admin
      .from("rewards")
      .select("id, name, description, points_cost, tier_required, category, active, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[dashboard/shop] GET error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(rewards ?? []);
  } catch (e) {
    console.error("[dashboard/shop] GET Error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to load shop" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const result = await requireAdmin();
    if (result.error) return result.error;
    const { admin } = result;

    const body = await request.json().catch(() => ({}));
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const description = typeof body.description === "string" ? body.description.trim() || null : null;
    const points_cost = Math.max(0, Math.floor(Number(body.points_cost) || 0));
    const tier_required = ["silver", "gold", "black"].includes(body.tier_required) ? body.tier_required : "silver";
    const category = typeof body.category === "string" ? body.category.trim() || null : null;
    const active = body.active !== false;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const { data: reward, error } = await admin
      .from("rewards")
      .insert({
        name,
        description,
        points_cost,
        tier_required,
        category,
        active: active ?? true,
      })
      .select("id, name, description, points_cost, tier_required, category, active, created_at")
      .single();

    if (error) {
      console.error("[dashboard/shop] POST error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(reward);
  } catch (e) {
    console.error("[dashboard/shop] POST Error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to create reward" },
      { status: 500 }
    );
  }
}
