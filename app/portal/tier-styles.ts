/**
 * Portal UI colors by card tier (silver, gold, black).
 * Use for membership card preview, sidebar badge, header, and stat icons.
 */
export type TierId = "silver" | "gold" | "black";

export const tierStyles: Record<
  TierId,
  {
    /** Card gradient (Tailwind classes) */
    cardGradient: string;
    /** Sidebar/header badge background gradient */
    badgeBg: string;
    /** Dot and accent color */
    badgeDot: string;
    /** Badge text color */
    badgeText: string;
    /** Stat icon color */
    statIcon: string;
    /** Progress bar start (for "progress to next" bar) */
    progressBar: string;
    /** Header avatar circle background */
    avatarBg: string;
    /** Header avatar text color */
    avatarText: string;
  }
> = {
  silver: {
    cardGradient:
      "from-zinc-500 via-zinc-600 to-zinc-800",
    badgeBg: "bg-gradient-to-r from-zinc-500/15 to-zinc-500/5",
    badgeDot: "bg-zinc-400",
    badgeText: "text-zinc-300",
    statIcon: "text-zinc-400",
    progressBar: "from-zinc-400",
    avatarBg: "bg-zinc-400/20",
    avatarText: "text-zinc-600",
  },
  gold: {
    cardGradient:
      "from-[hsl(43,80%,45%)] via-[hsl(40,70%,40%)] to-[hsl(35,60%,30%)]",
    badgeBg: "bg-gradient-to-r from-[hsl(43,80%,50%)]/15 to-[hsl(43,80%,50%)]/5",
    badgeDot: "bg-[hsl(43,80%,50%)]",
    badgeText: "text-[hsl(43,80%,50%)]",
    statIcon: "text-[hsl(43,80%,50%)]",
    progressBar: "from-[hsl(43,80%,50%)]",
    avatarBg: "bg-[hsl(43,80%,50%)]/20",
    avatarText: "text-[hsl(43,80%,50%)]",
  },
  black: {
    cardGradient:
      "from-zinc-800 via-zinc-900 to-zinc-950",
    badgeBg: "bg-gradient-to-r from-foreground/15 to-foreground/5",
    badgeDot: "bg-foreground",
    badgeText: "text-foreground",
    statIcon: "text-foreground",
    progressBar: "from-foreground/80",
    avatarBg: "bg-foreground/20",
    avatarText: "text-foreground",
  },
};

export function getTierStyle(tierId: string | null): (typeof tierStyles)["silver"] {
  const id = (tierId ?? "silver") as TierId;
  return tierStyles[id] ?? tierStyles.silver;
}
