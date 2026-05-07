function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function parseRetryAfterSeconds(value: string | null) {
  if (!value) return null;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export async function fetchTextWithBackoff(input: {
  url: string;
  maxAttempts?: number;
  minDelayMsBetweenAttempts?: number;
  maxWaitMsOn429?: number;
}) {
  const maxAttempts = input.maxAttempts ?? 6;
  const minDelay = input.minDelayMsBetweenAttempts ?? 1200;
  const maxWaitMsOn429 = input.maxWaitMsOn429 ?? 15_000;

  let lastErr: Error | null = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    if (attempt > 1) await sleep(minDelay);

    const res = await fetch(input.url, {
      headers: {
        "user-agent": "nba-exchange-mgt828/0.1 (educational project; low-frequency fetching)",
        "accept-language": "en-US,en;q=0.9",
      },
      cache: "no-store",
    });

    if (res.status === 429) {
      const retryAfter = parseRetryAfterSeconds(res.headers.get("retry-after"));
      const waitMs = Math.min(maxWaitMsOn429, Math.max(minDelay, (retryAfter ?? 5) * 1000));
      lastErr = new Error(`Rate limited (429). Waiting ${Math.round(waitMs / 1000)}s then retrying...`);
      await sleep(waitMs);
      continue;
    }

    if (!res.ok) {
      lastErr = new Error(`Fetch failed (${res.status})`);
      continue;
    }

    return await res.text();
  }

  throw lastErr ?? new Error("Fetch failed");
}

