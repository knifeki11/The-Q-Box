"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Monitor,
  Gift,
  Trophy,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
} from "lucide-react";

type ActivityType = "session" | "reward" | "tournament";

type ActivityItem = {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  date: string;
  points?: number;
  pointsType?: "earned" | "spent";
};

const typeIcons: Record<ActivityType, typeof Monitor> = {
  session: Monitor,
  reward: Gift,
  tournament: Trophy,
};

const typeColors: Record<ActivityType, string> = {
  session: "bg-primary/10 text-primary",
  reward: "bg-[hsl(280,60%,60%)]/10 text-[hsl(280,60%,60%)]",
  tournament: "bg-[hsl(140,70%,45%)]/10 text-[hsl(140,70%,45%)]",
};

const filterOptions: Array<{ value: ActivityType | "all"; label: string }> = [
  { value: "all", label: "All" },
  { value: "session", label: "Sessions" },
  { value: "reward", label: "Rewards" },
  { value: "tournament", label: "Tournaments" },
];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function ActivityPage() {
  const [filter, setFilter] = useState<ActivityType | "all">("all");
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [totalSessions, setTotalSessions] = useState(0);
  const [totalEarned, setTotalEarned] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch("/api/portal/activity")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load activity");
        return r.json();
      })
      .then((data) => {
        if (cancelled) return;
        setActivities(data.activities ?? []);
        setTotalSessions(data.total_sessions ?? 0);
        setTotalEarned(data.total_earned ?? 0);
        setTotalSpent(data.total_spent ?? 0);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Error loading activity");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered =
    filter === "all" ? activities : activities.filter((a) => a.type === filter);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Activity</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your complete membership activity history
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <span className="text-xs text-muted-foreground">Total Sessions</span>
          <p className="mt-1 text-2xl font-bold text-foreground">
            {loading ? "…" : totalSessions}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <span className="text-xs text-muted-foreground">Points Earned</span>
          <p className="mt-1 text-2xl font-bold text-primary">
            {loading ? "…" : `+${totalEarned}`}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <span className="text-xs text-muted-foreground">Points Spent</span>
          <p className="mt-1 text-2xl font-bold text-foreground">
            {loading ? "…" : `-${totalSpent}`}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Filter size={14} className="text-muted-foreground" />
        <div className="flex gap-1.5">
          {filterOptions.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                filter === f.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex min-h-[120px] items-center justify-center text-muted-foreground">
          Loading…
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          No activity yet
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((activity, i) => {
            const Icon = typeIcons[activity.type];
            const colorClass = typeColors[activity.type];
            return (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, duration: 0.3 }}
                className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg ${colorClass}`}
                  >
                    <Icon size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {activity.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {activity.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-muted-foreground">
                    {formatDate(activity.date)}
                  </span>
                  {activity.points != null && activity.pointsType && (
                    <div
                      className={`flex items-center gap-0.5 text-sm font-bold ${
                        activity.pointsType === "earned"
                          ? "text-primary"
                          : "text-muted-foreground"
                      }`}
                    >
                      {activity.pointsType === "earned" ? (
                        <ArrowUpRight size={14} />
                      ) : (
                        <ArrowDownRight size={14} />
                      )}
                      {activity.pointsType === "earned" ? "+" : "-"}
                      {activity.points}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
