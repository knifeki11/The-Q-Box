import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: stations, error } = await supabase
      .from("stations")
      .select("id, name, type")
      .order("name", { ascending: true });

    if (error) {
      console.error("[portal/stations] Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(stations ?? []);
  } catch (e) {
    console.error("[portal/stations] Error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to load stations" },
      { status: 500 }
    );
  }
}
