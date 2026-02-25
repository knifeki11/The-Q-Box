import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tournamentId } = await params();
    if (!tournamentId) {
      return NextResponse.json({ error: "Tournament ID required" }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { error } = await supabase.from("tournament_registrations").insert({
      tournament_id: tournamentId,
      member_id: user.id,
      entry_paid: false,
    });

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "Already registered" }, { status: 409 });
      }
      console.error("[portal/tournaments/register] Error:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[portal/tournaments/register] Error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to register" },
      { status: 500 }
    );
  }
}
