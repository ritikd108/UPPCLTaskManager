'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  CheckSquare,
  ListTodo,
  KanbanSquare,
  Calendar,
  GanttChartSquare,
  FolderGit2,
  FileText,
  Sparkles,
  Users2,
  BarChart3,
  Bell,
  History,
  Settings,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { useApp } from './AppContext';

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { currentUser, unreadNotifications } = useApp();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'My Tasks', href: '/my-tasks', icon: CheckSquare },
    { name: 'All Tasks', href: '/tasks', icon: ListTodo },
    { name: 'Kanban Board', href: '/kanban', icon: KanbanSquare },
    { name: 'Calendar', href: '/calendar', icon: Calendar },
    { name: 'Timeline View', href: '/timeline', icon: GanttChartSquare },
    { name: 'Projects', href: '/projects', icon: FolderGit2 },
    { name: 'Requirement Documents', href: '/documents', icon: FileText },
    { name: 'Requirement Analysis', href: '/analysis', icon: Sparkles, badge: 'AI' },
    { name: 'Team Members', href: '/team', icon: Users2 },
    { name: 'Reports & Analytics', href: '/reports', icon: BarChart3 },
    { name: 'Notifications', href: '/notifications', icon: Bell, count: unreadNotifications },
    { name: 'Activity Log', href: '/activity', icon: History },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <aside
      className={`h-screen sticky top-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 z-30 flex flex-col ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-800">
        {!collapsed && (
          <Link href="/" className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-sm flex-shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="leading-tight truncate">
              <span className="font-bold text-slate-900 dark:text-white text-base block tracking-tight">UPPCL</span>
              <span className="text-xs text-brand-600 dark:text-brand-400 font-medium tracking-wide">Task Manager</span>
            </div>
          </Link>
        )}
        {collapsed && (
          <div className="mx-auto w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-sm">
            <ShieldCheck className="w-5 h-5" />
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hidden md:block"
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Nav List */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navigation.map(item => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group relative ${
                isActive
                  ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
              title={collapsed ? item.name : undefined}
            >
              <Icon
                className={`w-5 h-5 flex-shrink-0 transition-colors ${
                  isActive
                    ? 'text-brand-600 dark:text-brand-400'
                    : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                }`}
              />
              {!collapsed && <span className="truncate flex-1">{item.name}</span>}
              {!collapsed && item.badge && (
                <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded-md">
                  {item.badge}
                </span>
              )}
              {!collapsed && typeof item.count === 'number' && item.count > 0 && (
                <span className="text-xs font-semibold bg-rose-500 text-white px-2 py-0.5 rounded-full">
                  {item.count}
                </span>
              )}
              {collapsed && typeof item.count === 'number' && item.count > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User profile footer */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800">
        <div className={`flex items-center gap-3 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 ${collapsed ? 'justify-center' : ''}`}>
          <img
            src={currentUser?.avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150'}
            alt="User avatar"
            className="w-8 h-8 rounded-full object-cover ring-2 ring-brand-500/20"
          />
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{currentUser?.name || 'Administrator'}</p>
              <div className="flex items-center gap-1.5">
                <span className={`inline-block w-1.5 h-1.5 rounded-full ${
                  currentUser?.role === 'ADMIN' ? 'bg-purple-500' : currentUser?.role === 'MANAGER' ? 'bg-blue-500' : 'bg-emerald-500'
                }`} />
                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {currentUser?.role || 'ADMIN'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
