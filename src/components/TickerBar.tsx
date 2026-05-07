"use client";

import { useEffect, useMemo, useState } from "react";

type TickerItem = {
  id: number;
  name: string;
  teamAbbr: string | null;
  priceCents: number;
};

function formatUsd(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

export function TickerBar() {
  const [items, setItems] = useState<TickerItem[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/market", { cache: "no-store" });
        const json = await res.json();
        if (!cancelled) setItems(json.market ?? []);
      } catch {
        // ignore
      }
    }

    load();
    const t = setInterval(load, 15_000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, []);

  const text = useMemo(() => {
    const parts = items.map((p) => `${p.name} (${p.teamAbbr ?? "-"}) ${formatUsd(p.priceCents)}`);
    return parts.length ? parts.join("   •   ") : "Loading market…";
  }, [items]);

  return (
    <div className="sticky bottom-0 z-20 border-t border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-black/60">
      <div className="mx-auto w-full max-w-5xl overflow-hidden px-4 py-2">
        <div className="whitespace-nowrap text-xs text-zinc-600 dark:text-zinc-300">
          <span className="inline-block animate-[ticker_75s_linear_infinite] pr-10">{text}</span>
          <span className="inline-block animate-[ticker_75s_linear_infinite] pr-10">{text}</span>
        </div>
      </div>
    </div>
  );
}

