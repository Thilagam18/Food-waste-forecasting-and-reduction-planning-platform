import React from 'react';
import { Link } from 'react-router-dom';
import {
  UtensilsCrossed,
  TrendingUp,
  ShieldCheck,
  Award,
  ArrowRight,
  CheckCircle2,
  Building2,
  Sparkles,
  GraduationCap,
  Store,
  Leaf,
  IndianRupee
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LandingPage: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-[#050B18] text-slate-100 flex flex-col justify-between selection:bg-cyan-500 selection:text-black">
      {/* Navigation Header */}
      <header className="border-b border-slate-800/80 bg-[#070E22]/90 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-cyan-400 flex items-center justify-center text-white shadow-md shadow-cyan-500/20">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-white tracking-tight text-base sm:text-lg block leading-tight">
                FoodWise Analytics
              </span>
              <span className="text-[10px] font-semibold text-cyan-400 tracking-wide block">
                Food Waste Forecasting & Reduction Platform
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="px-4 py-2 text-xs font-bold text-white bg-[#1E6BFF] hover:bg-blue-600 rounded-xl shadow-md shadow-blue-500/30 transition"
              >
                Go to Kitchen Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-xs font-bold text-slate-300 hover:text-white transition"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-xs font-bold text-white bg-[#1E6BFF] hover:bg-blue-600 rounded-xl shadow-md shadow-blue-500/30 transition"
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
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0C152B] border border-cyan-500/30 text-cyan-400 text-xs font-bold mb-6 shadow-lg shadow-cyan-950/40">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span>Operational Kitchen Intelligence & Next-Meal ML Forecasting</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight max-w-4xl mx-auto leading-tight">
          Eliminate Kitchen Food Waste, <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Forecast Diner Demand</span>, and Protect Your Margin
        </h1>

        <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-3xl mx-auto leading-relaxed">
          The practical operational platform built specifically for commercial kitchens, college canteens, hotels, banquet halls, and restaurants. Stop daily overproduction, calibrate ladle portion sizes, and verify UN SDG 12.3 sustainability impact.
        </p>

        {/* Action Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to={isAuthenticated ? "/dashboard" : "/login"}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-3.5 text-sm font-bold text-white bg-[#1E6BFF] hover:bg-blue-600 rounded-xl shadow-xl shadow-blue-600/30 transition"
          >
            <span>{isAuthenticated ? 'Open Control Dashboard' : 'Sign In to Organization Dashboard'}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            to="/register"
            className="w-full sm:w-auto px-7 py-3.5 text-sm font-bold text-slate-300 bg-[#0C162E] hover:bg-[#112042] border border-slate-800 rounded-xl transition"
          >
            Register New Organization
          </Link>
        </div>

        {/* Commercial Kitchen Hero Banner */}
        <div className="mt-12 relative rounded-3xl overflow-hidden border border-slate-700/70 shadow-2xl max-w-5xl mx-auto h-64 sm:h-96 group">
          <img
            src="/images/kitchen_hero.jpg"
            alt="Commercial Smart Kitchen"
            className="w-full h-full object-cover group-hover:scale-102 transition duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050B18] via-[#050B18]/30 to-transparent" />
          
          <div className="absolute top-4 left-4 flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-[#050B18]/80 backdrop-blur-md text-cyan-400 border border-cyan-500/40 shadow-lg">
              Live Kitchen Operations Monitoring
            </span>
          </div>

          <div className="absolute bottom-6 left-6 right-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="text-left">
              <span className="text-[11px] font-bold text-cyan-300 uppercase tracking-widest block">
                Integrated Prep Station Dispatch
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                Connecting Shift Prep, Portion Calibration & Cold Holding
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <div className="px-3 py-2 rounded-xl bg-black/60 backdrop-blur-md border border-slate-700 text-left">
                <span className="text-[10px] text-slate-400 block font-semibold">Average Discard Reduction</span>
                <strong className="text-emerald-400 text-sm font-extrabold">-38% in 30 Days</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Culinary Dishes Showcase Preview */}
        <div className="mt-14 max-w-5xl mx-auto text-left">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block">Real Food Photography & Recipe Inventory</span>
              <h3 className="text-lg font-black text-white">Tracked Preparations & Portion Calibrations</h3>
            </div>
            <span className="text-xs text-slate-400 font-medium">HACCP Cold & Hot Holding Calibrated</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { name: 'Basmati Rice', img: '/images/steamed_basmati_rice.jpg', cat: 'Grains' },
              { name: 'Paneer Masala', img: '/images/paneer_butter_masala.jpg', cat: 'Gravies' },
              { name: 'Sambar Dal', img: '/images/vegetable_sambar.jpg', cat: 'Soups' },
              { name: 'Green Salad', img: '/images/fresh_green_salad.jpg', cat: 'Salads' },
              { name: 'Chicken Biryani', img: '/images/chicken_biryani.jpg', cat: 'Specials' },
              { name: 'Gulab Jamun', img: '/images/gulab_jamun.jpg', cat: 'Desserts' }
            ].map((d, i) => (
              <div key={i} className="bg-[#0C162E] rounded-xl border border-slate-800 overflow-hidden group hover:border-cyan-500/50 transition">
                <div className="h-24 w-full overflow-hidden">
                  <img src={d.img} alt={d.name} className="w-full h-full object-cover group-hover:scale-110 transition duration-300" />
                </div>
                <div className="p-2">
                  <span className="text-xs font-bold text-white block truncate">{d.name}</span>
                  <span className="text-[10px] text-slate-400">{d.cat}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Demo Presets Bar */}
        <div className="mt-12 max-w-2xl mx-auto bg-[#0C162E] border border-slate-800/80 rounded-2xl p-5 shadow-2xl">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-3">
            EVALUATE INSTANTLY WITH ONE-CLICK PRESET ENVIRONMENTS
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Link
              to="/login"
              className="p-3 bg-[#070D1F] hover:bg-[#0E1A38] border border-slate-800 hover:border-cyan-500/50 rounded-xl flex items-center gap-2.5 transition text-left"
            >
              <div className="w-8 h-8 rounded-lg bg-cyan-950/80 text-cyan-400 flex items-center justify-center flex-shrink-0">
                <GraduationCap className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-white block">College Canteen</span>
                <span className="text-[10px] text-slate-400">Apex Culinary</span>
              </div>
            </Link>

            <Link
              to="/login"
              className="p-3 bg-[#070D1F] hover:bg-[#0E1A38] border border-slate-800 hover:border-emerald-500/50 rounded-xl flex items-center gap-2.5 transition text-left"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-950/80 text-emerald-400 flex items-center justify-center flex-shrink-0">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-white block">Hotel & Buffet</span>
                <span className="text-[10px] text-slate-400">Grand Palace</span>
              </div>
            </Link>

            <Link
              to="/login"
              className="p-3 bg-[#070D1F] hover:bg-[#0E1A38] border border-slate-800 hover:border-amber-500/50 rounded-xl flex items-center gap-2.5 transition text-left"
            >
              <div className="w-8 h-8 rounded-lg bg-amber-950/80 text-amber-400 flex items-center justify-center flex-shrink-0">
                <Store className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-white block">Restaurant</span>
                <span className="text-[10px] text-slate-400">Metro Haven</span>
              </div>
            </Link>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="bg-[#0C162E] p-6 rounded-2xl border border-slate-800 shadow-xl">
            <div className="w-11 h-11 rounded-xl bg-cyan-950/80 text-cyan-400 flex items-center justify-center mb-4 border border-cyan-800/50">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="text-base font-extrabold text-white">Machine Learning Demand Forecasting</h3>
            <p className="mt-2 text-xs text-slate-400 leading-relaxed">
              Scikit-learn Random Forest and Gradient Boosting Regressors trained chronologically on daily weather, attendance records, and meal patterns with dynamic +8% safety buffers.
            </p>
          </div>

          <div className="bg-[#0C162E] p-6 rounded-2xl border border-slate-800 shadow-xl">
            <div className="w-11 h-11 rounded-xl bg-blue-950/80 text-blue-400 flex items-center justify-center mb-4 border border-blue-800/50">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-extrabold text-white">Safe Surplus Redistribution Protocol</h3>
            <p className="mt-2 text-xs text-slate-400 leading-relaxed">
              Mandatory Food Safety Checklist: Hot holding (≥60°C), cold holding (≤4°C), and 2-hour duration compliance audits before charitable donation handoffs.
            </p>
          </div>

          <div className="bg-[#0C162E] p-6 rounded-2xl border border-slate-800 shadow-xl">
            <div className="w-11 h-11 rounded-xl bg-emerald-950/80 text-emerald-400 flex items-center justify-center mb-4 border border-emerald-800/50">
              <Award className="w-5 h-5" />
            </div>
            <h3 className="text-base font-extrabold text-white">Verified Environmental Impact (SDG 12.3)</h3>
            <p className="mt-2 text-xs text-slate-400 leading-relaxed">
              Scientific conversions: 2.5 kg CO2e per kg food waste, 1,000 Liters virtual water conserved, and 0.45 kg nutritious meal equivalents verified.
            </p>
          </div>
        </div>

        {/* Multi-Tenant Enterprise Banner */}
        <div className="mt-16 bg-[#0D1C38] border border-slate-800 rounded-3xl p-8 sm:p-10 text-left shadow-2xl">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-950 text-cyan-400 border border-cyan-800">
                SDG 12.3
              </span>
              <span className="text-cyan-400 font-bold text-xs uppercase tracking-wider">
                Multi-Tenant Kitchen Isolation
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              Built for Commercial Kitchens & Dining Facilities
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
              Each organization operates in full data isolation with organization-level scoping, custom recipe catalogs, station routing, and kitchen operational shift planners.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {['College & University Messes', 'Buffet Hotels & Banquets', 'Corporate Dining Cafeterias', 'Multi-Outlet Bistros', 'Central Production Kitchens'].map((type) => (
                <span key={type} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#070E22] rounded-xl text-xs font-semibold text-slate-200 border border-slate-700">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                  {type}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#070E22] py-8 px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-400">
        <p>© 2026 FoodWise Analytics. Operational Kitchen Intelligence & Waste Reduction Platform.</p>
      </footer>
    </div>
  );
};
