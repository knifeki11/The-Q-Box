"use client";

import { motion } from "framer-motion";
import { Settings, Clock, DollarSign, Bell, Palette, Save, Monitor } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

const DAY_NAMES: Record<number, { en: string; ar: string }> = {
  0: { en: "Sunday", ar: "الأحد" },
  1: { en: "Monday", ar: "الإثنين" },
  2: { en: "Tuesday", ar: "الثلاثاء" },
  3: { en: "Wednesday", ar: "الأربعاء" },
  4: { en: "Thursday", ar: "الخميس" },
  5: { en: "Friday", ar: "الجمعة" },
  6: { en: "Saturday", ar: "السبت" },
};

const settingsT = {
  title: { en: "Settings", ar: "الإعدادات" },
  subtitle: { en: "Business configuration and preferences", ar: "إعدادات العمل والتفضيلات" },
  saveChanges: { en: "Save Changes", ar: "حفظ التغييرات" },
  pricingRules: { en: "Pricing Rules", ar: "قواعد التسعير" },
  standardRate: { en: "Standard rate", ar: "السعر العادي" },
  perHour: { en: "Per hour", ar: "في الساعة" },
  goldRate: { en: "Gold member rate", ar: "سعر عضو الذهبي" },
  goldDesc: { en: "Discounted rate", ar: "سعر مخفض" },
  blackRate: { en: "Black member rate", ar: "سعر عضو الأسود" },
  blackDesc: { en: "Premium discount", ar: "خصم مميز" },
  weekendSurcharge: { en: "Weekend surcharge", ar: "إضافة عطلة نهاية الأسبوع" },
  xbox: { en: "Xbox", ar: "إكس بوكس" },
  standardPs5: { en: "Standard PS5", ar: "بلايستيشن 5 عادي" },
  premiumPs5: { en: "PS5 Premium (VIP)", ar: "بلايستيشن 5 بريميوم (VIP)" },
  onePlayer: { en: "1 player", ar: "لاعب واحد" },
  fourPlayers: { en: "4 players", ar: "4 لاعبين" },
  openingHours: { en: "Opening Hours", ar: "ساعات العمل" },
  notifications: { en: "Notifications", ar: "الإشعارات" },
  sessionAlerts: { en: "Session alerts", ar: "تنبيهات الجلسات" },
  sessionAlertsDesc: { en: "Notify when sessions end", ar: "إشعار عند انتهاء الجلسات" },
  lowStationAlerts: { en: "Low station alerts", ar: "تنبيه المحطات المشغولة" },
  lowStationDesc: { en: "When most stations are full", ar: "عند امتلاء معظم المحطات" },
  tournamentReminders: { en: "Tournament reminders", ar: "تذكيرات البطولات" },
  tournamentDesc: { en: "Upcoming tournament alerts", ar: "تنبيهات البطولات القادمة" },
  revenueMilestones: { en: "Revenue milestones", ar: "معالم الإيرادات" },
  revenueDesc: { en: "Daily revenue target alerts", ar: "تنبيهات أهداف الإيرادات اليومية" },
  newMemberAlerts: { en: "New member alerts", ar: "تنبيه الأعضاء الجدد" },
  newMemberDesc: { en: "Notify on new signups", ar: "إشعار عند التسجيلات الجديدة" },
  stationDefaults: { en: "Station Defaults", ar: "إعدادات المحطات الافتراضية" },
  defaultSessionLength: { en: "Default session length", ar: "مدة الجلسة الافتراضية" },
  minutes: { en: "minutes", ar: "دقيقة" },
  autoEndWarning: { en: "Auto-end warning", ar: "تحذير انتهاء تلقائي" },
  autoEndDesc: { en: "Minutes before auto-end", ar: "دقائق قبل الانتهاء التلقائي" },
  autoExtend: { en: "Auto-extend sessions", ar: "تمديد الجلسات تلقائياً" },
  maintenanceAlerts: { en: "Maintenance mode alerts", ar: "تنبيهات وضع الصيانة" },
  branding: { en: "Branding", ar: "الهوية البصرية" },
  primaryColor: { en: "Primary Color", ar: "اللون الأساسي" },
  background: { en: "Background", ar: "الخلفية" },
  cardBackground: { en: "Card Background", ar: "خلفية البطاقة" },
  madPerHr: { en: "MAD/hr", ar: "درهم/ساعة" },
  loading: { en: "Loading…", ar: "جاري التحميل…" },
  saved: { en: "Settings saved", ar: "تم حفظ الإعدادات" },
  saveFailed: { en: "Failed to save settings", ar: "فشل حفظ الإعدادات" },
  loadFailed: { en: "Failed to load settings", ar: "فشل تحميل الإعدادات" },
};

