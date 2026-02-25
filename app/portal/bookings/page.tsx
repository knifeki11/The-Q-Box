"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Monitor, Calendar, Clock, X, Plus, ArrowRight } from "lucide-react";

const tabs = ["upcoming", "past"] as const;
const DURATION_OPTIONS = [
  { value: 60, label: "1 hour" },
  { value: 120, label: "2 hours" },
  { value: 180, label: "3 hours" },
];

type BookingStatus = "pending" | "confirmed" | "cancelled" | "completed";

type BookingItem = {
  id: string;
  station_id: string;
  station_name: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  game: string | null;
  status: BookingStatus;
};

const CONSOLE_OPTIONS: { value: string; label: string }[] = [
  { value: "standard_ps5", label: "PS5 Standard" },
  { value: "premium_ps5", label: "PS5 Premium" },
  { value: "xbox", label: "Xbox" },
];

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatTimeRange(start: string, end: string): string {
  return `${formatTime(start)} – ${formatTime(end)}`;
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}m` : `${h}H`;
}

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

const statusColors: Record<BookingStatus, string> = {
  confirmed: "bg-[hsl(140,70%,45%)]/10 text-[hsl(140,70%,45%)]",
  pending: "bg-[hsl(40,100%,50%)]/10 text-[hsl(40,100%,50%)]",
  completed: "bg-muted text-muted-foreground",
  cancelled: "bg-destructive/10 text-destructive",
};

export default function BookingsPage() {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("upcoming");
  const [upcoming, setUpcoming] = useState<BookingItem[]>([]);
  const [past, setPast] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [stationType, setStationType] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadBookings = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch("/api/portal/bookings")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load bookings");
        return r.json();
      })
      .then((data) => {
        setUpcoming(data.upcoming ?? []);
        setPast(data.past ?? []);
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "Error loading bookings");
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  const openModal = () => {
    const now = new Date();
    const start = new Date(now);
    start.setMinutes(0, 0, 0);
    if (start.getTime() <= now.getTime()) start.setHours(start.getHours() + 1);
    setDate(toDateInputValue(start));
    setTime(toTimeInputValue(start));
    setDurationMinutes(60);
    setStationType("");
    setFormError(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    if (!submitting) setModalOpen(false);
  };

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!stationType) {
      setFormError("Please choose a console type.");
      return;
    }
    if (!date || !time) {
      setFormError("Please choose date and time.");
      return;
    }
    const [hours, minutes] = time.split(":").map(Number);
    const start = new Date(date);
    start.setHours(hours, minutes, 0, 0);
    if (start.getTime() < Date.now() + 15 * 60 * 1000) {
      setFormError("Start time must be at least 15 minutes from now.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/portal/bookings", {
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
        setFormError(data.error ?? "Failed to create booking");
        return;
      }
      closeModal();
      setActiveTab("upcoming");
      loadBookings();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const list = activeTab === "upcoming" ? upcoming : past;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Bookings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your station reservations
          </p>
        </div>
        <button
          type="button"
          onClick={openModal}
          className="btn-premium-orange flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-bold uppercase tracking-wider text-primary-foreground"
        >
          <Plus size={16} />
          Book Station
        </button>
      </div>

      <div className="flex gap-1 rounded-lg bg-secondary/50 p-1">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`relative flex-1 rounded-md px-4 py-2 text-sm font-medium capitalize transition-colors ${
              activeTab === tab
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {activeTab === tab && (
              <motion.div
                layoutId="booking-tab"
                className="absolute inset-0 rounded-md bg-card shadow-sm"
                transition={{ duration: 0.25 }}
              />
            )}
            <span className="relative z-10">{tab}</span>
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex min-h-[120px] items-center justify-center text-muted-foreground">
          Loading…
        </div>
      ) : list.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          No {activeTab} bookings
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {list.map((booking, i) => (
            <motion.div
              key={booking.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.35 }}
              className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 md:flex-row md:items-center md:justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <Monitor size={22} className="text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">
                      {booking.station_name}
                    </p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        statusColors[booking.status]
                      }`}
                    >
                      {booking.status}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {booking.game ?? "—"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Calendar size={13} />
                  {formatDate(booking.start_time)}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock size={13} />
                  {formatTimeRange(booking.start_time, booking.end_time)}
                </div>
                <span className="rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-foreground">
                  {formatDuration(booking.duration_minutes)}
                </span>
              </div>

              {activeTab === "upcoming" && booking.status !== "cancelled" && (
                <div className="flex gap-2">
                  <button className="flex items-center gap-1 rounded-lg bg-secondary px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary/80">
                    <ArrowRight size={12} />
                    Reschedule
                  </button>
                  <button className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10">
                    <X size={12} />
                    Cancel
                  </button>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4"
            onClick={closeModal}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl"
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-foreground">Book a station</h2>
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={submitting}
                  className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-50"
                >
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSubmitBooking} className="flex flex-col gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Console type
                  </label>
                  <select
                    value={stationType}
                    onChange={(e) => setStationType(e.target.value)}
                    className="h-11 w-full rounded-lg border border-border bg-secondary/50 px-3 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
                    required
                  >
                    <option value="">Select console type</option>
                    {CONSOLE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Date
                    </label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      min={toDateInputValue(new Date())}
                      className="h-11 w-full rounded-lg border border-border bg-secondary/50 px-3 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Time
                    </label>
                    <input
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="h-11 w-full rounded-lg border border-border bg-secondary/50 px-3 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Duration
                  </label>
                  <select
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="h-11 w-full rounded-lg border border-border bg-secondary/50 px-3 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
                  >
                    {DURATION_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                {formError && (
                  <p className="text-sm text-destructive">{formError}</p>
                )}
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={submitting}
                    className="flex-1 rounded-lg border border-border bg-secondary py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary/80 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-premium-orange flex-1 py-2.5 text-sm font-bold uppercase tracking-wider text-primary-foreground disabled:opacity-50"
                  >
                    {submitting ? "Booking…" : "Confirm"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
