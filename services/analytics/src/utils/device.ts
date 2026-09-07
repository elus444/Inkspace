import type { DeviceType } from "../models/analyticsEvent.model.js";

/** Small in-house classifier — no ua-parser dependency needed for three buckets. */
export function classifyDevice(userAgent: string | undefined): DeviceType {
  if (!userAgent) return "desktop";
  if (/iPad|Tablet(?!.*Mobile)/i.test(userAgent)) return "tablet";
  if (/Mobi|Android|iPhone|iPod/i.test(userAgent)) return "mobile";
  return "desktop";
}

/** Best-effort country from Cloudflare's edge header, if it ever reaches this
 *  origin. Render fronts services with Cloudflare, but nothing in this repo
 *  has confirmed the header is forwarded — always fall back honestly rather
 *  than guessing. */
export function extractCountry(headers: Record<string, string | string[] | undefined>): string {
  const raw = headers["cf-ipcountry"];
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value && value !== "XX" ? value.toUpperCase() : "Unknown";
}

/** Reduces a full referrer URL down to a hostname for grouping ("top referrers"). */
export function referrerHostname(referrer: string | undefined): string | null {
  if (!referrer) return null;
  try {
    return new URL(referrer).hostname || null;
  } catch {
    return null;
  }
}
