import React from 'react';
import { Role } from '../types/index.ts';
import {
  LayoutDashboard,
  Users,
  Building2,
  BookOpen,
  GitBranch,
  Shuffle,
  Clock,
  Calendar,
  Sliders,
  FileText,
  Binary,
  Inbox,
  UserCheck,
  BarChart3,
  Bot,
} from 'lucide-react';

interface SidebarProps {
  role: Role;
  activeTab: string;
  onSelectTab: (tabId: string) => void;
  pendingRequestsCount?: number;
  overloadCount?: number;
  onOpenChatbot?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  role,
  activeTab,
  onSelectTab,
  pendingRequestsCount = 0,
  overloadCount = 0,
  onOpenChatbot,
}) => {
  // Navigation item configurations per role
  const getNavItems = () => {
    if (role === 'admin') {
      return [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'faculty', label: 'Faculty Management', icon: Users, badge: overloadCount > 0 ? `${overloadCount} Overload` : undefined, badgeColor: 'bg-rose-100 text-rose-700' },
        { id: 'departments', label: 'Departments', icon: Building2 },
        { id: 'courses', label: 'Courses Catalog', icon: BookOpen },
        { id: 'assignments', label: 'Course Assignments', icon: GitBranch },
        { id: 'workload', label: 'Workload Matrix', icon: Clock },
        { id: 'balancer', label: 'Smart Balancer', icon: Shuffle, badge: 'Greedy' },
        { id: 'dsa', label: 'DSA Implementation', icon: Binary, highlight: true },
        { id: 'requests', label: 'Requests Queue', icon: Inbox, badge: pendingRequestsCount > 0 ? `${pendingRequestsCount}` : undefined, badgeColor: 'bg-amber-100 text-amber-800' },
        { id: 'timetable', label: 'Academic Timetable', icon: Calendar },
        { id: 'reports', label: 'Analytics & Reports', icon: BarChart3 },
        { id: 'settings', label: 'Workload Rules', icon: Sliders },
      ];
    } else if (role === 'hod') {
      return [
        { id: 'dashboard', label: 'Department Dashboard', icon: LayoutDashboard },
        { id: 'faculty', label: 'Department Faculty', icon: Users, badge: overloadCount > 0 ? `${overloadCount} Overload` : undefined, badgeColor: 'bg-rose-100 text-rose-700' },
        { id: 'courses', label: 'Department Courses', icon: BookOpen },
        { id: 'assignments', label: 'Assign / Reassign', icon: GitBranch },
        { id: 'workload', label: 'Workload Comparison', icon: Clock },
        { id: 'balancer', label: 'Workload Optimization', icon: Shuffle, badge: 'Greedy' },
        { id: 'dsa', label: 'DSA Implementation', icon: Binary, highlight: true },
        { id: 'requests', label: 'Faculty Requests', icon: Inbox, badge: pendingRequestsCount > 0 ? `${pendingRequestsCount}` : undefined, badgeColor: 'bg-amber-100 text-amber-800' },
        { id: 'timetable', label: 'Timetable Overview', icon: Calendar },
        { id: 'reports', label: 'Department Reports', icon: BarChart3 },
      ];
    } else {
      // Faculty
      return [
        { id: 'dashboard', label: 'My Dashboard', icon: LayoutDashboard },
        { id: 'profile', label: 'My Profile', icon: UserCheck },
        { id: 'courses', label: 'My Assigned Courses', icon: BookOpen },
        { id: 'workload', label: 'My Workload Meter', icon: Clock },
        { id: 'timetable', label: 'My Weekly Timetable', icon: Calendar },
        { id: 'requests', label: 'Reduction Requests', icon: Inbox, badge: pendingRequestsCount > 0 ? `${pendingRequestsCount}` : undefined, badgeColor: 'bg-amber-100 text-amber-800' },
        { id: 'dsa', label: 'DSA Viva Demo', icon: Binary, highlight: true },
      ];
    }
  };

  const navItems = getNavItems();

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 border-r border-slate-800 select-none">
      {/* Role Pill Banner */}
      <div className="p-4 border-b border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">
            Navigation Portal
          </span>
          <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-slate-800 text-indigo-400 border border-slate-700">
            {role.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Nav links */}
      <div className="flex-1 py-3 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all group ${
                isActive
                  ? 'bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-600/30'
                  : item.highlight
                  ? 'bg-indigo-950/50 text-indigo-300 hover:bg-indigo-900/60 border border-indigo-800/40 font-semibold'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive ? 'text-white' : item.highlight ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </div>

              {item.badge && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0 ${
                    item.badgeColor || (isActive ? 'bg-indigo-700 text-white' : 'bg-slate-800 text-slate-300')
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Chatbot Trigger & Academic Year Footnote */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/60 space-y-2">
        {onOpenChatbot && (
          <button
            onClick={onOpenChatbot}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-xs font-semibold shadow-sm transition-all"
          >
            <Bot className="w-4 h-4" />
            <span>Ask FacultyAssist AI</span>
          </button>
        )}

        <div className="text-[11px] text-slate-500 text-center pt-1">
          Academic Year 2026–2027 • Fall Sem
        </div>
      </div>
    </aside>
  );
};
