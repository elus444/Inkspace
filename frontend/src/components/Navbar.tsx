import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { motion } from 'framer-motion';
import { FiLogIn, FiLogOut, FiPlusSquare, FiUserPlus } from 'react-icons/fi';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItemVariants = {
    hidden: { y: -20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.3 } },
  };

  return (
    <nav className="bg-slate-900/80 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="text-2xl font-bold text-indigo-400 hover:text-indigo-300 transition-all duration-300 hover:drop-shadow-[0_0_8px_rgba(129,140,248,0.5)]">
            Inkspace
          </Link>
          <motion.div
            className="flex items-center space-x-4"
            initial="hidden"
            animate="visible"
            variants={{
              visible: { transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
            }}
          >
            {user ? (
              <>
                <motion.div variants={navItemVariants}>
                  <Link to="/create-post" className="flex items-center space-x-2 text-slate-300 hover:text-indigo-400 transition-colors">
                    <FiPlusSquare />
                    <span>Create Post</span>
                  </Link>
                </motion.div>
                <motion.div variants={navItemVariants}>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-2 bg-slate-800 text-slate-300 px-4 py-2 rounded-md hover:bg-red-500 hover:text-white transition-all duration-300 transform hover:scale-105"
                  >
                    <FiLogOut />
                    <span>Logout</span>
                  </button>
                </motion.div>
              </>
            ) : (
              <>
                <motion.div variants={navItemVariants}>
                  <Link to="/login" className="flex items-center space-x-2 text-slate-300 hover:text-indigo-400 transition-colors">
                     <FiLogIn />
                     <span>Login</span>
                  </Link>
                </motion.div>
                <motion.div variants={navItemVariants}>
                  <Link
                    to="/register"
                    className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-500 transition-all duration-300 transform hover:scale-105 shadow-lg shadow-indigo-600/30"
                  >
                    <FiUserPlus />
                    <span>Register</span>
                  </Link>
                </motion.div>
              </>
            )}
          </motion.div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;