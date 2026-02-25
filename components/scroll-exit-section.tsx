"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

type ScrollExitSectionProps = {
  children: React.ReactNode;
  className?: string;
};

/**
 * Wraps content with a subtle 3D scroll effect: perspective centered in the viewport,
 * elements recede (tilt back + scale down) as they exit upward, and approach
 * (tilt forward + scale up) as they enter from below.
 */
export default function ScrollExitSection({
  children,
  className = "",
}: ScrollExitSectionProps) {
  const ref = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  // Move up + fade when exiting — stronger lift for more accent
  const y = useTransform(scrollYProgress, [0, 0.5, 0.9], [0, 0, -200]);
  const opacity = useTransform(scrollYProgress, [0, 0.5, 0.85], [1, 1, 0]);

  // Stronger 3D accent: recede more when exiting, approach more when entering
  const rotateX = useTransform(
    scrollYProgress,
    [-0.1, 0.02, 0.48, 0.88],
    [-8, 0, 0, 12]
  );
  const scale = useTransform(
    scrollYProgress,
    [-0.1, 0.02, 0.48, 0.88],
    [0.96, 1, 1, 0.96]
  );

  return (
    <div
      ref={ref}
      className={className}
      style={{
        perspective: "1000px",
        perspectiveOrigin: "50% 50%",
      }}
    >
      <motion.div
        style={{
          y,
          opacity,
          rotateX,
          scale,
          transformOrigin: "50% 50%",
          transformStyle: "preserve-3d",
          backfaceVisibility: "hidden",
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}
