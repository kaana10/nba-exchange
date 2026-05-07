"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type MarketItem = {
  id: number;
  name: string;
  teamAbbr: string | null;
  position: string | null;
  priceCents: number;
  updatedAt: string | null;
};

function formatUsd(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

export default function MarketPage() {
  const [market, setMarket] = useState<MarketItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [sharesById, setSharesById] = useState<Record<number, number>>({});
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<"name" | "team" | "price">("price");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  async function load() {
    const res = await fetch("/api/market", { cache: "no-store" });
    const json = await res.json();
    setMarket(json.market ?? []);
  }

  useEffect(() => {
    const kickoff = setTimeout(() => {
      load().catch(() => {});
    }, 0);
    const t = setInterval(() => load().catch(() => {}), 10_000);
    return () => {
      clearTimeout(kickoff);
      clearInterval(t);
    };
  }, []);

  const sorted = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? market.filter((p) => {
          const hay = `${p.name} ${p.teamAbbr ?? ""} ${p.position ?? ""}`.toLowerCase();
          return hay.includes(q);
        })
      : market;

    const dir = sortDir === "asc" ? 1 : -1;
    const byString = (av: string, bv: string) => av.localeCompare(bv) * dir;
    const byNumber = (av: number, bv: number) => (av - bv) * dir;

    return [...filtered].sort((a, b) => {
      if (sortKey === "name") return byString(a.name, b.name);
      if (sortKey === "team") return byString(a.teamAbbr ?? "", b.teamAbbr ?? "");
      return byNumber(a.priceCents, b.priceCents);
    });
  }, [market, query, sortDir, sortKey]);

  function toggleSort(nextKey: "name" | "team" | "price") {
    if (sortKey === nextKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(nextKey);
    setSortDir(nextKey === "name" || nextKey === "team" ? "asc" : "desc");
  }

  function sortIndicator(key: "name" | "team" | "price") {
    if (sortKey !== key) return null;
    return <span className="ml-1 text-[10px]">{sortDir === "asc" ? "▲" : "▼"}</span>;
  }

  async function trade(playerId: number, side: "BUY" | "SELL") {
    setError(null);
    setBusyId(playerId);
    try {
      const shares = Math.max(1, Number(sharesById[playerId] ?? 1));
      const res = await fetch("/api/trade", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ playerId, side, shares }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.status === 401) {
        setError("Please log in to trade.");
        return;
      }
      if (!res.ok) {
        setError(json.error ?? "Trade failed.");
        return;
      }
      await load();
    } finally {
      setBusyId(null);
    }
  }

  async function tick() {
    await fetch("/api/market/tick", { method: "POST" });
    await load();
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Market</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
            Prices update periodically. For the MVP, click “Tick prices” to simulate a new market
            minute.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/portfolio"
            className="rounded-full border border-zinc-200 px-4 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
          >
            Portfolio
          </Link>
          <button
            onClick={tick}
            className="rounded-full bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            Tick prices
          </button>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search players (name, team, position)…"
          className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-zinc-300 dark:border-zinc-800 dark:bg-black dark:focus:ring-zinc-700"
        />
        <button
          onClick={() => setQuery("")}
          className="shrink-0 rounded-2xl border border-zinc-200 px-4 py-2.5 text-sm hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
        >
          Clear
        </button>
      </div>

      {error ? (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          {error}{" "}
          {error.includes("log in") ? (
            <Link href="/login" className="font-medium underline">
              Log in
            </Link>
          ) : null}
        </div>
      ) : null}

      <div className="mt-6 overflow-hidden rounded-3xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-black">
        <div className="grid grid-cols-12 gap-2 border-b border-zinc-200 px-4 py-3 text-xs font-semibold text-zinc-600 dark:border-zinc-800 dark:text-zinc-300">
          <button
            type="button"
            onClick={() => toggleSort("name")}
            className="col-span-5 flex items-center text-left hover:text-zinc-950 dark:hover:text-white"
          >
            Player{sortIndicator("name")}
          </button>
          <button
            type="button"
            onClick={() => toggleSort("team")}
            className="col-span-2 flex items-center text-left hover:text-zinc-950 dark:hover:text-white"
          >
            Team{sortIndicator("team")}
          </button>
          <button
            type="button"
            onClick={() => toggleSort("price")}
            className="col-span-2 flex items-center justify-end text-right hover:text-zinc-950 dark:hover:text-white"
          >
            Price{sortIndicator("price")}
          </button>
          <div className="col-span-3 text-right">Trade</div>
        </div>

        <div className="divide-y divide-zinc-100 dark:divide-zinc-900">
          {sorted.map((p) => (
            <div key={p.id} className="grid grid-cols-12 items-center gap-2 px-4 py-3">
              <div className="col-span-5">
                <Link href={`/player/${p.id}`} className="text-sm font-medium hover:underline">
                  {p.name}
                </Link>
                <div className="text-xs text-zinc-500 dark:text-zinc-400">
                  {p.position ?? "-"} {p.updatedAt ? `· updated ${new Date(p.updatedAt).toLocaleTimeString()}` : ""}
                </div>
              </div>
              <div className="col-span-2 text-sm text-zinc-600 dark:text-zinc-300">{p.teamAbbr ?? "-"}</div>
              <div className="col-span-2 text-right text-sm font-medium tabular-nums">
                {formatUsd(p.priceCents)}
              </div>
              <div className="col-span-3 flex items-center justify-end gap-2">
                <input
                  type="number"
                  min={1}
                  value={sharesById[p.id] ?? 1}
                  onChange={(e) =>
                    setSharesById((s) => ({ ...s, [p.id]: Number(e.target.value) }))
                  }
                  className="w-20 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-zinc-300 dark:border-zinc-800 dark:bg-black dark:focus:ring-zinc-700"
                />
                <button
                  disabled={busyId === p.id}
                  onClick={() => trade(p.id, "BUY")}
                  className="rounded-full bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-60"
                >
                  Buy
                </button>
                <button
                  disabled={busyId === p.id}
                  onClick={() => trade(p.id, "SELL")}
                  className="rounded-full border border-zinc-200 px-3 py-1.5 text-sm font-medium hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-800 dark:hover:bg-zinc-900"
                >
                  Sell
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

