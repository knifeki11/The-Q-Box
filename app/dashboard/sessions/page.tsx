"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Clock, Monitor, User, DollarSign, CalendarClock, Play, Eye } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface SessionRow {
  id: string;
  player: string;
  station: string;
  game: string;
  status: "active" | "completed" | "reserved";
  startTime: string;
  duration: string;
  payment: number;
  paymentStatus?: "paid" | "unpaid";
}

const sessionsT = {
  paid: { en: "Paid", ar: "مدفوع" },
  unpaid: { en: "Unpaid", ar: "غير مدفوع" },
  paymentStatus: { en: "Payment status", ar: "حالة الدفع" },
  saveChanges: { en: "Save changes", ar: "حفظ التغييرات" },
  saveHint: { en: "Toggle payment status above, then save", ar: "غيّر حالة الدفع أعلاه ثم احفظ" },
  detailTitle: { en: "Session details", ar: "تفاصيل الجلسة" },
  player: { en: "Player", ar: "اللاعب" },
  station: { en: "Station", ar: "المحطة" },
  game: { en: "Game", ar: "اللعبة" },
  startTime: { en: "Start time", ar: "وقت البداية" },
  duration: { en: "Duration", ar: "المدة" },
  payment: { en: "Payment", ar: "الدفع" },
  status: { en: "Status", ar: "الحالة" },
};

