"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Trophy,
  Calendar,
  Users,
  CreditCard,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
} from "lucide-react";
import { usePortalMe } from "@/app/portal/portal-me-context";

const tierRank: Record<string, number> = { silver: 0, grey: 0, gold: 1, black: 2 };
const filters = ["all", "eligible", "registered"] as const;

type UpcomingTournament = {
  id: string;
  name: string;
  game: string;
  status: string;
  card_eligibility: string;
  entry_fee_mad: number;
  prize: string | null;
  max_participants: number;
  participants: number;
  starts_at: string;
  registered: boolean;
};

type PastTournament = {
  id: string;
  name: string;
  game: string;
  starts_at: string;
  status: string;
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
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

function entryFeeDisplay(entryFeeMad: number, cardEligibility: string): string {
  if (entryFeeMad === 0) return "Free";
  return `${entryFeeMad} MAD`;
}

export default function TournamentsPage() {
  const { data: me } = usePortalMe();
  const [filter, setFilter] = useState<(typeof filters)[number]>("all");
  const [upcoming, setUpcoming] = useState<UpcomingTournament[]>([]);
  const [past, setPast] = useState<PastTournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [registeringId, setRegisteringId] = useState<string | null>(null);

  const userTier = me?.profile?.card_tier_id ?? "silver";

  const loadTournaments = () => {
    setLoading(true);
    setError(null);
    fetch("/api/portal/tournaments")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load tournaments");
        return r.json();
      })
      .then((data) => {
        setUpcoming(data.upcoming ?? []);
        setPast(data.past ?? []);
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "Error loading tournaments");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadTournaments();
  }, []);

  const handleRegister = async (tournamentId: string) => {
    setRegisteringId(tournamentId);
    try {
      const r = await fetch(`/api/portal/tournaments/${tournamentId}/register`, {
        method: "POST",
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error ?? "Failed to register");
      loadTournaments();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to register");
    } finally {
      setRegisteringId(null);
    }
  };

  const filtered = upcoming.filter((t) => {
    const eligible =
      tierRank[userTier] >= tierRank[t.card_eligibility === "all" ? "silver" : t.card_eligibility];
    if (filter === "eligible") return eligible;
    if (filter === "registered") return t.registered;
    return true;
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Tournaments</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Compete, earn points, and climb the ranks
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="flex gap-2">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-all ${
              filter === f
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex min-h-[120px] items-center justify-center text-muted-foreground">
          Loading…
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          No tournaments match the filter
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filtered.map((tournament, i) => {
            const eligible =
              tierRank[userTier] >=
              tierRank[tournament.card_eligibility === "all" ? "silver" : tournament.card_eligibility];
            return (
              <motion.div
                key={tournament.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, duration: 0.4 }}
                className={`rounded-xl border bg-card p-5 transition-all ${
                  eligible
                    ? "border-border hover:border-primary/30"
                    : "border-border/50 opacity-60"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-foreground">
                        {tournament.name}
                      </h3>
                      {tournament.registered && (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                          Registered
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {tournament.game}
                    </p>
                  </div>
                  <Trophy
                    size={20}
                    className={
                      tournament.status === "upcoming" || tournament.status === "ongoing"
                        ? "text-primary"
                        : "text-muted-foreground"
                    }
                  />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar size={13} />
                    {formatDate(tournament.starts_at)}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock size={13} />
                    {formatTime(tournament.starts_at)}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <CreditCard size={13} />
                    {entryFeeDisplay(tournament.entry_fee_mad, tournament.card_eligibility)}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Users size={13} />
                    {tournament.participants}/{tournament.max_participants} spots
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between rounded-lg bg-secondary/30 px-3 py-2">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Prize Pool
                  </span>
                  <span className="text-xs font-bold text-primary">
                    {tournament.prize ?? "—"}
                  </span>
                </div>

                <div className="mt-4">
                  {tournament.registered ? (
                    <div className="flex items-center justify-center gap-1.5 rounded-lg bg-primary/10 py-2 text-xs font-bold text-primary">
                      <CheckCircle2 size={14} />
                      You are registered
                    </div>
                  ) : !eligible ? (
                    <div className="flex items-center justify-center gap-1.5 rounded-lg bg-secondary py-2 text-xs text-muted-foreground">
                      <XCircle size={14} />
                      Requires {tournament.card_eligibility} tier
                    </div>
                  ) : tournament.status === "completed" ? (
                    <div className="flex items-center justify-center gap-1.5 rounded-lg bg-secondary py-2 text-xs text-muted-foreground">
                      Registration closed
                    </div>
                  ) : tournament.participants >= tournament.max_participants ? (
                    <div className="flex items-center justify-center gap-1.5 rounded-lg bg-secondary py-2 text-xs text-muted-foreground">
                      Full
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={registeringId === tournament.id}
                      onClick={() => handleRegister(tournament.id)}
                      className="btn-premium-orange flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold uppercase tracking-wider text-primary-foreground disabled:opacity-50"
                    >
                      {registeringId === tournament.id ? "…" : "Register Now"}
                      <ArrowRight size={14} />
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="mb-4 text-sm font-semibold text-foreground">
          Past Participation
        </h3>
        {past.length === 0 ? (
          <p className="text-sm text-muted-foreground">No past tournaments yet</p>
        ) : (
          <div className="flex flex-col gap-2">
            {past.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between rounded-lg bg-secondary/30 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {t.game} – {formatDate(t.starts_at)}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">Participated</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
