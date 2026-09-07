/**
 * In-process TTL cache for the read endpoints. Render's free tier runs a
 * single instance, so there's no cross-instance consistency problem to
 * solve — this gets the "reduce repeated aggregation work" benefit the
 * original spec wanted from Redis without requiring a new account. It does
 * reset on cold start/restart; that's an accepted trade-off, not a bug.
 */
const store = new Map<string, { data: unknown; expiresAt: number }>();

export async function cached<T>(key: string, ttlMs: number, compute: () => Promise<T>): Promise<T> {
  const hit = store.get(key);
  if (hit && hit.expiresAt > Date.now()) {
    return hit.data as T;
  }
  const data = await compute();
  store.set(key, { data, expiresAt: Date.now() + ttlMs });
  return data;
}

export function invalidateCache(): void {
  store.clear();
}
