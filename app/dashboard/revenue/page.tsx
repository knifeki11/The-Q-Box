"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { DollarSign, TrendingUp, Download, Monitor } from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
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
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-xl">
      <p className="text-muted-foreground">{label}</p>
      <p className="font-semibold text-primary">{payload[0].value.toLocaleString()} MAD</p>
    </div>
  );
}

export default function RevenuePage() {
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly">("daily");
  const [data, setData] = useState<{
    stats: { thisWeek: number; thisMonth: number; avgPerDay: number; avgPerSession: number; weekChange: number; monthChange: number };
    dailyData: { day: string; revenue: number }[];
    weeklyData: { week: string; revenue: number }[];
    monthlyData: { month: string; revenue: number }[];
    breakdown: { category: string; amount: number; percent: number }[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/dashboard/revenue")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Failed to load"))))
      .then((d) => { if (!cancelled) setData(d); })
      .catch((e) => { if (!cancelled) setError(e instanceof Error ? e.message : "Failed"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const chartData = data
    ? period === "daily"
      ? data.dailyData
      : period === "weekly"
        ? data.weeklyData
        : data.monthlyData
    : [];
  const xKey = period === "daily" ? "day" : period === "weekly" ? "week" : "month";

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Revenue</h1>
          <p className="text-sm text-muted-foreground">Loading…</p>
        </div>
        <div className="h-64 animate-pulse rounded-xl border border-border bg-card" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Revenue</h1>
          <p className="text-sm text-muted-foreground">Financial overview</p>
        </div>
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">{error ?? "Failed to load"}</div>
      </div>
    );
  }

  const statsDisplay = [
    { label: "This Week", value: `${data.stats.thisWeek.toLocaleString()} MAD`, change: `${data.stats.weekChange >= 0 ? "+" : ""}${data.stats.weekChange}%`, icon: DollarSign },
    { label: "This Month", value: `${data.stats.thisMonth.toLocaleString()} MAD`, change: `${data.stats.monthChange >= 0 ? "+" : ""}${data.stats.monthChange}%`, icon: TrendingUp },
    { label: "Avg / Day", value: `${data.stats.avgPerDay.toLocaleString()} MAD`, change: "vs period", icon: DollarSign },
    { label: "Avg / Session", value: `${data.stats.avgPerSession.toLocaleString()} MAD`, change: "per session", icon: Monitor },
  ];

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="flex flex-col gap-6"
    >
      {/* Header */}
      <motion.div variants={item} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Revenue</h1>
          <p className="text-sm text-muted-foreground">Financial overview and analytics</p>
        </div>
        <button className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary">
          <Download size={16} />
          Export Report
        </button>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statsDisplay.map((s) => (
          <motion.div
            key={s.label}
            variants={item}
            className="rounded-xl border border-border bg-card p-4"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{s.label}</p>
              <s.icon size={16} className="text-primary" />
            </div>
            <p className="mt-2 text-2xl font-bold text-foreground">{s.value}</p>
            <p className="mt-1 text-xs text-emerald-400">{s.change} vs last period</p>
          </motion.div>
        ))}
      </div>

      {/* Chart */}
      <motion.div variants={item} className="rounded-xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Revenue Trend</h2>
          <div className="flex gap-1 rounded-lg border border-border bg-secondary/50 p-0.5">
            {(["daily", "weekly", "monthly"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`rounded-md px-3 py-1 text-xs font-medium capitalize transition-colors ${
                  period === p ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(24, 100%, 50%)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(24, 100%, 50%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 18%)" />
              <XAxis dataKey={xKey} axisLine={false} tickLine={false} tick={{ fill: "hsl(0, 0%, 60%)", fontSize: 11 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "hsl(0, 0%, 60%)", fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k MAD`} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="revenue" stroke="hsl(24, 100%, 50%)" strokeWidth={2} fill="url(#revGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Breakdown */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <motion.div variants={item} className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-4 text-sm font-semibold text-foreground">Revenue Breakdown</h2>
          <div className="flex flex-col gap-4">
            {data.breakdown.map((b) => (
              <div key={b.category} className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Monitor size={16} className="text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground">{b.category}</span>
                    <span className="text-sm font-semibold text-foreground">{b.amount.toLocaleString()} MAD</span>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${b.percent}%` }} />
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">{b.percent}%</span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div variants={item} className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-4 text-sm font-semibold text-foreground">Daily Revenue (This Week)</h2>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 18%)" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "hsl(0, 0%, 60%)", fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "hsl(0, 0%, 60%)", fontSize: 11 }} tickFormatter={(v) => `${v} MAD`} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="revenue" fill="hsl(24, 100%, 50%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
