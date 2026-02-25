"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  Monitor,
  Play,
  Square,
  Pause,
  CalendarClock,
  Wrench,
  Clock,
  User,
  LayoutGrid,
  List,
  ChevronDown,
  Plus,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

type StationStatus = "free" | "occupied" | "reserved" | "maintenance";
type StationType = "standard_ps5" | "premium_ps5" | "xbox";

interface Station {
  id: string;
  name: string;
  status: StationStatus;
  type: StationType;
  price_1_mad: number;
  price_4_mad: number | null;
  current_session?: {
    player_name: string;
    game: string | null;
    started_at: string;
    duration_minutes: number | null;
    member_ids?: string[];
    paused_at?: string | null;
  } | null;
}

function formatTimeRemaining(minutes: number | null): string {
  if (minutes == null) return "—";
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}min` : `${h}h`;
}

function formatElapsedMs(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function stationTypeLabel(type: StationType): string {
  switch (type) {
    case "standard_ps5":
      return "Standard PS5";
    case "premium_ps5":
      return "Premium PS5";
    case "xbox":
      return "Xbox";
    default:
      return type;
  }
}

function stationPriceLabel(price_1_mad: number, price_4_mad: number | null): string {
  const one = `${price_1_mad} MAD/h`;
  if (price_4_mad != null) return `${one} · ${price_4_mad} MAD/h (4p)`;
  return one;
}

const statusConfig: Record<StationStatus, { label: string; color: string; bg: string; border: string }> = {
  free: { label: "Free", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  occupied: { label: "Occupied", color: "text-primary", bg: "bg-primary/10", border: "border-primary/20" },
  reserved: { label: "Reserved", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
  maintenance: { label: "Maintenance", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
};

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

interface ClientOption {
  id: string;
  label: string;
  name?: string | null;
  email: string | null;
  phone?: string | null;
}

const startModalT = {
  en: {
    title: "Start session",
    client: "Client",
    noClient: "No client",
    addClient: "Add client...",
    noMatches: "No matches",
    are4: "Are 4",
    price: "Price",
    standard: "Standard",
    fourPlayers: "4 players",
    cancel: "Cancel",
    startSession: "Start session",
  },
  ar: {
    title: "بدء الجلسة",
    client: "العميل",
    noClient: "لا عميل",
    addClient: "إضافة عميل...",
    noMatches: "لا توجد نتائج",
    are4: "أربعة أشخاص",
    price: "السعر",
    standard: "عادي",
    fourPlayers: "٤ أشخاص",
    cancel: "إلغاء",
    startSession: "بدء الجلسة",
  },
} as const;

const stopModalT = {
  en: {
    title: "End session",
    duration: "Session duration",
    basePrice: "Base price",
    client: "Client",
    addClient: "Add client...",
    loadingClients: "Loading...",
    noClients: "No clients",
    noMatches: "No matches",
    are4: "Are 4",
    extraItems: "Extra items (MAD)",
    total: "Total",
    paymentStatus: "Payment",
    paid: "Paid",
    unpaid: "Unpaid",
    cancel: "Cancel",
    pause: "Pause",
    resume: "Resume",
    pausedLabel: "Paused",
    done: "Done",
    calcDuration: (min: number, sec: number) => `(${min} min ${sec} sec)`,
    calcBase: (min: string, rate: number) => `(${min} min × ${rate} MAD/h)`,
  },
  ar: {
    title: "إنهاء الجلسة",
    duration: "مدة الجلسة",
    basePrice: "السعر الأساسي",
    client: "العميل",
    addClient: "إضافة عميل...",
    loadingClients: "جاري التحميل...",
    noClients: "لا يوجد عملاء",
    noMatches: "لا توجد نتائج",
    are4: "أربعة أشخاص",
    extraItems: "إضافات (درهم)",
    total: "المجموع",
    paymentStatus: "الدفع",
    paid: "مدفوع",
    unpaid: "غير مدفوع",
    cancel: "إلغاء",
    pause: "إيقاف مؤقت",
    resume: "متابعة",
    pausedLabel: "متوقف",
    done: "تم",
    calcDuration: (min: number, sec: number) => `(${min} د ${sec} ث)`,
    calcBase: (min: string, rate: number) => `(${min} د × ${rate} درهم/س)`,
  },
} as const;

const reserveModalT = {
  en: {
    title: "Reserve station",
    startTime: "Start time",
    duration: "Duration",
    client: "Client",
    clientPlaceholder: "Search client...",
    noClient: "No client",
    estimatedCost: "Estimated cost",
    cancel: "Cancel",
    reserve: "Reserve",
  },
  ar: {
    title: "حجز المحطة",
    startTime: "وقت البداية",
    duration: "المدة",
    client: "العميل",
    clientPlaceholder: "بحث عن عميل...",
    noClient: "لا عميل",
    estimatedCost: "التكلفة التقديرية",
    cancel: "إلغاء",
    reserve: "حجز",
  },
} as const;

const DURATION_OPTIONS = [30, 60, 90, 120, 150, 180] as const; // minutes

function formatDurationOption(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}h ${m}min` : `${h}h`;
}

