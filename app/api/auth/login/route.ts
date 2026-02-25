import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizePhoneMorocco } from "@/lib/phone";

export const dynamic = "force-dynamic";

/**
 * POST body: { "phone": "+212 6 66... or 06 66...", "password": "..." }
 * Resolves phone to profile email and signs in with Supabase Auth (session cookie set).
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const phoneRaw = typeof body.phone === "string" ? body.phone.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!phoneRaw || !password) {
      return NextResponse.json(
        { error: "Phone and password are required." },
        { status: 400 }
      );
    }

    const normalized = normalizePhoneMorocco(phoneRaw);
    if (!normalized) {
      return NextResponse.json(
        { error: "Invalid phone number. Use +212 6 XX XX XX XX or 06 XX XX XX XX." },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("id, email")
      .eq("phone", normalized)
      .maybeSingle();

    if (profileError || !profile?.id) {
      return NextResponse.json(
        { error: "No account found for this phone number." },
        { status: 401 }
      );
    }

    let emailForSignIn = profile.email ?? null;
    const { data: authUserData } = await admin.auth.admin.getUserById(profile.id);
    const authUser = authUserData?.user;
    if (!emailForSignIn) {
      emailForSignIn = authUser?.email ?? null;
    }
    if (!emailForSignIn) {
      return NextResponse.json(
        { error: "No account found for this phone number." },
        { status: 401 }
      );
    }

    if (authUser && !authUser.email_confirmed_at) {
      await admin.auth.admin.updateUserById(profile.id, { email_confirm: true });
    }

    const supabase = await createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: emailForSignIn,
      password,
    });

    if (signInError) {
      return NextResponse.json(
        { error: signInError.message === "Invalid login credentials" ? "Invalid password." : signInError.message },
        { status: 401 }
      );
    }

    const { data: profileRole } = await admin
      .from("profiles")
      .select("role")
      .eq("id", profile.id)
      .single();

    return NextResponse.json({ ok: true, role: profileRole?.role ?? "client" });
  } catch (e) {
    console.error("[auth/login] Error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Login failed." },
      { status: 500 }
    );
  }
}
