"use client";

import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";

export default function Hero() {
  return (
    <section
      id="home"
      className="relative flex min-h-screen min-h-[700px] items-center justify-center px-6"
    >
      {/* Content (3D box is fixed behind via FixedBoxBackground) */}
      <div className="relative z-10 flex flex-col items-center text-center">
        {/* Top Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="glass mb-8 inline-flex rounded-full px-5 py-2 text-[11px] font-medium uppercase tracking-[0.25em] text-muted-foreground"
        >
          Next-Gen Gaming Hub
        </motion.div>

        {/* Main Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mb-6 font-display text-6xl font-bold uppercase leading-[0.95] tracking-[0.04em] md:text-8xl lg:text-9xl"
        >
          <span className="text-luminous-silver">Step Into</span>
          <br />
          <span className="text-warm-orange">The Box</span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="mb-10 max-w-lg text-pretty text-base font-light tracking-wide text-muted-foreground md:text-lg"
        >
          4K PS5 stations. Pro-level performance. Competitive atmosphere.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.9 }}
          className="flex flex-col items-center gap-4 sm:flex-row"
        >
          {/* Primary CTA */}
          <a
            href="#stations"
            className="btn-premium-orange rounded-lg px-10 py-4 text-sm font-bold uppercase tracking-wider text-primary-foreground"
          >
            Start Playing Now
          </a>

          {/* Secondary CTA */}
          <a
            href="#features"
            className="btn-glass rounded-lg px-10 py-4 text-sm font-bold uppercase tracking-wider text-foreground"
          >
            Explore The Box
          </a>
        </motion.div>

        {/* Micro-text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.1 }}
          className="mt-8 text-xs tracking-widest text-muted-foreground/60"
        >
          {"10 Premium Stations \u00B7 Open Daily"}
        </motion.p>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          className="flex flex-col items-center gap-2"
        >
          <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Scroll
          </span>
          <ChevronDown className="h-4 w-4 text-primary" />
        </motion.div>
      </motion.div>
    </section>
  );
}
