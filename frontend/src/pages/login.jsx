import React, { useState } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { FileSearch, Loader2, ArrowRight } from 'lucide-react';
import { authAPI } from '../services/api';

export default function LoginRegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    try {
      const res = isSignUp ? await authAPI.signup(data) : await authAPI.login(data);
      const token = res.data.token;
      if (!token) throw new Error("No token returned from backend");
      
      login(token);
      navigate("/app");
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        err.response?.data?.message ||
        "Something went wrong. Try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      
      {/* Background decoration */}
      <div className="absolute top-0 -translate-y-12 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-accent-500/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-xl bg-accent-600 flex items-center justify-center shadow-glow-accent">
            <FileSearch className="w-6 h-6 text-white" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-surface-900 dark:text-surface-100 tracking-tight">
          {isSignUp ? 'Create your account' : 'Sign in to your account'}
        </h2>
        <p className="mt-2 text-center text-sm text-surface-600 dark:text-surface-400">
          Or{' '}
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="font-medium text-accent-600 hover:text-accent-500 transition-colors"
          >
            {isSignUp ? 'sign in to existing account' : 'create a new account'}
          </button>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white dark:bg-surface-900 py-8 px-4 shadow-xl border border-surface-200 dark:border-surface-800 sm:rounded-2xl sm:px-10">
          
          <AnimatePresence mode="wait">
            <motion.form
              key={isSignUp ? 'signup' : 'login'}
              initial={{ opacity: 0, x: isSignUp ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: isSignUp ? -20 : 20 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              {error && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/30 text-sm text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800">
                  {error}
                </div>
              )}

              {isSignUp && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                      Full Name
                    </label>
                    <input name="name" type="text" required className="input-base" placeholder="John Doe" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                      Phone Number
                    </label>
                    <input name="number" type="tel" required className="input-base" placeholder="+1 (555) 000-0000" />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                  Email address
                </label>
                <input name="email" type="email" autoComplete="email" required className="input-base" placeholder="you@example.com" />
              </div>

              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                  Password
                </label>
                <input name="password" type="password" autoComplete={isSignUp ? "new-password" : "current-password"} required className="input-base" placeholder="••••••••" />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-accent-600 hover:bg-accent-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-500 disabled:opacity-50 transition-colors"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      {isSignUp ? 'Sign up' : 'Sign in'}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </motion.form>
          </AnimatePresence>

        </div>
      </div>
    </div>
  );
}
