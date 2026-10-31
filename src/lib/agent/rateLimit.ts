/**
 * In-memory limits for the agent route. Vercel runs route handlers in
 * short-lived instances, so this is best-effort protection against a
 * runaway script or a looping client, not accounting — the real ceiling is
 * the spend limit on the Anthropic console. Two layers:
 *
 *   1. Per visitor: a token bucket keyed by IP. `burst` requests at once,
 *      refilling at `perMinute` per minute.
 *   2. Global daily cap: at most `dailyCap` model calls per UTC day per
 *      instance. Set AGENT_DAILY_CAP=0 to disable the agent entirely.
 */

export type LimitOptions = {
  burst?: number;
  perMinute?: number;
  dailyCap?: number;
  maxKeys?: number;
};

type Bucket = { tokens: number; updatedAt: number };

export class RateLimiter {
  private buckets = new Map<string, Bucket>();
  private day = "";
  private dayCount = 0;
  readonly burst: number;
  readonly perMinute: number;
  readonly dailyCap: number;
  readonly maxKeys: number;

  constructor(opts: LimitOptions = {}) {
    this.burst = opts.burst ?? 4;
    this.perMinute = opts.perMinute ?? 2;
    this.dailyCap = opts.dailyCap ?? 400;
    this.maxKeys = opts.maxKeys ?? 5000;
  }

  /** Returns { ok: true } or { ok: false, retryAfterSec, reason }. */
  check(key: string, now: number = Date.now()) {
    // Global cap first — cheap, and it protects the bill even if the
    // per-IP map is being gamed.
    const today = new Date(now).toISOString().slice(0, 10);
    if (today !== this.day) {
      this.day = today;
      this.dayCount = 0;
    }
    if (this.dayCount >= this.dailyCap) {
      const secondsToMidnight = Math.max(
        1,
        Math.ceil((Date.parse(`${today}T24:00:00Z`) - now) / 1000),
      );
      return { ok: false as const, reason: "daily" as const, retryAfterSec: secondsToMidnight };
    }

    let b = this.buckets.get(key);
    if (!b) {
      if (this.buckets.size >= this.maxKeys) this.prune(now);
      b = { tokens: this.burst, updatedAt: now };
      this.buckets.set(key, b);
    } else {
      const elapsedMin = (now - b.updatedAt) / 60_000;
      b.tokens = Math.min(this.burst, b.tokens + elapsedMin * this.perMinute);
      b.updatedAt = now;
    }
    if (b.tokens < 1) {
      const retryAfterSec = Math.ceil(((1 - b.tokens) / this.perMinute) * 60);
      return { ok: false as const, reason: "visitor" as const, retryAfterSec };
    }
    b.tokens -= 1;
    this.dayCount += 1;
    return { ok: true as const };
  }

  private prune(now: number) {
    // Drop buckets that are full again (idle long enough to refill); if
    // that frees nothing, drop the oldest half.
    for (const [k, b] of this.buckets) {
      const elapsedMin = (now - b.updatedAt) / 60_000;
      if (b.tokens + elapsedMin * this.perMinute >= this.burst) this.buckets.delete(k);
    }
    if (this.buckets.size >= this.maxKeys) {
      const entries = [...this.buckets.entries()].sort((a, b) => a[1].updatedAt - b[1].updatedAt);
      for (const [k] of entries.slice(0, Math.ceil(entries.length / 2))) this.buckets.delete(k);
    }
  }
}

/** Best-effort client address behind Vercel's proxy. */
export function clientKey(headers: Headers): string {
  const xff = headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim() || "unknown";
  return headers.get("x-real-ip") ?? "unknown";
}
