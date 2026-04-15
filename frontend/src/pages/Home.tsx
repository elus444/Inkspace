import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { postApi } from '../api/axios';
import { type Post } from '../types';
import { motion } from 'framer-motion';
import { FiArrowRight } from 'react-icons/fi';

const Home = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await postApi.get('/');
        setPosts(response.data);
      } catch (error) {
        console.error("Failed to fetch posts:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5 } },
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-400"></div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.h1
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="text-4xl font-bold mb-8 text-slate-100 tracking-tight"
      >
        Latest Posts
      </motion.h1>
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {posts.map((post) => (
          <motion.div key={post._id} variants={itemVariants}>
            <Link to={`/post/${post._id}`}>
              <div className="bg-slate-800 rounded-lg shadow-lg overflow-hidden h-full group relative border border-slate-700 transition-all duration-300 hover:border-indigo-500/50 hover:shadow-indigo-500/20 hover:shadow-2xl">
                <div className="p-6 flex flex-col justify-between h-full">
                  <div>
                    <h2 className="text-2xl font-bold mb-2 text-slate-100 group-hover:text-indigo-400 transition-colors duration-300">{post.title}</h2>
                    <p className="text-slate-400 mb-4 leading-relaxed">{post.content.substring(0, 100)}...</p>
                  </div>
                  <div className="mt-4 flex items-center font-semibold text-indigo-400 group-hover:text-indigo-300 transition-colors duration-300">
                    Read More <FiArrowRight className="ml-2 transform group-hover:translate-x-1 transition-transform duration-300" />
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

export default Home;