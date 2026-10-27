import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  UtensilsCrossed,
  User,
  Lock,
  ArrowRight,
  GraduationCap,
  Building2,
  Store,
  AlertCircle
} from 'lucide-react';
import { authService } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState('admin');
  const [password, setPassword] = useState('admin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await authService.login({
        username_or_email: identifier,
        password
      });
      if (res.data?.success) {
        login(res.data.access_token, res.data.user);
        navigate('/dashboard');
      } else {
        setError(res.data?.message || 'Login failed. Please check credentials.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid username or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPreset = (presetType: 'college' | 'hotel' | 'restaurant') => {
    if (presetType === 'college') {
      setIdentifier('admin@apexculinary.edu');
      setPassword('admin');
    } else if (presetType === 'hotel') {
      setIdentifier('hotel@grandpalace.com');
      setPassword('admin');
    } else {
      setIdentifier('bistro@metrohaven.com');
      setPassword('admin');
    }
  };

  return (
    <div className="min-h-screen bg-[#050B18] text-slate-100 flex flex-col items-center justify-center px-4 py-10 selection:bg-cyan-500 selection:text-black">
      {/* Top FoodWise Analytics Brand Pill */}
      <div className="mb-6 flex items-center gap-3.5 bg-[#0C152B]/95 border border-cyan-500/30 rounded-2xl py-2.5 px-5 shadow-xl shadow-cyan-950/30 backdrop-blur-md">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-cyan-400 flex items-center justify-center text-white shadow-md shadow-cyan-500/20">
          <UtensilsCrossed className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-base font-extrabold text-white tracking-tight leading-tight">
            FoodWise Analytics
          </h1>
          <p className="text-[11px] font-semibold text-cyan-400 tracking-wide">
            Food Waste Forecasting & Reduction Planning Platform
          </p>
        </div>
      </div>

      {/* Segmented Mode Pill Navigation */}
      <div className="mb-8 p-1 bg-[#0A1128] border border-slate-800/90 rounded-full flex items-center gap-1 shadow-inner">
        <button
          type="button"
          className="px-6 py-2 rounded-full text-xs font-bold text-white bg-blue-600 shadow-md shadow-blue-600/30 transition"
        >
          Sign In to Organization
        </button>
        <Link
          to="/register"
          className="px-6 py-2 rounded-full text-xs font-medium text-slate-400 hover:text-white transition"
        >
          Register New Organization
        </Link>
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-[#0C162E] border border-slate-800/80 rounded-3xl p-8 sm:p-9 shadow-2xl shadow-black/80">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            Organization Sign In
          </h2>
          <p className="text-xs text-slate-400 mt-1.5">
            Access your personalized food service dashboard
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Username or Email
            </label>
            <div className="relative rounded-xl border border-slate-700/80 bg-[#070D1F] focus-within:border-blue-500 transition">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="admin or user@domain.com"
                className="w-full pl-10 pr-4 py-2.5 bg-transparent text-sm text-white placeholder-slate-500 rounded-xl focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Password
            </label>
            <div className="relative rounded-xl border border-slate-700/80 bg-[#070D1F] focus-within:border-blue-500 transition">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-transparent text-sm text-white placeholder-slate-500 rounded-xl focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 bg-blue-600 hover:bg-blue-500 active:scale-[0.99] text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition disabled:opacity-50"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In to Dashboard'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Instant Demo Presets Section */}
        <div className="mt-7 pt-5 border-t border-slate-800/80">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center block mb-3">
            INSTANT DEMO EVALUATION PRESETS
          </span>

          <div className="grid grid-cols-3 gap-2.5">
            {/* College Preset */}
            <button
              type="button"
              onClick={() => handleSelectPreset('college')}
              className="p-3 bg-[#070D1F] hover:bg-[#0E1A38] border border-slate-800 hover:border-cyan-500/50 rounded-xl flex flex-col items-center justify-center text-center transition cursor-pointer group"
            >
              <div className="w-7 h-7 rounded-lg bg-cyan-950/60 text-cyan-400 flex items-center justify-center mb-1.5 group-hover:scale-110 transition">
                <GraduationCap className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-white block">College</span>
              <span className="text-[10px] text-slate-400 block">Mess / Canteen</span>
            </button>

            {/* Hotel Preset */}
            <button
              type="button"
              onClick={() => handleSelectPreset('hotel')}
              className="p-3 bg-[#070D1F] hover:bg-[#0E1A38] border border-slate-800 hover:border-emerald-500/50 rounded-xl flex flex-col items-center justify-center text-center transition cursor-pointer group"
            >
              <div className="w-7 h-7 rounded-lg bg-emerald-950/60 text-emerald-400 flex items-center justify-center mb-1.5 group-hover:scale-110 transition">
                <Building2 className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-white block">Hotel</span>
              <span className="text-[10px] text-slate-400 block">Buffet / Banquet</span>
            </button>

            {/* Restaurant Preset */}
            <button
              type="button"
              onClick={() => handleSelectPreset('restaurant')}
              className="p-3 bg-[#070D1F] hover:bg-[#0E1A38] border border-slate-800 hover:border-amber-500/50 rounded-xl flex flex-col items-center justify-center text-center transition cursor-pointer group"
            >
              <div className="w-7 h-7 rounded-lg bg-amber-950/60 text-amber-400 flex items-center justify-center mb-1.5 group-hover:scale-110 transition">
                <Store className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-white block">Restaurant</span>
              <span className="text-[10px] text-slate-400 block">Bistro / Cafe</span>
            </button>
          </div>

          <div className="mt-6 text-center">
            <Link
              to="/register"
              className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition"
            >
              Register a new organization instead →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
