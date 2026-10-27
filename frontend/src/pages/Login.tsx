import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Mail, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';
import { authService } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await authService.login({ email, password });
      if (res.data && res.data.success) {
        login(res.data.access_token, res.data.user);
        navigate('/dashboard');
      } else {
        setError(res.data?.message || 'Login failed. Please check your credentials.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid email or password. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoCredentials = () => {
    setEmail('director@emeraldvalley.com');
    setPassword('Director2026!');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2 mb-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold text-xl shadow-md">
            🌱
          </div>
          <span className="text-2xl font-extrabold text-slate-900 tracking-tight">WasteAware IQ</span>
        </Link>
        <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
          Sign In to Your Kitchen Dashboard
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Or{' '}
          <Link to="/register" className="font-semibold text-emerald-700 hover:text-emerald-800">
            register a new organization
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 rounded-2xl sm:px-10">
          {error && (
            <div className="mb-5 flex items-center gap-3 p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-semibold text-slate-700">Email Address</label>
              <div className="mt-1.5 relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-5 h-5" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                  placeholder="manager@restaurant.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700">Password</label>
              <div className="mt-1.5 relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-5 h-5" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Credentials Helper */}
          <div className="mt-6 pt-5 border-t border-slate-200">
            <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-900">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>Demo Enterprise Credentials</span>
                </div>
                <button
                  type="button"
                  onClick={fillDemoCredentials}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-900 underline"
                >
                  Auto-fill
                </button>
              </div>
              <p className="mt-1 text-[11px] text-emerald-800">
                Email: <code className="font-mono font-semibold">director@emeraldvalley.com</code> | Pass: <code className="font-mono font-semibold">Director2026!</code>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
