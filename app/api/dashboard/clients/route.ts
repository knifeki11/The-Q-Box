import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, email, phone")
      .eq("role", "client")
      .order("first_name", { ascending: true });

    if (error) {
      console.error("[clients] Supabase error:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    const clients = (data ?? []).map((p) => {
      const name = [p.first_name, p.last_name].filter(Boolean).join(" ").trim();
      return {
        id: p.id,
        label: name || p.email || p.id.slice(0, 8),
        name: name || null,
        email: p.email ?? null,
        phone: p.phone ?? null,
      };
    });

    return NextResponse.json(clients);
  } catch (e) {
    console.error("[clients] Error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to fetch clients" },
      { status: 500 }
    );
  }
}
