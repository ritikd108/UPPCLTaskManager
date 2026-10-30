'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Bell,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  Sparkles,
  ArrowRight,
  CheckCheck,
} from 'lucide-react';
import { useApp } from '@/components/AppContext';

export default function NotificationsPage() {
  const { refreshKey, refreshAppData } = useApp();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/notifications');
      const data = await res.json();
      if (data.notifications) setNotifications(data.notifications);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, [refreshKey]);

  const handleMarkAllRead = async () => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllRead: true }),
      });
      if (res.ok) {
        fetchNotifs();
        refreshAppData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkSingleRead = async (id: string) => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        fetchNotifs();
        refreshAppData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Bell className="w-6 h-6 text-brand-600" />
            <span>Notifications & Automated Reminders</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Internal alerts for assignments, overdue tasks, approaching deadlines, and AI analysis events
          </p>
        </div>

        {notifications.some(n => !n.isRead) && (
          <button
            onClick={handleMarkAllRead}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1.5 self-start sm:self-auto"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Mark All as Read</span>
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-12 text-xs text-slate-400">Loading alerts...</div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">You are completely up to date!</p>
            <p className="text-xs text-slate-400 mt-1">No unread notices or overdue reminders.</p>
          </div>
        ) : (
          notifications.map(n => (
            <div
              key={n.id}
              className={`p-4 rounded-xl border transition-all flex items-start justify-between gap-4 ${
                n.isRead
                  ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-80'
                  : 'bg-brand-50/40 dark:bg-brand-950/20 border-brand-200 dark:border-brand-900 shadow-sm'
              }`}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-xs text-slate-900 dark:text-white">{n.title}</span>
                  <span className="text-[10px] text-slate-400">
                    {new Date(n.createdAt).toLocaleDateString()} {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {!n.isRead && (
                    <span className="w-2 h-2 rounded-full bg-brand-600 animate-pulse" />
                  )}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300">{n.message}</p>
                {n.link && (
                  <Link
                    href={n.link}
                    onClick={() => handleMarkSingleRead(n.id)}
                    className="inline-flex items-center gap-1 text-xs text-brand-600 font-semibold hover:underline mt-2"
                  >
                    <span>View Target Details</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                )}
              </div>

              {!n.isRead && (
                <button
                  onClick={() => handleMarkSingleRead(n.id)}
                  className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Mark read
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
