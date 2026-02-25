"use client";

import { motion } from "framer-motion";
import { Check, Star } from "lucide-react";

const plans = [
  {
    name: "Standard",
    priceLabel: "20–55 MAD/h",
    description: "From Xbox solo sessions to group PS5 gaming.",
    priceLines: [
      "20 MAD/h — Xbox (1 person max)",
      "40 MAD/h — Standard PS5",
      "55 MAD/h — Standard PS5 (4 people)",
    ],
    features: [
      "Console access",
      "4K HDR monitor",
      "DualSense controller",
      "Standard seating",
      "High-speed WiFi",
    ],
    featured: false,
  },
  {
    name: "VIP PS5",
    priceLabel: "50–70 MAD/h",
    description: "Premium setup with large screen and sofa for solo or group play.",
    priceLines: [
      "50 MAD/h — Solo",
      "70 MAD/h — 4 people",
    ],
    features: [
      "55″ 4K TV",
      "Comfortable 3-person sofa",
      "Everything in Standard",
      "Private booth experience",
      "Complimentary drinks",
      "Priority booking",
    ],
    featured: true,
  },
  {
    name: "Membership",
    priceLabel: "900 MAD/month",
    description: "Exclusive perks for dedicated gamers.",
    priceLines: [],
    features: [
      "20 free PS5 VIP hours per month",
      "Get VIP at standard price when available",
      "Tournament priority entry",
      "Guest passes (2/month)",
      "Exclusive member events",
      "Loyalty rewards program",
    ],
    featured: false,
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

export default function Pricing() {
  return (
    <section id="pricing" className="relative py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center"
        >
          <span className="mb-4 inline-block text-xs font-medium uppercase tracking-[0.2em] text-primary">
            Pricing
          </span>
          <h2 className="mb-4 text-balance text-3xl font-bold tracking-tight text-foreground md:text-5xl">
            Choose Your Experience
          </h2>
          <p className="mx-auto max-w-2xl text-pretty text-muted-foreground">
            Flexible pricing for every type of gamer. No hidden fees, no
            surprises.
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid gap-6 md:grid-cols-3"
        >
          {plans.map((plan) => (
            <motion.div
              key={plan.name}
              variants={itemVariants}
              className={`relative flex flex-col overflow-hidden rounded-2xl p-8 transition-all duration-500 hover:-translate-y-1 ${
                plan.featured
                  ? "glass-strong border border-primary/30 glow-orange-sm"
                  : "glass"
              }`}
            >
              {plan.featured && (
                <div className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary">
                  <Star className="h-3 w-3" />
                  Popular
                </div>
              )}

              <div className="mb-6">
                <h3 className="mb-2 text-xl font-bold text-foreground">
                  {plan.name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {plan.description}
                </p>
              </div>

              <div className="mb-6">
                <span className="text-3xl font-black text-foreground md:text-4xl">
                  {plan.priceLabel}
                </span>
                {plan.priceLines.length > 0 && (
                  <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                    {plan.priceLines.map((line) => (
                      <div key={line}>{line}</div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mb-8 flex flex-1 flex-col gap-3">
                {plan.features.map((feature) => (
                  <div
                    key={feature}
                    className="flex items-center gap-3 text-sm text-muted-foreground"
                  >
                    <Check className="h-4 w-4 shrink-0 text-primary" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              <button
                className={`w-full rounded-xl py-3 text-sm font-bold uppercase tracking-wider transition-all duration-300 ${
                  plan.featured
                    ? "glow-orange bg-primary text-primary-foreground hover:brightness-110"
                    : "border border-border bg-secondary text-foreground hover:border-muted-foreground"
                }`}
              >
                Get Started
              </button>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
