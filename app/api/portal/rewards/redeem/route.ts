import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const rewardId = typeof body.reward_id === "string" ? body.reward_id.trim() : "";
    if (!rewardId) {
      return NextResponse.json({ error: "reward_id is required" }, { status: 400 });
    }

    const { data: result, error } = await supabase.rpc("redeem_reward", {
      p_reward_id: rewardId,
    });

    if (error) {
      console.error("[portal/rewards/redeem] RPC error:", error);
      return NextResponse.json(
        { error: error.message ?? "Redemption failed" },
        { status: 400 }
      );
    }

    const ok = result?.ok === true;
    if (!ok) {
      return NextResponse.json(
        { error: (result?.error as string) ?? "Redemption failed" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      points_spent: result?.points_spent ?? 0,
      reward_name: result?.reward_name ?? "",
    });
  } catch (e) {
    console.error("[portal/rewards/redeem] Error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Redemption failed" },
      { status: 500 }
    );
  }
}
