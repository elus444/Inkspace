// import { useState, useEffect, type FormEvent } from 'react';
// import { useParams } from 'react-router-dom';
// import { postApi, commentApi, likeApi } from '../api/axios';
// import { type Post, type Comment } from '../types';
// import { useAuth } from '../hooks/useAuth';
// import { motion, AnimatePresence } from 'framer-motion';
// import { FiHeart, FiMessageSquare } from 'react-icons/fi';

// const PostDetail = () => {
//   const { id } = useParams<{ id: string }>();
//   const { user } = useAuth();

//   const [post, setPost] = useState<Post | null>(null);
//   const [comments, setComments] = useState<Comment[]>([]);
//   const [likeCount, setLikeCount] = useState(0);
//   const [hasLiked, setHasLiked] = useState(false);
//   const [newComment, setNewComment] = useState('');
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     if (!id) return;
//     const fetchData = async () => {
//       try {
//         const [postRes, commentsRes, likeCountRes, hasLikedRes] = await Promise.all([
//           postApi.get(`/${id}`),
//           commentApi.get(`/post/${id}`),
//           likeApi.get(`/post/${id}/count`),
//           user ? likeApi.get(`/post/${id}/liked`) : Promise.resolve({ data: { liked: false } })
//         ]);
//         setPost(postRes.data);
//         setComments(commentsRes.data);
//         setLikeCount(likeCountRes.data.count);
//         setHasLiked(hasLikedRes.data.liked);
//       } catch (error) {
//         console.error("Failed to fetch post details:", error);
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchData();
//   }, [id, user]);

//   const handleLike = async () => {
//     if (!user || !id) return;
//     try {
//       if (hasLiked) {
//         await likeApi.delete('/', { data: { postId: id } });
//         setLikeCount(prev => prev - 1);
//       } else {
//         await likeApi.post('/', { postId: id });
//         setLikeCount(prev => prev + 1);
//       }
//       setHasLiked(!hasLiked);
//     } catch (error) {
//       console.error("Failed to update like status:", error);
//     }
//   };

//   const handleCommentSubmit = async (e: FormEvent) => {
//     e.preventDefault();
//     if (!newComment.trim() || !id) return;
//     try {
//       const response = await commentApi.post('/', { postId: id, content: newComment });
//       setComments(prev => [response.data, ...prev]);
//       setNewComment('');
//     } catch (error) {
//       console.error("Failed to add comment:", error);
//     }
//   };

//   if (loading) return (
//     <div className="flex justify-center items-center h-64">
//       <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-400"></div>
//     </div>
//   );
//   if (!post) return <div className="text-center mt-10 text-red-400">Post not found.</div>;

//   return (
//     <motion.div
//       initial={{ opacity: 0 }}
//       animate={{ opacity: 1 }}
//       className="bg-slate-800 p-6 sm:p-8 rounded-lg shadow-2xl max-w-4xl mx-auto my-10 border border-slate-700"
//     >
//       <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 text-slate-100 tracking-tight">{post.title}</h1>
//       <p className="text-slate-400 mb-6">Published on {new Date(post.createdAt).toLocaleDateString()}</p>

//       <div className="prose prose-invert lg:prose-xl max-w-none mb-8 text-slate-300 prose-headings:text-slate-100 prose-a:text-indigo-400 hover:prose-a:text-indigo-300">
//         {post.content}
//       </div>

//       <div className="flex items-center space-x-6 border-t border-b border-slate-700 py-4 mb-8">
//         <motion.button
//           onClick={handleLike}
//           disabled={!user}
//           className="flex items-center space-x-2 text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed group"
//           whileTap={{ scale: 1.2 }}
//         >
//           <FiHeart className={`w-6 h-6 transition-colors duration-300 ${hasLiked ? 'text-red-500 fill-current' : 'group-hover:text-red-400'}`} />
//           <span className="font-semibold text-lg">{likeCount}</span>
//         </motion.button>
//         <div className="flex items-center space-x-2 text-slate-300">
//            <FiMessageSquare className="w-6 h-6"/>
//            <span className="font-semibold text-lg">{comments.length}</span>
//         </div>
//       </div>

//       <div>
//         <h3 className="text-2xl font-bold mb-4 text-slate-100">Comments</h3>
//         {user ? (
//           <form onSubmit={handleCommentSubmit} className="mb-6">
//             <textarea
//               value={newComment}
//               onChange={(e) => setNewComment(e.target.value)}
//               className="w-full p-3 border rounded-lg bg-slate-700 border-slate-600 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
//               placeholder="Add your comment..."
//               rows={3}
//             />
//             <motion.button
//                 whileHover={{ scale: 1.02 }}
//                 whileTap={{ scale: 0.98 }}
//                 type="submit"
//                 className="mt-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-600/30"
//             >
//               Post Comment
//             </motion.button>
//           </form>
//         ) : <p className="text-slate-400 mb-6">Please log in to comment.</p>}

