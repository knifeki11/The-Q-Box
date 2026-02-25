import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const first_name = typeof body.first_name === "string" ? body.first_name.trim() || null : undefined;
    const last_name = typeof body.last_name === "string" ? body.last_name.trim() || null : undefined;
    const email = typeof body.email === "string" ? body.email.trim() || null : undefined;
    const phone = typeof body.phone === "string" ? body.phone.trim() || null : undefined;

    const updates: Record<string, string | null> = {};
    if (first_name !== undefined) updates.first_name = first_name;
    if (last_name !== undefined) updates.last_name = last_name;
    if (email !== undefined) updates.email = email;
    if (phone !== undefined) updates.phone = phone;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ ok: true });
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", user.id);

    if (profileError) {
      console.error("[portal/profile] update error:", profileError);
      return NextResponse.json({ error: profileError.message }, { status: 400 });
    }

    if (email !== undefined && email !== user.email) {
      await supabase.auth.updateUser({ email: email ?? undefined });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[portal/profile] Error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to update profile" },
      { status: 500 }
    );
  }
}
