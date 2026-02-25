"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Bell, Check, Loader2, CalendarClock, AlertCircle, Users, Trophy, DollarSign, Wrench, Info } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export type NotificationItem = {
  id: string;
  title: string;
  message: string;
  type: string;
  link_url: string | null;
  created_at: string;
  read: boolean;
};

const typeIcons: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  session_alert: CalendarClock,
  low_station: AlertCircle,
  tournament: Trophy,
  revenue: DollarSign,
  new_member: Users,
  maintenance: Wrench,
  info: Info,
};

function formatTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3600_000);
  const diffDays = Math.floor(diffMs / 86400_000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString();
}

export function NotificationsDropdown() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [list, setList] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard/notifications", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setList(data.notifications ?? []);
      setUnreadCount(data.unread_count ?? 0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) fetchNotifications();
  }, [open, fetchNotifications]);

  const markRead = async (notificationId: string) => {
    await fetch("/api/dashboard/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notification_id: notificationId }),
    });
    setList((prev) => prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)));
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  const markAllRead = async () => {
    await fetch("/api/dashboard/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mark_all: true }),
    });
    setList((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const handleNotificationClick = (n: NotificationItem) => {
    if (!n.read) markRead(n.id);
    if (n.link_url) {
      setOpen(false);
      router.push(n.link_url);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          aria-label="Notifications"
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-2 min-w-[8px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent id="dashboard-notifications-popover" align="end" className="w-[380px] p-0" sideOffset={8}>
        <div className="border-b border-border px-4 py-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
            {list.some((n) => !n.read) && (
              <button
                type="button"
                onClick={markAllRead}
                className="text-xs text-primary hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>
        </div>
        <div className="max-h-[360px] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="animate-spin text-muted-foreground" />
            </div>
          ) : list.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No notifications yet</p>
          ) : (
            <ul className="divide-y divide-border">
              {list.map((n) => {
                const Icon = typeIcons[n.type] ?? Info;
                return (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => handleNotificationClick(n)}
                      className={`flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-secondary/50 ${!n.read ? "bg-primary/5" : ""}`}
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-muted-foreground">
                        <Icon size={16} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground">{n.title}</p>
                        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{n.message}</p>
                        <p className="mt-1 text-[10px] text-muted-foreground/80">{formatTime(n.created_at)}</p>
                      </div>
                      {!n.read && (
                        <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" aria-hidden />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
