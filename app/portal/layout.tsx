"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  LayoutDashboard,
  CreditCard,
  Gift,
  CalendarClock,
  Trophy,
  History,
  UserCog,
  Bell,
  ChevronLeft,
  Menu,
  LogOut,
} from "lucide-react";
import { usePortalMe } from "@/app/portal/portal-me-context";
import { getTierStyle } from "@/app/portal/tier-styles";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/portal" },
  { label: "My Card", icon: CreditCard, href: "/portal/card" },
  { label: "Rewards", icon: Gift, href: "/portal/rewards" },
  { label: "Bookings", icon: CalendarClock, href: "/portal/bookings" },
  { label: "Tournaments", icon: Trophy, href: "/portal/tournaments" },
  { label: "Activity", icon: History, href: "/portal/activity" },
  { label: "Profile & Settings", icon: UserCog, href: "/portal/profile" },
];

function Sidebar({
  collapsed,
  onToggle,
  mobileOpen,
  onMobileClose,
}: {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: me } = usePortalMe();

  const handleLogout = async () => {
    await createClient().auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onMobileClose}
            className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      <motion.aside
        animate={{
          width: collapsed ? 72 : 260,
          x: typeof window !== "undefined" && window.innerWidth < 1024 ? (mobileOpen ? 0 : -260) : 0,
        }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className="fixed left-0 top-0 z-50 flex h-screen flex-col border-r border-border bg-card lg:z-40"
      >
        {/* Logo area – Qbox logo top left */}
        <div className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-border px-3">
          <Link href="/portal" className="flex min-w-0 flex-1 items-center justify-center overflow-hidden md:justify-start">
            <Image
              src="/images/QBOX_logo_upscaled.png"
              alt="Qbox"
              width={120}
              height={120}
              className={`shrink-0 object-contain object-left ${collapsed ? "h-8 w-8" : "h-10 w-auto"}`}
              priority
            />
          </Link>
          <button
            onClick={onToggle}
            className="hidden h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground lg:flex"
          >
            {collapsed ? <Menu size={18} /> : <ChevronLeft size={18} />}
          </button>
          <button
            onClick={onMobileClose}
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground lg:hidden"
          >
            <ChevronLeft size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-2 py-4">
          <ul className="flex flex-col gap-1">
            {navItems.map((item) => {
              const isActive =
                item.href === "/portal"
                  ? pathname === "/portal"
                  : pathname.startsWith(item.href);

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onMobileClose}
                    className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="portal-sidebar-active"
                        className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-primary"
                        transition={{
                          duration: 0.3,
                          ease: [0.4, 0, 0.2, 1],
                        }}
                      />
                    )}
                    <item.icon
                      size={20}
                      className={
                        isActive
                          ? "text-primary"
                          : "text-muted-foreground group-hover:text-foreground"
                      }
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

        {/* Tier badge + Logout – color reflects user's card tier */}
        <div className="border-t border-border p-3">
          <AnimatePresence mode="wait">
            {!collapsed && me && (() => {
              const style = getTierStyle(me.profile.card_tier_id);
              return (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className={`mb-3 rounded-lg px-3 py-2 ${style.badgeBg}`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${style.badgeDot}`} />
                    <span className={`text-xs font-bold uppercase tracking-wider ${style.badgeText}`}>
                      {me.profile.tier_name} Member
                    </span>
                  </div>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">
                    {me.profile.points.toLocaleString()} points
                  </p>
                </motion.div>
              );
            })()}
          </AnimatePresence>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
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
    </>
  );
}

function Header({
  sidebarWidth,
  onMenuClick,
}: {
  sidebarWidth: number;
  onMenuClick: () => void;
}) {
  const { data: me } = usePortalMe();
  const [left, setLeft] = useState(0);
  useEffect(() => {
    const update = () => setLeft(window.innerWidth >= 1024 ? sidebarWidth : 0);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [sidebarWidth]);

  const initial = me?.profile.short_name?.charAt(0)?.toUpperCase() ?? "?";
  const tierStyle = getTierStyle(me?.profile.card_tier_id ?? null);

  return (
    <header
      className="fixed right-0 top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card/80 px-4 backdrop-blur-xl lg:px-6"
      style={{ left }}
    >
      <button
        onClick={onMenuClick}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground lg:hidden"
      >
        <Menu size={20} />
      </button>

      <div className="hidden lg:block" />

      <div className="flex items-center gap-4">
        <button className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
          <Bell size={18} />
        </button>
        <div className="h-6 w-px bg-border" />
        <div className="flex items-center gap-3">
          <div className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${tierStyle.avatarBg} ${tierStyle.avatarText}`}>
            {initial}
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium text-foreground">
              {me?.profile.short_name ?? "…"}
            </p>
            <p className="text-xs text-muted-foreground">
              {me?.profile.tier_name ?? "…"} Member
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}

import { PortalMeProvider } from "@/app/portal/portal-me-context";

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const sidebarWidth = collapsed ? 72 : 260;

  return (
    <PortalMeProvider>
    <div className="min-h-screen bg-background font-portal">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <Header
        sidebarWidth={sidebarWidth}
        onMenuClick={() => setMobileOpen(true)}
      />
      <motion.main
        animate={{ marginLeft: sidebarWidth }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className="hidden min-h-screen pt-16 lg:block"
      >
        <div className="p-6">{children}</div>
      </motion.main>
      {/* Mobile main - no margin */}
      <main className="min-h-screen pt-16 lg:hidden">
        <div className="p-4">{children}</div>
      </main>
    </div>
    </PortalMeProvider>
  );
}
