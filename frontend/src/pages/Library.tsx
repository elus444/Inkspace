import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiBookmark, FiRepeat, FiArrowRight, FiX } from 'react-icons/fi';
import { postApi, saveApi, repostApi } from '../api/axios';
import { type Post, type PostsResponse } from '../types';

const easeEditorial = [0.22, 1, 0.36, 1] as const;

interface SavedRecord {
  _id: string;
  postId: string;
  createdAt: string;
}

type Tab = 'saved' | 'reposted';

/** Batch-fetches post details for a list of saved/reposted records,
 *  preserving the records' own order (most recent action first) rather
 *  than whatever order the posts happen to come back in. */
async function resolvePosts(records: SavedRecord[]): Promise<Post[]> {
  const ids = records.map((r) => r.postId);
  if (ids.length === 0) return [];
  const res = await postApi.get<PostsResponse>('/', { params: { ids: ids.join(',') } });
  const byId = new Map(res.data.posts.map((p) => [p._id, p]));
  return records.map((r) => byId.get(r.postId)).filter((p): p is Post => Boolean(p));
}

const Library = () => {
  const [tab, setTab] = useState<Tab>('saved');
  const [savedPosts, setSavedPosts] = useState<Post[]>([]);
  const [repostedPosts, setRepostedPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [savesRes, repostsRes] = await Promise.all([
          saveApi.get<SavedRecord[]>('/me'),
          repostApi.get<SavedRecord[]>('/me'),
        ]);
        const [saved, reposted] = await Promise.all([
          resolvePosts(savesRes.data),
          resolvePosts(repostsRes.data),
        ]);
        setSavedPosts(saved);
        setRepostedPosts(reposted);
      } catch (error) {
        console.error('Failed to load library:', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleUnsave = async (postId: string) => {
    try {
      await saveApi.delete('/', { data: { postId } });
      setSavedPosts((prev) => prev.filter((p) => p._id !== postId));
    } catch (error) {
      console.error('Failed to unsave post:', error);
    }
  };

  const handleUnrepost = async (postId: string) => {
    try {
      await repostApi.delete('/', { data: { postId } });
      setRepostedPosts((prev) => prev.filter((p) => p._id !== postId));
    } catch (error) {
      console.error('Failed to remove repost:', error);
    }
  };

  const items = tab === 'saved' ? savedPosts : repostedPosts;
  const onRemove = tab === 'saved' ? handleUnsave : handleUnrepost;

  return (
    <div className="mx-auto max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: easeEditorial }}
        className="mb-8"
      >
        <p className="mb-1 text-xs font-semibold uppercase tracking-[0.25em] text-taupe">Your corner</p>
        <h1 className="font-display text-3xl italic text-ink">Library</h1>
        <p className="mt-1 text-sm text-ink-soft">Everything you've saved and reposted, in one place.</p>
      </motion.div>

      <div className="mb-8 flex gap-1 rounded-full bg-parchment p-1 w-fit">
        <button
          onClick={() => setTab('saved')}
          className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm transition-colors ${
            tab === 'saved' ? 'bg-maroon text-cream' : 'text-taupe hover:text-maroon'
          }`}
        >
          <FiBookmark size={14} /> Saved
        </button>
        <button
          onClick={() => setTab('reposted')}
          className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm transition-colors ${
            tab === 'reposted' ? 'bg-maroon text-cream' : 'text-taupe hover:text-maroon'
          }`}
        >
          <FiRepeat size={14} /> Reposted
        </button>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.1, repeat: Infinity, ease: 'linear' }}
            className="h-10 w-10 rounded-full border-2 border-border-warm border-t-maroon"
          />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border-warm bg-parchment/50 px-6 py-16 text-center">
          <p className="font-display text-xl italic text-ink-soft">
            {tab === 'saved' ? "Nothing saved yet." : "Nothing reposted yet."}
          </p>
          <p className="mt-2 text-sm text-taupe">
            {tab === 'saved'
              ? 'Bookmark a post from its page to find it here later.'
              : 'Repost a post from its page to share it with everyone, and see it here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((post) => (
            <motion.div
              key={post._id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-start justify-between gap-4 rounded-2xl border border-border-warm bg-cream p-5 shadow-warm-sm"
            >
              <Link to={`/post/${post._id}`} className="group flex-1">
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-taupe">
                  {new Date(post.createdAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
                <h3 className="font-display text-lg italic text-ink transition-colors group-hover:text-maroon">
                  {post.title}
                </h3>
                <p className="mt-2 line-clamp-2 text-sm text-ink-soft">{post.content}</p>
                <div className="mt-3 flex items-center text-sm font-medium text-maroon">
                  Read story
                  <FiArrowRight className="ml-2 transition-transform duration-300 group-hover:translate-x-1" />
                </div>
              </Link>
              <button
                onClick={() => onRemove(post._id)}
                title={tab === 'saved' ? 'Remove from saved' : 'Remove repost'}
                className="shrink-0 rounded-full p-2 text-taupe transition-colors hover:bg-parchment hover:text-maroon"
              >
                <FiX size={16} />
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Library;
