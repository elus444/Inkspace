import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { motion } from 'framer-motion';
import { FiLogIn, FiLogOut, FiPlusSquare, FiUserPlus, FiBarChart2, FiFeather } from 'react-icons/fi';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItemVariants = {
    hidden: { y: -16, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } },
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-border-warm/70 bg-cream/85 backdrop-blur-md">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-[4.5rem] items-center justify-between py-3">
          <Link to="/" className="group flex items-center gap-2">
            <motion.span
              whileHover={{ rotate: -12, scale: 1.08 }}
              transition={{ type: 'spring', stiffness: 300, damping: 15 }}
              className="text-maroon"
            >
              <FiFeather size={22} />
            </motion.span>
            <span className="font-display text-2xl italic tracking-tight text-ink transition-colors group-hover:text-maroon">
              Inkspace
            </span>
          </Link>

          <motion.div
            className="flex items-center gap-2 sm:gap-3"
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.08, delayChildren: 0.15 } } }}
          >
            {user ? (
              <>
                <motion.div variants={navItemVariants}>
                  <Link
                    to="/create-post"
                    className="link-underline hidden items-center gap-2 px-2 py-2 text-sm font-medium text-ink-soft transition-colors hover:text-maroon sm:flex"
                  >
                    <FiPlusSquare size={16} />
                    <span>Create Post</span>
                  </Link>
                </motion.div>
                <motion.div variants={navItemVariants}>
                  <Link
                    to="/analytics"
                    className="link-underline hidden items-center gap-2 px-2 py-2 text-sm font-medium text-ink-soft transition-colors hover:text-maroon sm:flex"
                  >
                    <FiBarChart2 size={16} />
                    <span>Analytics</span>
                  </Link>
                </motion.div>
                <motion.div variants={navItemVariants}>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleLogout}
                    className="flex items-center gap-2 rounded-full border border-border-warm bg-parchment px-4 py-2 text-sm font-medium text-ink-soft transition-colors hover:border-maroon/40 hover:bg-maroon hover:text-cream"
                  >
                    <FiLogOut size={15} />
                    <span>Logout</span>
                  </motion.button>
                </motion.div>
              </>
            ) : (
              <>
                <motion.div variants={navItemVariants}>
                  <Link
                    to="/login"
                    className="link-underline flex items-center gap-2 px-2 py-2 text-sm font-medium text-ink-soft transition-colors hover:text-maroon"
                  >
                    <FiLogIn size={16} />
                    <span>Login</span>
                  </Link>
                </motion.div>
                <motion.div variants={navItemVariants}>
                  <Link to="/register">
                    <motion.span
                      whileHover={{ scale: 1.04, boxShadow: '0 10px 30px -12px rgba(122,46,61,0.55)' }}
                      whileTap={{ scale: 0.97 }}
                      className="flex items-center gap-2 rounded-full bg-maroon px-4 py-2 text-sm font-medium text-cream shadow-warm-sm transition-colors"
                    >
                      <FiUserPlus size={15} />
                      <span>Register</span>
                    </motion.span>
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
