'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Plus,
  UploadCloud,
  Moon,
  Sun,
  Bell,
  CheckCircle2,
  FolderDot,
  UserCheck,
  ChevronDown,
} from 'lucide-react';
import { useApp } from './AppContext';

export default function Header() {
  const router = useRouter();
  const {
    currentUser,
    availableUsers,
    switchUser,
    selectedProjectId,
    setSelectedProjectId,
    theme,
    toggleTheme,
    unreadNotifications,
    openNewTaskModal,
    openDocModal,
  } = useApp();

  const [projects, setProjects] = useState<{ id: string; name: string; code: string }[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showNotificationFlyout, setShowNotificationFlyout] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/projects')
      .then(res => res.json())
      .then(data => {
        if (data.projects) setProjects(data.projects);
      })
      .catch(console.error);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/tasks?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleOpenNotifications = async () => {
    setShowNotificationFlyout(!showNotificationFlyout);
    if (!showNotificationFlyout) {
      try {
        const res = await fetch('/api/notifications');
        const data = await res.json();
        if (data.notifications) setNotifications(data.notifications);
      } catch (e) {
        console.error(e);
      }
    }
  };

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 md:px-6 flex items-center justify-between gap-4 sticky top-0 z-20">
      {/* Global Search */}
      <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md hidden sm:block">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Global search (Task ID, title, requirement, project)..."
          className="w-full pl-9 pr-4 py-1.5 text-sm bg-slate-100 dark:bg-slate-800 border-none rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </form>

      {/* Right Controls */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Project Selector */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300">
          <FolderDot className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
          <select
            value={selectedProjectId}
            onChange={e => setSelectedProjectId(e.target.value)}
            className="bg-transparent border-none text-xs focus:outline-none cursor-pointer text-slate-800 dark:text-slate-200 font-medium"
          >
            <option value="ALL">All Projects</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>
                {p.code} - {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Role / User Switcher */}
        <div className="relative">
          <button
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-200 transition-colors"
            title="Switch Simulated Role"
          >
            <UserCheck className="w-3.5 h-3.5 text-indigo-500" />
            <span className="hidden md:inline">{currentUser?.name?.split(' ')[0] || 'User'}</span>
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
              currentUser?.role === 'ADMIN'
                ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300'
                : currentUser?.role === 'MANAGER'
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300'
                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300'
            }`}>
              {currentUser?.role}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {showUserDropdown && (
            <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-2 z-50">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2 py-1">
                Switch Role / Persona
              </p>
              <div className="space-y-1">
                {availableUsers.map(u => (
                  <button
                    key={u.id}
                    onClick={() => {
                      switchUser(u.id);
                      setShowUserDropdown(false);
                    }}
                    className={`w-full text-left px-2.5 py-2 rounded-lg text-xs flex items-center justify-between transition-colors ${
                      currentUser?.id === u.id
                        ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 font-semibold'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">{u.name}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">{u.designation || u.email}</p>
                    </div>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider bg-slate-200 dark:bg-slate-700">
                      {u.role}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
        >
          {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </button>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={handleOpenNotifications}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadNotifications > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            )}
          </button>

          {showNotificationFlyout && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-3 z-50">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200 dark:border-slate-700">
                <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Notifications
                </span>
                <button
                  onClick={() => router.push('/notifications')}
                  className="text-xs text-brand-600 hover:underline"
                >
                  View All
                </button>
              </div>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {notifications.length === 0 ? (
                  <p className="text-xs text-slate-500 py-3 text-center">No new notifications.</p>
                ) : (
                  notifications.slice(0, 4).map(n => (
                    <div
                      key={n.id}
                      className="p-2 rounded-lg bg-slate-50 dark:bg-slate-700/50 text-xs hover:bg-slate-100 transition-colors cursor-pointer"
                      onClick={() => {
                        setShowNotificationFlyout(false);
                        if (n.link) router.push(n.link);
                      }}
                    >
                      <p className="font-semibold text-slate-900 dark:text-white">{n.title}</p>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 line-clamp-2">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Action: Upload Doc */}
        <button
          onClick={openDocModal}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <UploadCloud className="w-3.5 h-3.5 text-brand-600" />
          <span>Upload Doc</span>
        </button>

        {/* Action: New Task */}
        <button
          onClick={() => openNewTaskModal()}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-sm transition-all shadow-brand-500/20 active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Task</span>
        </button>
      </div>
    </header>
  );
}
