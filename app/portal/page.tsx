"use client";

import { motion } from "framer-motion";
import {
  CreditCard,
  TrendingUp,
  CalendarClock,
  Trophy,
  Gift,
  Monitor,
  ArrowRight,
  Star,
} from "lucide-react";
import Link from "next/link";
import { usePortalMe } from "@/app/portal/portal-me-context";
import { getTierStyle } from "@/app/portal/tier-styles";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.4, ease: [0.4, 0, 0.2, 1] },
  }),
};

function formatBookingDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const bookingDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  if (bookingDay.getTime() === today.getTime()) return "Today";
  if (bookingDay.getTime() === tomorrow.getTime()) return "Tomorrow";
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return days[d.getDay()];
}

function formatTimeRange(startIso: string, endIso: string): string {
  const s = new Date(startIso);
  const e = new Date(endIso);
  const fmt = (d: Date) =>
    d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  return `${fmt(s)} - ${fmt(e)}`;
}

export default function PortalDashboard() {
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
        {error ?? "Failed to load your data"}
      </div>
    );
  }

  const { profile, tier, upcoming_bookings, upcoming_tournaments } = me;
  const nextBooking = upcoming_bookings[0];
  const nextBookingSub = nextBooking
    ? `${formatBookingDate(nextBooking.start_time)} ${new Date(nextBooking.start_time).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}`
    : "No upcoming";
  const nextTournament = upcoming_tournaments[0];
  const nextTournamentSub = nextTournament
    ? `${nextTournament.name} – ${formatBookingDate(nextTournament.starts_at)}`
    : "None registered";

  const tierStyle = getTierStyle(tier.current);
  const stats = [
    {
      label: "Card Tier",
      value: tier.current_name,
      sub: tier.next_name ? `${tier.points_to_next.toLocaleString()} pts to ${tier.next_name}` : "Max tier",
      icon: CreditCard,
      color: tierStyle.statIcon,
    },
    {
      label: "Points Balance",
      value: profile.points.toLocaleString(),
      sub: `+${profile.points_this_month.toLocaleString()} this month`,
      icon: TrendingUp,
      color: "text-primary",
    },
    {
      label: "Upcoming Bookings",
      value: String(me.booking_count),
      sub: `Next: ${nextBookingSub}`,
      icon: CalendarClock,
      color: "text-[hsl(200,70%,55%)]",
    },
    {
      label: "Tournaments",
      value: String(me.tournament_count),
      sub: nextTournamentSub,
      icon: Trophy,
      color: "text-[hsl(280,60%,60%)]",
    },
  ];

  const progressPct = Math.min(100, tier.progress_percent);
  const progressLabel =
    tier.next_threshold != null
      ? `${profile.points.toLocaleString()} / ${tier.next_threshold.toLocaleString()} points`
      : `${profile.points.toLocaleString()} points`;

  return (
    <div className="flex flex-col gap-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-2xl font-bold text-foreground">
          Welcome back, {profile.first_name || profile.display_name}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Here is your membership overview
        </p>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-3">
        <motion.div
          custom={0}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="lg:col-span-1"
        >
          <Link href="/portal/card" className="group block">
            <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${tierStyle.cardGradient} p-6 shadow-lg transition-transform duration-300 group-hover:scale-[1.02]`}>
              <div className="absolute inset-0 opacity-10">
                <div
                  className="h-full w-full"
                  style={{
                    backgroundImage:
                      "radial-gradient(circle at 20% 50%, rgba(255,255,255,0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.2) 0%, transparent 40%)",
                  }}
                />
              </div>
              <div className="relative">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-[0.2em] text-white/70">
                    Q-BOX Play Lounge
                  </span>
                  <Star size={20} className="text-white/80" />
                </div>
                <div className="mt-8">
                  <p className="font-mono text-sm tracking-[0.3em] text-white/60">
                    **** **** **** {String(profile.id).slice(-4)}
                  </p>
                </div>
                <div className="mt-4 flex items-end justify-between">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-white/50">
                      Member
                    </p>
                    <p className="text-sm font-bold text-white">{profile.short_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-wider text-white/50">
                      Tier
                    </p>
                    <p className="text-sm font-bold text-white">{tier.current_name.toUpperCase()}</p>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </motion.div>

        <div className="grid grid-cols-2 gap-4 lg:col-span-2">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              custom={i + 1}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="rounded-xl border border-border bg-card p-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{stat.label}</span>
                <stat.icon size={16} className={stat.color} />
              </div>
              <p className="mt-2 text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{stat.sub}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {tier.next_name && (
        <motion.div
          custom={5}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="rounded-xl border border-border bg-card p-5"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Progress to {tier.next_name} Tier
              </h3>
              <p className="mt-0.5 text-xs text-muted-foreground">{progressLabel}</p>
            </div>
            <span className="text-xs font-bold text-primary">{progressPct}%</span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
              className={`h-full rounded-full bg-gradient-to-r ${tierStyle.progressBar} to-primary`}
            />
          </div>
          <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
            <span>Silver</span>
            <span className="font-medium text-[hsl(43,80%,50%)]">Gold</span>
            <span>Black</span>
          </div>
        </motion.div>
      )}

      <motion.div custom={6} variants={fadeUp} initial="hidden" animate="visible">
        <h3 className="mb-3 text-sm font-semibold text-foreground">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            { label: "Book Station", icon: Monitor, href: "/portal/bookings", primary: true },
            { label: "View Rewards", icon: Gift, href: "/portal/rewards", primary: false },
            { label: "My Card", icon: CreditCard, href: "/portal/card", primary: false },
            { label: "Tournaments", icon: Trophy, href: "/portal/tournaments", primary: false },
          ].map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                action.primary
                  ? "btn-premium-orange text-primary-foreground"
                  : "border border-border bg-card text-foreground hover:border-primary/30 hover:bg-card/80"
              }`}
            >
              <action.icon size={18} />
              {action.label}
            </Link>
          ))}
        </div>
      </motion.div>

      <motion.div
        custom={7}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="rounded-xl border border-border bg-card p-5"
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Upcoming Bookings</h3>
          <Link
            href="/portal/bookings"
            className="flex items-center gap-1 text-xs text-primary transition-colors hover:text-primary/80"
          >
            View all <ArrowRight size={12} />
          </Link>
        </div>
        <div className="flex flex-col gap-3">
          {upcoming_bookings.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No upcoming bookings
            </p>
          ) : (
            upcoming_bookings.map((booking) => (
              <div
                key={booking.id}
                className="flex items-center justify-between rounded-lg bg-secondary/30 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Monitor size={18} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {booking.station_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {booking.game ?? "—"}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium text-foreground">
                    {formatBookingDate(booking.start_time)}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {formatTimeRange(booking.start_time, booking.end_time)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
}
