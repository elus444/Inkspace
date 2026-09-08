import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { authApi } from '../api/axios';
import { motion } from 'framer-motion';
import { FiAlertTriangle, FiFeather } from 'react-icons/fi';
import { trackLogin } from '../lib/analytics';

const easeEditorial = [0.22, 1, 0.36, 1] as const;

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const response = await authApi.post('/login', { email, password });
      login(response.data.token);
      trackLogin();
      navigate('/');
    } catch (err) {
      setError('Failed to login. Please check your credentials.');
      console.error(err);
    }
  };

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: easeEditorial }}
        className="rounded-2xl border border-border-warm bg-cream p-6 shadow-warm sm:p-10"
      >
        <div className="mb-8 text-center">
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-border-warm bg-parchment text-maroon"
          >
            <FiFeather size={18} />
          </motion.div>
          <h2 className="font-display text-3xl italic text-ink">Welcome back</h2>
          <p className="mt-2 text-sm text-taupe">Sign in to keep writing.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 rounded-lg bg-maroon/10 px-3 py-2.5 text-sm text-maroon-dark"
            >
              <FiAlertTriangle />
              <span>{error}</span>
            </motion.div>
          )}

          <div>
            <label htmlFor="email" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-taupe">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border-0 border-b border-border-warm bg-transparent px-0 py-2 text-ink placeholder:text-taupe/60 focus:border-maroon focus:outline-none focus:ring-0"
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-taupe">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border-0 border-b border-border-warm bg-transparent px-0 py-2 text-ink placeholder:text-taupe/60 focus:border-maroon focus:outline-none focus:ring-0"
              required
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.015, boxShadow: '0 14px 34px -14px rgba(122,46,61,0.55)' }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            className="w-full rounded-full bg-maroon py-3 text-sm font-medium text-cream shadow-warm-sm transition-colors"
          >
            Sign in
          </motion.button>
        </form>

        <p className="mt-8 text-center text-sm text-taupe">
          New here?{' '}
          <Link to="/register" className="link-underline font-medium text-maroon">
            Create an account
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
