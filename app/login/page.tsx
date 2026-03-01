"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Eye, EyeOff, Lock, ArrowRight, Phone } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { looksLikePhone } from "@/lib/phone";

const HeroScene = dynamic(() => import("@/components/hero-scene"), {
  ssr: false,
});

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") ?? "";
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const id = identifier.trim();
    if (!id) {
      setError("Phone or email is required.");
      return;
    }
    if (!password) {
      setError("Password is required.");
      return;
    }
    setLoading(true);
    try {
      if (looksLikePhone(id)) {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: id, password }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(data.error || "Sign in failed.");
          return;
        }
        const isAdmin = data.role === "admin";
        if (redirectTo && redirectTo.startsWith("/dashboard") && isAdmin) {
          window.location.href = redirectTo;
        } else if (isAdmin) {
          window.location.href = "/dashboard";
        } else {
          window.location.href = "/portal";
        }
        return;
      } else {
        const supabase = createClient();
        const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
          email: id,
          password,
        });
        if (signInError) throw signInError;
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", authData.user.id)
          .single();
        const isAdmin = profile?.role === "admin";
        if (redirectTo && redirectTo.startsWith("/dashboard") && isAdmin) {
          window.location.href = redirectTo;
        } else if (isAdmin) {
          window.location.href = "/dashboard";
        } else {
          window.location.href = "/portal";
        }
        return;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden">
      {/* 3D Cube Background */}
      <div className="absolute inset-0">
        <HeroScene />
      </div>

      {/* Darkened overlay for readability */}
      <div className="pointer-events-none absolute inset-0 bg-background/50 backdrop-blur-[2px]" />

      {/* Form container */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="relative z-10 w-full max-w-md px-6"
      >
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <Link href="/">
            <Image
              src="/images/QBOX_logo_upscaled.png"
              alt="THE Q-BOX PLAY LOUNGE"
              width={200}
              height={88}
              className="h-20 w-auto object-contain"
            />
          </Link>
        </div>

        {/* Glassmorphism form card */}
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-8 shadow-2xl backdrop-blur-xl">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold text-foreground">Welcome back</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Sign in to your Q-BOX account
            </p>
          </div>

          <form
            className="flex flex-col gap-5"
            onSubmit={handleSubmit}
          >
            {error && (
              <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">
                {error}
              </div>
            )}
            {/* Phone or email */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Phone or email
              </label>
              <div className="relative">
                <Phone
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <input
                  type="text"
                  inputMode="text"
                  autoComplete="tel email"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Email or phone"
                  className="h-11 w-full rounded-lg border border-white/[0.08] bg-white/[0.04] pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
                />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Password
              </label>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="h-11 w-full rounded-lg border border-white/[0.08] bg-white/[0.04] pl-10 pr-11 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Remember me + Forgot password */}
            <div className="flex items-center justify-between">
              <label className="flex cursor-pointer items-center gap-2">
                <div
                  onClick={() => setRememberMe(!rememberMe)}
                  className={`flex h-4 w-4 items-center justify-center rounded border transition-colors ${
                    rememberMe
                      ? "border-primary bg-primary"
                      : "border-white/[0.12] bg-white/[0.04]"
                  }`}
                >
                  {rememberMe && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path
                        d="M1 4L3.5 6.5L9 1"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  Remember me
                </span>
              </label>
              <Link
                href="/reset-password"
                className="text-xs text-primary transition-colors hover:text-primary/80"
              >
                Forgot password?
              </Link>
            </div>

            {/* Login button */}
            <button
              type="submit"
              disabled={loading}
              className="btn-premium-orange flex h-11 items-center justify-center gap-2 rounded-lg text-sm font-bold uppercase tracking-wider text-primary-foreground disabled:opacity-60"
            >
              {loading ? "Signing in…" : "Sign In"}
              <ArrowRight size={16} />
            </button>
          </form>

          {/* Create account link */}
          <p className="mt-6 text-center text-sm text-muted-foreground">
            {"Don't have an account? "}
            <Link
              href="/register"
              className="font-medium text-primary transition-colors hover:text-primary/80"
            >
              Create one
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
