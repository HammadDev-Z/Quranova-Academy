// Simple in-memory limiter. Good enough for a single Node process (VPS) and a
// reasonable first line of defence on serverless. Swap for Redis/Upstash if the
// site ever runs on several instances.
const hits = new Map<string, number[]>();

export function rateLimit(key: string, max = 5, windowMs = 60 * 60 * 1000): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= max) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);
  return true;
}