function SettingGroup({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      variants={item}
      className="rounded-xl border border-border bg-card p-5"
    >
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
          <Icon size={16} className="text-primary" />
        </div>
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      </div>
      <div className="flex flex-col gap-4">{children}</div>
    </motion.div>
  );
}

function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg bg-secondary/30 px-4 py-3">
      <div>
        <p className="text-sm text-foreground">{label}</p>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      {children}
    </div>
  );
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="relative inline-flex cursor-pointer items-center">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="peer sr-only"
      />
      <div className="h-5 w-9 rounded-full bg-secondary transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-muted-foreground after:transition-transform peer-checked:bg-primary peer-checked:after:translate-x-4 peer-checked:after:bg-primary-foreground" />
    </label>
  );
}

type PricingByType = {
  xbox: { price_1_mad: number; price_4_mad: number | null };
  standard_ps5: { price_1_mad: number; price_4_mad: number | null };
  premium_ps5: { price_1_mad: number; price_4_mad: number | null };
};

type SettingsState = {
  pricing: {
    standard_rate_mad: number;
    gold_rate_mad: number;
    black_rate_mad: number;
    gold_discount_percent: number;
    black_discount_percent: number;
    weekend_surcharge_mad: number;
  };
  pricing_by_type: PricingByType;
  session: {
    default_session_minutes: number;
    auto_end_warning_minutes: number;
    auto_extend_sessions: boolean;
  };
  notifications: {
    session_alerts: boolean;
    low_station_alerts: boolean;
    tournament_reminders: boolean;
    revenue_milestones: boolean;
    new_member_alerts: boolean;
    maintenance_alerts: boolean;
  };
  opening_hours: { day_of_week: number; open_time: string; close_time: string }[];
};

const defaultPricingByType: PricingByType = {
  xbox: { price_1_mad: 20, price_4_mad: null },
  standard_ps5: { price_1_mad: 40, price_4_mad: 55 },
  premium_ps5: { price_1_mad: 50, price_4_mad: 70 },
};

const defaultSettings: SettingsState = {
  pricing: {
    standard_rate_mad: 40,
    gold_rate_mad: 36,
    black_rate_mad: 30,
    gold_discount_percent: 10,
    black_discount_percent: 25,
    weekend_surcharge_mad: 0,
  },
  pricing_by_type: defaultPricingByType,
  session: {
    default_session_minutes: 60,
    auto_end_warning_minutes: 5,
    auto_extend_sessions: false,
  },
  notifications: {
    session_alerts: true,
    low_station_alerts: true,
    tournament_reminders: true,
    revenue_milestones: false,
    new_member_alerts: true,
    maintenance_alerts: true,
  },
  opening_hours: [],
};

