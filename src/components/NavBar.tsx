"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Me = { id: string; email: string; cashCents: number } | null;

function formatUsd(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

export function NavBar() {
  const [me, setMe] = useState<Me>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/me")
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setMe(d.user ?? null);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-black/60">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-sm font-semibold tracking-tight">
            NBA Exchange
          </Link>
          <nav className="hidden items-center gap-3 text-sm text-zinc-600 dark:text-zinc-300 sm:flex">
            <Link href="/market" className="hover:text-zinc-950 dark:hover:text-white">
              Market
            </Link>
            <Link href="/portfolio" className="hover:text-zinc-950 dark:hover:text-white">
              Portfolio
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2 text-sm">
          {me ? (
            <>
              <span className="hidden text-zinc-600 dark:text-zinc-300 sm:inline">
                {me.email} · Cash {formatUsd(me.cashCents)}
              </span>
              <button
                onClick={logout}
                className="rounded-full border border-zinc-200 px-3 py-1.5 text-sm hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-full border border-zinc-200 px-3 py-1.5 text-sm hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-zinc-900 px-3 py-1.5 text-sm text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

