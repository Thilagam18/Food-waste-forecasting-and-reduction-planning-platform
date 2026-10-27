import React from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  ShieldCheck,
  BarChart3,
  Leaf,
  ArrowRight,
  CheckCircle2,
  Building2,
  Sparkles,
  DollarSign
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LandingPage: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Navigation */}
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-bold text-lg shadow-sm">
              🌱
            </div>
            <div>
              <span className="font-extrabold text-slate-900 tracking-tight text-lg">WasteAware IQ</span>
              <span className="hidden sm:inline-block ml-2 text-xs font-semibold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded">
                Enterprise
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="px-4 py-2 text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm transition"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-emerald-800 transition"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm transition"
                >
                  Register Organization
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100/80 border border-emerald-300 text-emerald-800 text-xs font-semibold mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Machine Learning Food Waste Forecasting & Planning</span>
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight max-w-4xl mx-auto leading-tight">
          Cut Commercial Food Waste, <span className="text-emerald-700">Predict Demand</span>, and Protect Your Margin
        </h1>
        <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
          The operational intelligence platform built specifically for commercial kitchens, hotels, cafeterias, college canteens, and catering services. Forecast daily demand, eliminate recurring overproduction, and verify sustainability impact.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to={isAuthenticated ? "/dashboard" : "/register"}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 text-base font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-md transition"
          >
            <span>{isAuthenticated ? 'Open Control Dashboard' : 'Get Started with Your Organization'}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/login"
            className="w-full sm:w-auto px-6 py-3.5 text-base font-semibold text-slate-700 bg-white hover:bg-slate-100 rounded-xl border border-slate-300 shadow-sm transition"
          >
            Explore with Demo Account
          </Link>
        </div>

        {/* Feature Grid */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Predictive ML Forecasting</h3>
            <p className="mt-2 text-sm text-slate-600">
              Scikit-learn Random Forest and Gradient Boosting regressors calibrated with chronological validation, dynamic safety buffers, and uncertainty bounds.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-4">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Explainable Recommendations</h3>
            <p className="mt-2 text-sm text-slate-600">
              Surplus analysis pinpoints repeated overproduction, portion calibration, storage temperatures, and safe food rescue donation verification.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-4">
              <Leaf className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Verified Impact Analytics</h3>
            <p className="mt-2 text-sm text-slate-600">
              Calculate financial losses avoided, greenhouse gas emissions reduced (kg CO2e), water footprint conserved, and meals rescued with documented formulas.
            </p>
          </div>
        </div>

        {/* Organization Types Supported */}
        <div className="mt-16 bg-emerald-900 text-white rounded-3xl p-8 sm:p-12 text-left">
          <div className="max-w-3xl">
            <span className="text-emerald-300 font-semibold text-xs uppercase tracking-wider">Multi-Tenant Organization Support</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold mt-1">Built for Food Service Organizations of Any Scale</h2>
            <p className="mt-3 text-emerald-100 text-sm sm:text-base">
              Each organization operates in complete data isolation. Custom meal periods, food item categories, unit costs, and shelf-life monitoring tailored to your kitchen workflows.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {['Restaurants', 'Hotels & Resorts', 'College Canteens', 'Hospital Cafeterias', 'Corporate Catering', 'Central Prep Kitchens'].map((type) => (
                <span key={type} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-800/80 rounded-lg text-xs font-semibold text-emerald-100 border border-emerald-700/50">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  {type}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-500">
        <p>© 2026 WasteAware IQ Platform. Production-grade food waste reduction and demand planning.</p>
      </footer>
    </div>
  );
};
