"use client";

import { motion } from "framer-motion";
import {
  Gamepad2,
  Monitor,
  Users,
  Armchair,
  Wifi,
  Trophy,
} from "lucide-react";

const features = [
  {
    icon: Gamepad2,
    title: "Ultra-fast Consoles",
    description:
      "Next-gen consoles with lightning-fast SSD and ray tracing for unmatched performance.",
  },
  {
    icon: Monitor,
    title: "4K HDR Gaming Monitors",
    description:
      "Crystal-clear visuals on premium 4K HDR displays with 120Hz refresh rate and 1ms response time.",
  },
  {
    icon: Users,
    title: "Competitive Multiplayer",
    description:
      "Full multiplayer setup with dedicated servers and low-latency connections for competitive play.",
  },
  {
    icon: Armchair,
    title: "Premium Seating",
    description:
      "Ergonomic gaming chairs with lumbar support designed for extended comfort during marathon sessions.",
  },
  {
    icon: Wifi,
    title: "High-Speed Internet",
    description:
      "Enterprise-grade fiber connection ensuring zero lag and instant downloads for the best experience.",
  },
  {
    icon: Trophy,
    title: "Tournaments & Events",
    description:
      "Regular competitive events, weekly tournaments, and exclusive gaming nights with prizes.",
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" as const },
  },
};

export default function Features() {
  return (
    <section id="features" className="relative py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="mb-20 text-center"
        >
          <span className="mb-5 inline-block text-[11px] font-medium uppercase tracking-[0.25em] text-muted-foreground">
            THE Q-BOX EXPERIENCE
          </span>
          <h2 className="mb-6 font-display text-3xl font-bold leading-tight tracking-[-0.02em] text-white md:text-4xl lg:text-5xl xl:text-[2.75rem]">
            Where Gaming Meets Community
          </h2>
          <p className="mx-auto max-w-[60ch] text-pretty text-sm leading-relaxed text-muted-foreground md:text-base">
            More than hardware — a place built for competition, comfort, and
            community.
          </p>
        </motion.div>

        {/* Feature Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={itemVariants}
              className="feature-card group cursor-default rounded-2xl p-8"
            >
              <div className="feature-card-icon mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="mb-3 text-lg font-semibold text-foreground">
                {feature.title}
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
