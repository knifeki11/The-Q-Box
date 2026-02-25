"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { X } from "lucide-react";

export default function AuthErrorBanner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [dismissed, setDismissed] = useState(false);
  const error = searchParams.get("error");

  useEffect(() => {
    if (!error || dismissed) return;
    const timer = setTimeout(() => {
      router.replace("/", { scroll: false });
    }, 15000);
    return () => clearTimeout(timer);
  }, [error, dismissed, router]);

  if (!error || dismissed) return null;

  const message =
    error === "not_admin"
      ? "Dashboard access requires an admin role. Set your role in Supabase: Table Editor → profiles → your row → role = 'admin'."
      : error === "admin_config"
        ? "Dashboard is not configured (missing server config)."
        : null;

  if (!message) return null;

  return (
    <div className="relative z-20 mx-auto max-w-4xl px-4 pt-4">
      <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
        <p className="flex-1">{message}</p>
        <button
          type="button"
          onClick={() => {
            setDismissed(true);
            router.replace("/", { scroll: false });
          }}
          className="shrink-0 rounded p-1 text-amber-400 hover:bg-amber-500/20 hover:text-amber-200"
          aria-label="Dismiss"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
