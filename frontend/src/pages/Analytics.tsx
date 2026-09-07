import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { io, type Socket } from 'socket.io-client';
import { postApi, analyticsApi } from '../api/axios';
import { type Post, type PostsResponse } from '../types';
import { useAuth } from '../hooks/useAuth';
import { FiEye, FiHeart, FiMessageSquare, FiTrendingUp } from 'react-icons/fi';

interface PostMetric {
  postId: string;
  views: number;
  likes: number;
  comments: number;
  engagementRate: number;
}

interface GlobalDashboard {
  todayViews: number;
  todayLikes: number;
  todayComments: number;
  deviceBreakdown: Record<string, number>;
  topReferrers: { referrer: string; count: number }[];
  topCountries: { country: string; count: number }[];
}

interface PostDashboard {
  postId: string;
  totalViews: number;
  avgReadTimeMs: number;
  dailyViews: { date: string; views: number }[];
}

interface TrendingEntry {
  postId: string;
  score: number;
  views: number;
  likes: number;
  comments: number;
}

interface AuthorStats {
  totalPosts: number;
  totalReach: number;
  avgEngagementRate: number;
}

type Period = '24h' | '7d' | '30d';

function socketOrigin(baseURL: string | undefined): string {
  return (baseURL ?? '').replace(/\/api\/analytics\/?$/, '');
}

function formatMs(ms: number): string {
  if (ms <= 0) return 'N/A';
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

const StatCard = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex items-center gap-4 rounded-2xl border border-border-warm bg-cream p-5 shadow-warm-sm"
  >
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-parchment text-lg text-maroon">
      {icon}
    </div>
    <div>
      <p className="font-display text-2xl italic text-ink">{value}</p>
      <p className="text-sm text-taupe">{label}</p>
    </div>
  </motion.div>
);

