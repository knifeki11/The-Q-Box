"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Monitor,
  Users,
  CreditCard,
  Trophy,
  CalendarClock,
  DollarSign,
  Gift,
  ShoppingBag,
  UserCog,
  Settings,
  Search,
  ChevronLeft,
  Menu,
  LogOut,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { NotificationsDropdown } from "@/app/dashboard/notifications-dropdown";

const navItems = [
  { label: "Overview", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Stations", icon: Monitor, href: "/dashboard/stations" },
  { label: "Members", icon: Users, href: "/dashboard/members" },
  { label: "Cards and Points", icon: CreditCard, href: "/dashboard/cards" },
  { label: "Tournaments", icon: Trophy, href: "/dashboard/tournaments" },
  { label: "Sessions and Bookings", icon: CalendarClock, href: "/dashboard/sessions" },
  { label: "Revenue", icon: DollarSign, href: "/dashboard/revenue" },
  { label: "Shop", icon: ShoppingBag, href: "/dashboard/shop" },
  { label: "Rewards and Privileges", icon: Gift, href: "/dashboard/rewards" },
  { label: "Staff", icon: UserCog, href: "/dashboard/staff" },
  { label: "Settings", icon: Settings, href: "/dashboard/settings" },
];

function Sidebar({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  const pathname = usePathname();

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 260 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-border bg-card"
    >
      {/* Logo area – Qbox logo always visible at top left */}
      <div className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-border px-3">
        <Link href="/dashboard" className="flex min-w-0 flex-1 items-center justify-center overflow-hidden md:justify-start">
          <Image
            src="/images/QBOX_logo_upscaled.png"
            alt="Qbox"
            width={120}
            height={120}
            className={`shrink-0 object-contain object-left ${collapsed ? "h-8 w-8" : "h-9 w-auto"}`}
            priority
          />
          <AnimatePresence mode="wait">
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="truncate text-sm font-semibold text-foreground"
              >
                Qbox
              </motion.span>
            )}
          </AnimatePresence>
        </Link>
        <button
          onClick={onToggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          {collapsed ? <Menu size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-4">
        <ul className="flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-primary"
                      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                    />
                  )}
                  <item.icon
                    size={20}
                    className={isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}
                  />
                  <AnimatePresence mode="wait">
                    {!collapsed && (
                      <motion.span
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -8 }}
                        transition={{ duration: 0.15 }}
                        className="whitespace-nowrap"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t border-border p-2">
        <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
          <LogOut size={20} />
          <AnimatePresence mode="wait">
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                Logout
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </motion.aside>
  );
}

type Profile = { first_name: string | null; last_name: string | null; role: string | null };

function Header({ sidebarWidth }: { sidebarWidth: number }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [authName, setAuthName] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (cancelled || !user) return;
      setEmail(user.email ?? null);
      const meta = user.user_metadata ?? {};
      const fromMeta = [meta.first_name, meta.last_name].filter(Boolean).join(" ").trim();
      if (fromMeta) setAuthName(fromMeta);
      const { data: p } = await supabase
        .from("profiles")
        .select("first_name, last_name, role")
        .eq("id", user.id)
        .single();
      if (!cancelled && p) setProfile(p);
    })();
    return () => { cancelled = true; };
  }, []);

  const nameFromProfile = profile
    ? [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim()
    : "";
  const displayName = nameFromProfile || authName || email || "…";
  const roleLabel = profile?.role ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1) : "…";
  const initial = displayName !== "…" ? (displayName.charAt(0).toUpperCase() || "?") : "?";

  return (
    <header
      className="fixed right-0 top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card/80 px-6 backdrop-blur-xl"
      style={{ left: sidebarWidth }}
    >
      {/* Search */}
      <div className="relative max-w-md flex-1">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <input
          type="text"
          placeholder="Search stations, members, tournaments..."
          className="h-9 w-full rounded-lg border border-border bg-secondary/50 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
        />
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        <NotificationsDropdown />
        <div className="h-6 w-px bg-border" />
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
            {initial}
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium text-foreground">{displayName}</p>
            <p className="text-xs text-muted-foreground">{roleLabel}</p>
          </div>
        </div>
      </div>
    </header>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const sidebarWidth = collapsed ? 72 : 260;

  return (
    <div className="min-h-screen bg-background font-portal">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <Header sidebarWidth={sidebarWidth} />
      <motion.main
        animate={{ marginLeft: sidebarWidth }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className="min-h-screen pt-16"
      >
        <div className="p-6">{children}</div>
      </motion.main>
    </div>
  );
}
