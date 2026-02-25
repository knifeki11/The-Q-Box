"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, UserPlus, Eye, CreditCard, ArrowUpDown } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Member {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  name: string;
  email: string;
  card: string;
  points: number;
  visits: number;
  totalSpent: number;
  unpaid: number;
  totalUnpaidMad?: number;
}

const cardColors: Record<string, { text: string; bg: string }> = {
  Silver: { text: "text-zinc-400", bg: "bg-zinc-500/10" },
  Gold: { text: "text-amber-400", bg: "bg-amber-500/10" },
  Black: { text: "text-foreground", bg: "bg-foreground/10" },
};

function getCardStyle(card: string) {
  return cardColors[card] ?? cardColors.Silver;
}

const membersT = {
  loading: { en: "Loading…", ar: "جاري التحميل…" },
  noMembers: { en: "No members found", ar: "لا يوجد أعضاء" },
  detailTitle: { en: "Client details", ar: "تفاصيل العميل" },
  firstName: { en: "First name", ar: "الاسم الأول" },
  lastName: { en: "Last name", ar: "اسم العائلة" },
  email: { en: "Email", ar: "البريد الإلكتروني" },
  card: { en: "Card", ar: "البطاقة" },
  visits: { en: "Visits", ar: "الزيارات" },
  points: { en: "Points", ar: "النقاط" },
  totalSpent: { en: "Total spent", ar: "إجمالي الإنفاق" },
  unpaidSessions: { en: "Unpaid sessions", ar: "جلسات غير مدفوعة" },
  totalUnpaid: { en: "Total unpaid", ar: "إجمالي غير المدفوع" },
  close: { en: "Close", ar: "إغلاق" },
};
const lang: "en" | "ar" = "en";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

export default function MembersPage() {
  const [search, setSearch] = useState("");
  const [filterCard, setFilterCard] = useState<string>("all");
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detailMember, setDetailMember] = useState<Member | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/dashboard/members");
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || `HTTP ${res.status}`);
        }
        const data = await res.json();
        if (!cancelled) setMembers(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load members");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const filtered = members.filter((m) => {
    const matchSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      (m.email && m.email.toLowerCase().includes(search.toLowerCase()));
    const matchCard = filterCard === "all" || m.card === filterCard;
    return matchSearch && matchCard;
  });

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Members</h1>
          <p className="text-sm text-muted-foreground">{membersT.loading[lang]}</p>
        </div>
        <div className="h-64 animate-pulse rounded-xl border border-border bg-card" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Members</h1>
          <p className="text-sm text-muted-foreground">Registered members</p>
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
          <h1 className="text-2xl font-bold text-foreground">Members</h1>
          <p className="text-sm text-muted-foreground">{members.length} registered members</p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
          <UserPlus size={16} />
          Add Member
        </button>
      </motion.div>

      <motion.div variants={item} className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search members..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full rounded-lg border border-border bg-secondary/50 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
          />
        </div>
        <div className="flex gap-2">
          {["all", "Silver", "Gold", "Black"].map((c) => (
            <button
              key={c}
              onClick={() => setFilterCard(c)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                filterCard === c ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {c === "all" ? "All Cards" : `${c} Card`}
            </button>
          ))}
        </div>
      </motion.div>

      <motion.div variants={item} className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {["Member", "Card", "Points", "Visits", "Total Spent", "Unpaid", ""].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground"
                  >
                    <div className="flex items-center gap-1">
                      {h}
                      {h !== "" && <ArrowUpDown size={10} className="opacity-40" />}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    {membersT.noMembers[lang]}
                  </td>
                </tr>
              ) : (
                filtered.map((member) => {
                  const cc = getCardStyle(member.card);
                  return (
                    <tr
                      key={member.id}
                      className="border-b border-border/50 transition-colors hover:bg-secondary/30"
                    >
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-foreground">{member.name}</p>
                          <p className="text-xs text-muted-foreground">{member.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-xs font-bold ${cc.text} ${cc.bg}`}>
                          <CreditCard size={10} />
                          {member.card}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-foreground">{member.points.toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm text-foreground">{member.visits}</td>
                      <td className="px-4 py-3 text-sm text-foreground">
                        {Number(member.totalSpent).toLocaleString()} MAD
                      </td>
                      <td className="px-4 py-3">
                        <span className={member.unpaid > 0 ? "text-amber-400 font-medium" : "text-muted-foreground"}>
                          {member.unpaid}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => setDetailMember(member)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                          aria-label="View details"
                        >
                          <Eye size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      <Dialog open={!!detailMember} onOpenChange={(open) => !open && setDetailMember(null)}>
        <DialogContent className="border-white/[0.08] bg-card shadow-2xl backdrop-blur-xl sm:rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {membersT.detailTitle[lang]}
            </DialogTitle>
          </DialogHeader>
          {detailMember && (
            <div className="grid gap-4 py-2">
              <div className="grid gap-1">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {membersT.firstName[lang]}
                </p>
                <p className="text-sm font-medium text-foreground">
                  {detailMember.first_name ?? "—"}
                </p>
              </div>
              <div className="grid gap-1">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {membersT.lastName[lang]}
                </p>
                <p className="text-sm font-medium text-foreground">
                  {detailMember.last_name ?? "—"}
                </p>
              </div>
              <div className="grid gap-1">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {membersT.email[lang]}
                </p>
                <p className="text-sm font-medium text-foreground">
                  {detailMember.email}
                </p>
              </div>
              <div className="grid gap-1">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {membersT.card[lang]}
                </p>
                <span
                  className={`inline-flex w-fit items-center gap-1.5 rounded px-2 py-0.5 text-xs font-bold ${
                    getCardStyle(detailMember.card).text
                  } ${getCardStyle(detailMember.card).bg}`}
                >
                  <CreditCard size={10} />
                  {detailMember.card}
                </span>
              </div>
              <div className="grid gap-1">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {membersT.visits[lang]}
                </p>
                <p className="text-sm font-medium text-foreground">
                  {detailMember.visits.toLocaleString()}
                </p>
              </div>
              <div className="grid gap-1">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {membersT.points[lang]}
                </p>
                <p className="text-sm font-medium text-foreground">
                  {detailMember.points.toLocaleString()}
                </p>
              </div>
              <div className="grid gap-1">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {membersT.totalSpent[lang]}
                </p>
                <p className="text-sm font-medium text-foreground">
                  {Number(detailMember.totalSpent).toLocaleString()} MAD
                </p>
              </div>
              <div className="grid gap-1">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {membersT.unpaidSessions[lang]}
                </p>
                <p className="text-sm font-medium text-foreground">
                  {detailMember.unpaid}
                </p>
              </div>
              <div className="grid gap-1 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2">
                <p className="text-xs font-medium uppercase tracking-wider text-amber-400/90">
                  {membersT.totalUnpaid[lang]}
                </p>
                <p className="text-sm font-bold text-foreground">
                  {(detailMember.totalUnpaidMad ?? 0).toLocaleString()} MAD
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
