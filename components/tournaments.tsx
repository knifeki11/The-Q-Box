"use client";

import { motion } from "framer-motion";
import { Trophy, Calendar, Users, ChevronRight, Crown, Medal, Award } from "lucide-react";

const tournaments = [
  {
    title: "FIFA Champions Cup",
    date: "Mar 15, 2026",
    players: "32 Players",
    prize: "1,000 MAD",
    status: "Registration Open",
    game: "EA FC 26",
  },
  {
    title: "Call of Duty Showdown",
    date: "Mar 22, 2026",
    players: "16 Teams",
    prize: "10 free hours",
    status: "Registration Open",
    game: "COD: Modern Warfare",
  },
  {
    title: "Gran Turismo Grand Prix",
    date: "Apr 5, 2026",
    players: "24 Players",
    prize: "Free Tier 1 Membership",
    status: "Coming Soon",
    game: "GT7",
  },
];

const leaderboard = [
  { rank: 1, name: "Saad Akku", wins: 47, icon: Crown },
  { rank: 2, name: "Mono", wins: 42, icon: Medal },
  { rank: 3, name: "Gucci", wins: 38, icon: Award },
  { rank: 4, name: "Moulay Sidi", wins: 35, icon: null },
  { rank: 5, name: "Michael Hilali", wins: 31, icon: null },
];

export default function Tournaments() {
  return (
    <section id="tournaments" className="relative py-24 md:py-32">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.02] to-transparent" />

      <div className="relative mx-auto max-w-7xl px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center"
        >
          <span className="mb-4 inline-block text-xs font-medium uppercase tracking-[0.2em] text-primary">
            Compete & Win
          </span>
          <h2 className="mb-4 text-balance text-3xl font-bold tracking-tight text-foreground md:text-5xl">
            Tournaments & Community
          </h2>
          <p className="mx-auto max-w-2xl text-pretty text-muted-foreground">
            Join the competitive scene. Prove your skills and climb the
            leaderboard.
          </p>
        </motion.div>

        <div className="grid gap-8 lg:grid-cols-5">
          {/* Upcoming Tournaments */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-3"
          >
            <h3 className="mb-6 flex items-center gap-2 text-lg font-semibold text-foreground">
              <Trophy className="h-5 w-5 text-primary" />
              Upcoming Tournaments
            </h3>
            <div className="flex flex-col gap-4">
              {tournaments.map((tournament) => (
                <div
                  key={tournament.title}
                  className="group flex flex-col gap-4 rounded-2xl border border-white/10 bg-[rgba(14,14,14,0.96)] p-6 transition-all duration-300 hover:glow-orange-sm sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex-1">
                    <div className="mb-1 text-xs font-medium uppercase tracking-wider text-primary">
                      {tournament.game}
                    </div>
                    <h4 className="mb-2 text-lg font-bold text-foreground">
                      {tournament.title}
                    </h4>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-3 w-3" />
                        {tournament.date}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Users className="h-3 w-3" />
                        {tournament.players}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-xl font-black text-primary">
                        {tournament.prize}
                      </div>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        Prize Pool
                      </div>
                    </div>
                    <button className="flex items-center gap-1 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition-all duration-300 hover:brightness-110">
                      Join
                      <ChevronRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Leaderboard */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-2"
          >
            <h3 className="mb-6 flex items-center gap-2 text-lg font-semibold text-foreground">
              <Crown className="h-5 w-5 text-primary" />
              Leaderboard
            </h3>
            <div className="rounded-2xl border border-white/10 bg-[rgba(14,14,14,0.96)] p-6">
              <div className="flex flex-col gap-3">
                {leaderboard.map((player) => (
                  <div
                    key={player.rank}
                    className={`flex items-center gap-4 rounded-xl p-3 transition-colors duration-300 ${
                      player.rank === 1
                        ? "bg-primary/10"
                        : "hover:bg-secondary/50"
                    }`}
                  >
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-black ${
                        player.rank === 1
                          ? "bg-primary text-primary-foreground"
                          : player.rank <= 3
                            ? "bg-secondary text-foreground"
                            : "text-muted-foreground"
                      }`}
                    >
                      {player.rank}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        {player.name}
                        {player.icon && (
                          <player.icon className="h-3.5 w-3.5 text-primary" />
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-foreground">
                        {player.wins}
                      </div>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        Wins
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div className="mt-6 border-t border-border pt-6 text-center" id="membership">
                <p className="mb-4 text-sm text-muted-foreground">
                  Join the Q-BOX community and compete.
                </p>
                <button className="w-full rounded-xl border border-primary/30 py-2.5 text-xs font-bold uppercase tracking-wider text-primary transition-all duration-300 hover:bg-primary hover:text-primary-foreground">
                  Join the Community
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
