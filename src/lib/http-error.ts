/**
 * Reads best-effort error text from a failed fetch Response (JSON or plain).
 */
export async function messageFromFailedResponse(res: Response): Promise<string> {
  const status = res.status;
  const text = await res.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = null;
  }
  if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
    const o = parsed as Record<string, unknown>;
    for (const key of ["error", "message", "detail"] as const) {
      const v = o[key];
      if (typeof v === "string" && v.length > 0) return v;
    }
  }
  const trimmed = text.trim();
  if (trimmed && !trimmed.startsWith("<") && trimmed.length < 400) {
    return `${trimmed} (HTTP ${status})`;
  }
  return `Request failed (HTTP ${status}). Open /api/health on this site to check database and JWT config.`;
}
