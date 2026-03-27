import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'motion/react';
import { Lock, User } from 'lucide-react';
import { fetchFromGAS } from '../lib/api';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const data = await fetchFromGAS('login', { username, password });
      
      // Handle new response format with success field
      if (!data.success) {
        setError(data.error || 'Login failed');
        return;
      }
      
      login(data.user, data.token);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-vista/30 blur-3xl mix-blend-multiply animate-blob"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-deyork/30 blur-3xl mix-blend-multiply animate-blob animation-delay-2000"></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md glass rounded-3xl p-8 shadow-2xl relative z-10"
      >
        <div className="text-center mb-8">
          <div className="w-24 h-24 rounded-full bg-frostee flex items-center justify-center mx-auto mb-4 shadow-lg overflow-hidden border-4 border-jewel/10">
            {logoError ? (
              <span className="text-jewel font-bold text-3xl">TY</span>
            ) : (
              <img 
                src="https://i.imgur.com/xggJ5lV.png" 
                alt="TCYDO Logo" 
                className="w-full h-full object-cover" 
                onError={() => setLogoError(true)}
              />
            )}
          </div>
          <h1 className="text-3xl font-bold text-jewel mb-2">TCYDO</h1>
          <p className="text-jewel/70">Tagum City Youth Development Office</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-jewel mb-2">Username</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User size={20} className="text-jewel/50" />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-frostee/50 border border-white/30 rounded-xl focus:ring-2 focus:ring-jewel focus:border-transparent outline-none transition-all placeholder-jewel/40 text-jewel"
                placeholder="Enter your username"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-jewel mb-2">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock size={20} className="text-jewel/50" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-frostee/50 border border-white/30 rounded-xl focus:ring-2 focus:ring-jewel focus:border-transparent outline-none transition-all placeholder-jewel/40 text-jewel"
                placeholder="Enter your password"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 px-4 bg-jewel hover:bg-jewel/90 text-white font-medium rounded-xl shadow-lg shadow-jewel/30 transition-all transform hover:-translate-y-0.5"
          >
            Sign In
          </button>
        </form>

      </motion.div>
    </div>
  );
}
