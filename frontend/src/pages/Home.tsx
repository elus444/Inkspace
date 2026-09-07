import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { postApi } from '../api/axios';
import { type Post } from '../types';
import { motion } from 'framer-motion';
import { FiArrowRight, FiFeather } from 'react-icons/fi';
import { useAuth } from '../hooks/useAuth';

const easeEditorial = [0.22, 1, 0.36, 1] as const;

const Home = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await postApi.get('/');
        setPosts(response.data);
      } catch (error) {
        console.error('Failed to fetch posts:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

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
          Inkspace is a small, unhurried corner of the internet for writing
          that takes its time — essays, notes, and stories worth reading
          slowly.
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
        ) : posts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-2xl border border-dashed border-border-warm bg-parchment/50 px-6 py-20 text-center"
          >
            <p className="font-display text-2xl italic text-ink-soft">
              Nothing's been written yet.
            </p>
            <p className="mt-2 text-sm text-taupe">
              {user ? 'Be the first — your story starts here.' : 'Sign in to write the first one.'}
            </p>
          </motion.div>
        ) : (
          <motion.div
            className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {posts.map((post) => (
              <motion.div
                key={post._id}
                variants={itemVariants}
                whileHover={{ y: -6 }}
                transition={{ type: 'spring', stiffness: 300, damping: 22 }}
              >
                <Link to={`/post/${post._id}`} className="group block h-full">
                  <div className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-border-warm bg-cream p-7 shadow-warm-sm transition-shadow duration-300 group-hover:shadow-warm">
                    <span className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-maroon transition-transform duration-300 group-hover:scale-x-100" />
                    <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-taupe">
                      {new Date(post.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                    <h3 className="font-display text-xl italic text-ink transition-colors duration-300 group-hover:text-maroon">
                      {post.title}
                    </h3>
                    <p className="mt-3 flex-1 text-sm leading-relaxed text-ink-soft">
                      {post.content.slice(0, 120)}
                      {post.content.length > 120 ? '...' : ''}
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
        )}
      </section>
    </div>
  );
};

export default Home;
