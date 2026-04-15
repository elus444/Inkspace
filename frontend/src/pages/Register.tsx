import { useState, type  FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api/axios';
import { motion } from 'framer-motion';
import { FiAlertTriangle } from 'react-icons/fi';


const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await authApi.post('/register', { name, email, password });
      navigate('/login');
    } catch (err) {
      setError('Failed to register. The email might already be in use.');
      console.error(err);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-md mx-auto bg-slate-800 p-8 rounded-lg shadow-2xl shadow-slate-900/50 border border-slate-700 mt-10"
    >
      <h2 className="text-3xl font-bold mb-6 text-center text-slate-100">Create an Account</h2>
      <form onSubmit={handleSubmit}>
        {error && (
            <div className="bg-red-500/10 text-red-400 text-sm p-3 rounded-lg mb-4 flex items-center space-x-2">
                <FiAlertTriangle/>
                <span>{error}</span>
            </div>
        )}
        <div className="mb-4">
          <label className="block text-slate-400 mb-2" htmlFor="name">Name</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg bg-slate-700 border-slate-600 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-slate-400 mb-2" htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg bg-slate-700 border-slate-600 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
            required
          />
        </div>
        <div className="mb-6">
          <label className="block text-slate-400 mb-2" htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg bg-slate-700 border-slate-600 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
            required
          />
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-600/30"
        >
          Register
        </motion.button>
      </form>
    </motion.div>
  );
};

export default Register;