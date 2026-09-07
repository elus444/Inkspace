import { Request, Response } from "express";
import AnalyticsEvent from "../models/analyticsEvent.model.js";
import ReadTime from "../models/readTime.model.js";
import { classifyDevice, extractCountry, referrerHostname } from "../utils/device.js";
import { cached } from "../utils/cache.js";
import { isTrendingPeriod, periodStart, trendingScore, type TrendingPeriod } from "../utils/trending.js";
import { emitMetricsUpdate } from "../socket.js";

const CACHE_TTL_MS = 5 * 60 * 1000;
const MAX_POST_IDS = 100;
const MAX_READ_TIME_MS = 2 * 60 * 60 * 1000; // 2h — anything longer is a stale/background tab, not real reading

function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function parsePostIds(raw: unknown): string[] {
  if (typeof raw !== "string" || !raw.trim()) return [];
  return [...new Set(raw.split(",").map((s) => s.trim()).filter(Boolean))].slice(0, MAX_POST_IDS);
}

interface PostMetrics {
  postId: string;
  views: number;
  likes: number;
  comments: number;
  engagementRate: number;
}

/** Shared by /posts and /author-stats — one aggregation query covering every
 *  requested post rather than one round-trip per post. */
async function computePostMetrics(postIds: string[]): Promise<PostMetrics[]> {
  if (postIds.length === 0) return [];

  const rows = await AnalyticsEvent.aggregate<{ _id: { postId: string; type: string }; count: number }>([
    { $match: { postId: { $in: postIds }, type: { $in: ["PostViewed", "PostLiked", "PostCommented"] } } },
    { $group: { _id: { postId: "$postId", type: "$type" }, count: { $sum: 1 } } },
  ]);

  const byPost = new Map<string, { views: number; likes: number; comments: number }>();
  for (const id of postIds) byPost.set(id, { views: 0, likes: 0, comments: 0 });
  for (const row of rows) {
    const entry = byPost.get(row._id.postId);
    if (!entry) continue;
    if (row._id.type === "PostViewed") entry.views = row.count;
    else if (row._id.type === "PostLiked") entry.likes = row.count;
    else if (row._id.type === "PostCommented") entry.comments = row.count;
  }

  return postIds.map((postId) => {
    const m = byPost.get(postId)!;
    return {
      postId,
      views: m.views,
      likes: m.likes,
      comments: m.comments,
      engagementRate: m.views > 0 ? Math.round(((m.likes + m.comments) / m.views) * 1000) / 1000 : 0,
    };
  });
}

// ---------------------------------------------------------------------------
// Ingest endpoints — all public, all fire-and-forget from the frontend's
// point of view. Failures here should never surface as a broken page, so
// every handler responds quickly and logs rather than throwing.
// ---------------------------------------------------------------------------

export const trackView = async (req: Request, res: Response) => {
  const postId: string = req.body?.postId ?? "";
  if (!postId) return res.status(400).json({ message: "postId is required" });

  try {
    const device = classifyDevice(req.headers["user-agent"]);
    const country = extractCountry(req.headers as Record<string, string | string[] | undefined>);
    const referrer = referrerHostname(req.body?.referrer);

    await AnalyticsEvent.create({ type: "PostViewed", postId, device, country, referrer: referrer ?? undefined });
    emitMetricsUpdate({ type: "PostViewed", postId });
    res.status(201).json({ ok: true });
  } catch (err) {
    console.error("track-view failed:", err);
    res.status(500).json({ message: "Failed to record view" });
  }
};

export const trackReadTime = async (req: Request, res: Response) => {
  const postId: string = req.body?.postId ?? "";
  const durationMs = Number(req.body?.durationMs);
  if (!postId || !Number.isFinite(durationMs) || durationMs <= 0) {
    return res.status(400).json({ message: "postId and a positive durationMs are required" });
  }
  if (durationMs > MAX_READ_TIME_MS) {
    // Silently drop implausible durations (backgrounded tab left open for
    // hours) rather than letting them skew the average.
    return res.status(202).json({ ok: true, recorded: false });
  }

  try {
    await ReadTime.create({ postId, durationMs });
    res.status(201).json({ ok: true, recorded: true });
  } catch (err) {
    console.error("track-read-time failed:", err);
    res.status(500).json({ message: "Failed to record read time" });
  }
};

