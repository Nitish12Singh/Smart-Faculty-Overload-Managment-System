import React, { useState } from 'react';
import { User, NotificationItem } from '../types/index.ts';
import {
  GraduationCap,
  Bell,
  Search,
  LogOut,
  User as UserIcon,
  ShieldAlert,
  Check,
  Building,
} from 'lucide-react';
import { api } from '../services/api.ts';

interface NavbarProps {
  user: User;
  onLogout: () => void;
  notifications: NotificationItem[];
  onRefreshNotifications: () => void;
  globalSearch: string;
  onSearchChange: (val: string) => void;
  onSwitchRole?: (role: 'admin' | 'faculty' | 'hod') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onLogout,
  notifications,
  onRefreshNotifications,
  globalSearch,
  onSearchChange,
  onSwitchRole,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkRead = async (id: number) => {
    try {
      await api.markNotificationRead(id);
      onRefreshNotifications();
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      onRefreshNotifications();
    } catch (e) {
      console.error(e);
    }
  };

  const roleBadgeColor =
    user.role === 'admin'
      ? 'bg-purple-100 text-purple-800 border-purple-200'
      : user.role === 'hod'
      ? 'bg-blue-100 text-blue-800 border-blue-200'
      : 'bg-emerald-100 text-emerald-800 border-emerald-200';

  const roleLabel =
    user.role === 'admin'
      ? 'University Admin'
      : user.role === 'hod'
      ? 'HOD / Coordinator'
      : 'Faculty Member';

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-xs">
      <div className="flex items-center justify-between px-4 sm:px-6 py-2.5">
        {/* Left: Branding & University Title */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-700 via-blue-700 to-indigo-900 text-white shadow-sm ring-2 ring-indigo-100">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                Smart Faculty Overload Management
              </span>
              <span className="hidden md:inline-block px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                DSA v2.4
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              Academic Workload Optimization & Algorithm-Driven Allocation System
            </p>
          </div>
        </div>

        {/* Center: Global Search */}
        <div className="hidden lg:flex items-center flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search faculty, course code, dept, workload status..."
              value={globalSearch}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800 placeholder-slate-400"
            />
          </div>
        </div>

        {/* Right: Actions, Notifications, Role Switcher, Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Role Switcher Button */}
          {onSwitchRole && (
            <div className="relative">
              <button
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className={`text-xs font-semibold px-2.5 py-1 rounded-lg border flex items-center gap-1.5 transition-all ${roleBadgeColor}`}
                title="Switch demo role"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                {roleLabel}
              </button>

              {showRoleMenu && (
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50 text-xs">
                  <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    Switch Test Persona
                  </div>
                  <button
                    onClick={() => {
                      onSwitchRole('admin');
                      setShowRoleMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-50 transition-colors ${
                      user.role === 'admin' ? 'font-bold text-indigo-700 bg-indigo-50/50' : 'text-slate-700'
                    }`}
                  >
                    <span>University Admin</span>
                    {user.role === 'admin' && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                  </button>
                  <button
                    onClick={() => {
                      onSwitchRole('hod');
                      setShowRoleMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-50 transition-colors ${
                      user.role === 'hod' ? 'font-bold text-indigo-700 bg-indigo-50/50' : 'text-slate-700'
                    }`}
                  >
                    <span>HOD (CSE Dept)</span>
                    {user.role === 'hod' && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                  </button>
                  <button
                    onClick={() => {
                      onSwitchRole('faculty');
                      setShowRoleMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-50 transition-colors ${
                      user.role === 'faculty' ? 'font-bold text-indigo-700 bg-indigo-50/50' : 'text-slate-700'
                    }`}
                  >
                    <span>Faculty (Dr. Sharma - Overloaded)</span>
                    {user.role === 'faculty' && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden text-xs">
                <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span>Notifications</span>
                    {unreadCount > 0 && (
                      <span className="px-1.5 py-0.2 bg-rose-100 text-rose-700 font-semibold rounded-full text-[10px]">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-[11px] font-medium text-indigo-600 hover:text-indigo-800"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-slate-400">No notifications found.</div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => handleMarkRead(n.id)}
                        className={`p-3 hover:bg-slate-50/80 cursor-pointer transition-colors ${
                          !n.isRead ? 'bg-indigo-50/30' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className={`font-semibold ${!n.isRead ? 'text-indigo-900' : 'text-slate-800'}`}>
                            {n.title}
                          </span>
                          {!n.isRead && (
                            <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0 mt-1" />
                          )}
                        </div>
                        <p className="text-slate-600 mt-1 leading-relaxed">{n.message}</p>
                        <span className="text-[10px] text-slate-400 mt-1.5 block">
                          {new Date(n.createdAt).toLocaleDateString()} at{' '}
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile & Logout */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700 font-bold text-xs">
                {user.name.charAt(0)}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-bold text-slate-900 leading-tight max-w-[140px] truncate">
                  {user.name}
                </div>
                <div className="text-[10px] text-slate-500 truncate max-w-[140px]">
                  {user.email}
                </div>
              </div>
            </div>

            <button
              onClick={onLogout}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ml-1"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
