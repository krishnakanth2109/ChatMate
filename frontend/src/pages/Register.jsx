import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

export default function Register() {
  const [formData, setFormData] = useState({ name: '', email: '' });
  const [password, setPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const response = await api.post('/auth/register', { 
        name: formData.name, 
        email: formData.email, 
        password 
      });
      
      login(response.data.token);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.msg || 'Registration failed. Please check your details.');
    } finally {
      setIsLoading(false);
    }
  };

  const formVariants = {
    hidden: { opacity: 0, x: 50 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 },
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-gray-900 via-indigo-900 to-purple-900 overflow-hidden p-4">
      <AnimatedBackground />
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 bg-black/30 backdrop-blur-lg border border-white/10 shadow-2xl rounded-2xl p-6 sm:p-10 w-full max-w-md text-white"
      >
        <AnimatePresence mode="wait">
          <motion.div key="step1" variants={formVariants} initial="hidden" animate="visible" exit="exit">
            <h1 className="text-center text-3xl sm:text-4xl font-extrabold mb-8">Create Your Account</h1>
            <form className="space-y-4" onSubmit={handleRegister}>
              <input 
                name="name" 
                type="text" 
                placeholder="Full Name" 
                value={formData.name} 
                onChange={handleInputChange} 
                className="w-full px-4 py-3 rounded-lg bg-white/10 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400" 
                required 
              />
              <input 
                name="email" 
                type="email" 
                placeholder="Email Address" 
                value={formData.email} 
                onChange={handleInputChange} 
                className="w-full px-4 py-3 rounded-lg bg-white/10 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400" 
                required 
              />
              <input 
                name="password" 
                type="password" 
                placeholder="Password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                className="w-full px-4 py-3 rounded-lg bg-white/10 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400" 
                required 
              />
              
              <div className="flex items-center space-x-2 text-sm pt-2">
                  <input 
                    type="checkbox" 
                    id="terms" 
                    checked={agreedToTerms} 
                    onChange={(e) => setAgreedToTerms(e.target.checked)} 
                    className="h-4 w-4 rounded bg-white/20 border-gray-500 text-blue-500 focus:ring-blue-500"
                  />
                  <label htmlFor="terms" className="text-gray-300">
                    I agree to the <a href="#" className="font-semibold text-blue-400 hover:underline">Terms & Conditions</a>
                  </label>
              </div>
              
              <motion.button 
                type="submit" 
                disabled={isLoading || !agreedToTerms} 
                whileHover={{ scale: 1.05, y: -2 }} 
                whileTap={{ scale: 0.95 }} 
                className="w-full py-3 mt-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg font-semibold disabled:opacity-50"
              >
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </motion.button>
            </form>
          </motion.div>
        </AnimatePresence>
        
        {error && <p className="mt-4 text-center text-red-400 font-medium">{error}</p>}
        
        <p className="mt-8 text-center text-gray-400 text-sm">
          Already have an account? <Link to="/login" className="font-semibold text-blue-400 hover:underline">Log in</Link>
        </p>
      </motion.div>
    </div>
  );
}