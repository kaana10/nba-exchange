"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Position = {
  playerId: number;
  name: string;
  teamAbbr: string | null;
  position: string | null;
  shares: number;
  priceCents: number;
  marketValueCents: number;
};

function formatUsd(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

export default function PortfolioPage() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [cashCents, setCashCents] = useState(0);
  const [equityCents, setEquityCents] = useState(0);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setError(null);
    const res = await fetch("/api/portfolio", { cache: "no-store" });
    const json = await res.json().catch(() => ({}));
    if (res.status === 401) {
      setError("Please log in to view your portfolio.");
      return;
    }
    if (!res.ok) {
      setError(json.error ?? "Failed to load portfolio.");
      return;
    }
    setPositions(json.positions ?? []);
    setCashCents(json.cashCents ?? 0);
    setEquityCents(json.equityCents ?? 0);
  }

  useEffect(() => {
    const kickoff = setTimeout(() => {
      load().catch(() => {});
    }, 0);
    const t = setInterval(() => load().catch(() => {}), 15_000);
    return () => {
      clearTimeout(kickoff);
      clearInterval(t);
    };
  }, []);

  const investedCents = useMemo(
    () => positions.reduce((s, p) => s + p.marketValueCents, 0),
    [positions],
  );

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Portfolio</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
            Paper trading. Equity = cash + market value of holdings.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/market"
            className="rounded-full bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            Go to Market
          </Link>
        </div>
      </div>

      {error ? (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          {error}{" "}
          <Link href="/login" className="font-medium underline">
            Log in
          </Link>
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-3xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-black">
          <div className="text-sm text-zinc-600 dark:text-zinc-300">Equity</div>
          <div className="mt-2 text-2xl font-semibold tabular-nums">{formatUsd(equityCents)}</div>
        </div>
        <div className="rounded-3xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-black">
          <div className="text-sm text-zinc-600 dark:text-zinc-300">Cash</div>
          <div className="mt-2 text-2xl font-semibold tabular-nums">{formatUsd(cashCents)}</div>
        </div>
        <div className="rounded-3xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-black">
          <div className="text-sm text-zinc-600 dark:text-zinc-300">Invested</div>
          <div className="mt-2 text-2xl font-semibold tabular-nums">{formatUsd(investedCents)}</div>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-3xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-black">
        <div className="grid grid-cols-12 gap-2 border-b border-zinc-200 px-4 py-3 text-xs font-semibold text-zinc-600 dark:border-zinc-800 dark:text-zinc-300">
          <div className="col-span-6">Player</div>
          <div className="col-span-2 text-right">Shares</div>
          <div className="col-span-2 text-right">Price</div>
          <div className="col-span-2 text-right">Value</div>
        </div>

        <div className="divide-y divide-zinc-100 dark:divide-zinc-900">
          {positions.length ? (
            positions.map((p) => (
              <div key={p.playerId} className="grid grid-cols-12 items-center gap-2 px-4 py-3">
                <div className="col-span-6">
                  <div className="text-sm font-medium">{p.name}</div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">
                    {p.teamAbbr ?? "-"} · {p.position ?? "-"}
                  </div>
                </div>
                <div className="col-span-2 text-right text-sm tabular-nums">{p.shares}</div>
                <div className="col-span-2 text-right text-sm tabular-nums">{formatUsd(p.priceCents)}</div>
                <div className="col-span-2 text-right text-sm font-medium tabular-nums">
                  {formatUsd(p.marketValueCents)}
                </div>
              </div>
            ))
          ) : (
            <div className="px-4 py-10 text-center text-sm text-zinc-600 dark:text-zinc-300">
              No holdings yet.{" "}
              <Link href="/market" className="font-medium underline">
                Buy your first shares
              </Link>
              .
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

