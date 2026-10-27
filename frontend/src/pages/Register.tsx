import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  UtensilsCrossed,
  Building2,
  Mail,
  Lock,
  User,
  MapPin,
  Phone,
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import { authService } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    organization_name: '',
    org_type: 'College Canteen',
    full_name: '',
    email: '',
    password: '',
    location: '',
    contact_phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await authService.register(formData);
      if (res.data?.success) {
        login(res.data.access_token, res.data.user);
        navigate('/dashboard');
      } else {
        setError(res.data?.message || 'Registration failed.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration could not be completed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050B18] text-slate-100 flex flex-col items-center justify-center px-4 py-10 selection:bg-cyan-500 selection:text-black">
      {/* Top Brand Pill */}
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
        <Link
          to="/login"
          className="px-6 py-2 rounded-full text-xs font-medium text-slate-400 hover:text-white transition"
        >
          Sign In to Organization
        </Link>
        <button
          type="button"
          className="px-6 py-2 rounded-full text-xs font-bold text-white bg-blue-600 shadow-md shadow-blue-600/30 transition"
        >
          Register New Organization
        </button>
      </div>

      {/* Main Register Card */}
      <div className="w-full max-w-lg bg-[#0C162E] border border-slate-800/80 rounded-3xl p-8 sm:p-9 shadow-2xl shadow-black/80">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            New Organization Registration
          </h2>
          <p className="text-xs text-slate-400 mt-1.5">
            Configure your enterprise kitchen analytics workspace
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
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Organization Name *
            </label>
            <div className="relative rounded-xl border border-slate-700/80 bg-[#070D1F] focus-within:border-blue-500 transition">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Building2 className="w-4 h-4" />
              </div>
              <input
                type="text"
                name="organization_name"
                required
                value={formData.organization_name}
                onChange={handleChange}
                placeholder="e.g. Apex Culinary Campus, Grand Palace Hotel"
                className="w-full pl-10 pr-4 py-2 bg-transparent text-xs text-white placeholder-slate-500 rounded-xl focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Organization Sector *
              </label>
              <select
                name="org_type"
                value={formData.org_type}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-[#070D1F] border border-slate-700/80 text-xs text-white rounded-xl focus:outline-none focus:border-blue-500"
              >
                <option value="College Canteen">College & Education</option>
                <option value="Hotel">Hotel & Hospitality</option>
                <option value="Restaurant">Restaurant & Cafe</option>
                <option value="Cafeteria">Corporate Cafeteria</option>
                <option value="Catering Service">Catering Service</option>
                <option value="Other">Other Food Service</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Admin Full Name *
              </label>
              <div className="relative rounded-xl border border-slate-700/80 bg-[#070D1F] focus-within:border-blue-500 transition">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="w-3.5 h-3.5" />
                </div>
                <input
                  type="text"
                  name="full_name"
                  required
                  value={formData.full_name}
                  onChange={handleChange}
                  placeholder="e.g. System Administrator"
                  className="w-full pl-9 pr-3 py-2 bg-transparent text-xs text-white placeholder-slate-500 rounded-xl focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Admin Email Address *
            </label>
            <div className="relative rounded-xl border border-slate-700/80 bg-[#070D1F] focus-within:border-blue-500 transition">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="admin@organization.com"
                className="w-full pl-10 pr-4 py-2 bg-transparent text-xs text-white placeholder-slate-500 rounded-xl focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Password *
            </label>
            <div className="relative rounded-xl border border-slate-700/80 bg-[#070D1F] focus-within:border-blue-500 transition">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                name="password"
                required
                minLength={6}
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2 bg-transparent text-xs text-white placeholder-slate-500 rounded-xl focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Location / City</label>
              <div className="relative rounded-xl border border-slate-700/80 bg-[#070D1F]">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <MapPin className="w-3.5 h-3.5" />
                </div>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="e.g. Campus North Wing"
                  className="w-full pl-9 pr-3 py-1.5 bg-transparent text-xs text-white placeholder-slate-500 rounded-xl focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Phone</label>
              <div className="relative rounded-xl border border-slate-700/80 bg-[#070D1F]">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Phone className="w-3.5 h-3.5" />
                </div>
                <input
                  type="text"
                  name="contact_phone"
                  value={formData.contact_phone}
                  onChange={handleChange}
                  placeholder="+91 98450 12345"
                  className="w-full pl-9 pr-3 py-1.5 bg-transparent text-xs text-white placeholder-slate-500 rounded-xl focus:outline-none"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 bg-blue-600 hover:bg-blue-500 active:scale-[0.99] text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition disabled:opacity-50"
          >
            <span>{loading ? 'Creating Organization...' : 'Complete Registration & Open Dashboard'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