function ReserveModal({
  open,
  onOpenChange,
  station,
  clients,
  loadingClients,
  onConfirm,
  lang = "en",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  station: Station | null;
  clients: ClientOption[];
  loadingClients: boolean;
  onConfirm: (memberIds: string[], durationMinutes: number, startTimeIso: string) => void;
  lang?: "en" | "ar";
}) {
  const t = reserveModalT[lang];
  const getDefaultStart = () => {
    const d = new Date();
    d.setMinutes(Math.ceil(d.getMinutes() / 30) * 30, 0, 0);
    if (d.getMinutes() === 60) d.setHours(d.getHours() + 1, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  };
  const [startTime, setStartTime] = useState(() => getDefaultStart());
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [clientSearch, setClientSearch] = useState("");
  const [selectedClients, setSelectedClients] = useState<ClientOption[]>([]);
  const [listOpen, setListOpen] = useState(false);

  useEffect(() => {
    if (open) {
      setStartTime(getDefaultStart());
      setDurationMinutes(60);
      setClientSearch("");
      setSelectedClients([]);
      setListOpen(false);
    }
  }, [open]);

  const searchLower = clientSearch.trim().toLowerCase();
  const filteredClients = clients.filter(
    (c) =>
      !selectedClients.some((s) => s.id === c.id) &&
      (!searchLower ||
        (c.label?.toLowerCase().includes(searchLower)) ||
        (c.email?.toLowerCase().includes(searchLower)) ||
        (c.phone?.toLowerCase().includes(searchLower)))
  );

  const costMad = station
    ? Math.round(((durationMinutes / 60) * (station.price_1_mad ?? 0)) * 100) / 100
    : 0;

  const addClient = (c: ClientOption) => {
    if (c.id && selectedClients.some((s) => s.id === c.id)) return;
    setSelectedClients((prev) => [...prev, c]);
    setClientSearch("");
    setListOpen(false);
  };

  const removeClient = (id: string) => {
    setSelectedClients((prev) => prev.filter((c) => c.id !== id));
  };

  const handleConfirm = () => {
    if (!station) return;
    const start = new Date(startTime);
    const memberIds = selectedClients.map((c) => c.id).filter(Boolean);
    onConfirm(memberIds, durationMinutes, start.toISOString());
    onOpenChange(false);
  };

  if (!station) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-white/[0.08] bg-card shadow-2xl backdrop-blur-xl sm:rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {t.title} — {station.name}
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {t.startTime}
            </label>
            <input
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
              className="h-11 w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {t.duration}
            </label>
            <div className="flex flex-wrap gap-2">
              {DURATION_OPTIONS.map((min) => (
                <button
                  key={min}
                  type="button"
                  onClick={() => setDurationMinutes(min)}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                    durationMinutes === min
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-white/[0.12] bg-white/[0.04] text-muted-foreground hover:bg-white/[0.08] hover:text-foreground"
                  }`}
                >
                  {formatDurationOption(min)}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {t.client}
            </label>
            {selectedClients.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedClients.map((c) => (
                  <span
                    key={c.id}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.12] bg-white/[0.06] pl-2 pr-1 py-1 text-xs text-foreground"
                  >
                    {c.label}
                    <button
                      type="button"
                      onClick={() => removeClient(c.id)}
                      className="rounded p-0.5 text-muted-foreground hover:bg-white/[0.1] hover:text-foreground"
                      aria-label="Remove"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="relative flex gap-2">
              <input
                type="text"
                value={clientSearch}
                onChange={(e) => {
                  setClientSearch(e.target.value);
                  setListOpen(true);
                }}
                onFocus={() => setListOpen(true)}
                onBlur={() => setTimeout(() => setListOpen(false), 200)}
                placeholder={t.clientPlaceholder}
                disabled={loadingClients}
                className="h-11 flex-1 rounded-lg border border-white/[0.08] bg-white/[0.04] pl-3 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30 disabled:opacity-50"
              />
              <span className="text-xs text-muted-foreground self-center whitespace-nowrap">Add client</span>
              {listOpen && (
                <ul className="absolute left-0 right-0 top-full z-10 mt-1 max-h-48 overflow-auto rounded-lg border border-white/[0.08] bg-card py-1 shadow-xl">
                  {loadingClients ? (
                    <li className="px-3 py-2 text-sm text-muted-foreground">Loading...</li>
                  ) : filteredClients.length === 0 ? (
                    <li className="px-3 py-2 text-sm text-muted-foreground">No more clients or search</li>
                  ) : (
                    filteredClients.map((c) => (
                      <li key={c.id}>
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => addClient(c)}
                          className="w-full px-3 py-2 text-left hover:bg-white/[0.08]"
                        >
                          <span className="block text-sm font-medium text-foreground">{c.label}</span>
                          {(c.email || c.phone) && (
                            <span className="block text-xs text-muted-foreground truncate">
                              {[c.email, c.phone].filter(Boolean).join(" · ")}
                            </span>
                          )}
                        </button>
                      </li>
                    ))
                  )}
                </ul>
              )}
            </div>
          </div>
          <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2.5">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {t.estimatedCost}
            </p>
            <p className="mt-1 text-lg font-bold text-primary">{costMad.toFixed(2)} MAD</p>
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-lg border border-white/[0.12] bg-white/[0.04] px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-white/[0.08] hover:text-foreground"
          >
            {t.cancel}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {t.reserve}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function StartSessionModal({
  open,
  onOpenChange,
  station,
  clients,
  loadingClients,
  onConfirm,
  lang = "en",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  station: Station | null;
  clients: ClientOption[];
  loadingClients: boolean;
  onConfirm: (clientIds: string[], are4: boolean) => void;
  lang?: "en" | "ar";
}) {
  const [clientIds, setClientIds] = useState<string[]>([]);
  const [clientSearch, setClientSearch] = useState("");
  const [listOpen, setListOpen] = useState(false);
  const [are4, setAre4] = useState(false);
  const t = startModalT[lang];

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setClientIds([]);
      setClientSearch("");
      setListOpen(false);
      setAre4(false);
    }
    onOpenChange(next);
  };

  const addClient = (c: ClientOption) => {
    if (clientIds.includes(c.id)) return;
    setClientIds((prev) => [...prev, c.id]);
    setClientSearch("");
  };

  const removeClient = (id: string) => {
    setClientIds((prev) => prev.filter((x) => x !== id));
  };

  const handleConfirm = () => {
    onConfirm(clientIds, are4);
    handleOpenChange(false);
  };

  const availableClients = clients.filter((c) => !clientIds.includes(c.id));
  const searchLower = clientSearch.trim().toLowerCase();
  const filteredClients = availableClients.filter(
    (c) =>
      !searchLower ||
      (c.label?.toLowerCase().includes(searchLower)) ||
      (c.email?.toLowerCase().includes(searchLower)) ||
      (c.phone?.toLowerCase().includes(searchLower))
  );

  if (!station) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="border-white/[0.08] bg-card shadow-2xl backdrop-blur-xl sm:rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {t.title} — {station.name}
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {t.client}
            </label>
            {clientIds.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {clientIds.map((id) => {
                  const c = clients.find((x) => x.id === id);
                  return (
                    <span
                      key={id}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.12] bg-white/[0.06] pl-2 pr-1 py-1 text-xs text-foreground"
                    >
                      {c?.label ?? id}
                      <button
                        type="button"
                        onClick={() => removeClient(id)}
                        className="rounded p-0.5 text-muted-foreground hover:bg-white/[0.1] hover:text-foreground"
                        aria-label="Remove"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
            <div className="relative">
              <input
                type="text"
                value={clientSearch}
                onChange={(e) => {
                  setClientSearch(e.target.value);
                  setListOpen(true);
                }}
                onFocus={() => setListOpen(true)}
                onBlur={() => setTimeout(() => setListOpen(false), 200)}
                placeholder={t.addClient}
                disabled={loadingClients}
                className="h-11 w-full rounded-lg border border-white/[0.08] bg-white/[0.04] pl-3 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30 disabled:opacity-50"
              />
              {listOpen && (
                <ul className="absolute left-0 right-0 top-full z-10 mt-1 max-h-48 overflow-auto rounded-lg border border-white/[0.08] bg-card py-1 shadow-xl">
                  {loadingClients ? (
                    <li className="px-3 py-2 text-sm text-muted-foreground">{t.addClient}</li>
                  ) : filteredClients.length === 0 ? (
                    <li className="px-3 py-2 text-sm text-muted-foreground">
                      {availableClients.length === 0 ? t.noClient : t.noMatches}
                    </li>
                  ) : (
                    filteredClients.map((c) => (
                      <li key={c.id}>
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => addClient(c)}
                          className="w-full px-3 py-2 text-left hover:bg-white/[0.08]"
                        >
                          <span className="block text-sm font-medium text-foreground">{c.label}</span>
                          {(c.email || c.phone) && (
                            <span className="block text-xs text-muted-foreground truncate">
                              {[c.email, c.phone].filter(Boolean).join(" · ")}
                            </span>
                          )}
                        </button>
                      </li>
                    ))
                  )}
                </ul>
              )}
            </div>
          </div>
          <label
            className={`flex items-center gap-3 ${station.price_4_mad != null ? "cursor-pointer" : "cursor-not-allowed opacity-50"}`}
          >
            <div
              role="checkbox"
              tabIndex={station.price_4_mad != null ? 0 : -1}
              aria-checked={are4}
              aria-disabled={station.price_4_mad == null}
              onClick={() => station.price_4_mad != null && setAre4((v) => !v)}
              onKeyDown={(e) => {
                if (station.price_4_mad == null) return;
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setAre4((v) => !v);
                }
              }}
              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                are4 ? "border-primary bg-primary" : "border-white/[0.12] bg-white/[0.04]"
              }`}
            >
              {are4 && (
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                  <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            <span className="text-sm text-foreground">{t.are4}</span>
          </label>
          <div className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2.5">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {t.price}
            </p>
            <p className="mt-1 text-sm font-medium text-foreground">
              {t.standard}: {station.price_1_mad ?? 0} MAD/h
            </p>
            {are4 && station.price_4_mad != null && (
              <p className="mt-0.5 text-sm font-medium text-primary">
                {t.fourPlayers}: {station.price_4_mad} MAD/h
              </p>
            )}
            {are4 && station.price_4_mad == null && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                {t.fourPlayers}: — (not available)
              </p>
            )}
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <button
            type="button"
            onClick={() => handleOpenChange(false)}
            className="rounded-lg border border-white/[0.12] bg-white/[0.04] px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-white/[0.08] hover:text-foreground"
          >
            {t.cancel}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {t.startSession}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function StopSessionModal({
  open,
  onOpenChange,
  station,
  clients,
  loadingClients,
  onDone,
  onPauseSuccess,
  onResumeSuccess,
  lang = "en",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  station: Station | null;
  clients: ClientOption[];
  loadingClients: boolean;
  onDone: (payload: { durationMinutes: number; baseCostMad: number; extraItemsMad: number; totalCostMad: number; paymentStatus: "paid" | "unpaid"; memberIds: string[] }) => Promise<void>;
  onPauseSuccess?: () => void | Promise<void>;
  onResumeSuccess?: () => void | Promise<void>;
  lang?: "en" | "ar";
}) {
  const t = stopModalT[lang];
  const [extraItems, setExtraItems] = useState("");
  const [are4, setAre4] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<"paid" | "unpaid">("unpaid");
  const [memberIds, setMemberIds] = useState<string[]>([]);
  const [clientSearch, setClientSearch] = useState("");
  const [listOpen, setListOpen] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [pauseResumeLoading, setPauseResumeLoading] = useState(false);
  const effectiveStartRef = useRef<number>(0);

  useEffect(() => {
    if (open && station?.current_session?.started_at && station) {
      const started = new Date(station.current_session.started_at).getTime();
      const sessionPausedAt = station.current_session.paused_at;
      if (sessionPausedAt) {
        const pausedAt = new Date(sessionPausedAt).getTime();
        effectiveStartRef.current = started;
        setElapsedMs(pausedAt - started);
        setIsPaused(true);
      } else {
        effectiveStartRef.current = started;
        setElapsedMs(Date.now() - started);
        setIsPaused(false);
      }
      setExtraItems("");
      setAre4(false);
      setPaymentStatus("unpaid");
      setMemberIds(station.current_session?.member_ids ?? []);
      setClientSearch("");
      setListOpen(false);
    }
  }, [open, station?.id, station?.current_session?.started_at, station?.current_session?.member_ids, station?.current_session?.paused_at]);

  useEffect(() => {
    if (!open || !station?.current_session?.started_at || isPaused) return;
    const tick = () => setElapsedMs(Date.now() - effectiveStartRef.current);
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [open, station?.current_session?.started_at, isPaused]);

  const handlePause = async () => {
    if (isPaused) {
      if (!station?.id) return;
      setPauseResumeLoading(true);
      try {
        const res = await fetch("/api/dashboard/stations/resume-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ stationId: station.id }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          toast.error(data.error ?? "Failed to resume");
          return;
        }
        effectiveStartRef.current = Date.now() - elapsedMs;
        setIsPaused(false);
        await onResumeSuccess?.();
      } finally {
        setPauseResumeLoading(false);
      }
    } else {
      if (!station?.id) return;
      setPauseResumeLoading(true);
      try {
        const res = await fetch("/api/dashboard/stations/pause-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ stationId: station.id }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          toast.error(data.error ?? "Failed to pause");
          return;
        }
        setIsPaused(true);
        toast.success("Session paused");
        await onPauseSuccess?.();
      } finally {
        setPauseResumeLoading(false);
      }
    }
  };

  const ratePerHour = are4 && station?.price_4_mad != null ? station.price_4_mad : (station?.price_1_mad ?? 0);
  const durationMinutes = elapsedMs / 60_000;
  const base = Math.round((durationMinutes / 60) * ratePerHour * 100) / 100;
  const extraNum = Number(extraItems) || 0;
  const total = Math.round((base + extraNum) * 100) / 100;

  const addClient = (c: ClientOption) => {
    if (memberIds.includes(c.id)) return;
    setMemberIds((prev) => [...prev, c.id]);
    setClientSearch("");
  };

  const removeClient = (id: string) => {
    setMemberIds((prev) => prev.filter((x) => x !== id));
  };

  const handleDone = async () => {
    if (!station) return;
    const durationMinutesRounded = Math.round(durationMinutes * 100) / 100;
    await onDone({
      durationMinutes: durationMinutesRounded,
      baseCostMad: base,
      extraItemsMad: extraNum,
      totalCostMad: total,
      paymentStatus,
      memberIds,
    });
    onOpenChange(false);
  };

  const availableClients = clients.filter((c) => !memberIds.includes(c.id));
  const searchLower = clientSearch.trim().toLowerCase();
  const filteredClients = availableClients.filter(
    (c) =>
      !searchLower ||
      (c.label?.toLowerCase().includes(searchLower)) ||
      (c.email?.toLowerCase().includes(searchLower)) ||
      (c.phone?.toLowerCase().includes(searchLower))
  );

  if (!station) return null;

  const totalSeconds = Math.floor(elapsedMs / 1000);
  const durationM = Math.floor(totalSeconds / 60);
  const durationS = totalSeconds % 60;
  const durationDisplay = `${durationM}:${durationS.toString().padStart(2, "0")}`;
  const baseCalcMinutes = durationMinutes < 1 ? durationMinutes.toFixed(2) : durationMinutes.toFixed(1);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-white/[0.08] bg-card shadow-2xl backdrop-blur-xl sm:rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {t.title} — {station.name}
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-2">
          <div className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2.5">
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{t.duration}</p>
              <span className="text-xs text-muted-foreground shrink-0">
                {t.calcDuration(durationM, durationS)}
                {isPaused && ` · ${t.pausedLabel}`}
              </span>
            </div>
            <p className="mt-1 text-sm font-medium text-foreground">{durationDisplay}</p>
          </div>
          <div className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2.5">
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{t.basePrice}</p>
              <span className="text-xs text-muted-foreground shrink-0">
                {t.calcBase(baseCalcMinutes, ratePerHour)}
              </span>
            </div>
            <p className="mt-1 text-sm font-medium text-foreground">{base.toFixed(2)} MAD</p>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {t.client}
            </label>
            {memberIds.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {memberIds.map((id) => {
                  const c = clients.find((x) => x.id === id);
                  return (
                    <span
                      key={id}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.12] bg-white/[0.06] pl-2 pr-1 py-1 text-xs text-foreground"
                    >
                      {c?.label ?? id}
                      <button
                        type="button"
                        onClick={() => removeClient(id)}
                        className="rounded p-0.5 text-muted-foreground hover:bg-white/[0.1] hover:text-foreground"
                        aria-label="Remove"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
            <div className="relative">
              <input
                type="text"
                value={clientSearch}
                onChange={(e) => {
                  setClientSearch(e.target.value);
                  setListOpen(true);
                }}
                onFocus={() => setListOpen(true)}
                onBlur={() => setTimeout(() => setListOpen(false), 200)}
                placeholder={t.addClient}
                disabled={loadingClients}
                className="h-11 w-full rounded-lg border border-white/[0.08] bg-white/[0.04] pl-3 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30 disabled:opacity-50"
              />
              {listOpen && (
                <ul className="absolute left-0 right-0 top-full z-10 mt-1 max-h-48 overflow-auto rounded-lg border border-white/[0.08] bg-card py-1 shadow-xl">
                  {loadingClients ? (
                    <li className="px-3 py-2 text-sm text-muted-foreground">{t.loadingClients}</li>
                  ) : filteredClients.length === 0 ? (
                    <li className="px-3 py-2 text-sm text-muted-foreground">
                      {availableClients.length === 0 ? t.noClients : t.noMatches}
                    </li>
                  ) : (
                    filteredClients.map((c) => (
                      <li key={c.id}>
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => addClient(c)}
                          className="w-full px-3 py-2 text-left hover:bg-white/[0.08]"
                        >
                          <span className="block text-sm font-medium text-foreground">{c.label}</span>
                          {(c.email || c.phone) && (
                            <span className="block text-xs text-muted-foreground truncate">
                              {[c.email, c.phone].filter(Boolean).join(" · ")}
                            </span>
                          )}
                        </button>
                      </li>
                    ))
                  )}
                </ul>
              )}
            </div>
          </div>
          <label
            className={`flex items-center gap-3 ${station.price_4_mad != null ? "cursor-pointer" : "cursor-not-allowed opacity-50"}`}
          >
            <div
              role="checkbox"
              tabIndex={station.price_4_mad != null ? 0 : -1}
              aria-checked={are4}
              aria-disabled={station.price_4_mad == null}
              onClick={() => station.price_4_mad != null && setAre4((v) => !v)}
              onKeyDown={(e) => {
                if (station.price_4_mad == null) return;
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setAre4((v) => !v);
                }
              }}
              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                are4 ? "border-primary bg-primary" : "border-white/[0.12] bg-white/[0.04]"
              }`}
            >
              {are4 && (
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                  <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            <span className="text-sm text-foreground">{t.are4}</span>
          </label>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {t.extraItems}
            </label>
            <input
              type="number"
              min={0}
              step={0.01}
              value={extraItems}
              onChange={(e) => setExtraItems(e.target.value)}
              placeholder="0"
              className="h-11 w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
          </div>
          <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2.5">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{t.total}</p>
            <p className="mt-1 text-lg font-bold text-primary">{total.toFixed(2)} MAD</p>
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{t.paymentStatus}</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPaymentStatus("unpaid")}
                className={`flex-1 rounded-lg border py-2 text-sm font-medium transition-colors ${
                  paymentStatus === "unpaid"
                    ? "border-red-500/50 bg-red-500/10 text-red-400"
                    : "border-white/[0.12] bg-white/[0.04] text-muted-foreground hover:bg-white/[0.08]"
                }`}
              >
                {t.unpaid}
              </button>
              <button
                type="button"
                onClick={() => setPaymentStatus("paid")}
                className={`flex-1 rounded-lg border py-2 text-sm font-medium transition-colors ${
                  paymentStatus === "paid"
                    ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
                    : "border-white/[0.12] bg-white/[0.04] text-muted-foreground hover:bg-white/[0.08]"
                }`}
              >
                {t.paid}
              </button>
            </div>
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-lg border border-white/[0.12] bg-white/[0.04] px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-white/[0.08] hover:text-foreground"
          >
            {t.cancel}
          </button>
          <button
            type="button"
            onClick={handlePause}
            disabled={pauseResumeLoading}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-white/[0.12] bg-white/[0.04] px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-white/[0.08] hover:text-foreground disabled:opacity-50"
          >
            {pauseResumeLoading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : isPaused ? (
              <>
                <Play size={14} />
                {t.resume}
              </>
            ) : (
              <>
                <Pause size={14} />
                {t.pause}
              </>
            )}
          </button>
          <button
            type="button"
            onClick={handleDone}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {t.done}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const cardPausedT = { en: "Paused", ar: "متوقف" };

function StationCard({
  station,
  onStartClick,
  onStopClick,
  onReserveClick,
  lang = "en",
}: {
  station: Station;
  onStartClick: (s: Station) => void;
  onStopClick: (s: Station) => void;
  onReserveClick: (s: Station) => void;
  lang?: "en" | "ar";
}) {
  const config = statusConfig[station.status];
  const session = station.current_session;

  const [elapsed, setElapsed] = useState<string>("0:00");
  const isPaused = !!(session?.paused_at);
  useEffect(() => {
    if (station.status !== "occupied" || !session?.started_at) return;
    const started = new Date(session.started_at).getTime();
    if (session.paused_at) {
      const pausedAt = new Date(session.paused_at).getTime();
      setElapsed(formatElapsedMs(pausedAt - started));
      return;
    }
    const tick = () => setElapsed(formatElapsedMs(Date.now() - started));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [station.status, session?.started_at, session?.paused_at]);

  return (
    <motion.div
      variants={item}
      className={`group relative overflow-hidden rounded-xl border bg-card p-5 transition-all duration-300 hover:border-primary/30 ${config.border}`}
    >
      {station.status === "occupied" && (
        <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-primary/10 blur-2xl" />
      )}

      <div className="relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${config.bg}`}>
              <Monitor size={18} className={config.color} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">{station.name}</h3>
              <span className={`text-xs font-medium ${config.color}`}>{config.label}</span>
            </div>
          </div>
        </div>

        <p className="mt-2 text-xs text-muted-foreground">
          {stationTypeLabel(station.type ?? "standard_ps5")} · {stationPriceLabel(station.price_1_mad ?? 40, station.price_4_mad ?? null)}
        </p>

        <div className="mt-4 flex flex-col gap-2">
          {session && (
            <>
              <div className="flex items-center gap-2">
                <User size={12} className="shrink-0 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">
                  {session.player_name?.trim() && session.player_name !== "—"
                    ? session.player_name
                    : "Walk-in"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-foreground">
                <Clock size={12} />
                <span>{elapsed}</span>
                {isPaused && (
                  <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-amber-400">{cardPausedT[lang]}</span>
                )}
              </div>
              {session.game && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Monitor size={12} />
                  <span>{session.game}</span>
                </div>
              )}
            </>
          )}
        </div>

        <div className="mt-4 flex gap-2">
          {station.status === "free" && (
            <button
              type="button"
              onClick={() => onStartClick(station)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary/10 py-2 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
            >
              <Play size={12} /> Start
            </button>
          )}
          {station.status === "occupied" && (
            <button
              type="button"
              onClick={() => onStopClick(station)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-red-500/10 py-2 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/20"
            >
              <Square size={12} /> Stop
            </button>
          )}
          {station.status !== "maintenance" && (
            <button
              type="button"
              onClick={() => onReserveClick(station)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-secondary py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary/80 hover:text-foreground"
            >
              <CalendarClock size={12} /> Reserve
            </button>
          )}
          {station.status === "maintenance" && (
            <button className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-amber-500/10 py-2 text-xs font-medium text-amber-400 transition-colors hover:bg-amber-500/20">
              <Wrench size={12} /> Mark Ready
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function StationsPage() {
  const [view, setView] = useState<"grid" | "list">("grid");
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startModalOpen, setStartModalOpen] = useState(false);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [stopModalOpen, setStopModalOpen] = useState(false);
  const [stationForStop, setStationForStop] = useState<Station | null>(null);
  const [reserveModalOpen, setReserveModalOpen] = useState(false);
  const [stationForReserve, setStationForReserve] = useState<Station | null>(null);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);

  const refetchStations = async () => {
    try {
      const res = await fetch("/api/dashboard/stations");
      if (!res.ok) return;
      const data = await res.json();
      setStations(Array.isArray(data) ? data : []);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    let cancelled = false;
    async function fetchStations() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/dashboard/stations");
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || `HTTP ${res.status}`);
        }
        const data = await res.json();
        if (!cancelled) setStations(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load stations");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchStations();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!startModalOpen && !reserveModalOpen && !stopModalOpen) return;
    let cancelled = false;
    setLoadingClients(true);
    fetch("/api/dashboard/clients")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (!cancelled) setClients(Array.isArray(data) ? data : []);
      })
      .finally(() => {
        if (!cancelled) setLoadingClients(false);
      });
    return () => { cancelled = true; };
  }, [startModalOpen, reserveModalOpen, stopModalOpen]);

  const free = stations.filter((s) => s.status === "free").length;
  const occupied = stations.filter((s) => s.status === "occupied").length;
  const reserved = stations.filter((s) => s.status === "reserved").length;
  const maintenance = stations.filter((s) => s.status === "maintenance").length;

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Stations</h1>
          <p className="text-sm text-muted-foreground">Manage gaming stations</p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(10)].map((_, i) => (
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
          <h1 className="text-2xl font-bold text-foreground">Stations</h1>
          <p className="text-sm text-muted-foreground">Manage gaming stations</p>
        </div>
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
          {error}
        </div>
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
      <motion.div variants={item} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Stations</h1>
          <p className="text-sm text-muted-foreground">Manage gaming stations (Standard PS5, Premium PS5, Xbox)</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setView("grid")}
            className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${view === "grid" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary"}`}
          >
            <LayoutGrid size={16} />
          </button>
          <button
            onClick={() => setView("list")}
            className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${view === "list" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary"}`}
          >
            <List size={16} />
          </button>
        </div>
      </motion.div>

      <motion.div variants={item} className="flex flex-wrap gap-3">
        {[
          { label: "Free", count: free, ...statusConfig.free },
          { label: "Occupied", count: occupied, ...statusConfig.occupied },
          { label: "Reserved", count: reserved, ...statusConfig.reserved },
          { label: "Maintenance", count: maintenance, ...statusConfig.maintenance },
        ].map((s) => (
          <div
            key={s.label}
            className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${s.bg} ${s.border}`}
          >
            <div className={`h-2 w-2 rounded-full ${s.color.replace("text-", "bg-")}`} />
            <span className="text-xs font-medium text-foreground">{s.count}</span>
            <span className="text-xs text-muted-foreground">{s.label}</span>
          </div>
        ))}
      </motion.div>

      <div className={`grid gap-4 ${view === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"}`}>
        {stations.map((station) => (
          <StationCard
            key={station.id}
            station={station}
            onStartClick={(s) => {
              setSelectedStation(s);
              setStartModalOpen(true);
            }}
            onStopClick={(s) => {
              setStationForStop(s);
              setStopModalOpen(true);
            }}
            onReserveClick={(s) => {
              setStationForReserve(s);
              setReserveModalOpen(true);
            }}
          />
        ))}
      </div>

      <ReserveModal
        open={reserveModalOpen}
        onOpenChange={setReserveModalOpen}
        station={stationForReserve}
        clients={clients}
        loadingClients={loadingClients}
        onConfirm={async (memberIds, durationMinutes, startTimeIso) => {
          if (!stationForReserve) return;
          const res = await fetch("/api/dashboard/bookings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              stationId: stationForReserve.id,
              memberIds: memberIds.length > 0 ? memberIds : undefined,
              durationMinutes,
              startTime: startTimeIso,
            }),
          });
          if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            setError(body.error || "Failed to create reservation");
            return;
          }
          setError(null);
          toast.success("Reservation created");
          const stationsRes = await fetch("/api/dashboard/stations");
          if (stationsRes.ok) {
            const data = await stationsRes.json();
            setStations(Array.isArray(data) ? data : []);
          }
        }}
      />

      <StopSessionModal
        open={stopModalOpen}
        onOpenChange={setStopModalOpen}
        station={stationForStop}
        clients={clients}
        loadingClients={loadingClients}
        onPauseSuccess={async () => {
          await refetchStations();
          setStopModalOpen(false);
        }}
        onResumeSuccess={refetchStations}
        onDone={async (payload) => {
          if (!stationForStop) return;
          const res = await fetch("/api/dashboard/stations/stop-session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              stationId: stationForStop.id,
              durationMinutes: payload.durationMinutes,
              extraItemsMad: payload.extraItemsMad,
              totalCostMad: payload.totalCostMad,
              paymentStatus: payload.paymentStatus,
              memberIds: payload.memberIds,
            }),
          });
          if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            setError(body.error || "Failed to end session");
            return;
          }
          setError(null);
          toast.success("Session ended");
          await refetchStations();
        }}
      />

      <StartSessionModal
        open={startModalOpen}
        onOpenChange={setStartModalOpen}
        station={selectedStation}
        clients={clients}
        loadingClients={loadingClients}
        onConfirm={async (clientIds, are4) => {
          if (!selectedStation) return;
          const res = await fetch("/api/dashboard/stations/start-session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              stationId: selectedStation.id,
              clientIds: clientIds.length > 0 ? clientIds : undefined,
              clientId: clientIds[0] || null,
              are4,
            }),
          });
          if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            setError(body.error || "Failed to start session");
            return;
          }
          setError(null);
          toast.success("Session started");
          const stationsRes = await fetch("/api/dashboard/stations");
          if (stationsRes.ok) {
            const data = await stationsRes.json();
            setStations(Array.isArray(data) ? data : []);
          }
        }}
      />
    </motion.div>
  );
}
