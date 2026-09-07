export type TrendingPeriod = "24h" | "7d" | "30d";

const PERIOD_MS: Record<TrendingPeriod, number> = {
  "24h": 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
  "30d": 30 * 24 * 60 * 60 * 1000,
};

export function isTrendingPeriod(value: unknown): value is TrendingPeriod {
  return value === "24h" || value === "7d" || value === "30d";
}

export function periodStart(period: TrendingPeriod): Date {
  return new Date(Date.now() - PERIOD_MS[period]);
}

/** Weighted trending score: a like or comment signals stronger engagement
 *  than a passive view, so they count for more. */
export function trendingScore(views: number, likes: number, comments: number): number {
  return views + likes * 3 + comments * 5;
}
