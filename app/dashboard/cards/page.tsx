"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { CreditCard, Star, Crown, Settings, ChevronRight } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

type TierId = "silver" | "gold" | "black";

interface DistributionItem {
  id: string;
  name: string;
  fullName: string;
  count: number;
  percent: number;
  color: string;
}

interface TierDetail {
  id: string;
  name: string;
  members: number;
  percent: number;
  pointsMultiplier: string;
  requirements: string;
  privileges: string[];
}

interface PointsConfig {
  pointsPerHourPlayed: number;
  tournamentWinBonus: number;
  birthdayBonus: number;
  yearlyBonus: number;
}

interface CardsData {
  distribution: DistributionItem[];
  tierDetails: TierDetail[];
  totalMembers: number;
  pointsConfig?: PointsConfig;
}

const tierStyle: Record<TierId, { icon: typeof CreditCard; gradient: string; border: string; textColor: string; bg: string }> = {
  silver: {
    icon: CreditCard,
    gradient: "from-zinc-600 to-zinc-800",
    border: "border-zinc-500/30",
    textColor: "text-zinc-300",
    bg: "bg-zinc-500/10",
  },
  gold: {
    icon: Star,
    gradient: "from-amber-500 to-amber-700",
    border: "border-amber-500/30",
    textColor: "text-amber-400",
    bg: "bg-amber-500/10",
  },
  black: {
    icon: Crown,
    gradient: "from-foreground/80 to-foreground/40",
    border: "border-foreground/20",
    textColor: "text-foreground",
    bg: "bg-foreground/10",
  },
};

const POINTS_CONFIG_KEYS: { key: keyof PointsConfig; label: string }[] = [
  { key: "pointsPerHourPlayed", label: "Points per hour played" },
  { key: "tournamentWinBonus", label: "Tournament win bonus" },
  { key: "birthdayBonus", label: "Birthday bonus" },
  { key: "yearlyBonus", label: "Yearly bonus (each year after signup)" },
];

const defaultPointsConfig: PointsConfig = {
  pointsPerHourPlayed: 10,
  tournamentWinBonus: 500,
  birthdayBonus: 1000,
  yearlyBonus: 500,
};

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

function CustomPieTooltip({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number }> }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-xl">
      <p className="font-semibold text-foreground">{payload[0].name} Card</p>
      <p className="text-muted-foreground">{payload[0].value} members</p>
    </div>
  );
}

export default function CardsPage() {
  const [data, setData] = useState<CardsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editRulesOpen, setEditRulesOpen] = useState(false);
  const [editForm, setEditForm] = useState<PointsConfig>(defaultPointsConfig);
  const [saving, setSaving] = useState(false);

  const fetchCards = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/dashboard/cards");
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      const json = await res.json();
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load cards data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  const openEditRules = () => {
    const pc = data?.pointsConfig ?? defaultPointsConfig;
    setEditForm({ ...pc });
    setEditRulesOpen(true);
  };

  const handleSavePointsConfig = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/dashboard/points-config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to save");
      }
      toast.success("Points configuration saved");
      setEditRulesOpen(false);
      await fetchCards();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const pointsConfig = data?.pointsConfig ?? defaultPointsConfig;
  const pieData = (data?.distribution ?? []).map((d) => ({ name: d.name, value: d.count, color: d.color }));

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Cards and Points</h1>
          <p className="text-sm text-muted-foreground">Manage membership tiers and points system</p>
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="h-64 animate-pulse rounded-xl border border-border bg-card lg:col-span-1" />
          <div className="h-64 animate-pulse rounded-xl border border-border bg-card lg:col-span-2" />
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 animate-pulse rounded-xl border border-border bg-card" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Cards and Points</h1>
          <p className="text-sm text-muted-foreground">Manage membership tiers and points system</p>
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
      <motion.div variants={item} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Cards and Points</h1>
          <p className="text-sm text-muted-foreground">Manage membership tiers and points system</p>
        </div>
        <button
          onClick={openEditRules}
          className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
        >
          <Settings size={16} />
          Edit Rules
        </button>
      </motion.div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <motion.div variants={item} className="rounded-xl border border-border bg-card p-5 lg:col-span-1">
          <h2 className="mb-4 text-sm font-semibold text-foreground">Tier Distribution</h2>
          <div className="h-48">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No members yet</div>
            )}
          </div>
          <div className="mt-2 flex justify-center gap-4">
            {pieData.map((d) => (
              <div key={d.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <div className="h-2.5 w-2.5 rounded-full" style={{ background: d.color }} />
                {d.name}
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div variants={item} className="rounded-xl border border-border bg-card p-5 lg:col-span-2">
          <h2 className="mb-4 text-sm font-semibold text-foreground">Points Configuration</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {POINTS_CONFIG_KEYS.map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 px-4 py-3">
                <span className="text-sm text-muted-foreground">{label}</span>
                <span className="text-sm font-semibold text-foreground">{pointsConfig[key].toLocaleString()} pts</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <Dialog open={editRulesOpen} onOpenChange={setEditRulesOpen}>
        <DialogContent className="border-white/[0.08] bg-card sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Points Configuration</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            {POINTS_CONFIG_KEYS.map(({ key, label }) => (
              <div key={key} className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">{label}</label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={editForm[key]}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, [key]: Math.max(0, parseInt(e.target.value, 10) || 0) }))
                  }
                  className="h-10 rounded-lg border border-border bg-secondary/50 px-3 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
                />
              </div>
            ))}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <button
              type="button"
              onClick={() => setEditRulesOpen(false)}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSavePointsConfig}
              disabled={saving}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {(data?.tierDetails ?? []).map((tier) => {
          const style = tierStyle[tier.id as TierId] ?? tierStyle.silver;
          const Icon = style.icon;
          return (
            <motion.div
              key={tier.id}
              variants={item}
              className={`group relative overflow-hidden rounded-xl border bg-card p-6 transition-all duration-300 hover:border-primary/30 ${style.border}`}
            >
              <div className={`absolute left-0 top-0 h-1 w-full bg-gradient-to-r ${style.gradient}`} />

              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${style.bg}`}>
                  <Icon size={20} className={style.textColor} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">{tier.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    {tier.members} members{tier.percent >= 0 ? ` (${tier.percent}%)` : ""}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between rounded-lg bg-secondary/30 px-3 py-2">
                <span className="text-xs text-muted-foreground">Points multiplier</span>
                <span className={`text-sm font-bold ${style.textColor}`}>{tier.pointsMultiplier}</span>
              </div>

              <div className="mt-4">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Requirements</p>
                <p className="mt-1 text-sm text-foreground">{tier.requirements}</p>
              </div>

              <div className="mt-4">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Privileges</p>
                <ul className="mt-2 flex flex-col gap-1.5">
                  {tier.privileges.map((p) => (
                    <li key={p} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <ChevronRight size={10} className={style.textColor} />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