export const trackLike = async (req: Request, res: Response) => {
  const postId: string = req.body?.postId ?? "";
  if (!postId) return res.status(400).json({ message: "postId is required" });

  try {
    await AnalyticsEvent.create({ type: "PostLiked", postId });
    emitMetricsUpdate({ type: "PostLiked", postId });
    res.status(201).json({ ok: true });
  } catch (err) {
    console.error("track-like failed:", err);
    res.status(500).json({ message: "Failed to record like" });
  }
};

const GENERIC_EVENT_MAP = {
  comment: "PostCommented",
  signup: "UserSignup",
  login: "UserLogin",
} as const;

export const trackGeneric = async (req: Request, res: Response) => {
  const type = req.body?.type as keyof typeof GENERIC_EVENT_MAP | undefined;
  if (!type || !(type in GENERIC_EVENT_MAP)) {
    return res.status(400).json({ message: "type must be one of comment, signup, login" });
  }

  try {
    const eventType = GENERIC_EVENT_MAP[type];
    const postId: string | undefined = req.body?.postId || undefined;
    await AnalyticsEvent.create({ type: eventType, postId });
    emitMetricsUpdate({ type: eventType, postId });
    res.status(201).json({ ok: true });
  } catch (err) {
    console.error("track failed:", err);
    res.status(500).json({ message: "Failed to record event" });
  }
};

// ---------------------------------------------------------------------------
// Query endpoints — public, read-only, cached for 5 minutes in-process.
// ---------------------------------------------------------------------------

