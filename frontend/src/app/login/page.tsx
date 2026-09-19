'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Activity, Lock, Mail, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const user = await login(email, password);
      redirectUserByRole(user.role);
    } catch (err: any) {
      setError(err.message || 'Invalid credentials.');
      setIsSubmitting(false);
    }
  };

  const redirectUserByRole = (role: string) => {
    switch (role) {
      case 'PATIENT':
        router.push('/patient/dashboard');
        break;
      case 'DOCTOR':
        router.push('/doctor/dashboard');
        break;
      case 'HOSPITAL_ADMIN':
        router.push('/hospital/dashboard');
        break;
      case 'PHARMACY':
        router.push('/pharmacy/dashboard');
        break;
      default:
        router.push('/');
    }
  };

  const handleDemoLogin = async (demoEmail: string, demoPw: string) => {
    setError(null);
    setIsSubmitting(true);
    try {
      const user = await login(demoEmail, demoPw);
      redirectUserByRole(user.role);
    } catch (err: any) {
      setError(err.message || 'Demo login failed.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-xl">
        {/* Header */}
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-600 to-emerald-500 mx-auto flex items-center justify-center text-white shadow-lg shadow-cyan-500/20 mb-4">
            <Activity className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Welcome to MediSync</h2>
          <p className="text-xs text-slate-500 mt-1">Sign in to access your healthcare dashboard</p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 focus:border-cyan-600 rounded-xl text-sm text-slate-900 focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 focus:border-cyan-600 rounded-xl text-sm text-slate-900 focus:outline-none transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center space-x-2"
          >
            {isSubmitting ? (
              <span>Signing In...</span>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* QUICK DEMO ACCOUNTS PRESETS */}
        <div className="pt-6 border-t border-slate-100">
          <span className="block text-center text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
            Instant Demo Sign In
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleDemoLogin('patient@medisync.demo', 'patient123')}
              className="px-3 py-2 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl hover:bg-emerald-100 transition-colors text-center"
            >
              Patient Demo
            </button>
            <button
              onClick={() => handleDemoLogin('doctor@medisync.demo', 'doctor123')}
              className="px-3 py-2 bg-blue-50 border border-blue-200 text-blue-800 text-xs font-semibold rounded-xl hover:bg-blue-100 transition-colors text-center"
            >
              Doctor Demo
            </button>
            <button
              onClick={() => handleDemoLogin('admin@medisync.demo', 'admin123')}
              className="px-3 py-2 bg-purple-50 border border-purple-200 text-purple-800 text-xs font-semibold rounded-xl hover:bg-purple-100 transition-colors text-center"
            >
              Admin Demo
            </button>
            <button
              onClick={() => handleDemoLogin('pharmacy@medisync.demo', 'pharmacy123')}
              className="px-3 py-2 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold rounded-xl hover:bg-amber-100 transition-colors text-center"
            >
              Pharmacy Demo
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-slate-500 pt-2">
          Don't have an account?{' '}
          <Link href="/register" className="font-bold text-cyan-700 hover:underline">
            Register now
          </Link>
        </p>
      </div>
    </div>
  );
}
