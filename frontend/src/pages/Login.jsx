// src/pages/Login.jsx
import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import api from "../services/api";

const AnimatedBackground = () => (
  <div className="absolute inset-0 w-full h-full overflow-hidden">
    <motion.div
      animate={{ x: ['-20%', '20%'], y: ['-20%', '30%'], rotate: [0, 180] }}
      transition={{ duration: 40, repeat: Infinity, repeatType: 'reverse', ease: 'linear' }}
      className="absolute top-0 left-0 w-96 h-96 bg-indigo-500/30 rounded-full filter blur-3xl"
    />
    <motion.div
      animate={{ x: ['80%', '120%'], y: ['70%', '10%'], rotate: [0, -180] }}
      transition={{ duration: 35, repeat: Infinity, repeatType: 'reverse', ease: 'linear' }}
      className="absolute bottom-0 right-0 w-80 h-80 bg-cyan-500/30 rounded-full filter blur-3xl"
    />
  </div>
);

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const response = await api.post('/auth/login', { username, password });
      login(response.data.token);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.msg || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-gray-900 via-indigo-900 to-purple-900 overflow-hidden p-4">
      <AnimatedBackground />
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 bg-black/30 backdrop-blur-lg border border-white/10 shadow-2xl rounded-2xl p-6 sm:p-10 w-full max-w-md text-white"
      >
        <div className="flex flex-col items-center mb-8">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut' }}
            className="bg-gradient-to-tr from-cyan-400 to-blue-500 rounded-full p-4 shadow-lg text-4xl"
          >
            💬
          </motion.div>
          <h1 className="mt-4 text-3xl sm:text-4xl font-extrabold tracking-wide">Welcome Back</h1>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="block mb-1 text-sm font-semibold text-gray-300">Email or Phone Number</label>
            <input 
              type="text" 
              placeholder="Enter your email or phone" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              className="w-full px-4 py-3 rounded-lg bg-white/10 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all" 
              required 
            />
          </div>
          <div>
            <label className="block mb-1 text-sm font-semibold text-gray-300">Password</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              className="w-full px-4 py-3 rounded-lg bg-white/10 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all" 
              required 
            />
          </div>
          <motion.button type="submit" disabled={isLoading} whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }} className="w-full py-3 mt-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg font-semibold text-white shadow-lg hover:shadow-blue-500/50 transition-all disabled:opacity-50">
            {isLoading ? 'Logging In...' : 'Log In'}
          </motion.button>
        </form>
        {error && <p className="mt-4 text-center text-red-400 font-medium">{error}</p>}
        <p className="mt-8 text-center text-gray-400 text-sm">
          Don't have an account? <Link to="/register" className="font-semibold text-blue-400 hover:underline">Sign up</Link>
        </p>
      </motion.div>
    </div>
  );
}