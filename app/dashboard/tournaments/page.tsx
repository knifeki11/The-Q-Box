"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Trophy, Plus, Users, DollarSign, Calendar, Clock, Filter, MoreVertical, Pencil } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface Tournament {
  id: string;
  name: string;
  game: string;
  status: "upcoming" | "ongoing" | "completed";
  cardEligibility: string;
  entryFeeMad: number;
  prize: string | null;
  maxParticipants: number;
  participants: number;
  startsAt: string;
}

const statusConfig = {
  upcoming: { label: "Upcoming", color: "text-blue-400", bg: "bg-blue-500/10" },
  ongoing: { label: "Live", color: "text-emerald-400", bg: "bg-emerald-500/10" },
  completed: { label: "Completed", color: "text-muted-foreground", bg: "bg-secondary" },
};

const cardConfig: Record<string, { color: string; bg: string }> = {
  all: { color: "text-primary", bg: "bg-primary/10" },
  silver: { color: "text-zinc-400", bg: "bg-zinc-500/10" },
  gold: { color: "text-amber-400", bg: "bg-amber-500/10" },
  black: { color: "text-foreground", bg: "bg-foreground/10" },
};

function formatTournamentDate(startsAt: string): { date: string; time: string } {
  const d = new Date(startsAt);
  const date = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  return { date, time };
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

const CARD_ELIGIBILITY_OPTIONS = [
  { value: "all", label: "All Cards" },
  { value: "silver", label: "Silver Only" },
  { value: "gold", label: "Gold Only" },
  { value: "black", label: "Black Only" },
];

const STATUS_OPTIONS = [
  { value: "upcoming", label: "Upcoming" },
  { value: "ongoing", label: "Ongoing" },
  { value: "completed", label: "Completed" },
];

const defaultForm = {
  name: "",
  game: "",
  status: "upcoming" as const,
  card_eligibility: "all" as const,
  entry_fee_mad: 0,
  prize: "",
  max_participants: 16,
  starts_at: "",
};

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [editingTournament, setEditingTournament] = useState<Tournament | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);

  const fetchTournaments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/dashboard/tournaments");
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setTournaments(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load tournaments");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTournaments();
  }, [fetchTournaments]);

  const filtered = tournaments.filter(
    (t) => filterStatus === "all" || t.status === filterStatus
  );

  const openCreate = () => {
    setEditingTournament(null);
    const now = new Date();
    now.setMinutes(0, 0, 0);
    if (now.getHours() < 8) now.setHours(8);
    const iso = now.toISOString().slice(0, 16);
    setForm({
      ...defaultForm,
      starts_at: iso,
    });
    setCreateOpen(true);
  };

  const openEdit = (t: Tournament) => {
    const startsAtLocal = t.startsAt ? new Date(t.startsAt).toISOString().slice(0, 16) : "";
    setForm({
      name: t.name,
      game: t.game,
      status: t.status,
      card_eligibility: t.cardEligibility as "all" | "silver" | "gold" | "black",
      entry_fee_mad: t.entryFeeMad,
      prize: t.prize ?? "",
      max_participants: t.maxParticipants,
      starts_at: startsAtLocal,
    });
    setEditingTournament(t);
    setCreateOpen(true);
  };

  const handleSave = async () => {
    const name = form.name.trim();
    const game = form.game.trim();
    if (!name) {
      toast.error("Tournament name is required");
      return;
    }
    if (!game) {
      toast.error("Game name is required");
      return;
    }
    if (!form.starts_at) {
      toast.error("Start date and time is required");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name,
        game,
        status: form.status,
        card_eligibility: form.card_eligibility,
        entry_fee_mad: form.entry_fee_mad,
        prize: form.prize.trim() || null,
        max_participants: form.max_participants,
        starts_at: new Date(form.starts_at).toISOString(),
      };
      if (editingTournament) {
        const res = await fetch(`/api/dashboard/tournaments/${editingTournament.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || "Failed to update");
        }
        toast.success("Tournament updated");
      } else {
        const res = await fetch("/api/dashboard/tournaments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || "Failed to create");
        }
        toast.success("Tournament created");
      }
      setCreateOpen(false);
      setEditingTournament(null);
      await fetchTournaments();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save tournament");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tournaments</h1>
          <p className="text-sm text-muted-foreground">Loading…</p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 animate-pulse rounded-xl border border-border bg-card" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tournaments</h1>
          <p className="text-sm text-muted-foreground">Total tournaments</p>
        </div>
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">{error}</div>
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
      <motion.div variants={item} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tournaments</h1>
          <p className="text-sm text-muted-foreground">{tournaments.length} total tournaments</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Plus size={16} />
          Create Tournament
        </button>
      </motion.div>

      <motion.div variants={item} className="flex items-center gap-2">
        <Filter size={14} className="text-muted-foreground" />
        {["all", "upcoming", "ongoing", "completed"].map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
              filterStatus === s ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            {s === "all" ? "All" : s}
          </button>
        ))}
      </motion.div>

      {filtered.length === 0 ? (
        <motion.div
          variants={item}
          className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/50 py-16 text-center"
        >
          <Trophy size={40} className="text-muted-foreground/50" />
          <p className="mt-3 text-sm font-medium text-foreground">
            {tournaments.length === 0 ? "No tournaments yet" : "No tournaments match this filter"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {tournaments.length === 0 ? "Create your first tournament to get started." : "Try another filter."}
          </p>
          {tournaments.length === 0 && (
            <button
              onClick={openCreate}
              className="mt-4 flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              <Plus size={16} />
              Create Tournament
            </button>
          )}
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((t) => {
            const sc = statusConfig[t.status] ?? statusConfig.upcoming;
            const cc = cardConfig[t.cardEligibility] ?? cardConfig.all;
            const { date, time } = formatTournamentDate(t.startsAt);
            const prizeDisplay = t.prize || `${t.entryFeeMad} MAD`;
            return (
              <motion.div
                key={t.id}
                variants={item}
                className="group relative overflow-hidden rounded-xl border border-border bg-card p-5 transition-all duration-300 hover:border-primary/30"
              >
                <div className="absolute right-3 top-3 flex items-center gap-2">
                  {t.status === "ongoing" && (
                    <div className="flex items-center gap-1.5">
                      <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Live</span>
                    </div>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                        aria-label="Tournament options"
                      >
                        <MoreVertical size={16} />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="min-w-[10rem]">
                      <DropdownMenuItem onClick={() => openEdit(t)}>
                        <Pencil size={14} className="mr-2" />
                        Edit
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Trophy size={18} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">{t.name}</h3>
                    <p className="text-xs text-muted-foreground">{t.game}</p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar size={12} />
                    <span>{date}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock size={12} />
                    <span>{time}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Users size={12} />
                    <span>{t.participants}/{t.maxParticipants}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <DollarSign size={12} />
                    <span>{t.entryFeeMad} MAD entry</span>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${sc.color} ${sc.bg}`}>
                      {sc.label}
                    </span>
                    <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${cc.color} ${cc.bg}`}>
                      {t.cardEligibility === "all" ? "All Cards" : `${t.cardEligibility.charAt(0).toUpperCase() + t.cardEligibility.slice(1)} Only`}
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-primary">{prizeDisplay}</span>
                </div>

                <div className="mt-3">
                  <div className="h-1 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${t.maxParticipants > 0 ? (t.participants / t.maxParticipants) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={(open) => { if (!open) setEditingTournament(null); setCreateOpen(open); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto border-white/[0.08] bg-card sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingTournament ? "Edit Tournament" : "Create Tournament"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Tournament name *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="e.g. FIFA Pro Cup"
                className="h-10 rounded-lg border border-border bg-secondary/50 px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Game *</label>
              <input
                type="text"
                value={form.game}
                onChange={(e) => setForm((p) => ({ ...p, game: e.target.value }))}
                placeholder="e.g. FC 25"
                className="h-10 rounded-lg border border-border bg-secondary/50 px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Start date and time *</label>
              <input
                type="datetime-local"
                value={form.starts_at}
                onChange={(e) => setForm((p) => ({ ...p, starts_at: e.target.value }))}
                className="h-10 rounded-lg border border-border bg-secondary/50 px-3 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as "upcoming" | "ongoing" | "completed" }))}
                  className="h-10 rounded-lg border border-border bg-secondary/50 px-3 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
                >
                  {STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">Card eligibility</label>
                <select
                  value={form.card_eligibility}
                  onChange={(e) => setForm((p) => ({ ...p, card_eligibility: e.target.value as "all" | "silver" | "gold" | "black" }))}
                  className="h-10 rounded-lg border border-border bg-secondary/50 px-3 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
                >
                  {CARD_ELIGIBILITY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">Entry fee (MAD)</label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={form.entry_fee_mad || ""}
                  onChange={(e) => setForm((p) => ({ ...p, entry_fee_mad: Math.max(0, parseInt(e.target.value, 10) || 0) }))}
                  className="h-10 rounded-lg border border-border bg-secondary/50 px-3 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">Max participants</label>
                <input
                  type="number"
                  min={1}
                  value={form.max_participants}
                  onChange={(e) => setForm((p) => ({ ...p, max_participants: Math.max(1, parseInt(e.target.value, 10) || 1) }))}
                  className="h-10 rounded-lg border border-border bg-secondary/50 px-3 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Prize (optional)</label>
              <input
                type="text"
                value={form.prize}
                onChange={(e) => setForm((p) => ({ ...p, prize: e.target.value }))}
                placeholder="e.g. 200 pts or 500 MAD"
                className="h-10 rounded-lg border border-border bg-secondary/50 px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <button
              type="button"
              onClick={() => setCreateOpen(false)}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {saving
                ? (editingTournament ? "Saving…" : "Creating…")
                : (editingTournament ? "Save" : "Create Tournament")}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