export default function SettingsPage() {
  const lang: "en" | "ar" = "en";
  const t = settingsT;
  const [data, setData] = useState<SettingsState>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard/settings", { cache: "no-store" });
      if (!res.ok) {
        toast.error(t.loadFailed[lang]);
        return;
      }
      const json = await res.json();
      const hours = Array.isArray(json.opening_hours) && json.opening_hours.length > 0
        ? json.opening_hours
        : Array.from({ length: 7 }, (_, i) => ({ day_of_week: i, open_time: i === 0 || i === 6 ? "10:00" : "12:00", close_time: i === 5 || i === 6 ? "01:00" : "23:00" }));
      setData({
        pricing: json.pricing ?? defaultSettings.pricing,
        pricing_by_type: json.pricing_by_type ?? defaultSettings.pricing_by_type,
        session: json.session ?? defaultSettings.session,
        notifications: json.notifications ?? defaultSettings.notifications,
        opening_hours: hours,
      });
    } catch {
      toast.error(t.loadFailed[lang]);
    } finally {
      setLoading(false);
    }
  }, [lang, t.loadFailed]);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/dashboard/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          standard_rate_mad: data.pricing.standard_rate_mad,
          weekend_surcharge_mad: data.pricing.weekend_surcharge_mad,
          pricing_by_type: data.pricing_by_type,
          default_session_minutes: data.session.default_session_minutes,
          auto_end_warning_minutes: data.session.auto_end_warning_minutes,
          auto_extend_sessions: data.session.auto_extend_sessions,
          session_alerts: data.notifications.session_alerts,
          low_station_alerts: data.notifications.low_station_alerts,
          tournament_reminders: data.notifications.tournament_reminders,
          revenue_milestones: data.notifications.revenue_milestones,
          new_member_alerts: data.notifications.new_member_alerts,
          maintenance_alerts: data.notifications.maintenance_alerts,
          opening_hours: data.opening_hours,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err?.error || t.saveFailed[lang]);
        return;
      }
      const updated = await res.json();
      setData({
        pricing: updated.pricing ?? data.pricing,
        pricing_by_type: updated.pricing_by_type ?? data.pricing_by_type,
        session: updated.session ?? data.session,
        notifications: updated.notifications ?? data.notifications,
        opening_hours: Array.isArray(updated.opening_hours) ? updated.opening_hours : data.opening_hours,
      });
      toast.success(t.saved[lang]);
    } catch {
      toast.error(t.saveFailed[lang]);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center text-muted-foreground">
        {t.loading[lang]}
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
          <h1 className="text-2xl font-bold text-foreground">{t.title[lang]}</h1>
          <p className="text-sm text-muted-foreground">{t.subtitle[lang]}</p>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          <Save size={16} />
          {saving ? "…" : t.saveChanges[lang]}
        </button>
      </motion.div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SettingGroup title={t.pricingRules[lang]} icon={DollarSign}>
          <SettingRow label={t.xbox[lang]} description={t.onePlayer[lang]}>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min={0}
                step={0.5}
                value={data.pricing_by_type.xbox.price_1_mad}
                onChange={(e) =>
                  setData((d) => ({
                    ...d,
                    pricing_by_type: {
                      ...d.pricing_by_type,
                      xbox: { ...d.pricing_by_type.xbox, price_1_mad: Number(e.target.value) || 0 },
                    },
                  }))
                }
                className="h-8 w-24 rounded-md border border-border bg-background px-2 text-right text-sm text-foreground focus:border-primary/50 focus:outline-none"
              />
              <span className="text-xs text-muted-foreground">{t.madPerHr[lang]}</span>
            </div>
          </SettingRow>
          <SettingRow label={t.xbox[lang]} description={t.fourPlayers[lang]}>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min={0}
                step={0.5}
                value={data.pricing_by_type.xbox.price_4_mad ?? ""}
                placeholder="—"
                onChange={(e) => {
                  const v = e.target.value === "" ? null : Number(e.target.value) || 0;
                  setData((d) => ({
                    ...d,
                    pricing_by_type: {
                      ...d.pricing_by_type,
                      xbox: { ...d.pricing_by_type.xbox, price_4_mad: v },
                    },
                  }));
                }}
                className="h-8 w-24 rounded-md border border-border bg-background px-2 text-right text-sm text-foreground focus:border-primary/50 focus:outline-none"
              />
              <span className="text-xs text-muted-foreground">{t.madPerHr[lang]}</span>
            </div>
          </SettingRow>
          <SettingRow label={t.standardPs5[lang]} description={t.onePlayer[lang]}>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min={0}
                step={0.5}
                value={data.pricing_by_type.standard_ps5.price_1_mad}
                onChange={(e) =>
                  setData((d) => ({
                    ...d,
                    pricing_by_type: {
                      ...d.pricing_by_type,
                      standard_ps5: { ...d.pricing_by_type.standard_ps5, price_1_mad: Number(e.target.value) || 0 },
                    },
                  }))
                }
                className="h-8 w-24 rounded-md border border-border bg-background px-2 text-right text-sm text-foreground focus:border-primary/50 focus:outline-none"
              />
              <span className="text-xs text-muted-foreground">{t.madPerHr[lang]}</span>
            </div>
          </SettingRow>
          <SettingRow label={t.standardPs5[lang]} description={t.fourPlayers[lang]}>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min={0}
                step={0.5}
                value={data.pricing_by_type.standard_ps5.price_4_mad ?? ""}
                onChange={(e) =>
                  setData((d) => ({
                    ...d,
                    pricing_by_type: {
                      ...d.pricing_by_type,
                      standard_ps5: { ...d.pricing_by_type.standard_ps5, price_4_mad: e.target.value === "" ? null : Number(e.target.value) || 0 },
                    },
                  }))
                }
                className="h-8 w-24 rounded-md border border-border bg-background px-2 text-right text-sm text-foreground focus:border-primary/50 focus:outline-none"
              />
              <span className="text-xs text-muted-foreground">{t.madPerHr[lang]}</span>
            </div>
          </SettingRow>
          <SettingRow label={t.premiumPs5[lang]} description={t.onePlayer[lang]}>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min={0}
                step={0.5}
                value={data.pricing_by_type.premium_ps5.price_1_mad}
                onChange={(e) =>
                  setData((d) => ({
                    ...d,
                    pricing_by_type: {
                      ...d.pricing_by_type,
                      premium_ps5: { ...d.pricing_by_type.premium_ps5, price_1_mad: Number(e.target.value) || 0 },
                    },
                  }))
                }
                className="h-8 w-24 rounded-md border border-border bg-background px-2 text-right text-sm text-foreground focus:border-primary/50 focus:outline-none"
              />
              <span className="text-xs text-muted-foreground">{t.madPerHr[lang]}</span>
            </div>
          </SettingRow>
          <SettingRow label={t.premiumPs5[lang]} description={t.fourPlayers[lang]}>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min={0}
                step={0.5}
                value={data.pricing_by_type.premium_ps5.price_4_mad ?? ""}
                onChange={(e) =>
                  setData((d) => ({
                    ...d,
                    pricing_by_type: {
                      ...d.pricing_by_type,
                      premium_ps5: { ...d.pricing_by_type.premium_ps5, price_4_mad: e.target.value === "" ? null : Number(e.target.value) || 0 },
                    },
                  }))
                }
                className="h-8 w-24 rounded-md border border-border bg-background px-2 text-right text-sm text-foreground focus:border-primary/50 focus:outline-none"
              />
              <span className="text-xs text-muted-foreground">{t.madPerHr[lang]}</span>
            </div>
          </SettingRow>
        </SettingGroup>

        <SettingGroup title={t.openingHours[lang]} icon={Clock}>
          {(data.opening_hours.length ? data.opening_hours : Array.from({ length: 7 }, (_, i) => ({ day_of_week: i, open_time: "12:00", close_time: "23:00" })))
            .sort((a, b) => a.day_of_week - b.day_of_week)
            .map((row) => {
              const updateHours = (patch: Partial<typeof row>) =>
                setData((d) => {
                  const list = d.opening_hours.length ? d.opening_hours : Array.from({ length: 7 }, (_, i) => ({ day_of_week: i, open_time: "12:00", close_time: "23:00" }));
                  return { ...d, opening_hours: list.map((h) => (h.day_of_week === row.day_of_week ? { ...h, ...patch } : h)) };
                });
              return (
                <SettingRow key={row.day_of_week} label={DAY_NAMES[row.day_of_week]?.[lang] ?? `Day ${row.day_of_week}`}>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="09:00"
                      value={row.open_time}
                      onChange={(e) => updateHours({ open_time: e.target.value })}
                      className="h-8 w-20 rounded-md border border-border bg-background px-2 text-right text-sm text-foreground focus:border-primary/50 focus:outline-none"
                    />
                    <span className="text-muted-foreground">–</span>
                    <input
                      type="text"
                      placeholder="23:00"
                      value={row.close_time}
                      onChange={(e) => updateHours({ close_time: e.target.value })}
                      className="h-8 w-20 rounded-md border border-border bg-background px-2 text-right text-sm text-foreground focus:border-primary/50 focus:outline-none"
                    />
                  </div>
                </SettingRow>
              );
            })}
        </SettingGroup>

        <SettingGroup title={t.notifications[lang]} icon={Bell}>
          <SettingRow label={t.sessionAlerts[lang]} description={t.sessionAlertsDesc[lang]}>
            <Toggle
              checked={data.notifications.session_alerts}
              onChange={(v) => setData((d) => ({ ...d, notifications: { ...d.notifications, session_alerts: v } }))}
            />
          </SettingRow>
          <SettingRow label={t.lowStationAlerts[lang]} description={t.lowStationDesc[lang]}>
            <Toggle
              checked={data.notifications.low_station_alerts}
              onChange={(v) => setData((d) => ({ ...d, notifications: { ...d.notifications, low_station_alerts: v } }))}
            />
          </SettingRow>
          <SettingRow label={t.tournamentReminders[lang]} description={t.tournamentDesc[lang]}>
            <Toggle
              checked={data.notifications.tournament_reminders}
              onChange={(v) => setData((d) => ({ ...d, notifications: { ...d.notifications, tournament_reminders: v } }))}
            />
          </SettingRow>
          <SettingRow label={t.revenueMilestones[lang]} description={t.revenueDesc[lang]}>
            <Toggle
              checked={data.notifications.revenue_milestones}
              onChange={(v) => setData((d) => ({ ...d, notifications: { ...d.notifications, revenue_milestones: v } }))}
            />
          </SettingRow>
          <SettingRow label={t.newMemberAlerts[lang]} description={t.newMemberDesc[lang]}>
            <Toggle
              checked={data.notifications.new_member_alerts}
              onChange={(v) => setData((d) => ({ ...d, notifications: { ...d.notifications, new_member_alerts: v } }))}
            />
          </SettingRow>
        </SettingGroup>

        <SettingGroup title={t.stationDefaults[lang]} icon={Monitor}>
          <SettingRow label={t.defaultSessionLength[lang]}>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min={1}
                value={data.session.default_session_minutes}
                onChange={(e) =>
                  setData((d) => ({
                    ...d,
                    session: { ...d.session, default_session_minutes: Number(e.target.value) || 1 },
                  }))
                }
                className="h-8 w-20 rounded-md border border-border bg-background px-2 text-right text-sm text-foreground focus:border-primary/50 focus:outline-none"
              />
              <span className="text-xs text-muted-foreground">{t.minutes[lang]}</span>
            </div>
          </SettingRow>
          <SettingRow label={t.autoEndWarning[lang]} description={t.autoEndDesc[lang]}>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min={0}
                value={data.session.auto_end_warning_minutes}
                onChange={(e) =>
                  setData((d) => ({
                    ...d,
                    session: { ...d.session, auto_end_warning_minutes: Number(e.target.value) || 0 },
                  }))
                }
                className="h-8 w-20 rounded-md border border-border bg-background px-2 text-right text-sm text-foreground focus:border-primary/50 focus:outline-none"
              />
              <span className="text-xs text-muted-foreground">{t.minutes[lang]}</span>
            </div>
          </SettingRow>
          <SettingRow label={t.autoExtend[lang]}>
            <Toggle
              checked={data.session.auto_extend_sessions}
              onChange={(v) => setData((d) => ({ ...d, session: { ...d.session, auto_extend_sessions: v } }))}
            />
          </SettingRow>
          <SettingRow label={t.maintenanceAlerts[lang]}>
            <Toggle
              checked={data.notifications.maintenance_alerts}
              onChange={(v) => setData((d) => ({ ...d, notifications: { ...d.notifications, maintenance_alerts: v } }))}
            />
          </SettingRow>
        </SettingGroup>
      </div>

      <SettingGroup title={t.branding[lang]} icon={Palette}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-muted-foreground">{t.primaryColor[lang]}</label>
            <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
              <div className="h-5 w-5 rounded-full bg-primary" />
              <span className="text-sm text-foreground">#FF6A00</span>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-muted-foreground">{t.background[lang]}</label>
            <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
              <div className="h-5 w-5 rounded-full border border-border bg-background" />
              <span className="text-sm text-foreground">#121212</span>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-muted-foreground">{t.cardBackground[lang]}</label>
            <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
              <div className="h-5 w-5 rounded-full border border-border bg-card" />
              <span className="text-sm text-foreground">#1A1A1A</span>
            </div>
          </div>
        </div>
      </SettingGroup>
    </motion.div>
  );
}
