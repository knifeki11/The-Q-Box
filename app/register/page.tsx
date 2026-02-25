"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Phone,
  Calendar,
  ArrowRight,
  Check,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { normalizePhoneMorocco } from "@/lib/phone";

const HeroScene = dynamic(() => import("@/components/hero-scene"), {
  ssr: false,
});

const registerT = {
  rateLimitError: {
    en: "Too many sign-up attempts from your device or network. Please wait about an hour and try again.",
    ar: "محاولات تسجيل كثيرة من جهازك أو شبكتك. انتظر حوالي ساعة ثم حاول مرة أخرى.",
  },
};

function PasswordStrength({ password }: { password: string }) {
  const strength = useMemo(() => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  }, [password]);

  const labels = ["Weak", "Fair", "Good", "Strong"];
  const colors = [
    "bg-destructive",
    "bg-[hsl(40,100%,50%)]",
    "bg-[hsl(90,60%,50%)]",
    "bg-[hsl(140,70%,45%)]",
  ];

  if (!password) return null;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i < strength ? colors[strength - 1] : "bg-white/[0.08]"
            }`}
          />
        ))}
      </div>
      <span className="text-[10px] text-muted-foreground">
        {labels[strength - 1] || "Too short"}
      </span>
    </div>
  );
}

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    date_of_birth: "",
    password: "",
    confirm: "",
  });

  const update = (key: string, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const firstName = form.first_name.trim();
    const lastName = form.last_name.trim();
    const emailRaw = form.email.trim();
    const phoneRaw = form.phone.trim();
    const dateOfBirth = form.date_of_birth.trim();

    if (!firstName) {
      setError("First name is required.");
      return;
    }
    if (!lastName) {
      setError("Last name is required.");
      return;
    }
    if (!phoneRaw) {
      setError("Phone number is required.");
      return;
    }
    const normalizedPhone = normalizePhoneMorocco(phoneRaw);
    if (!normalizedPhone) {
      setError("Invalid phone. Use +212 6 XX XX XX XX or 06 XX XX XX XX.");
      return;
    }
    if (!form.password) {
      setError("Password is required.");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (!form.confirm) {
      setError("Please confirm your password.");
      return;
    }
    if (form.password !== form.confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (!agreed) {
      setError("Please agree to the Terms of Service and Privacy Policy.");
      return;
    }

    const emailForAuth = emailRaw || `ph_${normalizedPhone.replace(/\D/g, "")}@qbox.app`;

    setLoading(true);
    try {
      const supabase = createClient();
      const { error: signUpError } = await supabase.auth.signUp({
        email: emailForAuth,
        password: form.password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            phone: normalizedPhone,
            email: emailRaw || null,
            date_of_birth: dateOfBirth || null,
            role: "client",
          },
        },
      });
      if (signUpError) throw signUpError;
      window.location.href = "/portal";
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong.";
      // Supabase Auth rate limit: show a clear, actionable message
      const isRateLimit =
        /rate limit|too many requests|email rate limit/i.test(message);
      const lang: "en" | "ar" = "en";
      if (isRateLimit) {
        setError(registerT.rateLimitError[lang]);
        return;
      }
      setError(message);
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
        className="relative z-10 w-full max-w-lg px-6 py-12"
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
            <h2 className="text-2xl font-bold text-foreground">
              Join the club
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Create your Q-BOX membership account
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

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  First name <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    required
                    value={form.first_name}
                    onChange={(e) => update("first_name", e.target.value)}
                    placeholder="John"
                    className="h-11 w-full rounded-lg border border-white/[0.08] bg-white/[0.04] pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Last name <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    required
                    value={form.last_name}
                    onChange={(e) => update("last_name", e.target.value)}
                    placeholder="Doe"
                    className="h-11 w-full rounded-lg border border-white/[0.08] bg-white/[0.04] pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
                  />
                </div>
              </div>
            </div>

            {/* Phone — required */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Phone number <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="tel"
                  required
                  value={form.phone}
                  onChange={(e) => update("phone", e.target.value)}
                  placeholder="+212 6 66 12 34 56 or 06 66 12 34 56"
                  className="h-11 w-full rounded-lg border border-white/[0.08] bg-white/[0.04] pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
                />
              </div>
            </div>

            {/* Email — optional */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Email <span className="text-muted-foreground/70">(optional)</span>
              </label>
              <div className="relative">
                <Mail
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  placeholder="your@email.com"
                  className="h-11 w-full rounded-lg border border-white/[0.08] bg-white/[0.04] pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
                />
              </div>
            </div>

            {/* Date of birth — optional */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Date of birth <span className="text-muted-foreground/70">(optional)</span>
              </label>
              <div className="relative">
                <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="date"
                  value={form.date_of_birth}
                  onChange={(e) => update("date_of_birth", e.target.value)}
                  className="h-11 w-full rounded-lg border border-white/[0.08] bg-white/[0.04] pl-10 pr-4 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
                />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Password <span className="text-red-400">*</span> <span className="normal-case text-muted-foreground/80">(min 8 characters)</span>
              </label>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                  value={form.password}
                  onChange={(e) => update("password", e.target.value)}
                  placeholder="Create a strong password"
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
              <PasswordStrength password={form.password} />
            </div>

            {/* Confirm password */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Confirm password <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <input
                  type={showConfirm ? "text" : "password"}
                  required
                  value={form.confirm}
                  onChange={(e) => update("confirm", e.target.value)}
                  placeholder="Repeat your password"
                  className="h-11 w-full rounded-lg border border-white/[0.08] bg-white/[0.04] pl-10 pr-11 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
                {form.confirm && form.password === form.confirm && (
                  <Check
                    size={16}
                    className="absolute right-10 top-1/2 -translate-y-1/2 text-[hsl(140,70%,45%)]"
                  />
                )}
              </div>
            </div>

            {/* Terms */}
            <label className="flex cursor-pointer items-start gap-3">
              <div
                onClick={() => setAgreed(!agreed)}
                className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                  agreed
                    ? "border-primary bg-primary"
                    : "border-white/[0.12] bg-white/[0.04]"
                }`}
              >
                {agreed && (
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
              <span className="text-xs leading-relaxed text-muted-foreground">
                I agree to the{" "}
                <span className="text-primary">Terms of Service</span> and{" "}
                <span className="text-primary">Privacy Policy</span>
              </span>
            </label>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-premium-orange flex h-11 items-center justify-center gap-2 rounded-lg text-sm font-bold uppercase tracking-wider text-primary-foreground disabled:opacity-60"
            >
              {loading ? "Creating…" : "Create Account"}
              <ArrowRight size={16} />
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-primary transition-colors hover:text-primary/80"
            >
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
