"use client";

import { motion } from "framer-motion";
import {
  Star,
  Check,
  Lock,
  Zap,
  Clock,
  Percent,
  Crown,
  Shield,
  Ticket,
} from "lucide-react";
import { usePortalMe } from "@/app/portal/portal-me-context";
import { getTierStyle } from "@/app/portal/tier-styles";

const tierOrder: Array<"silver" | "gold" | "black"> = ["silver", "gold", "black"];

const tierRanges: Record<string, string> = {
  silver: "0 - 4,999 pts",
  gold: "5,000 - 14,999 pts",
  black: "15,000+ pts",
};

const tierDisplayNames: Record<string, string> = {
  silver: "Silver",
  gold: "Gold",
  black: "Black",
};

const tierGradients: Record<string, string> = {
  silver: "from-zinc-500 via-zinc-600 to-zinc-800",
  gold: "from-[hsl(43,80%,45%)] via-[hsl(40,70%,40%)] to-[hsl(35,60%,30%)]",
  black: "from-zinc-800 via-zinc-900 to-zinc-950",
};

const tierDotColors: Record<string, string> = {
  silver: "bg-zinc-400",
  gold: "bg-[hsl(43,80%,50%)]",
  black: "bg-foreground",
};

const tierTextColors: Record<string, string> = {
  silver: "text-zinc-300",
  gold: "text-[hsl(43,80%,50%)]",
  black: "text-foreground",
};

const privileges = [
  { label: "Standard hourly rates", icon: Clock, tier: "silver" as const },
  { label: "Access to all stations", icon: Zap, tier: "silver" as const },
  { label: "Points on every session", icon: Star, tier: "silver" as const },
  { label: "10% discount on sessions", icon: Percent, tier: "gold" as const },
  { label: "Priority booking", icon: Ticket, tier: "gold" as const },
  { label: "Free tournament entry", icon: Crown, tier: "gold" as const },
  { label: "25% discount on sessions", icon: Percent, tier: "black" as const },
  { label: "VIP lounge access", icon: Shield, tier: "black" as const },
  { label: "Exclusive events", icon: Crown, tier: "black" as const },
];

function tierUnlocks(tierId: string): Set<string> {
  const idx = tierOrder.indexOf(tierId as "silver" | "gold" | "black");
  if (idx < 0) return new Set(["silver"]);
  const set = new Set<string>();
  for (let i = 0; i <= idx; i++) set.add(tierOrder[i]);
  return set;
}

export default function MyCardPage() {
  const { data: me, loading, error } = usePortalMe();

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center text-muted-foreground">
        Loading…
      </div>
    );
  }
  if (error || !me) {
    return (
      <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
        {error ?? "Failed to load your card"}
      </div>
    );
  }

  const { profile, tier } = me;
  const currentTierId = tier.current;
  const unlockedTiers = tierUnlocks(currentTierId);
  const tierStyle = getTierStyle(currentTierId);
  const cardGradient = tierGradients[currentTierId] ?? tierGradients.silver;
  const progressPct = Math.min(100, tier.progress_percent);
  const nextTierName = tier.next_name ?? "Black";

  const cardNumberSuffix = String(profile.id).replace(/-/g, "").slice(-16);
  const formattedCardNumber =
    "OB " + (cardNumberSuffix.match(/.{1,4}/g) ?? []).join(" ");

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Card</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your digital membership card and tier privileges
        </p>
      </div>

      {/* Large digital card – real data, tier-based gradient */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="mx-auto w-full max-w-lg"
      >
        <div
          className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${cardGradient} p-8 shadow-2xl`}
        >
          <div className="absolute inset-0">
            <div
              className="h-full w-full"
              style={{
                backgroundImage:
                  "radial-gradient(ellipse at 20% 50%, rgba(255,255,255,0.15) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(255,255,255,0.1) 0%, transparent 40%), radial-gradient(ellipse at 50% 100%, rgba(255,255,255,0.05) 0%, transparent 50%)",
              }}
            />
          </div>
          <div className="absolute inset-0 rounded-2xl border border-white/10" />

          <div className="relative">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-[0.25em] text-white/60">
                Q-BOX Play Lounge
              </span>
              <div className="flex items-center gap-1.5">
                <Star size={16} className="text-white/70" />
                <span className="text-xs font-bold uppercase tracking-wider text-white/70">
                  {tier.current_name}
                </span>
              </div>
            </div>

            <div className="mt-10">
              <p className="font-mono text-lg tracking-[0.35em] text-white/70">
                {formattedCardNumber}
              </p>
            </div>

            <div className="mt-8 flex items-end justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/40">
                  Member
                </p>
                <p className="mt-0.5 text-base font-bold tracking-wide text-white">
                  {profile.display_name}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/40">
                  Points
                </p>
                <p className="mt-0.5 text-base font-bold text-white">
                  {profile.points.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tier progress – real points and next tier */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="rounded-xl border border-border bg-card p-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Tier Progress
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {tier.next_threshold != null ? (
                <>
                  {profile.points.toLocaleString()} /{" "}
                  {tier.next_threshold.toLocaleString()} points to{" "}
                  <span className="font-medium text-foreground">{nextTierName}</span>
                </>
              ) : (
                <>{profile.points.toLocaleString()} points (max tier)</>
              )}
            </p>
          </div>
          {tier.next_threshold != null && (
            <span className="text-lg font-bold text-primary">{progressPct}%</span>
          )}
        </div>
        {tier.next_threshold != null && (
          <>
            <div className="mt-4 h-3 overflow-hidden rounded-full bg-secondary">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
                className={`h-full rounded-full bg-gradient-to-r ${tierStyle.progressBar} to-primary`}
              />
            </div>
            <div className="mt-2 flex justify-between">
              {tierOrder.map((key) => (
                <div key={key} className="flex items-center gap-1.5">
                  <div className={`h-2 w-2 rounded-full ${tierDotColors[key]}`} />
                  <span
                    className={`text-[11px] font-medium ${
                      key === currentTierId ? tierTextColors[key] : "text-muted-foreground"
                    }`}
                  >
                    {tierDisplayNames[key]}
                  </span>
                  <span className="text-[10px] text-muted-foreground/60">
                    {tierRanges[key]}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </motion.div>

      {/* Privileges – unlocked by current tier */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        className="rounded-xl border border-border bg-card p-6"
      >
        <h3 className="mb-4 text-sm font-semibold text-foreground">
          Tier Privileges
        </h3>
        <div className="flex flex-col gap-2">
          {privileges.map((priv, i) => {
            const unlocked = unlockedTiers.has(priv.tier);
            return (
              <motion.div
                key={priv.label}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.05, duration: 0.3 }}
                className={`flex items-center justify-between rounded-lg px-4 py-3 ${
                  unlocked ? "bg-secondary/30" : "bg-secondary/10 opacity-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  {unlocked ? (
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10">
                      <Check size={14} className="text-primary" />
                    </div>
                  ) : (
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary">
                      <Lock size={14} className="text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <priv.icon
                      size={14}
                      className={
                        unlocked ? "text-foreground" : "text-muted-foreground"
                      }
                    />
                    <span
                      className={`text-sm ${
                        unlocked ? "text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {priv.label}
                    </span>
                  </div>
                </div>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider ${
                    tierTextColors[priv.tier]
                  }`}
                >
                  {tierDisplayNames[priv.tier]}
                </span>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
