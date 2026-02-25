"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Shield, Eye, Clock, Mail, Phone } from "lucide-react";

interface StaffMember {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  lastActive: string;
  permissions: string[];
}

const roleConfig: Record<string, { color: string; bg: string }> = {
  Owner: { color: "text-primary", bg: "bg-primary/10" },
  Manager: { color: "text-blue-400", bg: "bg-blue-500/10" },
  Admin: { color: "text-primary", bg: "bg-primary/10" },
  Staff: { color: "text-zinc-400", bg: "bg-zinc-500/10" },
};

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

export default function StaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/dashboard/staff")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Failed to load"))))
      .then((d) => { if (!cancelled) setStaff(Array.isArray(d) ? d : []); })
      .catch((e) => { if (!cancelled) setError(e instanceof Error ? e.message : "Failed"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Staff</h1>
          <p className="text-sm text-muted-foreground">Loading…</p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 animate-pulse rounded-xl border border-border bg-card" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Staff</h1>
          <p className="text-sm text-muted-foreground">Team members</p>
        </div>
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">{error}</div>
      </div>
    );
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="flex flex-col gap-6"
    >
      <motion.div variants={item} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Staff</h1>
          <p className="text-sm text-muted-foreground">{staff.length} team members</p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
          <Plus size={16} />
          Add Staff
        </button>
      </motion.div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {staff.map((s) => {
          const rc = roleConfig[s.role] ?? roleConfig.Staff;
          return (
            <motion.div
              key={s.id}
              variants={item}
              className="rounded-xl border border-border bg-card p-5 transition-all duration-300 hover:border-primary/30"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary text-sm font-bold text-foreground">
                  {s.name.split(" ").map((n) => n[0]).join("") || "—"}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{s.name}</p>
                  <span className={`text-xs font-medium ${rc.color}`}>{s.role}</span>
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Mail size={12} />
                  <span>{s.email}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Phone size={12} />
                  <span>{s.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock size={12} />
                  <span>Last active: {s.lastActive}</span>
                </div>
              </div>

              <div className="mt-4">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Shield size={11} />
                  <span>Permissions:</span>
                </div>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {s.permissions.map((p) => (
                    <span key={p} className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${rc.color} ${rc.bg}`}>
                      {p}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <button className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-secondary py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground">
                  <Eye size={12} /> View
                </button>
                <button className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-secondary py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground">
                  <Shield size={12} /> Permissions
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      <motion.div variants={item} className="rounded-xl border border-border bg-card p-5">
        <h2 className="mb-4 text-sm font-semibold text-foreground">Activity Log</h2>
        <p className="text-sm text-muted-foreground">No activity log available.</p>
      </motion.div>
    </motion.div>
  );
}
