"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Gift, Percent, Clock, Crown, Star, Zap, Check, Loader2 } from "lucide-react";
import { usePortalMe } from "@/app/portal/portal-me-context";

type RewardItem = {
  id: string;
  name: string;
  description: string | null;
  points_cost: number;
  tier_required: string;
  category: string | null;
};

const tierRank: Record<string, number> = { silver: 0, gold: 1, black: 2 };
const categoryIcons: Record<string, typeof Clock> = {
  hours: Clock,
  discount: Percent,
  access: Crown,
  boost: Zap,
  premium: Star,
  special: Gift,
};

export default function RewardsPage() {
  const { data: me, refetch } = usePortalMe();
  const [rewards, setRewards] = useState<RewardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");
  const [redeemingId, setRedeemingId] = useState<string | null>(null);
  const [redeemError, setRedeemError] = useState<string | null>(null);

  const userPoints = me?.profile?.points ?? 0;
  const userTier = me?.profile?.card_tier_id ?? "silver";

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch("/api/portal/rewards")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load rewards");
        return r.json();
      })
      .then((data) => {
        if (!cancelled) setRewards(Array.isArray(data) ? data : []);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Error loading rewards");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const categories = ["all", ...Array.from(new Set(rewards.map((r) => r.category || "other").filter(Boolean)))];
  const filtered =
    filter === "all"
      ? rewards
      : rewards.filter((r) => (r.category || "other") === filter);

  const canAfford = (cost: number) => userPoints >= cost;
  const canUnlock = (tierRequired: string) =>
    tierRank[userTier] >= tierRank[tierRequired] ?? 0;

  const handleRedeem = async (rewardId: string) => {
    setRedeemError(null);
    setRedeemingId(rewardId);
    try {
      const res = await fetch("/api/portal/rewards/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reward_id: rewardId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setRedeemError(data.error ?? "Redemption failed");
        return;
      }
      await refetch();
    } catch (e) {
      setRedeemError(e instanceof Error ? e.message : "Redemption failed");
    } finally {
      setRedeemingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Rewards</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Redeem your points for exclusive perks
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2">
          <Star size={16} className="text-primary" />
          <span className="text-sm font-bold text-foreground">
            {userPoints.toLocaleString()}
          </span>
          <span className="text-xs text-muted-foreground">points available</span>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}
      {redeemError && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {redeemError}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-all ${
              filter === cat
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex min-h-[200px] items-center justify-center text-muted-foreground">
          <Loader2 size={24} className="animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          No rewards available right now. Check back later.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((reward, i) => {
            const affordable = canAfford(reward.points_cost);
            const unlocked = canUnlock(reward.tier_required);
            const available = affordable && unlocked;
            const Icon = categoryIcons[reward.category ?? ""] ?? Gift;

            return (
              <motion.div
                key={reward.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, duration: 0.4 }}
                className={`flex flex-col rounded-xl border bg-card p-5 transition-all ${
                  available
                    ? "border-border hover:border-primary/30"
                    : "border-border/50 opacity-60"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Icon size={20} className="text-primary" />
                  </div>
                  <div className="flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1">
                    <Star size={12} className="text-primary" />
                    <span className="text-xs font-bold text-foreground">
                      {reward.points_cost}
                    </span>
                  </div>
                </div>
                <h3 className="mt-4 text-sm font-semibold text-foreground">
                  {reward.name}
                </h3>
                <p className="mt-1 flex-1 text-xs leading-relaxed text-muted-foreground">
                  {reward.description || "—"}
                </p>
                <button
                  disabled={!available || redeemingId === reward.id}
                  onClick={() => handleRedeem(reward.id)}
                  className={`mt-4 flex h-9 items-center justify-center gap-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                    available && redeemingId !== reward.id
                      ? "btn-premium-orange text-primary-foreground"
                      : "cursor-not-allowed bg-secondary text-muted-foreground"
                  }`}
                >
                  {redeemingId === reward.id ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : !unlocked ? (
                    `${reward.tier_required} tier required`
                  ) : !affordable ? (
                    "Not enough points"
                  ) : (
                    <>
                      <Check size={14} />
                      Redeem
                    </>
                  )}
                </button>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
