import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-4 py-14">
      <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-black">
        <h1 className="text-3xl font-semibold tracking-tight">Trade NBA athletes like stocks.</h1>
        <p className="mt-4 max-w-2xl text-zinc-600 dark:text-zinc-300">
          Turn the social nervous system of sports into a portfolio. Buy shares of rookies for the
          long run, or trade momentum during hot streaks. This is a paper-trading MVP (simulated
          cash, simulated prices) built to evolve into real-time, event-driven pricing.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/market"
            className="inline-flex items-center justify-center rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            Open Market
          </Link>
          <Link
            href="/portfolio"
            className="inline-flex items-center justify-center rounded-full border border-zinc-200 px-5 py-2.5 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
          >
            View Portfolio
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-black">
          <div className="text-sm font-semibold">Asset class</div>
          <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
            Each player has a price and a share count you can own.
          </div>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-black">
          <div className="text-sm font-semibold">Portfolio management</div>
          <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
            Allocate cash, rebalance, and track positions over time.
          </div>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-black">
          <div className="text-sm font-semibold">Live ticker (MVP)</div>
          <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
            Bottom ticker updates prices periodically; wire it to real game events next.
          </div>
        </div>
      </div>
    </main>
  );
}
