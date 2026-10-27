import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  UtensilsCrossed,
  LayoutDashboard,
  CalendarClock,
  ClipboardList,
  TrendingUp,
  AlertTriangle,
  Boxes,
  Lightbulb,
  MessageSquare,
  BarChart2,
  Settings,
  Building2,
  ChevronDown,
  Sparkles,
  RotateCcw,
  LogOut,
  Menu,
  X,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { demoService, alertService } from '../../services/api';

export const AppLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true }));
  const [activeFacility, setActiveFacility] = useState('Main Dining Hall & Central Canteen (Dining Hall)');

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleReloadDemo = async () => {
    try {
      await demoService.load();
      window.location.reload();
    } catch (e) {
      console.error(e);
    }
  };

  const handleReset = async () => {
    if (window.confirm('Reset kitchen operational records back to initial benchmark?')) {
      try {
        await demoService.clear();
        await demoService.load();
        window.location.reload();
      } catch (e) {
        console.error(e);
      }
    }
  };

  const orgName = user?.organization_name || 'Apex Culinary Campus';
  const orgSector = user?.organization_type === 'College Canteen' ? 'College & Education' : user?.organization_type === 'Hotel' ? 'Hotel & Hospitality' : 'Restaurant & Cafe';

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/planner', label: 'Prep Planner & Actuals', icon: CalendarClock },
    { to: '/logs', label: 'Waste Data Logs', icon: ClipboardList },
    { to: '/forecasting', label: 'Demand Forecasting', icon: TrendingUp },
    { to: '/alerts', label: 'Waste Risk & Causes', icon: AlertTriangle },
    { to: '/inventory', label: 'Inventory & Stock', icon: Boxes },
    { to: '/recommendations', label: 'Reduction Planning', icon: Lightbulb },
    { to: '/feedback', label: 'Staff Floor Feedback', icon: MessageSquare },
    { to: '/impact', label: 'Performance & Savings', icon: BarChart2 },
    { to: '/reports', label: 'System & Config', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-slate-800 overflow-hidden font-sans">
      {/* Sidebar - Sleek Dark Theme matching Screenshot 2 */}
      <aside className="hidden lg:flex flex-col w-64 bg-[#070E22] text-white flex-shrink-0 border-r border-slate-900 select-none">
        {/* Brand Header */}
        <div className="p-4 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#00B4D8] flex items-center justify-center text-white shadow-md shadow-cyan-500/20">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-extrabold text-base tracking-tight text-white leading-tight">FoodWise</h1>
              <p className="text-[11px] text-[#00F0FF] font-semibold tracking-wide">Operations Platform</p>
            </div>
          </div>
        </div>

        {/* Selected Facility Header in Sidebar */}
        <div className="px-4 py-3 bg-[#0B142F]/70 border-b border-slate-800/60 flex items-center gap-2 text-xs font-semibold text-slate-200">
          <Building2 className="w-4 h-4 text-cyan-400 flex-shrink-0" />
          <span className="truncate">Main Dining Hall & Central Canteen</span>
        </div>

        {/* Operational Workflows Menu */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 block mb-2">
            OPERATIONAL WORKFLOWS
          </span>

          <nav className="space-y-1">
            {navItems.map((item, idx) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={idx}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                      isActive
                        ? 'bg-[#1E6BFF] text-white shadow-md shadow-blue-600/30 font-bold'
                        : 'text-slate-300 hover:bg-[#0D1938] hover:text-white'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 text-slate-400 group-hover:text-white flex-shrink-0" />
                  <span className="truncate">{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer with Organization & User Identity */}
        <div className="p-3 bg-[#050A1A] border-t border-slate-800/80 space-y-3">
          <div className="p-2.5 rounded-xl bg-[#0B142F] border border-slate-800/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white truncate">{orgName}</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-cyan-950 text-cyan-400 border border-cyan-800">
                SDG 12.3
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">Sector: {orgSector}</p>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-full bg-slate-700 text-white font-bold text-xs flex items-center justify-center flex-shrink-0">
                S
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white truncate">{user?.full_name || 'System Administrator'}</p>
                <p className="text-[10px] text-cyan-400 font-bold">ADMIN</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main App Body */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header matching Screenshot 2 */}
        <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between flex-shrink-0 z-10">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-extrabold text-slate-900 truncate">
                  Operational Kitchen Dashboard
                </h2>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                  {orgName}
                </span>
              </div>
              <p className="hidden md:block text-[11px] text-slate-500 truncate mt-0.5">
                Real-time daily food prep, consumed, leftovers, waste cost & baseline reduction
              </p>
            </div>
          </div>

          {/* Top Bar Controls */}
          <div className="flex items-center gap-2.5">
            {/* Kitchen Facility Dropdown */}
            <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
              <Building2 className="w-3.5 h-3.5 text-cyan-600" />
              <div>
                <span className="text-[9px] text-slate-400 uppercase font-bold block leading-none">Kitchen Facility</span>
                <select
                  value={activeFacility}
                  onChange={(e) => setActiveFacility(e.target.value)}
                  className="bg-transparent font-bold text-slate-800 text-xs focus:outline-none cursor-pointer"
                >
                  <option value="Main Dining Hall & Central Canteen (Dining Hall)">Main Dining Hall & Central Canteen (Dining Hall)</option>
                  <option value="Campus North Cafe & Bistro">Campus North Cafe & Bistro</option>
                  <option value="Executive Faculty Lounge">Executive Faculty Lounge</option>
                </select>
              </div>
            </div>

            {/* Role Pill */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700">
              <span className="w-2 h-2 rounded-full border border-teal-500"></span>
              <span>ROLE: Admin</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </div>

            {/* Live Sync Clock */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full text-xs font-bold text-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Live Sync {currentTime}</span>
            </div>

            {/* Demo Data Button */}
            <button
              onClick={handleReloadDemo}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-xl shadow-xs transition"
              title="Regenerate demonstration data"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Demo Data</span>
            </button>

            {/* Reset Button */}
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl shadow-xs transition"
              title="Reset dashboard"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Reset</span>
            </button>
          </div>
        </header>

        {/* Mobile Sidebar Overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-40 lg:hidden bg-slate-900/60 backdrop-blur-xs" onClick={() => setMobileMenuOpen(false)}>
            <div className="w-64 h-full bg-[#070E22] text-white p-4 flex flex-col justify-between" onClick={(e) => e.stopPropagation()}>
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#00B4D8] flex items-center justify-center text-white">
                      <UtensilsCrossed className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-extrabold text-sm text-white">FoodWise</span>
                      <p className="text-[10px] text-cyan-400 font-semibold">Operations Platform</p>
                    </div>
                  </div>
                  <button onClick={() => setMobileMenuOpen(false)} className="text-slate-400">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <nav className="mt-4 space-y-1">
                  {navItems.map((item, idx) => (
                    <NavLink
                      key={idx}
                      to={item.to}
                      onClick={() => setMobileMenuOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold ${
                          isActive ? 'bg-[#1E6BFF] text-white font-bold' : 'text-slate-300'
                        }`
                      }
                    >
                      <item.icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </NavLink>
                  ))}
                </nav>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 text-rose-300 hover:bg-rose-950/40 rounded-xl text-xs font-bold"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        )}

        {/* Scrollable Main Workspace */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-7">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
