import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { postApi, repostApi, authApi } from '../api/axios';
import { type Post, type PostsResponse } from '../types';
import { motion } from 'framer-motion';
import { FiArrowRight, FiFeather, FiRepeat } from 'react-icons/fi';
import { useAuth } from '../hooks/useAuth';

const easeEditorial = [0.22, 1, 0.36, 1] as const;
const PAGE_SIZE = 12;

interface RepostRecord {
  _id: string;
  userId: string;
  postId: string;
  createdAt: string;
}

interface FeedItem {
  key: string;
  timestamp: string;
  post: Post;
  repostedBy?: string; // reposter's display name, if this item is a repost
}

/** Batch-resolves userIds -> display names, tolerating the endpoint being
 *  briefly unavailable (feed still renders, just without names). */
async function resolveNames(ids: string[]): Promise<Map<string, string>> {
  const unique = [...new Set(ids)].filter(Boolean);
  if (unique.length === 0) return new Map();
  try {
    const res = await authApi.get<{ _id: string; name: string }[]>('/users', {
      params: { ids: unique.join(',') },
    });
    return new Map(res.data.map((u) => [u._id, u.name]));
  } catch (err) {
    console.error('Failed to resolve author names:', err);
    return new Map();
  }
}

function buildFeed(posts: Post[], reposts: RepostRecord[], postById: Map<string, Post>, nameById: Map<string, string>): FeedItem[] {
  const items: FeedItem[] = [];
  for (const post of posts) {
    items.push({ key: `post:${post._id}`, timestamp: post.createdAt, post });
  }
  for (const repost of reposts) {
    const post = postById.get(repost.postId);
    if (!post) continue; // original post may have been deleted since
    items.push({
      key: `repost:${repost._id}`,
      timestamp: repost.createdAt,
      post,
      repostedBy: nameById.get(repost.userId) ?? 'Someone',
    });
  }
  return items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

const Home = () => {
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextPage, setNextPage] = useState(2);
  const { user } = useAuth();

  useEffect(() => {
    const load = async () => {
      try {
        const [postsRes, repostsRes] = await Promise.all([
          postApi.get<PostsResponse>('/', { params: { page: 1, limit: PAGE_SIZE } }),
          repostApi.get<RepostRecord[]>('/feed', { params: { limit: PAGE_SIZE } }),
        ]);

        const posts = postsRes.data.posts;
        const postById = new Map(posts.map((p) => [p._id, p]));
        const missingIds = repostsRes.data.map((r) => r.postId).filter((id) => !postById.has(id));
        if (missingIds.length > 0) {
          const extra = await postApi.get<PostsResponse>('/', { params: { ids: missingIds.join(',') } });
          for (const p of extra.data.posts) postById.set(p._id, p);
        }

        const nameIds = [...posts.map((p) => p.authorId), ...repostsRes.data.map((r) => r.userId)];
        const names = await resolveNames(nameIds);

        setFeed(buildFeed(posts, repostsRes.data, postById, names));
        setHasMore(postsRes.data.hasMore || repostsRes.data.length === PAGE_SIZE);
      } catch (error) {
        console.error('Failed to fetch home feed:', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const oldestShown = feed.length > 0 ? feed[feed.length - 1]!.timestamp : undefined;
      const [postsRes, repostsRes] = await Promise.all([
        postApi.get<PostsResponse>('/', { params: { page: nextPage, limit: PAGE_SIZE } }),
        repostApi.get<RepostRecord[]>('/feed', { params: { limit: PAGE_SIZE, before: oldestShown } }),
      ]);

      const posts = postsRes.data.posts;
      const postById = new Map(posts.map((p) => [p._id, p]));
      const missingIds = repostsRes.data.map((r) => r.postId).filter((id) => !postById.has(id));
      if (missingIds.length > 0) {
        const extra = await postApi.get<PostsResponse>('/', { params: { ids: missingIds.join(',') } });
        for (const p of extra.data.posts) postById.set(p._id, p);
      }

      const nameIds = [...posts.map((p) => p.authorId), ...repostsRes.data.map((r) => r.userId)];
      const names = await resolveNames(nameIds);

      const newItems = buildFeed(posts, repostsRes.data, postById, names);
      setFeed((prev) => {
        const seen = new Set(prev.map((item) => item.key));
        return [...prev, ...newItems.filter((item) => !seen.has(item.key))];
      });
      setHasMore(postsRes.data.hasMore || repostsRes.data.length === PAGE_SIZE);
      setNextPage((p) => p + 1);
    } catch (error) {
      console.error('Failed to load more posts:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { y: 28, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.6, ease: easeEditorial } },
  };

  return (
    <div className="mx-auto max-w-6xl">
      {/* Hero */}
      <section className="relative pb-16 pt-6 text-center sm:pt-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: easeEditorial }}
          className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full border border-border-warm bg-parchment text-maroon shadow-warm-sm"
        >
          <FiFeather size={22} />
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-taupe"
        >
          A quieter place to write
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15, ease: easeEditorial }}
          className="font-display text-5xl italic leading-tight text-ink sm:text-6xl"
        >
          Stories worth <span className="text-maroon">savoring.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-ink-soft"
        >
          Inkspace is a small, unhurried corner of the internet for essays,
          notes, and stories worth reading slowly.
        </motion.p>

        {!user && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.45 }}
            className="mt-8 flex items-center justify-center gap-3"
          >
            <Link to="/register">
              <motion.span
                whileHover={{ scale: 1.04, boxShadow: '0 14px 34px -14px rgba(122,46,61,0.55)' }}
                whileTap={{ scale: 0.97 }}
                className="inline-block rounded-full bg-maroon px-6 py-3 text-sm font-medium text-cream shadow-warm-sm"
              >
                Start writing
              </motion.span>
            </Link>
            <Link
              to="/login"
              className="link-underline px-4 py-3 text-sm font-medium text-ink-soft hover:text-maroon"
            >
              Sign in
            </Link>
          </motion.div>
        )}
      </section>

      <div className="mx-auto mb-14 h-px w-24 bg-border-warm" />

      {/* Posts */}
      <section>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-10 flex items-end justify-between"
        >
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.25em] text-taupe">
              From the desk
            </p>
            <h2 className="font-display text-3xl italic text-ink">Latest Posts</h2>
          </div>
        </motion.div>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.1, repeat: Infinity, ease: 'linear' }}
              className="h-10 w-10 rounded-full border-2 border-border-warm border-t-maroon"
            />
          </div>
        ) : feed.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-2xl border border-dashed border-border-warm bg-parchment/50 px-6 py-20 text-center"
          >
            <p className="font-display text-2xl italic text-ink-soft">
              Nothing's been written yet.
            </p>
            <p className="mt-2 text-sm text-taupe">
              {user ? 'Be the first to share something.' : 'Sign in to write the first one.'}
            </p>
          </motion.div>
        ) : (
          <>
            <motion.div
              className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {feed.map((item) => (
                <motion.div
                  key={item.key}
                  variants={itemVariants}
                  whileHover={{ y: -6 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                >
                  {item.repostedBy && (
                    <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-taupe">
                      <FiRepeat size={12} /> Reposted by {item.repostedBy}
                    </p>
                  )}
                  <Link to={`/post/${item.post._id}`} className="group block h-full">
                    <div className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-border-warm bg-cream p-7 shadow-warm-sm transition-shadow duration-300 group-hover:shadow-warm">
                      <span className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-maroon transition-transform duration-300 group-hover:scale-x-100" />
                      <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-taupe">
                        {new Date(item.post.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                      <h3 className="font-display text-xl italic text-ink transition-colors duration-300 group-hover:text-maroon">
                        {item.post.title}
                      </h3>
                      <p className="mt-3 flex-1 text-sm leading-relaxed text-ink-soft">
                        {item.post.content.slice(0, 120)}
                        {item.post.content.length > 120 ? '...' : ''}
                      </p>
                      <div className="mt-5 flex items-center text-sm font-medium text-maroon">
                        Read story
                        <FiArrowRight className="ml-2 transition-transform duration-300 group-hover:translate-x-1" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>

            {hasMore && (
              <div className="mt-10 flex justify-center">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="rounded-full border border-border-warm bg-parchment px-6 py-2.5 text-sm font-medium text-ink-soft transition-colors hover:border-maroon/40 hover:text-maroon disabled:opacity-50"
                >
                  {loadingMore ? 'Loading...' : 'Load more'}
                </motion.button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
};

export default Home;
