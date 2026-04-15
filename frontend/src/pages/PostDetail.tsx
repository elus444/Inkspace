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
import { postApi, commentApi, likeApi } from '../api/axios';
import { type Post, type Comment } from '../types';
import { useAuth } from '../hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import { FiHeart, FiMessageSquare, FiLogIn } from 'react-icons/fi'; // Added FiLogIn

const PostDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate(); // Hook for redirection

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [likeCount, setLikeCount] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      try {
        const [postRes, commentsRes, likeCountRes, hasLikedRes] = await Promise.all([
          postApi.get(`/${id}`),
          commentApi.get(`/post/${id}`),
          likeApi.get(`/post/${id}/count`),
          user ? likeApi.get(`/post/${id}/liked`) : Promise.resolve({ data: { liked: false } })
        ]);
        setPost(postRes.data);
        setComments(commentsRes.data);
        setLikeCount(likeCountRes.data.count);
        setHasLiked(hasLikedRes.data.liked);
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
      }
      setHasLiked(!hasLiked);
    } catch (error) {
      console.error("Failed to update like status:", error);
    }
  };

  const handleCommentSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !id) return;
    try {
      const response = await commentApi.post('/', { postId: id, content: newComment });
      setComments(prev => [response.data, ...prev]);
      setNewComment('');
    } catch (error) {
      console.error("Failed to add comment:", error);
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-400"></div>
    </div>
  );
  if (!post) return <div className="text-center mt-10 text-red-400">Post not found.</div>;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-slate-800 p-6 sm:p-8 rounded-lg shadow-2xl max-w-4xl mx-auto my-10 border border-slate-700"
    >
      <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 text-slate-100 tracking-tight">{post.title}</h1>
      <p className="text-slate-400 mb-6">Published on {new Date(post.createdAt).toLocaleDateString()}</p>

      <div className="prose prose-invert lg:prose-xl max-w-none mb-8 text-slate-300 prose-headings:text-slate-100 prose-a:text-indigo-400 hover:prose-a:text-indigo-300">
        {post.content}
      </div>

      <div className="flex items-center space-x-6 border-t border-b border-slate-700 py-4 mb-8">
        <motion.button
          onClick={handleLike}
          // Removed disabled={!user} so clicking triggers the redirect logic in handleLike
          className={`flex items-center space-x-2 transition-colors duration-300 group ${!user ? 'cursor-pointer' : ''}`}
          whileTap={{ scale: 1.2 }}
        >
          <FiHeart className={`w-6 h-6 transition-colors duration-300 ${hasLiked ? 'text-red-500 fill-current' : 'text-slate-300 group-hover:text-red-400'}`} />
          <span className="font-semibold text-lg text-slate-300">{likeCount}</span>
        </motion.button>
        <div className="flex items-center space-x-2 text-slate-300">
           <FiMessageSquare className="w-6 h-6"/>
           <span className="font-semibold text-lg">{comments.length}</span>
        </div>
      </div>

      <div>
        <h3 className="text-2xl font-bold mb-4 text-slate-100">Comments</h3>
        
        {/* CONDITIONAL RENDERING FOR COMMENT FORM OR LOGIN PROMPT */}
        {user ? (
          <form onSubmit={handleCommentSubmit} className="mb-6">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="w-full p-3 border rounded-lg bg-slate-700 border-slate-600 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
              placeholder="Add your comment..."
              rows={3}
            />
            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="mt-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-600/30"
            >
              Post Comment
            </motion.button>
          </form>
        ) : (
          // The Login Message Prompt
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-6 bg-slate-700/30 border border-slate-600 rounded-lg text-center backdrop-blur-sm"
          >
            <p className="text-slate-300 text-lg mb-4">
              Log in to like this post and join the conversation.
            </p>
            <Link 
              to="/login"
              className="inline-flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg transition-all duration-300 shadow-lg shadow-indigo-600/30"
            >
              <FiLogIn />
              <span>Login to Interact</span>
            </Link>
          </motion.div>
        )}

        <div className="space-y-4">
          <AnimatePresence>
            {comments.map(comment => (
              <motion.div
                key={comment._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-slate-700/50 p-4 rounded-lg border border-slate-700/50"
              >
                <p className="text-slate-300">{comment.content}</p>
                <p className="text-sm text-slate-500 mt-2">
                  Commented on {new Date(comment.createdAt).toLocaleString()}
                </p>
              </motion.div>
            ))}
          </AnimatePresence>
          {comments.length === 0 && !user && (
            <p className="text-slate-500 italic">No comments yet. Be the first to comment after logging in!</p>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default PostDetail;