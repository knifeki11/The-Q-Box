"use client";

import { motion } from "framer-motion";
import { Gamepad2, Tv, Monitor } from "lucide-react";

const setups = [
  {
    id: "ps5-zone",
    icon: Gamepad2,
    title: "8 PS5 Consoles",
    availability: "6 / 8 AVAILABLE",
    availabilityVariant: "low" as const,
    description:
      "Standard PS5 stations with 4K monitors, DualSense controllers, and headsets.",
    highlights: ["4K monitors", "DualSense controllers", "Gaming headsets"],
    cta: "BOOK NOW",
    href: "#stations",
    isPremium: false,
  },
  {
    id: "premium-ps5",
    icon: Tv,
    title: "Premium PS5 Station",
    availability: "AVAILABLE",
    availabilityVariant: "available" as const,
    description:
      "VIP setup with a 55\" TV and comfortable 3-person sofa for group play.",
    highlights: ["55″ 4K TV", "Comfortable 3-person sofa", "Ideal for group play"],
    cta: "BOOK PREMIUM",
    href: "#stations",
    isPremium: true,
  },
  {
    id: "xbox-zone",
    icon: Monitor,
    title: "1 Xbox Console",
    availability: "AVAILABLE",
    availabilityVariant: "available" as const,
    description:
      "High-performance Xbox setup with large display and full multiplayer support.",
    highlights: ["Large displays", "Multiplayer ready", "Comfortable seating"],
    cta: "BOOK NOW",
    href: "#stations",
    isPremium: false,
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
};

function AvailabilityBadge({
  label,
  variant,
}: {
  label: string;
  variant: "available" | "low" | "unavailable";
}) {
  return (
    <span
      className={`availability-badge-${variant} inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider`}
    >
      <span className="availability-dot h-1.5 w-1.5 shrink-0 rounded-full" />
      {label}
    </span>
  );
}

export default function Stations() {
  return (
    <section id="stations" className="relative py-24 md:py-32">
      {/* Background accent */}
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
            OUR SETUPS
          </span>
          <h2 className="mb-4 text-balance text-3xl font-bold tracking-tight text-foreground md:text-5xl">
            Choose how you want to play.
          </h2>
        </motion.div>

        {/* 3 Premium Setup Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="grid gap-8 md:grid-cols-3"
        >
          {setups.map((setup) => (
            <motion.article
              key={setup.id}
              variants={itemVariants}
              className={`station-setup-card group flex flex-col rounded-2xl p-8 md:p-10 ${
                setup.isPremium ? "station-setup-card-premium" : ""
              }`}
            >
              {/* VIP label for premium card */}
              {setup.isPremium && (
                <span className="mb-4 inline-block w-fit rounded-full bg-primary/20 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary">
                  VIP
                </span>
              )}

              {/* Icon / visual accent */}
              <div className="setup-card-icon mb-6 flex h-16 w-16 items-center justify-center rounded-xl bg-primary/15 text-primary group-hover:bg-primary/25">
                <setup.icon className="h-8 w-8" strokeWidth={1.75} />
              </div>

              {/* Title */}
              <h3 className="mb-3 text-xl font-bold tracking-tight text-foreground md:text-2xl">
                {setup.title}
              </h3>

              {/* Availability badge with status dot */}
              <div className="mb-4">
                <AvailabilityBadge
                  label={setup.availability}
                  variant={setup.availabilityVariant}
                />
              </div>

              {/* Description */}
              <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
                {setup.description}
              </p>

              {/* Bullet highlights */}
              <ul className="mb-8 flex flex-1 flex-col gap-1.5">
                {setup.highlights.map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-2 text-xs text-muted-foreground"
                  >
                    <span className="h-0.5 w-0.5 shrink-0 rounded-full bg-primary/70" />
                    {item}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <a
                href={setup.href}
                className="btn-setup-cta w-full rounded-xl py-3.5 text-center text-sm font-semibold uppercase tracking-wider text-white md:py-4"
              >
                {setup.cta}
              </a>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
