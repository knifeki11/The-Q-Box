"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

export type PortalMe = {
  profile: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    display_name: string;
    short_name: string;
    email: string | null;
    phone: string | null;
    card_tier_id: string;
    tier_name: string;
    points: number;
    points_this_month: number;
    total_visits: number;
    total_spent: number;
  };
  tier: {
    current: string;
    current_name: string;
    next: string | null;
    next_name: string | null;
    points_to_next: number;
    progress_percent: number;
    next_threshold: number | null;
    current_threshold: number;
  };
  upcoming_bookings: Array<{
    id: string;
    station_id: string;
    station_name: string;
    start_time: string;
    end_time: string;
    game: string | null;
    status: string;
  }>;
  upcoming_tournaments: Array<{
    id: string;
    name: string;
    game: string;
    starts_at: string;
    status: string;
  }>;
  booking_count: number;
  tournament_count: number;
};

const PortalMeContext = createContext<{
  data: PortalMe | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}>({ data: null, loading: true, error: null, refetch: () => {} });

export function usePortalMe() {
  const ctx = useContext(PortalMeContext);
  if (!ctx) throw new Error("usePortalMe must be used within PortalMeProvider");
  return ctx;
}

export function PortalMeProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<PortalMe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMe = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/portal/me", { cache: "no-store" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setError(err.error || "Failed to load");
        setData(null);
        return;
      }
      const json = await res.json();
      setData(json);
    } catch {
      setError("Failed to load");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  return (
    <PortalMeContext.Provider value={{ data, loading, error, refetch: fetchMe }}>
      {children}
    </PortalMeContext.Provider>
  );
}
