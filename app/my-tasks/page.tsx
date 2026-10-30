'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CheckSquare,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Sparkles,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { useApp } from '@/components/AppContext';

export default function MyTasksPage() {
  const { currentUser, openNewTaskModal, refreshKey } = useApp();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'in_progress' | 'pending' | 'completed'>('all');

  useEffect(() => {
    if (currentUser?.id) {
      setLoading(true);
      fetch(`/api/tasks?assignedToId=${currentUser.id}&limit=100`)
        .then(res => res.json())
        .then(d => {
          if (d.tasks) setTasks(d.tasks);
        })
        .finally(() => setLoading(false));
    }
  }, [currentUser, refreshKey]);

  const filteredTasks = tasks.filter(t => {
    if (activeTab === 'in_progress') return t.status === 'IN_PROGRESS';
    if (activeTab === 'pending') return t.status === 'NOT_STARTED';
    if (activeTab === 'completed') return t.status === 'COMPLETED';
    return true;
  });

  const overdueCount = tasks.filter(
    t => t.status !== 'COMPLETED' && t.status !== 'CANCELLED' && new Date(t.dueDate) < new Date()
  ).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            My Tasks ({currentUser?.name})
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Work items directly assigned to you, active deliverables, and upcoming sprint deadlines
          </p>
        </div>
        <button
          onClick={() => openNewTaskModal()}
          className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-brand-600 hover:bg-brand-700 text-white shadow-sm transition-all shadow-brand-500/20 flex items-center gap-1.5 self-start sm:self-auto"
        >
          <CheckSquare className="w-3.5 h-3.5" />
          <span>Create Task</span>
        </button>
      </div>

      {/* Quick Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs text-slate-500">My Total Tasks</span>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{tasks.length}</p>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs text-blue-500">In Progress</span>
          <p className="text-2xl font-bold text-blue-600 mt-1">
            {tasks.filter(t => t.status === 'IN_PROGRESS').length}
          </p>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs text-emerald-500">Completed</span>
          <p className="text-2xl font-bold text-emerald-600 mt-1">
            {tasks.filter(t => t.status === 'COMPLETED').length}
          </p>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-950/60 shadow-sm">
          <span className="text-xs text-rose-500">Overdue</span>
          <p className="text-2xl font-bold text-rose-600 mt-1">{overdueCount}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-4 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('all')}
          className={`pb-2.5 border-b-2 transition-colors ${
            activeTab === 'all'
              ? 'border-brand-600 text-brand-600 dark:text-brand-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          }`}
        >
          All Assigned ({tasks.length})
        </button>
        <button
          onClick={() => setActiveTab('in_progress')}
          className={`pb-2.5 border-b-2 transition-colors ${
            activeTab === 'in_progress'
              ? 'border-brand-600 text-brand-600 dark:text-brand-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          }`}
        >
          In Progress ({tasks.filter(t => t.status === 'IN_PROGRESS').length})
        </button>
        <button
          onClick={() => setActiveTab('pending')}
          className={`pb-2.5 border-b-2 transition-colors ${
            activeTab === 'pending'
              ? 'border-brand-600 text-brand-600 dark:text-brand-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          }`}
        >
          Not Started ({tasks.filter(t => t.status === 'NOT_STARTED').length})
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`pb-2.5 border-b-2 transition-colors ${
            activeTab === 'completed'
              ? 'border-brand-600 text-brand-600 dark:text-brand-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          }`}
        >
          Completed ({tasks.filter(t => t.status === 'COMPLETED').length})
        </button>
      </div>

      {/* Tasks List */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-12 text-slate-400">Loading your tasks...</div>
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-12 text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No tasks in this view</p>
            <p className="text-xs text-slate-400 mt-1">Select another tab or switch user persona to view others.</p>
          </div>
        ) : (
          filteredTasks.map(t => {
            const isOverdue =
              t.status !== 'COMPLETED' && t.status !== 'CANCELLED' && new Date(t.dueDate) < new Date();

            return (
              <div
                key={t.id}
                className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-bold text-slate-500">{t.taskId}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {t.project?.code}
                    </span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                      t.priority === 'Critical'
                        ? 'bg-rose-100 text-rose-700'
                        : t.priority === 'High'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {t.priority}
                    </span>
                  </div>
                  <h3 className="font-semibold text-sm text-slate-900 dark:text-white truncate">{t.title}</h3>
                  {t.deliverable && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Deliverable: <span className="font-medium text-slate-700 dark:text-slate-300">{t.deliverable}</span>
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-4 flex-shrink-0">
                  <div className="text-right">
                    <span className={`text-xs font-semibold flex items-center gap-1 justify-end ${
                      isOverdue ? 'text-rose-600' : 'text-slate-600 dark:text-slate-400'
                    }`}>
                      {isOverdue && <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />}
                      Due {new Date(t.dueDate).toLocaleDateString()}
                    </span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded inline-block mt-1 ${
                      t.status === 'COMPLETED'
                        ? 'bg-emerald-100 text-emerald-700'
                        : t.status === 'IN_PROGRESS'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {t.status.replace('_', ' ')}
                    </span>
                  </div>

                  <Link
                    href={`/tasks/${t.id}`}
                    className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-950 transition-colors"
                    title="Open task details"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
