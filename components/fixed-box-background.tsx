"use client";

import dynamic from "next/dynamic";

const HeroScene = dynamic(() => import("./hero-scene"), { ssr: false });

/**
 * Fixed full-viewport 3D box background. Stays in place while content scrolls over it.
 * The only persistent background; all sections scroll up on top of it.
 */
export default function FixedBoxBackground() {
  return (
    <div
      className="fixed inset-0 z-0"
      aria-hidden
    >
      <HeroScene />
      {/* Gradient overlay for readability of hero text and smooth blend */}
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background/50 via-background/10 to-background/80"
        style={{ mixBlendMode: "normal" }}
      />
    </div>
  );
}
