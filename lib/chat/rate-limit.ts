/** Simple in-memory rate limit (per process). Good enough for single-instance Lightsail. */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export function rateLimit(opts: {
  key: string;
  limit: number;
  windowMs: number;
}): { ok: boolean; remaining: number } {
  const now = Date.now();
  let b = buckets.get(opts.key);
  if (!b || b.resetAt <= now) {
    b = { count: 0, resetAt: now + opts.windowMs };
    buckets.set(opts.key, b);
  }
  b.count += 1;
  if (b.count > opts.limit) {
    return { ok: false, remaining: 0 };
  }
  return { ok: true, remaining: opts.limit - b.count };
}

export function clientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}
