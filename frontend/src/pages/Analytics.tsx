import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { io, type Socket } from 'socket.io-client';
import { postApi, analyticsApi } from '../api/axios';
import { useAuth } from '../hooks/useAuth';
import { FiEye, FiHeart, FiMessageSquare, FiTrendingUp } from 'react-icons/fi';

// The shared `Post` type in ../types is out of sync with the actual backend
// schema (it has `author`, the API returns `authorId`) — defining the real
// shape locally here rather than trusting or "fixing" a type used elsewhere
// for unrelated pages.
interface PostRecord {
  _id: string;
  title: string;
  authorId: string;
  createdAt: string;
}

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
  if (ms <= 0) return '—';
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

const StatCard = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-slate-800 border border-slate-700 rounded-lg p-5 flex items-center gap-4"
  >
    <div className="text-indigo-400 text-2xl">{icon}</div>
    <div>
      <p className="text-2xl font-bold text-slate-100">{value}</p>
      <p className="text-sm text-slate-400">{label}</p>
    </div>
  </motion.div>
);

const Analytics = () => {
  const { user } = useAuth();

  const [posts, setPosts] = useState<PostRecord[]>([]);
  const [global, setGlobal] = useState<GlobalDashboard | null>(null);
  const [postMetrics, setPostMetrics] = useState<PostMetric[]>([]);
  const [authorStats, setAuthorStats] = useState<AuthorStats | null>(null);
  const [trending, setTrending] = useState<TrendingEntry[]>([]);
  const [trendingPeriod, setTrendingPeriod] = useState<Period>('7d');
  const [selectedPostId, setSelectedPostId] = useState<string>('');
  const [postDashboard, setPostDashboard] = useState<PostDashboard | null>(null);

  const myPosts = useMemo(
    () => (user ? posts.filter((p) => p.authorId === user.id) : []),
    [posts, user]
  );
  const myPostIds = useMemo(() => myPosts.map((p) => p._id), [myPosts]);
  const postTitleById = useMemo(() => new Map(posts.map((p) => [p._id, p.title])), [posts]);

  // All posts, once — used both for "my posts" filtering and to label
  // trending results with real titles.
  useEffect(() => {
    postApi.get<PostRecord[]>('/').then((res) => setPosts(res.data)).catch((err) => {
      console.error('Failed to load posts for analytics:', err);
    });
  }, []);

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
  }, [myPostIds]);

  useEffect(() => {
    analyticsApi
      .get<TrendingEntry[]>('/trending', { params: { period: trendingPeriod } })
      .then((res) => setTrending(res.data))
      .catch((err) => console.error('Failed to load trending posts:', err));
  }, [trendingPeriod]);

  useEffect(() => {
    if (myPostIds.length > 0 && !selectedPostId) {
      setSelectedPostId(myPostIds[0] ?? '');
    }
  }, [myPostIds, selectedPostId]);

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
    <div className="max-w-5xl mx-auto mt-10 space-y-8 pb-10">
      <div>
        <h1 className="text-3xl font-bold text-slate-100">Analytics</h1>
        <p className="text-slate-400 mt-1">Live site metrics and your posts' performance.</p>
      </div>

      {/* Live counters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={<FiEye />} label="Views today" value={global?.todayViews ?? '—'} />
        <StatCard icon={<FiHeart />} label="Likes today" value={global?.todayLikes ?? '—'} />
        <StatCard icon={<FiMessageSquare />} label="Comments today" value={global?.todayComments ?? '—'} />
      </div>

      {/* Author stats */}
      {authorStats && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800 border border-slate-700 rounded-lg p-5 grid grid-cols-3 gap-4 text-center"
        >
          <div>
            <p className="text-2xl font-bold text-slate-100">{authorStats.totalPosts}</p>
            <p className="text-sm text-slate-400">Your posts</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-100">{authorStats.totalReach}</p>
            <p className="text-sm text-slate-400">Total reach (views)</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-100">{Math.round(authorStats.avgEngagementRate * 100)}%</p>
            <p className="text-sm text-slate-400">Avg engagement rate</p>
          </div>
        </motion.div>
      )}

      {/* My posts table */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
        <h2 className="text-lg font-semibold text-slate-100 mb-4">My Posts</h2>
        {myPosts.length === 0 ? (
          <p className="text-slate-500 text-sm">You haven't published any posts yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="text-slate-500 border-b border-slate-700">
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
                    <tr key={post._id} className="border-b border-slate-700/50 last:border-0">
                      <td className="py-2 pr-4 text-slate-200">{post.title}</td>
                      <td className="py-2 pr-4 text-slate-300">{m?.views ?? 0}</td>
                      <td className="py-2 pr-4 text-slate-300">{m?.likes ?? 0}</td>
                      <td className="py-2 pr-4 text-slate-300">{m?.comments ?? 0}</td>
                      <td className="py-2 pr-4 text-slate-300">{Math.round((m?.engagementRate ?? 0) * 100)}%</td>
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
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h2 className="text-lg font-semibold text-slate-100">Views over time</h2>
            <select
              value={selectedPostId}
              onChange={(e) => setSelectedPostId(e.target.value)}
              className="bg-slate-700 border border-slate-600 text-slate-100 rounded-lg px-3 py-1.5 text-sm"
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
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: '#94a3b8', fontSize: 12 }}
                      tickFormatter={(d: string) => d.slice(5)}
                    />
                    <YAxis allowDecimals={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                      labelStyle={{ color: '#e2e8f0' }}
                    />
                    <Line type="monotone" dataKey="views" stroke="#818cf8" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="flex gap-6 mt-4 text-sm text-slate-400">
                <span>Total views: <span className="text-slate-200 font-medium">{postDashboard.totalViews}</span></span>
                <span>Avg. read time: <span className="text-slate-200 font-medium">{formatMs(postDashboard.avgReadTimeMs)}</span></span>
              </div>
            </>
          )}
        </div>
      )}

      {/* Trending posts */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
            <FiTrendingUp className="text-indigo-400" /> Trending
          </h2>
          <div className="flex gap-1 bg-slate-900/50 rounded-lg p-1">
            {(['24h', '7d', '30d'] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setTrendingPeriod(p)}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  trendingPeriod === p ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
        {trending.length === 0 ? (
          <p className="text-slate-500 text-sm">Not enough activity yet in this window.</p>
        ) : (
          <ol className="space-y-2">
            {trending.map((entry, i) => (
              <li key={entry.postId} className="flex items-center justify-between text-sm">
                <span className="text-slate-300">
                  <span className="text-slate-500 mr-2">#{i + 1}</span>
                  {postTitleById.get(entry.postId) ?? entry.postId}
                </span>
                <span className="text-slate-500">
                  {entry.views} views · {entry.likes} likes · {entry.comments} comments
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>

      {/* Reader insights */}
      {global && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
            <h3 className="text-sm font-semibold text-slate-100 mb-3">Device breakdown</h3>
            <div className="space-y-2">
              {deviceEntries.map(([device, count]) => (
                <div key={device}>
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span className="capitalize">{device}</span>
                    <span>{count}</span>
                  </div>
                  <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full"
                      style={{ width: `${(count / maxDeviceCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
            <h3 className="text-sm font-semibold text-slate-100 mb-3">Top referrers</h3>
            {global.topReferrers.length === 0 ? (
              <p className="text-xs text-slate-500">No referrer data yet.</p>
            ) : (
              <ul className="space-y-1.5 text-xs text-slate-400">
                {global.topReferrers.map((r) => (
                  <li key={r.referrer} className="flex justify-between">
                    <span className="text-slate-300 truncate">{r.referrer}</span>
                    <span>{r.count}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
            <h3 className="text-sm font-semibold text-slate-100 mb-3">Top countries</h3>
            {global.topCountries.every((c) => c.country === 'Unknown') ? (
              <p className="text-xs text-slate-500">
                No geo data available — country detection depends on the hosting edge forwarding a location header,
                which isn't guaranteed on the free tier.
              </p>
            ) : (
              <ul className="space-y-1.5 text-xs text-slate-400">
                {global.topCountries.map((c) => (
                  <li key={c.country} className="flex justify-between">
                    <span className="text-slate-300">{c.country}</span>
                    <span>{c.count}</span>
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
