import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardList,
  Utensils,
  TrendingUp,
  Sparkles,
  AlertTriangle,
  Leaf,
  FileText,
  LogOut,
  Building2,
  Menu,
  X,
  Database,
  Trash2,
  CheckCircle2,
  Info
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { demoService, alertService } from '../../services/api';

export const AppLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeAlertsCount, setActiveAlertsCount] = useState<number>(0);
  const [demoActionLoading, setDemoActionLoading] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  useEffect(() => {
    fetchAlertCount();
  }, []);

  const fetchAlertCount = async () => {
    try {
      const res = await alertService.list({ is_resolved: false });
      if (res.data && res.data.active_count !== undefined) {
        setActiveAlertsCount(res.data.active_count);
      }
    } catch (err) {
      // Ignore background error
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleLoadDemo = async () => {
    try {
      setDemoActionLoading(true);
      const res = await demoService.load();
      setNotification({ message: res.data.message || 'Demonstration data loaded successfully!', type: 'success' });
      fetchAlertCount();
      // Reload page to refresh all active views
      setTimeout(() => window.location.reload(), 1200);
    } catch (err: any) {
      setNotification({ message: err.response?.data?.message || 'Failed to load demo data.', type: 'error' });
    } finally {
      setDemoActionLoading(false);
    }
  };

  const handleClearDemo = async () => {
    if (!window.confirm('Are you sure you want to purge all demonstration data? Real records will be preserved.')) return;
    try {
      setDemoActionLoading(true);
      const res = await demoService.clear();
      setNotification({ message: res.data.message || 'Demo data cleared.', type: 'info' });
      fetchAlertCount();
      setTimeout(() => window.location.reload(), 1200);
    } catch (err: any) {
      setNotification({ message: err.response?.data?.message || 'Failed to clear demo data.', type: 'error' });
    } finally {
      setDemoActionLoading(false);
    }
  };

  const navLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/logs', label: 'Daily Food Logs', icon: ClipboardList },
    { to: '/inventory', label: 'Food Inventory', icon: Utensils },
    { to: '/forecasting', label: 'Demand Forecasting', icon: TrendingUp },
    { to: '/recommendations', label: 'Recommendations', icon: Sparkles },
    { to: '/alerts', label: 'Active Alerts', icon: AlertTriangle, badge: activeAlertsCount > 0 ? activeAlertsCount : null },
    { to: '/impact', label: 'Impact & Sustainability', icon: Leaf },
    { to: '/reports', label: 'Reports & Export', icon: FileText },
  ];

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden">
      {/* Toast Notification Banner */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border card-glass text-sm font-medium animate-in fade-in slide-in-from-top-2 duration-300">
          {notification.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
          {notification.type === 'info' && <Info className="w-5 h-5 text-blue-600" />}
          {notification.type === 'error' && <AlertTriangle className="w-5 h-5 text-rose-600" />}
          <span>{notification.message}</span>
          <button onClick={() => setNotification(null)} className="ml-2 text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-[#0d3829] text-white flex-shrink-0 border-r border-emerald-950/40">
        {/* Brand Header */}
        <div className="p-5 border-b border-emerald-900/40 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 font-bold text-lg">
              🌱
            </div>
            <div>
              <h1 className="font-bold text-base tracking-tight text-white leading-tight">WasteAware IQ</h1>
              <p className="text-[11px] text-emerald-300/80 font-medium">Food Reduction Platform</p>
            </div>
          </div>
        </div>

        {/* Organization Info Card */}
        <div className="mx-3.5 my-3 p-3 bg-emerald-950/50 border border-emerald-800/40 rounded-lg">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-200">
            <Building2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="truncate">{user?.organization_name || 'My Organization'}</span>
          </div>
          <span className="inline-block mt-1 px-1.5 py-0.5 text-[10px] font-medium bg-emerald-900/80 text-emerald-300 rounded">
            {user?.organization_type || 'Commercial Food Service'}
          </span>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto pt-2">
          {navLinks.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-emerald-600/30 text-emerald-200 border-l-4 border-emerald-400 font-semibold'
                      : 'text-slate-300 hover:bg-emerald-900/40 hover:text-white'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 text-emerald-400" />
                  <span>{item.label}</span>
                </div>
                {item.badge !== null && item.badge !== undefined && (
                  <span className="px-1.5 py-0.5 text-[11px] font-bold bg-amber-500 text-amber-950 rounded-full">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Demo Data Control Actions */}
        <div className="p-3 border-t border-emerald-900/40 bg-emerald-950/30 space-y-2">
          <div className="flex items-center gap-2">
            <button
              onClick={handleLoadDemo}
              disabled={demoActionLoading}
              className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-medium bg-emerald-700/60 hover:bg-emerald-600/80 text-emerald-100 rounded border border-emerald-600/40 transition disabled:opacity-50"
              title="Loads 30 days of realistic sample food records, ML forecasts, and recommendations"
            >
              <Database className="w-3.5 h-3.5 text-emerald-300" />
              <span>Load Demo Data</span>
            </button>
            <button
              onClick={handleClearDemo}
              disabled={demoActionLoading}
              className="p-1.5 text-xs text-rose-300 hover:text-rose-100 bg-rose-950/40 hover:bg-rose-900/60 rounded border border-rose-800/40 transition disabled:opacity-50"
              title="Purge all demonstration records"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* User Footer */}
        <div className="p-3.5 border-t border-emerald-900/50 bg-[#09271c] flex items-center justify-between">
          <div className="truncate pr-2">
            <p className="text-xs font-semibold text-white truncate">{user?.full_name}</p>
            <p className="text-[11px] text-emerald-400/80 truncate">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            title="Log Out"
            className="p-1.5 text-slate-300 hover:text-rose-300 hover:bg-emerald-900/40 rounded transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between flex-shrink-0 z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div>
              <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Enterprise Operations</span>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                {user?.organization_name || 'Food Waste Planning Platform'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-xs font-medium text-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Isolated Workspace</span>
            </div>
            {activeAlertsCount > 0 && (
              <NavLink
                to="/alerts"
                className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-xs font-semibold hover:bg-amber-100 transition"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>{activeAlertsCount} Alert{activeAlertsCount > 1 ? 's' : ''}</span>
              </NavLink>
            )}
          </div>
        </header>

        {/* Mobile Sidebar Modal */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-40 md:hidden bg-slate-900/60 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}>
            <div
              className="w-64 h-full bg-[#0d3829] text-white p-4 flex flex-col justify-between"
              onClick={(e) => e.stopPropagation()}
            >
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-emerald-800/40">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🌱</span>
                    <span className="font-bold text-white">WasteAware IQ</span>
                  </div>
                  <button onClick={() => setMobileMenuOpen(false)} className="text-slate-300">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <nav className="mt-4 space-y-1">
                  {navLinks.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => setMobileMenuOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                          isActive ? 'bg-emerald-600/40 text-emerald-200 font-semibold' : 'text-slate-300'
                        }`
                      }
                    >
                      <item.icon className="w-4 h-4 text-emerald-400" />
                      <span>{item.label}</span>
                    </NavLink>
                  ))}
                </nav>
              </div>
              <div className="pt-4 border-t border-emerald-800/40">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-rose-300 hover:bg-rose-950/40 rounded-lg text-sm font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Scrollable Page Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
