"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type GamePoint = {
  seasonEndYear: number;
  gameNumber: number;
  gameDate: string;
  gameScore: number;
  avgGameScore: number;
};

function formatUsdFromAvg(avg: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(avg);
}

export function PlayerClient({ playerId }: { playerId: string }) {
  const [name, setName] = useState<string>("Player");
  const [games, setGames] = useState<GamePoint[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setError(null);
      const res = await fetch(`/api/player/${encodeURIComponent(playerId)}`, { cache: "no-store" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error ?? "Failed to load player.");
        return;
      }
      if (cancelled) return;
      setName(json.player?.name ?? "Player");
      setGames(json.games ?? []);
    }
    load().catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [playerId]);

  const series = useMemo(() => games.map((g) => ({ x: g.gameNumber, y: g.avgGameScore })), [games]);
  const last = series[series.length - 1]?.y ?? 10;

  const svg = useMemo(() => {
    const w = 900;
    const h = 220;
    const pad = 16;
    if (series.length < 2) return null;

    const xs = series.map((p) => p.x);
    const ys = series.map((p) => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const dx = maxX - minX || 1;
    const dy = maxY - minY || 1;

    const pts = series
      .map((p) => {
        const x = pad + ((p.x - minX) / dx) * (w - pad * 2);
        const y = pad + (1 - (p.y - minY) / dy) * (h - pad * 2);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");

    const gridLines = 4;
    const grid = Array.from({ length: gridLines + 1 }, (_, i) => {
      const y = pad + (i / gridLines) * (h - pad * 2);
      return (
        <line
          key={i}
          x1={pad}
          x2={w - pad}
          y1={y}
          y2={y}
          stroke="rgba(120,120,120,0.25)"
          strokeWidth="1"
        />
      );
    });

    return (
      <svg viewBox={`0 0 ${w} ${h}`} className="h-56 w-full">
        {grid}
        <polyline fill="none" stroke="#22c55e" strokeWidth="2.5" points={pts} />
      </svg>
    );
  }, [series]);

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{name}</h1>
          <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
            Current “price” = season-average Game Score:{" "}
            <span className="font-medium">{formatUsdFromAvg(last)}</span>
          </div>
        </div>
        <Link
          href="/market"
          className="rounded-full border border-zinc-200 px-4 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
        >
          Back to Market
        </Link>
      </div>

      {error ? (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      ) : null}

      <div className="mt-6 rounded-3xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-black">
        <div className="text-sm font-semibold">Season price history (cumulative average GmSc)</div>
        <div className="mt-3 text-zinc-800 dark:text-zinc-100">
          {svg ?? (
            <div className="text-sm text-zinc-600 dark:text-zinc-300">No games imported yet.</div>
          )}
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-3xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-black">
        <div className="grid grid-cols-12 gap-2 border-b border-zinc-200 px-4 py-3 text-xs font-semibold text-zinc-600 dark:border-zinc-800 dark:text-zinc-300">
          <div className="col-span-2 text-right">Game</div>
          <div className="col-span-4">Date</div>
          <div className="col-span-3 text-right">GmSc</div>
          <div className="col-span-3 text-right">Avg (Price)</div>
        </div>
        <div className="divide-y divide-zinc-100 dark:divide-zinc-900">
          {games.map((g) => (
            <div
              key={`${g.seasonEndYear}-${g.gameNumber}`}
              className="grid grid-cols-12 items-center gap-2 px-4 py-3"
            >
              <div className="col-span-2 text-right text-sm tabular-nums">{g.gameNumber}</div>
              <div className="col-span-4 text-sm text-zinc-600 dark:text-zinc-300">
                {new Date(g.gameDate).toLocaleDateString()}
              </div>
              <div className="col-span-3 text-right text-sm tabular-nums">{g.gameScore.toFixed(1)}</div>
              <div className="col-span-3 text-right text-sm font-medium tabular-nums">
                {g.avgGameScore.toFixed(2)}
              </div>
            </div>
          ))}
          {!games.length ? (
            <div className="px-4 py-10 text-center text-sm text-zinc-600 dark:text-zinc-300">
              No game logs imported yet.
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}

