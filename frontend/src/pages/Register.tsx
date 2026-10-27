import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, Mail, Lock, User, MapPin, Phone, ArrowRight, AlertCircle } from 'lucide-react';
import { authService } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    organization_name: '',
    org_type: 'Restaurant',
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
      if (res.data && res.data.success) {
        login(res.data.access_token, res.data.user);
        navigate('/dashboard');
      } else {
        setError(res.data?.message || 'Registration failed.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration could not be completed. Please check your inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-lg text-center">
        <Link to="/" className="inline-flex items-center gap-2 mb-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold text-xl shadow-md">
            🌱
          </div>
          <span className="text-2xl font-extrabold text-slate-900 tracking-tight">WasteAware IQ</span>
        </Link>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
          Register Your Food Service Organization
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Already registered?{' '}
          <Link to="/login" className="font-semibold text-emerald-700 hover:text-emerald-800">
            Sign in to existing account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 rounded-2xl sm:px-10">
          {error && (
            <div className="mb-5 flex items-center gap-3 p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Organization Name */}
            <div>
              <label className="block text-sm font-semibold text-slate-700">Organization or Business Name *</label>
              <div className="mt-1 relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Building2 className="h-5 h-5" />
                </div>
                <input
                  type="text"
                  name="organization_name"
                  required
                  value={formData.organization_name}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 sm:text-sm"
                  placeholder="e.g. Apex Grand Hotel, City Cafeteria"
                />
              </div>
            </div>

            {/* Organization Type */}
            <div>
              <label className="block text-sm font-semibold text-slate-700">Organization Type *</label>
              <select
                name="org_type"
                value={formData.org_type}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 sm:text-sm bg-white"
              >
                <option value="Restaurant">Restaurant</option>
                <option value="Hotel">Hotel & Hospitality</option>
                <option value="College Canteen">College Canteen / Campus Dining</option>
                <option value="Cafeteria">Corporate / Hospital Cafeteria</option>
                <option value="Catering Service">Catering & Event Service</option>
                <option value="Other">Other Food-Service Entity</option>
              </select>
            </div>

            {/* Administrator Full Name */}
            <div>
              <label className="block text-sm font-semibold text-slate-700">Primary Administrator Name *</label>
              <div className="mt-1 relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="h-5 h-5" />
                </div>
                <input
                  type="text"
                  name="full_name"
                  required
                  value={formData.full_name}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 sm:text-sm"
                  placeholder="e.g. Elena Vance"
                />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-sm font-semibold text-slate-700">Official Email Address *</label>
              <div className="mt-1 relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-5 h-5" />
                </div>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 sm:text-sm"
                  placeholder="admin@organization.com"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-slate-700">Secure Password (min 6 chars) *</label>
              <div className="mt-1 relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-5 h-5" />
                </div>
                <input
                  type="password"
                  name="password"
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 sm:text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Location & Contact Phone (Grid) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-600">Location (City/Address)</label>
                <div className="mt-1 relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                    <MapPin className="h-4 h-4" />
                  </div>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    className="block w-full pl-8 pr-2 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-emerald-500"
                    placeholder="e.g. Chicago, IL"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600">Contact Phone</label>
                <div className="mt-1 relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                    <Phone className="h-4 h-4" />
                  </div>
                  <input
                    type="text"
                    name="contact_phone"
                    value={formData.contact_phone}
                    onChange={handleChange}
                    className="block w-full pl-8 pr-2 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-emerald-500"
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
              </div>
            </div>

            <div className="pt-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition disabled:opacity-50"
              >
                {loading ? 'Creating Organization Profile...' : 'Complete Registration'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