const statusConfig = {
  active: { label: "Active", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  completed: { label: "Completed", color: "text-muted-foreground", bg: "bg-secondary", border: "border-border" },
  reserved: { label: "Reserved", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
};

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

export default function SessionsPage() {
  const [tab, setTab] = useState<"active" | "reserved" | "completed">("active");
  const [data, setData] = useState<{
    active: SessionRow[];
    completed: SessionRow[];
    reserved: SessionRow[];
    totalActiveRevenue: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [pendingPayment, setPendingPayment] = useState<Record<string, "paid" | "unpaid">>({});
  const [saving, setSaving] = useState(false);
  const [detailSession, setDetailSession] = useState<SessionRow | null>(null);
  const lang: "en" | "ar" = "en";

  const fetchSessions = useCallback(async (background = false) => {
    if (!background) setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/dashboard/sessions");
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      const json = await res.json();
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load sessions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions(refreshTrigger > 0);
  }, [fetchSessions, refreshTrigger]);

  const activeSessions = data?.active ?? [];
  const completedSessions = data?.completed ?? [];
  const reservedSessions = data?.reserved ?? [];
  const totalActiveRevenue = data?.totalActiveRevenue ?? 0;

  const filtered =
    tab === "active"
      ? activeSessions
      : tab === "reserved"
        ? reservedSessions
        : completedSessions;

  const pendingCount = Object.keys(pendingPayment).length;
  const handleSavePaymentChanges = async () => {
    if (pendingCount === 0) return;
    setSaving(true);
    try {
      await Promise.all(
        Object.entries(pendingPayment).map(([id, payment_status]) =>
          fetch(`/api/dashboard/sessions/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ payment_status }),
          }).then((r) => {
            if (!r.ok) throw new Error("Failed to update");
            return r.json();
          })
        )
      );
      setPendingPayment({});
      setRefreshTrigger((t) => t + 1);
      toast.success(lang === "ar" ? "تم حفظ التغييرات" : "Changes saved");
    } catch {
      toast.error(lang === "ar" ? "فشل الحفظ" : "Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Sessions and Bookings</h1>
          <p className="text-sm text-muted-foreground">Track gameplay sessions and reservations</p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl border border-border bg-card" />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-xl border border-border bg-card" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Sessions and Bookings</h1>
          <p className="text-sm text-muted-foreground">Track gameplay sessions and reservations</p>
        </div>
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
          {error}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="flex flex-col gap-6"
    >
      {/* Header */}
      <motion.div variants={item} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Sessions and Bookings</h1>
          <p className="text-sm text-muted-foreground">Track gameplay sessions and reservations</p>
        </div>
      </motion.div>

      {/* Quick stats */}
      <motion.div variants={item} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10">
              <Play size={16} className="text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Active Sessions</p>
              <p className="text-xl font-bold text-foreground">{activeSessions.length}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10">
              <CalendarClock size={16} className="text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Upcoming Reservations</p>
              <p className="text-xl font-bold text-foreground">{reservedSessions.length}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <DollarSign size={16} className="text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Active Revenue</p>
              <p className="text-xl font-bold text-foreground">{totalActiveRevenue.toFixed(0)} MAD</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div variants={item} className="flex gap-1 rounded-lg border border-border bg-card p-1">
        {(["active", "reserved", "completed"] as const).map((t) => {
          const count =
            t === "active"
              ? activeSessions.length
              : t === "reserved"
                ? reservedSessions.length
                : completedSessions.length;
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 rounded-md px-4 py-2 text-sm font-medium capitalize transition-colors ${
                tab === t ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t} ({count})
            </button>
          );
        })}
      </motion.div>

      {/* Sessions table */}
      <motion.div variants={item} className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {["Player", "Station", "Game", "Start Time", "Duration", "Payment", "Status", ""].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No {tab} sessions
                  </td>
                </tr>
              ) : (
                filtered.map((session) => {
                  const sc = statusConfig[session.status];
                  return (
                    <tr
                      key={session.id}
                      className="border-b border-border/50 transition-colors hover:bg-secondary/30"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <User size={14} className="text-muted-foreground" />
                          <span className="text-sm font-medium text-foreground">{session.player}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Monitor size={14} className="text-muted-foreground" />
                          <span className="text-sm text-foreground">{session.station}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-foreground">{session.game}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{session.startTime}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <Clock size={12} className="text-muted-foreground" />
                          <span className="text-sm text-foreground">{session.duration}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1.5">
                          <span className="text-sm font-medium text-foreground">
                            {session.payment.toFixed(0)} MAD
                          </span>
                          {tab === "completed" && "paymentStatus" in session && (
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={
                                  (pendingPayment[session.id] ??
                                    (session.paymentStatus ?? "unpaid")) === "paid"
                                }
                                onCheckedChange={(checked) => {
                                  const next = checked ? "paid" : "unpaid";
                                  const original = session.paymentStatus ?? "unpaid";
                                  setPendingPayment((prev) => {
                                    if (next === original) {
                                      const { [session.id]: _, ...rest } = prev;
                                      return rest;
                                    }
                                    return { ...prev, [session.id]: next };
                                  });
                                }}
                              />
                              <span className="text-xs text-muted-foreground">
                                {(pendingPayment[session.id] ?? session.paymentStatus ?? "unpaid") === "paid"
                                  ? sessionsT.paid[lang]
                                  : sessionsT.unpaid[lang]}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${sc.color} ${sc.bg}`}>
                          {sc.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => setDetailSession(session)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                          aria-label="View details"
                        >
                          <Eye size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      <Dialog open={!!detailSession} onOpenChange={(open) => !open && setDetailSession(null)}>
        <DialogContent className="border-white/[0.08] bg-card shadow-2xl backdrop-blur-xl sm:rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {sessionsT.detailTitle[lang]}
            </DialogTitle>
          </DialogHeader>
          {detailSession && (
            <div className="grid gap-4 py-2">
              <div className="grid gap-1">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {sessionsT.player[lang]}
                </p>
                <p className="text-sm font-medium text-foreground">{detailSession.player}</p>
              </div>
              <div className="grid gap-1">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {sessionsT.station[lang]}
                </p>
                <p className="text-sm font-medium text-foreground">{detailSession.station}</p>
              </div>
              <div className="grid gap-1">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {sessionsT.game[lang]}
                </p>
                <p className="text-sm font-medium text-foreground">{detailSession.game || "—"}</p>
              </div>
              <div className="grid gap-1">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {sessionsT.startTime[lang]}
                </p>
                <p className="text-sm font-medium text-foreground">{detailSession.startTime}</p>
              </div>
              <div className="grid gap-1">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {sessionsT.duration[lang]}
                </p>
                <p className="text-sm font-medium text-foreground">{detailSession.duration}</p>
              </div>
              <div className="grid gap-1">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {sessionsT.payment[lang]}
                </p>
                <p className="text-sm font-medium text-foreground">
                  {detailSession.payment.toFixed(0)} MAD
                </p>
              </div>
              {"paymentStatus" in detailSession && (
                <div className="grid gap-1">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {sessionsT.paymentStatus[lang]}
                  </p>
                  <p className="text-sm font-medium text-foreground">
                    {detailSession.paymentStatus === "paid"
                      ? sessionsT.paid[lang]
                      : sessionsT.unpaid[lang]}
                  </p>
                </div>
              )}
              <div className="grid gap-1">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {sessionsT.status[lang]}
                </p>
                <span
                  className={`inline-flex w-fit rounded-full px-2 py-0.5 text-xs font-medium ${
                    statusConfig[detailSession.status].color
                  } ${statusConfig[detailSession.status].bg}`}
                >
                  {statusConfig[detailSession.status].label}
                </span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Save payment changes bar (completed tab only) — below table so it stays visible */}
      {tab === "completed" && (
        <motion.div
          variants={item}
          className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3"
        >
          <span className="text-sm text-muted-foreground">
            {pendingCount > 0
              ? `${pendingCount} ${pendingCount === 1 ? "session" : "sessions"} with unsaved payment status`
              : sessionsT.saveHint[lang]}
          </span>
          <button
            onClick={handleSavePaymentChanges}
            disabled={saving || pendingCount === 0}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "…" : sessionsT.saveChanges[lang]}
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}