const Analytics = () => {
  const { user } = useAuth();

  const [myPosts, setMyPosts] = useState<Post[]>([]);
  const [global, setGlobal] = useState<GlobalDashboard | null>(null);
  const [postMetrics, setPostMetrics] = useState<PostMetric[]>([]);
  const [authorStats, setAuthorStats] = useState<AuthorStats | null>(null);
  const [trending, setTrending] = useState<TrendingEntry[]>([]);
  const [trendingTitleById, setTrendingTitleById] = useState<Map<string, string>>(new Map());
  const [trendingPeriod, setTrendingPeriod] = useState<Period>('7d');
  const [selectedPostId, setSelectedPostId] = useState<string>('');
  const [postDashboard, setPostDashboard] = useState<PostDashboard | null>(null);

  const myPostIds = myPosts.map((p) => p._id);

  // Only this user's posts, fetched server-side via ?authorId= rather than
  // downloading every post on the site and filtering client-side.
  useEffect(() => {
    if (!user) {
      setMyPosts([]);
      return;
    }
    postApi
      .get<PostsResponse>('/', { params: { authorId: user.id } })
      .then((res) => setMyPosts(res.data.posts))
      .catch((err) => console.error('Failed to load your posts:', err));
  }, [user]);

  useEffect(() => {
    analyticsApi.get<GlobalDashboard>('/dashboard').then((res) => setGlobal(res.data)).catch((err) => {
      console.error('Failed to load analytics dashboard:', err);
    });
  }, []);

  useEffect(() => {
    if (myPostIds.length === 0) {
      setPostMetrics([]);
      setAuthorStats({ totalPosts: 0, totalReach: 0, avgEngagementRate: 0 });
      return;
    }
    const postIds = myPostIds.join(',');
    analyticsApi
      .get<PostMetric[]>('/posts', { params: { postIds } })
      .then((res) => setPostMetrics(res.data))
      .catch((err) => console.error('Failed to load post metrics:', err));
    analyticsApi
      .get<AuthorStats>('/author-stats', { params: { postIds } })
      .then((res) => setAuthorStats(res.data))
      .catch((err) => console.error('Failed to load author stats:', err));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myPosts]);

  // Trending references posts by ANY author, so its titles are resolved
  // independently of myPosts -- fetch exactly the ids trending returns,
  // never the whole post collection.
  useEffect(() => {
    analyticsApi
      .get<TrendingEntry[]>('/trending', { params: { period: trendingPeriod } })
      .then(async (res) => {
        setTrending(res.data);
        const ids = res.data.map((t) => t.postId);
        if (ids.length === 0) {
          setTrendingTitleById(new Map());
          return;
        }
        const postsRes = await postApi.get<PostsResponse>('/', { params: { ids: ids.join(',') } });
        setTrendingTitleById(new Map(postsRes.data.posts.map((p) => [p._id, p.title])));
      })
      .catch((err) => console.error('Failed to load trending posts:', err));
  }, [trendingPeriod]);

  useEffect(() => {
    if (myPostIds.length > 0 && !selectedPostId) {
      setSelectedPostId(myPostIds[0] ?? '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myPosts, selectedPostId]);

  useEffect(() => {
    if (!selectedPostId) return;
    analyticsApi
      .get<PostDashboard>('/dashboard', { params: { postId: selectedPostId } })
      .then((res) => setPostDashboard(res.data))
      .catch((err) => console.error('Failed to load post dashboard:', err));
  }, [selectedPostId]);

  // Live ticker: bump today's counters as events land, rather than a full
  // page of polling. First Socket.io usage in Inkspace.
  useEffect(() => {
    const origin = socketOrigin(analyticsApi.defaults.baseURL as string);
    if (!origin) return;
    const socket: Socket = io(origin, { transports: ['websocket', 'polling'] });

    socket.on('metrics:update', (payload: { type: string }) => {
      setGlobal((prev) => {
        if (!prev) return prev;
        if (payload.type === 'PostViewed') return { ...prev, todayViews: prev.todayViews + 1 };
        if (payload.type === 'PostLiked') return { ...prev, todayLikes: prev.todayLikes + 1 };
        if (payload.type === 'PostCommented') return { ...prev, todayComments: prev.todayComments + 1 };
        return prev;
      });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const deviceEntries = global ? Object.entries(global.deviceBreakdown) : [];
  const maxDeviceCount = Math.max(1, ...deviceEntries.map(([, c]) => c));

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-10">
      <div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-[0.25em] text-taupe">Behind the scenes</p>
        <h1 className="font-display text-3xl italic text-ink">Analytics</h1>
        <p className="mt-1 text-sm text-ink-soft">Live site metrics and your posts' performance.</p>
      </div>

      {/* Live counters */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={<FiEye />} label="Views today" value={global?.todayViews ?? '...'} />
        <StatCard icon={<FiHeart />} label="Likes today" value={global?.todayLikes ?? '...'} />
        <StatCard icon={<FiMessageSquare />} label="Comments today" value={global?.todayComments ?? '...'} />
      </div>

      {/* Author stats */}
      {authorStats && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-3 gap-4 rounded-2xl border border-border-warm bg-cream p-5 text-center shadow-warm-sm"
        >
          <div>
            <p className="font-display text-2xl italic text-ink">{authorStats.totalPosts}</p>
            <p className="text-sm text-taupe">Your posts</p>
          </div>
          <div>
            <p className="font-display text-2xl italic text-ink">{authorStats.totalReach}</p>
            <p className="text-sm text-taupe">Total reach (views)</p>
          </div>
          <div>
            <p className="font-display text-2xl italic text-ink">{Math.round(authorStats.avgEngagementRate * 100)}%</p>
            <p className="text-sm text-taupe">Avg engagement rate</p>
          </div>
        </motion.div>
      )}

      {/* My posts table */}
      <div className="rounded-2xl border border-border-warm bg-cream p-5 shadow-warm-sm sm:p-6">
        <h2 className="mb-4 font-display text-lg italic text-ink">My Posts</h2>
        {myPosts.length === 0 ? (
          <p className="text-sm text-taupe">You haven't published any posts yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border-warm text-taupe">
                  <th className="py-2 pr-4 font-medium">Post</th>
                  <th className="py-2 pr-4 font-medium">Views</th>
                  <th className="py-2 pr-4 font-medium">Likes</th>
                  <th className="py-2 pr-4 font-medium">Comments</th>
                  <th className="py-2 pr-4 font-medium">Engagement</th>
                </tr>
              </thead>
              <tbody>
                {myPosts.map((post) => {
                  const m = postMetrics.find((pm) => pm.postId === post._id);
                  return (
                    <tr key={post._id} className="border-b border-border-warm/60 last:border-0">
                      <td className="py-2 pr-4 text-ink">{post.title}</td>
                      <td className="py-2 pr-4 text-ink-soft">{m?.views ?? 0}</td>
                      <td className="py-2 pr-4 text-ink-soft">{m?.likes ?? 0}</td>
                      <td className="py-2 pr-4 text-ink-soft">{m?.comments ?? 0}</td>
                      <td className="py-2 pr-4 text-ink-soft">{Math.round((m?.engagementRate ?? 0) * 100)}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Views-over-time chart */}
      {myPosts.length > 0 && (
        <div className="rounded-2xl border border-border-warm bg-cream p-5 shadow-warm-sm sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-lg italic text-ink">Views over time</h2>
            <select
              value={selectedPostId}
              onChange={(e) => setSelectedPostId(e.target.value)}
              className="rounded-full border border-border-warm bg-parchment px-3 py-1.5 text-sm text-ink"
            >
              {myPosts.map((post) => (
                <option key={post._id} value={post._id}>
                  {post.title}
                </option>
              ))}
            </select>
          </div>
          {postDashboard && (
            <>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={postDashboard.dailyViews}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2d3b8" />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: '#8c7c68', fontSize: 12 }}
                      tickFormatter={(d: string) => d.slice(5)}
                    />
                    <YAxis allowDecimals={false} tick={{ fill: '#8c7c68', fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{ background: '#faf5ec', border: '1px solid #e2d3b8', borderRadius: 12 }}
                      labelStyle={{ color: '#2b2118' }}
                    />
                    <Line type="monotone" dataKey="views" stroke="#7a2e3d" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 flex gap-6 text-sm text-taupe">
                <span>
                  Total views: <span className="font-medium text-ink">{postDashboard.totalViews}</span>
                </span>
                <span>
                  Avg. read time: <span className="font-medium text-ink">{formatMs(postDashboard.avgReadTimeMs)}</span>
                </span>
              </div>
            </>
          )}
        </div>
      )}

      {/* Trending posts */}
      <div className="rounded-2xl border border-border-warm bg-cream p-5 shadow-warm-sm sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-display text-lg italic text-ink">
            <FiTrendingUp className="text-maroon" size={16} /> Trending
          </h2>
          <div className="flex gap-1 rounded-full bg-parchment p-1">
            {(['24h', '7d', '30d'] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setTrendingPeriod(p)}
                className={`rounded-full px-3 py-1 text-sm transition-colors ${
                  trendingPeriod === p ? 'bg-maroon text-cream' : 'text-taupe hover:text-maroon'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
        {trending.length === 0 ? (
          <p className="text-sm text-taupe">Not enough activity yet in this window.</p>
        ) : (
          <ol className="space-y-2">
            {trending.map((entry, i) => (
              <li key={entry.postId} className="flex items-center justify-between text-sm">
                <span className="text-ink-soft">
                  <span className="mr-2 text-taupe">#{i + 1}</span>
                  {trendingTitleById.get(entry.postId) ?? entry.postId}
                </span>
                <span className="text-taupe">
                  {entry.views} views &middot; {entry.likes} likes &middot; {entry.comments} comments
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>

      {/* Reader insights */}
      {global && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-border-warm bg-cream p-5 shadow-warm-sm">
            <h3 className="mb-3 text-sm font-semibold text-ink">Device breakdown</h3>
            <div className="space-y-2">
              {deviceEntries.map(([device, count]) => (
                <div key={device}>
                  <div className="mb-1 flex justify-between text-xs text-taupe">
                    <span className="capitalize">{device}</span>
                    <span>{count}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-parchment">
                    <div
                      className="h-full rounded-full bg-maroon"
                      style={{ width: `${(count / maxDeviceCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border-warm bg-cream p-5 shadow-warm-sm">
            <h3 className="mb-3 text-sm font-semibold text-ink">Top referrers</h3>
            {global.topReferrers.length === 0 ? (
              <p className="text-xs text-taupe">No referrer data yet.</p>
            ) : (
              <ul className="space-y-1.5 text-xs text-ink-soft">
                {global.topReferrers.map((r) => (
                  <li key={r.referrer} className="flex justify-between">
                    <span className="truncate text-ink-soft">{r.referrer}</span>
                    <span className="text-taupe">{r.count}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-2xl border border-border-warm bg-cream p-5 shadow-warm-sm">
            <h3 className="mb-3 text-sm font-semibold text-ink">Top countries</h3>
            {global.topCountries.every((c) => c.country === 'Unknown') ? (
              <p className="text-xs text-taupe">
                No geo data available yet -- country detection depends on the hosting edge forwarding a location
                header, which isn't guaranteed on the free tier.
              </p>
            ) : (
              <ul className="space-y-1.5 text-xs text-ink-soft">
                {global.topCountries.map((c) => (
                  <li key={c.country} className="flex justify-between">
                    <span>{c.country}</span>
                    <span className="text-taupe">{c.count}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;
