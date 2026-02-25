import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = createAdminClient();

    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, email, phone, updated_at")
      .eq("role", "admin")
      .order("first_name", { ascending: true });

    if (error) {
      console.error("[staff] Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const staff = (profiles ?? []).map((p) => {
      const name = [p.first_name, p.last_name].filter(Boolean).join(" ").trim() || "Admin";
      const updated = p.updated_at ? new Date(p.updated_at).getTime() : 0;
      const now = Date.now();
      const diffMs = now - updated;
      const diffMins = Math.floor(diffMs / 60_000);
      let lastActive = "—";
      if (updated > 0) {
        if (diffMins < 1) lastActive = "Now";
        else if (diffMins < 60) lastActive = `${diffMins} min ago`;
        else if (diffMins < 1440) lastActive = `${Math.floor(diffMins / 60)}h ago`;
        else if (diffMins < 2880) lastActive = "Yesterday";
        else lastActive = `${Math.floor(diffMins / 1440)} days ago`;
      }
      return {
        id: p.id,
        name,
        role: "Admin" as const,
        email: p.email ?? "—",
        phone: p.phone ?? "—",
        lastActive,
        permissions: ["Full access"],
      };
    });

    return NextResponse.json(staff);
  } catch (e) {
    console.error("[staff] Error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to load staff" },
      { status: 500 }
    );
  }
}
