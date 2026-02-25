"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Calendar, Clock, Monitor, Loader2, Check, ArrowRight } from "lucide-react";

const HeroScene = dynamic(() => import("@/components/hero-scene"), {
  ssr: false,
});

const CONSOLE_OPTIONS: { value: string; label: string }[] = [
  { value: "standard_ps5", label: "PS5 Standard" },
  { value: "premium_ps5", label: "PS5 Premium" },
  { value: "xbox", label: "Xbox" },
];

const DURATION_OPTIONS = [
  { value: 60, label: "1 hour" },
  { value: 120, label: "2 hours" },
  { value: 180, label: "3 hours" },
];

function toDateInputValue(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function toTimeInputValue(d: Date): string {
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

function getDefaultStart(): Date {
  const now = new Date();
  const start = new Date(now);
  start.setMinutes(0, 0, 0);
  if (start.getTime() <= now.getTime()) start.setHours(start.getHours() + 1);
  return start;
}

export default function BookPage() {
  const [date, setDate] = useState(() => toDateInputValue(getDefaultStart()));
  const [time, setTime] = useState(() => toTimeInputValue(getDefaultStart()));
  const [stationType, setStationType] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ station_name: string; start_time: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!date || !time) {
      setError("Please choose date and time.");
      return;
    }
    if (!stationType) {
      setError("Please choose a console type.");
      return;
    }
    const [hours, minutes] = time.split(":").map(Number);
    const start = new Date(date);
    start.setHours(hours, minutes, 0, 0);
    if (start.getTime() < Date.now() + 15 * 60 * 1000) {
      setError("Start time must be at least 15 minutes from now.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          station_type: stationType,
          start_time: start.toISOString(),
          duration_minutes: durationMinutes,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Booking failed");
        return;
      }
      setSuccess({
        station_name: data.station_name ?? "Station",
        start_time: data.start_time ?? start.toISOString(),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Booking failed");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    const startDate = new Date(success.start_time);
    const dateStr = startDate.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    const timeStr = startDate.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <HeroScene />
        </div>
        <div className="pointer-events-none absolute inset-0 bg-background/50 backdrop-blur-[2px]" />
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 w-full max-w-md px-6"
        >
          <div className="mb-8 flex justify-center">
            <Link href="/">
              <Image
                src="/images/QBOX_logo_upscaled.png"
                alt="Q-BOX Play Lounge"
                width={200}
                height={88}
                className="h-20 w-auto object-contain"
              />
            </Link>
          </div>
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-8 shadow-2xl backdrop-blur-xl">
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-primary/20">
              <Check size={28} className="text-primary" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Booking confirmed</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Your session is reserved at <span className="font-medium text-foreground">{success.station_name}</span> on{" "}
              {dateStr} at {timeStr}.
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              If you were logged in, you can view it in your portal under Bookings.
            </p>
            <div className="mt-6 flex flex-col gap-2">
              <Link
                href="/portal/bookings"
                className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                My Bookings
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/book"
                className="text-center text-sm text-muted-foreground underline hover:text-foreground"
              >
                Book another
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden py-12">
      <div className="absolute inset-0">
        <HeroScene />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-background/50 backdrop-blur-[2px]" />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="relative z-10 w-full max-w-md px-6"
      >
        <div className="mb-8 flex justify-center">
          <Link href="/">
            <Image
              src="/images/QBOX_logo_upscaled.png"
              alt="Q-BOX Play Lounge"
              width={200}
              height={88}
              className="h-20 w-auto object-contain"
            />
          </Link>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-8 shadow-2xl backdrop-blur-xl">
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-bold text-foreground">Book a station</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Choose date, time, and console. Logged in? Your booking will appear in your portal.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {error && (
              <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Date
                </label>
                <div className="relative">
                  <Calendar
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    min={toDateInputValue(new Date())}
                    className="h-11 w-full rounded-lg border border-white/[0.08] bg-white/[0.04] pl-10 pr-4 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
                    required
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Time
                </label>
                <div className="relative">
                  <Clock
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="h-11 w-full rounded-lg border border-white/[0.08] bg-white/[0.04] pl-10 pr-4 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Console
              </label>
              <div className="relative">
                <Monitor
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <select
                  value={stationType}
                  onChange={(e) => setStationType(e.target.value)}
                  className="h-11 w-full appearance-none rounded-lg border border-white/[0.08] bg-white/[0.04] pl-10 pr-10 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
                  required
                >
                  <option value="">Select console</option>
                  {CONSOLE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Duration
              </label>
              <select
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="h-11 w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-4 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
              >
                {DURATION_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex h-12 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-bold uppercase tracking-wider text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  Confirm booking
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
