import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import CreatePost from './pages/CreatePost';
import PostDetail from './pages/PostDetail';
import Analytics from './pages/Analytics';
import ProtectedRoute from './components/ProtectedRoute';

const pageTransition = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.45, ease: [0.65, 0, 0.35, 1] as const },
};

const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div key={location.pathname} {...pageTransition}>
        <Routes location={location}>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/post/:id" element={<PostDetail />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/create-post" element={<CreatePost />} />
            <Route path="/analytics" element={<Analytics />} />
          </Route>
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="relative min-h-screen bg-cream text-ink overflow-x-hidden">
          {/* Soft ambient warmth behind everything -- fixed so it never
              scrolls with content, deliberately subtle rather than the
              saturated tech-gradient-orb look. */}
          <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
            <div className="absolute -top-40 -left-32 h-[32rem] w-[32rem] rounded-full bg-blush/60 blur-3xl" />
            <div className="absolute top-1/3 -right-40 h-[36rem] w-[36rem] rounded-full bg-parchment-dark/50 blur-3xl" />
            <div className="absolute bottom-0 left-1/4 h-96 w-96 rounded-full bg-maroon/[0.06] blur-3xl" />
          </div>

          <Navbar />
          <main className="container mx-auto px-4 py-10 sm:px-6 lg:px-8">
            <AnimatedRoutes />
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
