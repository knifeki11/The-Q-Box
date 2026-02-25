"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ShoppingBag,
  Plus,
  Pencil,
  Trash2,
  Star,
  X,
  Check,
  Loader2,
} from "lucide-react";

type Reward = {
  id: string;
  name: string;
  description: string | null;
  points_cost: number;
  tier_required: string;
  category: string | null;
  active: boolean;
  created_at: string;
};

const TIERS = ["silver", "gold", "black"] as const;

export default function ShopPage() {
  const [list, setList] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Reward | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    points_cost: 0,
    tier_required: "silver" as (typeof TIERS)[number],
    category: "",
    active: true,
  });

  const load = () => {
    setLoading(true);
    setError(null);
    fetch("/api/dashboard/shop")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Failed to load"))))
      .then((data) => setList(Array.isArray(data) ? data : []))
      .catch((e) => setError(e instanceof Error ? e.message : "Error"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({
      name: "",
      description: "",
      points_cost: 0,
      tier_required: "silver",
      category: "",
      active: true,
    });
    setModalOpen(true);
  };

  const openEdit = (r: Reward) => {
    setEditing(r);
    setForm({
      name: r.name,
      description: r.description ?? "",
      points_cost: r.points_cost,
      tier_required: r.tier_required as (typeof TIERS)[number],
      category: r.category ?? "",
      active: r.active,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        points_cost: form.points_cost,
        tier_required: form.tier_required,
        category: form.category.trim() || null,
        active: form.active,
      };
      const url = editing ? `/api/dashboard/shop/${editing.id}` : "/api/dashboard/shop";
      const method = editing ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to save");
      }
      setModalOpen(false);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this shop item? This cannot be undone.")) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/dashboard/shop/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setModalOpen(false);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (r: Reward) => {
    try {
      const res = await fetch(`/api/dashboard/shop/${r.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !r.active }),
      });
      if (!res.ok) throw new Error("Failed to update");
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Shop</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage items clients can redeem with points. Only active items appear in the portal.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center gap-2 rounded-lg border border-primary bg-primary/10 px-4 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
        >
          <Plus size={16} />
          Add item
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex min-h-[200px] items-center justify-center text-muted-foreground">
          <Loader2 size={24} className="animate-spin" />
        </div>
      ) : list.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          No shop items yet. Add one to let clients redeem with points.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {list.map((r) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-xl border bg-card p-4 ${!r.active ? "opacity-60" : ""}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-foreground">{r.name}</h3>
                  <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                    {r.description || "—"}
                  </p>
                </div>
                <div className="flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5">
                  <Star size={12} className="text-primary" />
                  <span className="text-xs font-bold">{r.points_cost}</span>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-[10px] uppercase text-muted-foreground">
                  {r.tier_required}+
                </span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => toggleActive(r)}
                    className={`rounded p-1.5 transition-colors ${
                      r.active ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"
                    }`}
                    title={r.active ? "Hide from portal" : "Show in portal"}
                  >
                    {r.active ? <Check size={14} /> : <X size={14} />}
                  </button>
                  <button
                    type="button"
                    onClick={() => openEdit(r)}
                    className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(r.id)}
                    className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4"
          onClick={() => !saving && setModalOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl"
          >
            <h2 className="text-lg font-bold text-foreground">
              {editing ? "Edit item" : "Add shop item"}
            </h2>
            <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  className="h-10 w-full rounded-lg border border-border bg-secondary/50 px-3 text-sm"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  className="min-h-[80px] w-full rounded-lg border border-border bg-secondary/50 px-3 py-2 text-sm"
                  rows={3}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Points cost</label>
                <input
                  type="number"
                  min={0}
                  value={form.points_cost}
                  onChange={(e) => setForm((p) => ({ ...p, points_cost: Math.max(0, parseInt(e.target.value, 10) || 0) }))}
                  className="h-10 w-full rounded-lg border border-border bg-secondary/50 px-3 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Tier required</label>
                <select
                  value={form.tier_required}
                  onChange={(e) => setForm((p) => ({ ...p, tier_required: e.target.value as (typeof TIERS)[number] }))}
                  className="h-10 w-full rounded-lg border border-border bg-secondary/50 px-3 text-sm"
                >
                  {TIERS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Category (optional)</label>
                <input
                  value={form.category}
                  onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                  className="h-10 w-full rounded-lg border border-border bg-secondary/50 px-3 text-sm"
                  placeholder="e.g. hours, discount"
                />
              </div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setForm((p) => ({ ...p, active: e.target.checked }))}
                />
                <span className="text-sm text-muted-foreground">Visible in portal</span>
              </label>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => !saving && setModalOpen(false)}
                  className="flex-1 rounded-lg border border-border py-2.5 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !form.name.trim()}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : "Save"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
