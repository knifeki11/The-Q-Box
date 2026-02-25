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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const result = await requireAdmin();
    if (result.error) return result.error;
    const { admin } = result;
    const { id } = await params();
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    const body = await request.json().catch(() => ({}));
    const updates: Record<string, unknown> = {};
    if (typeof body.name === "string") updates.name = body.name.trim();
    if (body.description !== undefined) updates.description = typeof body.description === "string" ? body.description.trim() || null : null;
    if (body.points_cost !== undefined) updates.points_cost = Math.max(0, Math.floor(Number(body.points_cost) || 0));
    if (["silver", "gold", "black"].includes(body.tier_required)) updates.tier_required = body.tier_required;
    if (body.category !== undefined) updates.category = typeof body.category === "string" ? body.category.trim() || null : null;
    if (typeof body.active === "boolean") updates.active = body.active;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const { data: reward, error } = await admin
      .from("rewards")
      .update(updates)
      .eq("id", id)
      .select("id, name, description, points_cost, tier_required, category, active, created_at")
      .single();

    if (error) {
      console.error("[dashboard/shop] PATCH error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(reward);
  } catch (e) {
    console.error("[dashboard/shop] PATCH Error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to update reward" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const result = await requireAdmin();
    if (result.error) return result.error;
    const { admin } = result;
    const { id } = await params();
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    const { error } = await admin.from("rewards").delete().eq("id", id);
    if (error) {
      console.error("[dashboard/shop] DELETE error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[dashboard/shop] DELETE Error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to delete reward" },
      { status: 500 }
    );
  }
}
