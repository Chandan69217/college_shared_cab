import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, Lock, Mail, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getApiErrorMessage } from '../services/api';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setEmailError('');
    setPasswordError('');

    let hasError = false;
    if (!email.trim()) {
      setEmailError('Email or username is required.');
      hasError = true;
    }
    if (!password.trim()) {
      setPasswordError('Password is required.');
      hasError = true;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
      hasError = true;
    }

    if (hasError) return;

    setLoading(true);
    try {
      await login(email.trim(), password.trim());
      navigate('/');
    } catch (err: any) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center font-bold text-xl mx-auto mb-3 shadow-lg shadow-emerald-500/30">
            CR
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">CampusRide Admin</h2>
          <p className="text-xs text-slate-400 mt-1">
            College Student Shared Cab & Shuttle Platform Console
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1">Administrator Email / Username</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                autoComplete="username"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError('');
                }}
                className={`w-full bg-slate-950 border ${
                  emailError ? 'border-rose-500' : 'border-slate-800'
                } rounded-xl pl-9 pr-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition`}
                placeholder="Enter administrator email or phone"
              />
            </div>
            {emailError && <p className="text-rose-400 text-[11px] mt-1">{emailError}</p>}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-slate-300 font-medium">Password</label>
              <Link to="/forgot-password" className="text-[11px] text-emerald-400 hover:underline">
                Forgot Password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (passwordError) setPasswordError('');
                }}
                className={`w-full bg-slate-950 border ${
                  passwordError ? 'border-rose-500' : 'border-slate-800'
                } rounded-xl pl-9 pr-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition`}
                placeholder="Enter your password"
              />
            </div>
            {passwordError && <p className="text-rose-400 text-[11px] mt-1">{passwordError}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 mt-6 disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Sign In to Admin Console'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