//         <div className="space-y-4">
//           <AnimatePresence>
//             {comments.map(comment => (
//               <motion.div
//                 key={comment._id}
//                 initial={{ opacity: 0, y: 10 }}
//                 animate={{ opacity: 1, y: 0 }}
//                 exit={{ opacity: 0 }}
//                 className="bg-slate-700/50 p-4 rounded-lg"
//               >
//                 <p className="text-slate-300">{comment.content}</p>
//                 <p className="text-sm text-slate-500 mt-2">
//                   Commented on {new Date(comment.createdAt).toLocaleString()}
//                 </p>
//               </motion.div>
//             ))}
//           </AnimatePresence>
//         </div>
//       </div>
//     </motion.div>
//   );
// };

// export default PostDetail;


import { useState, useEffect, type FormEvent } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom'; // Added useNavigate and Link
import { postApi, commentApi, likeApi, saveApi, repostApi } from '../api/axios';
import { type Post, type Comment } from '../types';
import { useAuth } from '../hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import { FiHeart, FiMessageSquare, FiLogIn, FiBookmark, FiRepeat } from 'react-icons/fi'; // Added FiLogIn
import { trackView, trackLike, trackComment, trackSave, trackRepost, trackReadTime } from '../lib/analytics';

const PostDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate(); // Hook for redirection

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [likeCount, setLikeCount] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);
  const [hasReposted, setHasReposted] = useState(false);
  const [repostCount, setRepostCount] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);

  // Fires once per post visit, deliberately kept separate from the
  // fetchData effect below (which also depends on `user` and would
  // otherwise double-count a view when auth finishes loading).
  useEffect(() => {
    if (!id) return;
    trackView(id);
  }, [id]);

  // Reports how long the post was actually open, via sendBeacon so it
  // survives the tab closing (see lib/analytics.ts).
  useEffect(() => {
    if (!id) return;
    const startedAt = Date.now();
    let reported = false;
    const report = () => {
      if (reported) return; // one report per visit; avoids double-counting on tab-hide + unmount
      reported = true;
      trackReadTime(id, Date.now() - startedAt);
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') report();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('pagehide', report);
    return () => {
      report();
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('pagehide', report);
    };
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      try {
        const [postRes, commentsRes, likeCountRes, hasLikedRes, repostCountRes, hasSavedRes, hasRepostedRes] = await Promise.all([
          postApi.get(`/${id}`),
          commentApi.get(`/post/${id}`),
          likeApi.get(`/post/${id}/count`),
          user ? likeApi.get(`/post/${id}/liked`) : Promise.resolve({ data: { liked: false } }),
          repostApi.get(`/post/${id}/count`),
          user ? saveApi.get(`/post/${id}/saved`) : Promise.resolve({ data: { saved: false } }),
          user ? repostApi.get(`/post/${id}/reposted`) : Promise.resolve({ data: { reposted: false } }),
        ]);
        setPost(postRes.data);
        setComments(commentsRes.data);
        setLikeCount(likeCountRes.data.count);
        setHasLiked(hasLikedRes.data.liked);
        setRepostCount(repostCountRes.data.count);
        setHasSaved(hasSavedRes.data.saved);
        setHasReposted(hasRepostedRes.data.reposted);
      } catch (error) {
        console.error("Failed to fetch post details:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, user]);

  const handleLike = async () => {
    // If not logged in, redirect to login page
    if (!user) {
      navigate('/login');
      return;
    }

    if (!id) return;
    try {
      if (hasLiked) {
        await likeApi.delete('/', { data: { postId: id } });
        setLikeCount(prev => prev - 1);
      } else {
        await likeApi.post('/', { postId: id });
        setLikeCount(prev => prev + 1);
        trackLike(id);
      }
      setHasLiked(!hasLiked);
    } catch (error) {
      console.error("Failed to update like status:", error);
    }
  };

  const handleSave = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!id) return;
    try {
      if (hasSaved) {
        await saveApi.delete('/', { data: { postId: id } });
      } else {
        await saveApi.post('/', { postId: id });
        trackSave(id);
      }
      setHasSaved(!hasSaved);
    } catch (error) {
      console.error("Failed to update save status:", error);
    }
  };

  const handleRepost = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!id) return;
    try {
      if (hasReposted) {
        await repostApi.delete('/', { data: { postId: id } });
        setRepostCount((prev) => prev - 1);
      } else {
        await repostApi.post('/', { postId: id });
        setRepostCount((prev) => prev + 1);
        trackRepost(id);
      }
      setHasReposted(!hasReposted);
    } catch (error) {
      console.error("Failed to update repost status:", error);
    }
  };

  const handleCommentSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !id) return;
    try {
      const response = await commentApi.post('/', { postId: id, content: newComment });
      setComments(prev => [response.data, ...prev]);
      setNewComment('');
      trackComment(id);
    } catch (error) {
      console.error("Failed to add comment:", error);
    }
  };

  const easeEditorial = [0.22, 1, 0.36, 1] as const;

  if (loading) return (
    <div className="flex h-64 items-center justify-center">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1.1, repeat: Infinity, ease: 'linear' }}
        className="h-10 w-10 rounded-full border-2 border-border-warm border-t-maroon"
      />
    </div>
  );
  if (!post) return <div className="mt-10 text-center font-display text-xl italic text-maroon-dark">Post not found.</div>;

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: easeEditorial }}
      className="mx-auto my-6 max-w-3xl rounded-2xl border border-border-warm bg-cream p-8 shadow-warm-sm sm:p-12"
    >
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-taupe">
        {new Date(post.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
      </p>
      <h1 className="mb-8 font-display text-4xl italic leading-tight text-ink sm:text-5xl">{post.title}</h1>

      <div className="prose prose-lg max-w-none whitespace-pre-wrap text-[17px] leading-relaxed text-ink-soft">
        {post.content}
      </div>

      <div className="my-8 flex items-center gap-6 border-y border-border-warm py-4">
        <motion.button
          onClick={handleLike}
          className="group flex items-center gap-2 transition-colors duration-300"
          whileTap={{ scale: 1.25 }}
        >
          <FiHeart
            className={`h-5 w-5 transition-colors duration-300 ${
              hasLiked ? 'fill-maroon text-maroon' : 'text-taupe group-hover:text-maroon'
            }`}
          />
          <span className="text-sm font-semibold text-ink-soft">{likeCount}</span>
        </motion.button>
        <div className="flex items-center gap-2 text-ink-soft">
          <FiMessageSquare className="h-5 w-5" />
          <span className="text-sm font-semibold">{comments.length}</span>
        </div>
        <motion.button
          onClick={handleRepost}
          className="group flex items-center gap-2 transition-colors duration-300"
          whileTap={{ scale: 1.25 }}
          title={hasReposted ? 'Un-repost' : 'Repost'}
        >
          <FiRepeat
            className={`h-5 w-5 transition-colors duration-300 ${
              hasReposted ? 'text-maroon' : 'text-taupe group-hover:text-maroon'
            }`}
          />
          <span className="text-sm font-semibold text-ink-soft">{repostCount}</span>
        </motion.button>
        <motion.button
          onClick={handleSave}
          className="group ml-auto flex items-center gap-2 transition-colors duration-300"
          whileTap={{ scale: 1.25 }}
          title={hasSaved ? 'Remove from Library' : 'Save to Library'}
        >
          <FiBookmark
            className={`h-5 w-5 transition-colors duration-300 ${
              hasSaved ? 'fill-maroon text-maroon' : 'text-taupe group-hover:text-maroon'
            }`}
          />
        </motion.button>
      </div>

      <div>
        <h3 className="mb-4 font-display text-xl italic text-ink">Comments</h3>

        {user ? (
          <form onSubmit={handleCommentSubmit} className="mb-8">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="w-full rounded-xl border border-border-warm bg-parchment/40 p-3 text-sm text-ink placeholder:text-taupe/70 focus:border-maroon focus:outline-none focus:ring-0"
              placeholder="Add your comment..."
              rows={3}
            />
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="mt-3 rounded-full bg-maroon px-6 py-2 text-sm font-medium text-cream shadow-warm-sm transition-colors"
            >
              Post comment
            </motion.button>
          </form>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 rounded-xl border border-border-warm bg-parchment/50 p-6 text-center"
          >
            <p className="mb-4 text-ink-soft">Log in to like this post and join the conversation.</p>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-full bg-maroon px-6 py-2 text-sm font-medium text-cream shadow-warm-sm transition-colors"
            >
              <FiLogIn size={15} />
              <span>Login to interact</span>
            </Link>
          </motion.div>
        )}

        <div className="space-y-3">
          <AnimatePresence>
            {comments.map((comment) => (
              <motion.div
                key={comment._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="rounded-xl border border-border-warm/70 bg-parchment/40 p-4"
              >
                <p className="text-sm text-ink-soft">{comment.content}</p>
                <p className="mt-2 text-xs text-taupe">
                  Commented on {new Date(comment.createdAt).toLocaleString()}
                </p>
              </motion.div>
            ))}
          </AnimatePresence>
          {comments.length === 0 && !user && (
            <p className="italic text-taupe">No comments yet. Be the first to comment after logging in!</p>
          )}
        </div>
      </div>
    </motion.article>
  );
};

export default PostDetail;