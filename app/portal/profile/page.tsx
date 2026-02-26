"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  Bell,
  CreditCard,
  LogOut,
  Save,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePortalMe } from "@/app/portal/portal-me-context";
import { createClient } from "@/lib/supabase/client";
import { PushNotificationToggle } from "@/components/push-notification-toggle";

export default function ProfilePage() {
  const router = useRouter();
  const { data: me, loading: meLoading, refetch } = usePortalMe();
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [first_name, setFirst_name] = useState("");
  const [last_name, setLast_name] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState({
    bookingReminders: true,
    tournamentAlerts: true,
    rewardUpdates: false,
    promotions: true,
  });

  useEffect(() => {
    if (me?.profile) {
      setFirst_name(me.profile.first_name ?? "");
      setLast_name(me.profile.last_name ?? "");
      setEmail(me.profile.email ?? "");
      setPhone(me.profile.phone ?? "");
    }
  }, [me?.profile?.id, me?.profile?.first_name, me?.profile?.last_name, me?.profile?.email, me?.profile?.phone]);

  const toggleNotification = (key: string) => {
    setNotifications((prev) => ({
      ...prev,
      [key]: !prev[key as keyof typeof prev],
    }));
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const r = await fetch("/api/portal/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: first_name.trim() || null,
          last_name: last_name.trim() || null,
          email: email.trim() || null,
          phone: phone.trim() || null,
        }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error ?? "Failed to save");
      await refetch();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Profile & Settings
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your account and preferences
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Personal info */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="rounded-xl border border-border bg-card p-6"
        >
          <h3 className="mb-6 text-sm font-semibold text-foreground">
            Personal Information
          </h3>
          {meLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : (
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  First name
                </label>
                <div className="relative">
                  <User
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                  <input
                    type="text"
                    value={first_name}
                    onChange={(e) => setFirst_name(e.target.value)}
                    className="h-11 w-full rounded-lg border border-border bg-secondary/50 pl-10 pr-4 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Last name
                </label>
                <div className="relative">
                  <User
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                  <input
                    type="text"
                    value={last_name}
                    onChange={(e) => setLast_name(e.target.value)}
                    className="h-11 w-full rounded-lg border border-border bg-secondary/50 pl-10 pr-4 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Email
                </label>
                <div className="relative">
                  <Mail
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11 w-full rounded-lg border border-border bg-secondary/50 pl-10 pr-4 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Phone number
                </label>
                <div className="relative">
                  <Phone
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="h-11 w-full rounded-lg border border-border bg-secondary/50 pl-10 pr-4 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
                  />
                </div>
              </div>
              {saveError && (
                <p className="text-sm text-destructive">{saveError}</p>
              )}
              <button
                type="button"
                disabled={saving}
                onClick={handleSaveProfile}
                className="btn-premium-orange flex h-10 items-center justify-center gap-2 rounded-lg text-sm font-bold uppercase tracking-wider text-primary-foreground disabled:opacity-50"
              >
                <Save size={14} />
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          )}
        </motion.div>

        {/* Change password */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="rounded-xl border border-border bg-card p-6"
        >
          <h3 className="mb-6 text-sm font-semibold text-foreground">
            Change Password
          </h3>
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Current password
              </label>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <input
                  type={showOld ? "text" : "password"}
                  placeholder="Enter current password"
                  className="h-11 w-full rounded-lg border border-border bg-secondary/50 pl-10 pr-11 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
                />
                <button
                  type="button"
                  onClick={() => setShowOld(!showOld)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                >
                  {showOld ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                New password
              </label>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <input
                  type={showNew ? "text" : "password"}
                  placeholder="Enter new password"
                  className="h-11 w-full rounded-lg border border-border bg-secondary/50 pl-10 pr-11 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                >
                  {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Confirm new password
              </label>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <input
                  type="password"
                  placeholder="Repeat new password"
                  className="h-11 w-full rounded-lg border border-border bg-secondary/50 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
                />
              </div>
            </div>

            <button className="flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-secondary text-sm font-bold uppercase tracking-wider text-foreground transition-colors hover:bg-secondary/80">
              <Lock size={14} />
              Update Password
            </button>
          </div>
        </motion.div>

        {/* Notification preferences */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="rounded-xl border border-border bg-card p-6"
        >
          <h3 className="mb-6 flex items-center gap-2 text-sm font-semibold text-foreground">
            <Bell size={16} />
            Notifications
          </h3>
          <div className="flex flex-col gap-4">
            <PushNotificationToggle />
            {[
              {
                key: "bookingReminders",
                label: "Booking Reminders",
                desc: "Get notified before your sessions",
              },
              {
                key: "tournamentAlerts",
                label: "Tournament Alerts",
                desc: "New tournaments and registration deadlines",
              },
              {
                key: "rewardUpdates",
                label: "Reward Updates",
                desc: "When new rewards are available",
              },
              {
                key: "promotions",
                label: "Promotions",
                desc: "Special offers and discounts",
              },
            ].map((item) => (
              <div
                key={item.key}
                className="flex items-center justify-between rounded-lg bg-secondary/30 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {item.label}
                  </p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
                <button
                  onClick={() => toggleNotification(item.key)}
                  className={`relative h-6 w-11 rounded-full transition-colors ${
                    notifications[item.key as keyof typeof notifications]
                      ? "bg-primary"
                      : "bg-secondary"
                  }`}
                >
                  <motion.div
                    animate={{
                      x: notifications[item.key as keyof typeof notifications]
                        ? 20
                        : 2,
                    }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-1 h-4 w-4 rounded-full bg-foreground"
                  />
                </button>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Payment methods – no backend yet */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="rounded-xl border border-border bg-card p-6"
        >
          <h3 className="mb-6 flex items-center gap-2 text-sm font-semibold text-foreground">
            <CreditCard size={16} />
            Payment Methods
          </h3>
          <div className="flex flex-col gap-3">
            <p className="rounded-lg bg-secondary/30 px-4 py-3 text-sm text-muted-foreground">
              No payment methods on file. Pay at the lounge when you visit.
            </p>
          </div>
        </motion.div>
      </div>

      {/* Logout */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.4 }}
        className="flex justify-end"
      >
        <button
          type="button"
          onClick={async () => {
            await createClient().auth.signOut();
            router.push("/login");
            router.refresh();
          }}
          className="flex items-center gap-2 rounded-lg border border-destructive/20 px-5 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
        >
          <LogOut size={16} />
          Logout
        </button>
      </motion.div>
    </div>
  );
}
