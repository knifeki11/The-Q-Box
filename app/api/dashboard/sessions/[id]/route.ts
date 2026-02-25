import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params;
    if (!sessionId) {
      return NextResponse.json({ error: "Session ID is required" }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const paymentStatus = body.payment_status === "paid" ? "paid" : "unpaid";

    const supabase = createAdminClient();

    const { data: session, error: fetchError } = await supabase
      .from("sessions")
      .select("id, status")
      .eq("id", sessionId)
      .single();

    if (fetchError || !session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    if (session.status !== "completed") {
      return NextResponse.json(
        { error: "Only completed sessions can have payment status updated" },
        { status: 400 }
      );
    }

    const { error: updateError } = await supabase
      .from("sessions")
      .update({ payment_status: paymentStatus })
      .eq("id", sessionId);

    if (updateError) {
      console.error("[sessions PATCH] update error:", updateError);
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, payment_status: paymentStatus });
  } catch (e) {
    console.error("[sessions PATCH] Error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to update session" },
      { status: 500 }
    );
  }
}
