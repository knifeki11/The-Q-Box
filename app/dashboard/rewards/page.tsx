"use client";

import { motion } from "framer-motion";
import { Gift, CreditCard, Star, Crown, Percent, Clock, Zap, Users, CalendarClock, Trophy, Settings } from "lucide-react";

const tiers = [
  {
    name: "Silver Card",
    icon: CreditCard,
    color: "text-zinc-400",
    bg: "bg-zinc-500/10",
    border: "border-zinc-500/20",
    gradient: "from-zinc-600 to-zinc-800",
    rewards: [
      { label: "Session discount", value: "0%", icon: Percent },
      { label: "Priority booking", value: "No", icon: CalendarClock },
      { label: "Exclusive tournaments", value: "Community only", icon: Trophy },
      { label: "Points multiplier", value: "1x", icon: Zap },
      { label: "Free hours / month", value: "0", icon: Clock },
      { label: "Guest passes", value: "None", icon: Users },
    ],
  },
  {
    name: "Gold Card",
    icon: Star,
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    gradient: "from-amber-500 to-amber-700",
    rewards: [
      { label: "Session discount", value: "10%", icon: Percent },
      { label: "Priority booking", value: "Yes", icon: CalendarClock },
      { label: "Exclusive tournaments", value: "Gold tier", icon: Trophy },
      { label: "Points multiplier", value: "1.5x", icon: Zap },
      { label: "Free hours / month", value: "1", icon: Clock },
      { label: "Guest passes", value: "1 / month", icon: Users },
    ],
  },
  {
    name: "Black Card",
    icon: Crown,
    color: "text-foreground",
    bg: "bg-foreground/10",
    border: "border-foreground/20",
    gradient: "from-foreground/80 to-foreground/40",
    rewards: [
      { label: "Session discount", value: "25%", icon: Percent },
      { label: "Priority booking", value: "VIP", icon: CalendarClock },
      { label: "Exclusive tournaments", value: "All tiers + VIP", icon: Trophy },
      { label: "Points multiplier", value: "3x", icon: Zap },
      { label: "Free hours / month", value: "2", icon: Clock },
      { label: "Guest passes", value: "3 / month", icon: Users },
    ],
  },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function RewardsPage() {
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
          <h1 className="text-2xl font-bold text-foreground">Rewards and Privileges</h1>
          <p className="text-sm text-muted-foreground">Configure benefits for each membership tier</p>
        </div>
        <button className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary">
          <Settings size={16} />
          Edit Rewards
        </button>
      </motion.div>

      {/* Summary */}
      <motion.div variants={item} className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Gift size={20} className="text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">Rewards Program Overview</h2>
            <p className="text-xs text-muted-foreground">
              Members earn points through sessions, tournaments, and visits. Higher tiers unlock premium benefits.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Tier comparison */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {tiers.map((tier) => (
          <motion.div
            key={tier.name}
            variants={item}
            className={`relative overflow-hidden rounded-xl border bg-card ${tier.border}`}
          >
            <div className={`h-1 w-full bg-gradient-to-r ${tier.gradient}`} />
            <div className="p-5">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${tier.bg}`}>
                  <tier.icon size={20} className={tier.color} />
                </div>
                <h3 className="text-sm font-bold text-foreground">{tier.name}</h3>
              </div>

              <div className="mt-5 flex flex-col gap-3">
                {tier.rewards.map((r) => (
                  <div
                    key={r.label}
                    className="flex items-center justify-between rounded-lg bg-secondary/30 px-3 py-2.5"
                  >
                    <div className="flex items-center gap-2">
                      <r.icon size={13} className="text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{r.label}</span>
                    </div>
                    <span className={`text-xs font-semibold ${tier.color}`}>{r.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
