'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Activity, Bell, LogOut, User as UserIcon, ShieldAlert, Heart, Calendar } from 'lucide-react';
import api from '@/services/api';
import { NotificationItem } from '@/types';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const res: any = await api.get('/notifications');
      if (res.success) {
        setNotifications(res.notifications || []);
        setUnreadCount(res.unread_count || 0);
      }
    } catch (e) {
      console.error('Failed to load notifications', e);
    }
  };

  const markRead = async (id: number) => {
    try {
      await api.put(`/notifications/${id}/read`, {});
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (e) {
      console.error('Error marking notification read', e);
    }
  };

  const roleColors: Record<string, string> = {
    PATIENT: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    DOCTOR: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    HOSPITAL_ADMIN: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
    PHARMACY: 'bg-amber-500/10 text-amber-600 border-amber-500/20'
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/85 backdrop-blur-md transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-emerald-500 flex items-center justify-center shadow-md shadow-cyan-500/20 group-hover:scale-105 transition-transform">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="text-xl font-bold bg-gradient-to-r from-cyan-700 via-teal-700 to-emerald-700 bg-clip-text text-transparent">
              MediSync
            </span>
            <span className="block text-[10px] uppercase tracking-wider font-semibold text-slate-500">
              Smart Healthcare Platform
            </span>
          </div>
        </Link>

        {/* Action Controls & Navigation */}
        <div className="flex items-center space-x-4">
          {user ? (
            <>
              {/* Role Badge */}
              <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${roleColors[user.role] || 'bg-slate-100 text-slate-700'}`}>
                {user.role.replace('_', ' ')}
              </span>

              {/* Notification Bell */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                  className="relative p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
                  aria-label="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {showNotifDropdown && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                      <h4 className="font-semibold text-sm text-slate-900">Notifications</h4>
                      <span className="text-xs text-slate-500">{notifications.length} Total</span>
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-sm text-slate-400">No notifications yet.</div>
                      ) : (
                        notifications.map(n => (
                          <div
                            key={n.id}
                            onClick={() => !n.is_read && markRead(n.id)}
                            className={`p-3 text-xs transition-colors cursor-pointer hover:bg-slate-50 ${!n.is_read ? 'bg-cyan-50/50 font-medium' : 'text-slate-600'}`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-bold text-slate-900">{n.title}</span>
                              <span className="text-[10px] text-slate-400">
                                {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-slate-600 line-clamp-2">{n.message}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User Dropdown / Logout */}
              <div className="flex items-center space-x-3 pl-2 border-l border-slate-200">
                <div className="text-right hidden md:block">
                  <span className="block text-sm font-semibold text-slate-800">{user.name}</span>
                  <span className="block text-[11px] text-slate-500">{user.email}</span>
                </div>
                <button
                  onClick={logout}
                  className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors flex items-center space-x-1"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center space-x-3">
              <Link
                href="/login"
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-cyan-700 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 rounded-xl shadow-md shadow-cyan-500/20 transition-all"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