export const getDashboard = async (req: Request, res: Response) => {
  const postId = typeof req.query.postId === "string" ? req.query.postId : undefined;

  try {
    if (postId) {
      const data = await cached(`dashboard:post:${postId}`, CACHE_TTL_MS, async () => {
        const days = 14;
        const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

        const [rows, totalViews, readTimes] = await Promise.all([
          AnalyticsEvent.aggregate<{ _id: string; count: number }>([
            { $match: { postId, type: "PostViewed", createdAt: { $gte: since } } },
            { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
          ]),
          AnalyticsEvent.countDocuments({ postId, type: "PostViewed" }),
          ReadTime.aggregate<{ _id: null; avg: number }>([
            { $match: { postId } },
            { $group: { _id: null, avg: { $avg: "$durationMs" } } },
          ]),
        ]);

        const countsByDay = new Map(rows.map((r) => [r._id, r.count]));
        const dailyViews: { date: string; views: number }[] = [];
        for (let i = days - 1; i >= 0; i--) {
          const d = dayKey(new Date(Date.now() - i * 24 * 60 * 60 * 1000));
          dailyViews.push({ date: d, views: countsByDay.get(d) ?? 0 });
        }

        return {
          postId,
          totalViews,
          avgReadTimeMs: Math.round(readTimes[0]?.avg ?? 0),
          dailyViews,
        };
      });
      return res.json(data);
    }

    const data = await cached("dashboard:global", CACHE_TTL_MS, async () => {
      const todayStart = new Date();
      todayStart.setUTCHours(0, 0, 0, 0);
      const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const [todayViews, todayLikes, todayComments, deviceRows, referrerRows, countryRows] = await Promise.all([
        AnalyticsEvent.countDocuments({ type: "PostViewed", createdAt: { $gte: todayStart } }),
        AnalyticsEvent.countDocuments({ type: "PostLiked", createdAt: { $gte: todayStart } }),
        AnalyticsEvent.countDocuments({ type: "PostCommented", createdAt: { $gte: todayStart } }),
        AnalyticsEvent.aggregate<{ _id: string; count: number }>([
          { $match: { type: "PostViewed", createdAt: { $gte: since30d }, device: { $ne: null } } },
          { $group: { _id: "$device", count: { $sum: 1 } } },
        ]),
        AnalyticsEvent.aggregate<{ _id: string; count: number }>([
          { $match: { type: "PostViewed", createdAt: { $gte: since30d }, referrer: { $ne: null } } },
          { $group: { _id: "$referrer", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 5 },
        ]),
        AnalyticsEvent.aggregate<{ _id: string; count: number }>([
          { $match: { type: "PostViewed", createdAt: { $gte: since30d } } },
          { $group: { _id: { $ifNull: ["$country", "Unknown"] }, count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 5 },
        ]),
      ]);

      const deviceBreakdown = { mobile: 0, tablet: 0, desktop: 0 } as Record<string, number>;
      for (const row of deviceRows) deviceBreakdown[row._id] = row.count;

      return {
        todayViews,
        todayLikes,
        todayComments,
        deviceBreakdown,
        topReferrers: referrerRows.map((r) => ({ referrer: r._id, count: r.count })),
        topCountries: countryRows.map((r) => ({ country: r._id, count: r.count })),
      };
    });
    res.json(data);
  } catch (err) {
    console.error("get-dashboard failed:", err);
    res.status(500).json({ message: "Failed to load dashboard" });
  }
};

export const getPostsMetrics = async (req: Request, res: Response) => {
  const postIds = parsePostIds(req.query.postIds);
  if (postIds.length === 0) return res.status(400).json({ message: "postIds query param is required" });

  try {
    const key = `posts:${[...postIds].sort().join(",")}`;
    const data = await cached(key, CACHE_TTL_MS, () => computePostMetrics(postIds));
    res.json(data);
  } catch (err) {
    console.error("get-posts-metrics failed:", err);
    res.status(500).json({ message: "Failed to load post metrics" });
  }
};

export const getAuthorStats = async (req: Request, res: Response) => {
  const postIds = parsePostIds(req.query.postIds);
  if (postIds.length === 0) return res.status(400).json({ message: "postIds query param is required" });

  try {
    const key = `author-stats:${[...postIds].sort().join(",")}`;
    const data = await cached(key, CACHE_TTL_MS, async () => {
      const metrics = await computePostMetrics(postIds);
      const totalReach = metrics.reduce((sum, m) => sum + m.views, 0);
      const totalLikes = metrics.reduce((sum, m) => sum + m.likes, 0);
      const totalComments = metrics.reduce((sum, m) => sum + m.comments, 0);
      const avgEngagementRate =
        totalReach > 0 ? Math.round(((totalLikes + totalComments) / totalReach) * 1000) / 1000 : 0;

      return { totalPosts: postIds.length, totalReach, avgEngagementRate };
    });
    res.json(data);
  } catch (err) {
    console.error("get-author-stats failed:", err);
    res.status(500).json({ message: "Failed to load author stats" });
  }
};

export const getTrending = async (req: Request, res: Response) => {
  const period: TrendingPeriod = isTrendingPeriod(req.query.period) ? req.query.period : "7d";
  const key = `trending:${period}`;

  try {
    const data = await cached(key, CACHE_TTL_MS, async () => {
      const since = periodStart(period);
      const rows = await AnalyticsEvent.aggregate<{ _id: { postId: string; type: string }; count: number }>([
        {
          $match: {
            createdAt: { $gte: since },
            postId: { $ne: null },
            type: { $in: ["PostViewed", "PostLiked", "PostCommented"] },
          },
        },
        { $group: { _id: { postId: "$postId", type: "$type" }, count: { $sum: 1 } } },
      ]);

      const byPost = new Map<string, { views: number; likes: number; comments: number }>();
      for (const row of rows) {
        const entry = byPost.get(row._id.postId) ?? { views: 0, likes: 0, comments: 0 };
        if (row._id.type === "PostViewed") entry.views = row.count;
        else if (row._id.type === "PostLiked") entry.likes = row.count;
        else if (row._id.type === "PostCommented") entry.comments = row.count;
        byPost.set(row._id.postId, entry);
      }

      return [...byPost.entries()]
        .map(([postId, m]) => ({ postId, ...m, score: trendingScore(m.views, m.likes, m.comments) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);
    });
    res.json(data);
  } catch (err) {
    console.error("get-trending failed:", err);
    res.status(500).json({ message: "Failed to load trending posts" });
  }
};
