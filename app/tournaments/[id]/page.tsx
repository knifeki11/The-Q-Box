"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Check, Loader2 } from "lucide-react";

interface Player {
  id: string;
  firstName: string;
  lastName: string;
  displayName: string;
}

interface Match {
  id: string;
  round: number;
  match_index: number;
  player1_id: string | null;
  player2_id: string | null;
  winner_id: string | null;
}

interface Tournament {
  id: string;
  name: string;
  game: string;
  status: string;
  maxParticipants: number;
  entryFeeMad: number;
  prize: string | null;
  startsAt: string;
}

export default function TournamentBracketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [id, setId] = useState<string | null>(null);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [profileMap, setProfileMap] = useState<Record<string, Player>>({});
  const [matches, setMatches] = useState<Match[]>([]);
  const [rounds, setRounds] = useState<number[]>([]);
  const [canValidate, setCanValidate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [validating, setValidating] = useState<string | null>(null);

  useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/tournaments/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load");
        return res.json();
      })
      .then((data) => {
        if (!cancelled) {
          setTournament(data.tournament);
          setProfileMap(data.profileMap ?? {});
          setMatches(data.matches ?? []);
          setRounds(data.rounds ?? []);
          setCanValidate(data.canValidate ?? false);
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Error loading bracket");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [id]);

  const handleValidate = async (matchId: string, winnerId: string) => {
    if (!id) return;
    setValidating(matchId);
    try {
      const res = await fetch(`/api/dashboard/tournaments/${id}/validate-winner`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId, winnerId }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to validate");
      }
      const data = await fetch(`/api/tournaments/${id}`).then((r) => r.json());
      setMatches(data.matches ?? []);
      setProfileMap(data.profileMap ?? {});
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed");
    } finally {
      setValidating(null);
    }
  };

  const getPlayerDisplay = (playerId: string | null) => {
    if (!playerId) return "—";
    const p = profileMap[playerId];
    return p ? `${p.firstName} ${p.lastName}`.trim() || p.displayName : "—";
  };

  const roundLabels: Record<number, { en: string; ar: string }> = {
    1: { en: "Round 1", ar: "الجولة ١" },
    2: { en: "Semi-finals", ar: "نصف النهائي" },
    3: { en: "Final", ar: "النهائي" },
  };
  const lang: "en" | "ar" = "en";
  const roundLabel = (r: number) => roundLabels[r]?.[lang] ?? (lang === "ar" ? `الجولة ${r}` : `Round ${r}`);

  if (loading || !id) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  if (error || !tournament) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">{error ?? "Tournament not found"}</p>
          <Link href="/" className="mt-4 inline-block text-primary hover:underline">
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-xl font-bold text-foreground">{tournament.name}</h1>
          <p className="text-sm text-muted-foreground">{tournament.game}</p>
        </div>

        <div className="overflow-x-auto">
          <div className="flex min-w-max gap-12 pb-8">
            {rounds.map((round) => {
              const roundMatches = matches.filter((m) => m.round === round);
              const label = roundLabel(round);
              return (
                <div key={round} className="flex flex-col gap-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {label}
                  </h3>
                  <div
                    className="flex flex-col gap-6"
                    style={{
                      minHeight: roundMatches.length * 100,
                      justifyContent: roundMatches.length > 1 ? "space-between" : "flex-start",
                    }}
                  >
                    {roundMatches.map((m) => (
                      <div
                        key={m.id}
                        className="w-56 rounded-lg border border-white/[0.12] bg-white/[0.04] overflow-hidden"
                      >
                        <div className="flex flex-col">
                          <div
                            className={`flex items-center justify-between gap-2 border-b border-white/[0.08] px-3 py-2 ${
                              m.winner_id === m.player1_id ? "bg-primary/10" : ""
                            }`}
                          >
                            <span className="truncate text-sm font-medium text-foreground">
                              {getPlayerDisplay(m.player1_id)}
                            </span>
                            {canValidate && m.player1_id && !m.winner_id && (
                              <button
                                type="button"
                                onClick={() => handleValidate(m.id, m.player1_id!)}
                                disabled={!!validating}
                                className="shrink-0 rounded bg-primary/20 p-1 text-primary hover:bg-primary/30 disabled:opacity-50"
                                title="Validate winner"
                              >
                                {validating === m.id ? (
                                  <Loader2 size={14} className="animate-spin" />
                                ) : (
                                  <Check size={14} />
                                )}
                              </button>
                            )}
                          </div>
                          <div
                            className={`flex items-center justify-between gap-2 px-3 py-2 ${
                              m.winner_id === m.player2_id ? "bg-primary/10" : ""
                            }`}
                          >
                            <span className="truncate text-sm font-medium text-foreground">
                              {getPlayerDisplay(m.player2_id)}
                            </span>
                            {canValidate && m.player2_id && !m.winner_id && (
                              <button
                                type="button"
                                onClick={() => handleValidate(m.id, m.player2_id!)}
                                disabled={!!validating}
                                className="shrink-0 rounded bg-primary/20 p-1 text-primary hover:bg-primary/30 disabled:opacity-50"
                                title="Validate winner"
                              >
                                {validating === m.id ? (
                                  <Loader2 size={14} className="animate-spin" />
                                ) : (
                                  <Check size={14} />
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {canValidate && (
          <p className="mt-4 text-center text-xs text-muted-foreground">
            {lang === "ar"
              ? "اضغط على علامة الصح بجانب اللاعب للتحقق من فوزه. سيتقدم للجولة التالية."
              : "Click the checkmark next to a player to validate them as the winner. They will advance to the next round."}
          </p>
        )}
      </div>
    </div>
  );
}
