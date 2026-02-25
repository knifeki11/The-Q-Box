"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Monitor,
  DollarSign,
  Trophy,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Gamepad2,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] } },
};

function StatCard({
  stat,
}: {
  stat: {
    label: string;
    value: string;
    change: string;
    trend: "up" | "down";
    icon: React.ComponentType<{ size?: number; className?: string }>;
    description: string;
  };
}) {
  return (
    <motion.div
      variants={item}
      className="group relative overflow-hidden rounded-xl border border-border bg-card p-5 transition-all duration-300 hover:border-primary/30"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {stat.label}
          </p>
          <p className="mt-2 text-3xl font-bold text-foreground">{stat.value}</p>
          <div className="mt-1 flex items-center gap-1.5">
            {stat.trend === "up" ? (
              <TrendingUp size={12} className="text-emerald-400" />
            ) : (
              <TrendingDown size={12} className="text-red-400" />
            )}
            <span
              className={`text-xs font-medium ${
                stat.trend === "up" ? "text-emerald-400" : "text-red-400"
              }`}
            >
              {stat.change}
            </span>
            <span className="text-xs text-muted-foreground">{stat.description}</span>
          </div>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <stat.icon size={20} className="text-primary" />
        </div>
      </div>
    </motion.div>
  );
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-xl">
      <p className="text-muted-foreground">{label}</p>
      <p className="font-semibold text-primary">{payload[0].value} MAD</p>
    </div>
  );
}

export default function OverviewPage() {
  const [data, setData] = useState<{
    activePlayersCount: number;
    stationsInUse: number;
    totalStations: number;
    todayRevenue: number;
    revenueChartData: { time: string; revenue: number }[];
    upcomingTournaments: { name: string; date: string; players: string; tier: string }[];
    recentActivity: { text: string; time: string }[];
    alerts: { text: string; type: "warning" | "info" | "success" }[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/dashboard/overview")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Failed to load"))))
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load overview");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Overview</h1>
          <p className="text-sm text-muted-foreground">Loading…</p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl border border-border bg-card" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Overview</h1>
          <p className="text-sm text-muted-foreground">Real-time status</p>
        </div>
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
          {error ?? "Failed to load overview"}
        </div>
      </div>
    );
  }

  const freeStations = data.totalStations - data.stationsInUse;
  const utilization = data.totalStations > 0 ? Math.round((data.stationsInUse / data.totalStations) * 100) : 0;
  const stats = [
    {
      label: "Active Players",
      value: String(data.activePlayersCount),
      change: "Currently playing",
      trend: "up" as const,
      icon: Gamepad2,
      description: "Sessions in progress",
    },
    {
      label: "Stations In Use",
      value: `${data.stationsInUse} / ${data.totalStations}`,
      change: `${freeStations} free`,
      trend: "up" as const,
      icon: Monitor,
      description: `${utilization}% utilization`,
    },
    {
      label: "Today's Revenue",
      value: `${data.todayRevenue.toFixed(0)} MAD`,
      change: "Today",
      trend: "up" as const,
      icon: DollarSign,
      description: "Completed sessions",
    },
  ];

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="flex flex-col gap-6"
    >
      {/* Page header */}
      <motion.div variants={item} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Overview</h1>
          <p className="text-sm text-muted-foreground">
            Real-time status of your Q-BOX Play Lounge
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs text-muted-foreground">
          <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
          Live
        </div>
      </motion.div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <StatCard key={stat.label} stat={stat} />
        ))}
      </div>

      {/* Chart + Upcoming Tournaments */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <motion.div
          variants={item}
          className="col-span-1 rounded-xl border border-border bg-card p-5 lg:col-span-2"
        >
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Today&apos;s Revenue</h2>
              <p className="text-xs text-muted-foreground">Hourly breakdown (MAD)</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.revenueChartData}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(24, 100%, 50%)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(24, 100%, 50%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 18%)" />
                <XAxis
                  dataKey="time"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "hsl(0, 0%, 60%)", fontSize: 11 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "hsl(0, 0%, 60%)", fontSize: 11 }}
                  tickFormatter={(v) => `${v} MAD`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="hsl(24, 100%, 50%)"
                  strokeWidth={2}
                  fill="url(#revenueGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          variants={item}
          className="rounded-xl border border-border bg-card p-5"
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Upcoming Tournaments</h2>
            <Trophy size={16} className="text-primary" />
          </div>
          <div className="flex flex-col gap-3">
            {data.upcomingTournaments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No upcoming tournaments</p>
            ) : (
              data.upcomingTournaments.map((t) => (
                <div
                  key={t.name + t.date}
                  className="rounded-lg border border-border bg-secondary/30 p-3 transition-colors hover:border-primary/20"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground">{t.name}</p>
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        t.tier === "Black"
                          ? "bg-foreground/10 text-foreground"
                          : t.tier === "Gold"
                            ? "bg-amber-500/10 text-amber-400"
                            : "bg-primary/10 text-primary"
                      }`}
                    >
                      {t.tier}
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{t.date}</span>
                    <span>{t.players} players</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <motion.div
          variants={item}
          className="rounded-xl border border-border bg-card p-5"
        >
          <h2 className="mb-4 text-sm font-semibold text-foreground">Recent Activity</h2>
          <div className="flex flex-col gap-3">
            {data.recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent activity</p>
            ) : (
              data.recentActivity.map((a, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary">
                    <Monitor size={14} className="text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-foreground">{a.text}</p>
                  </div>
                  <span className="whitespace-nowrap text-xs text-muted-foreground">{a.time}</span>
                </div>
              ))
            )}
          </div>
        </motion.div>

        <motion.div
          variants={item}
          className="rounded-xl border border-border bg-card p-5"
        >
          <h2 className="mb-4 text-sm font-semibold text-foreground">Alerts</h2>
          <div className="flex flex-col gap-3">
            {data.alerts.map((a, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 rounded-lg border p-3 ${
                  a.type === "warning"
                    ? "border-amber-500/20 bg-amber-500/5"
                    : a.type === "success"
                      ? "border-emerald-500/20 bg-emerald-500/5"
                      : "border-blue-500/20 bg-blue-500/5"
                }`}
              >
                <AlertTriangle
                  size={16}
                  className={
                    a.type === "warning"
                      ? "text-amber-400"
                      : a.type === "success"
                        ? "text-emerald-400"
                        : "text-blue-400"
                  }
                />
                <p className="text-sm text-foreground">{a.text}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
