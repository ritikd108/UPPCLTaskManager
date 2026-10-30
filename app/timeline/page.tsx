'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  GanttChartSquare,
  Clock,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  GitBranch,
} from 'lucide-react';
import { differenceInDays, format } from 'date-fns';
import { useApp } from '@/components/AppContext';

export default function TimelinePage() {
  const { selectedProjectId, refreshKey } = useApp();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const pId = selectedProjectId !== 'ALL' ? `?projectId=${selectedProjectId}&limit=100` : '?limit=100';
    fetch(`/api/tasks${pId}`)
      .then(res => res.json())
      .then(d => {
        if (d.tasks) setTasks(d.tasks);
      })
      .finally(() => setLoading(false));
  }, [selectedProjectId, refreshKey]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Timeline & Gantt View</h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Visual schedule of task durations, commencement dates, delivery targets, and prerequisite dependencies
        </p>
      </div>

      {/* Timeline List */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-5">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Calculating schedule timeline...</div>
        ) : tasks.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">No tasks in current project timeline.</div>
        ) : (
          tasks.map(t => {
            const start = t.startDate ? new Date(t.startDate) : new Date(t.createdAt);
            const due = new Date(t.dueDate);
            const duration = Math.max(1, differenceInDays(due, start));
            const isDone = t.status === 'COMPLETED';
            const isOverdue = !isDone && t.status !== 'CANCELLED' && due < new Date();

            return (
              <div
                key={t.id}
                className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 hover:border-brand-500 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-brand-600">{t.taskId}</span>
                    <Link
                      href={`/tasks/${t.id}`}
                      className="text-sm font-semibold text-slate-900 dark:text-white hover:text-brand-600"
                    >
                      {t.title}
                    </Link>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      isDone
                        ? 'bg-emerald-100 text-emerald-700'
                        : isOverdue
                        ? 'bg-rose-100 text-rose-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {t.status.replace('_', ' ')}
                    </span>
                    <span className="text-slate-400 font-medium">({duration} days)</span>
                  </div>
                </div>

                {/* Progress bar visualizing duration */}
                <div className="w-full h-3 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden my-2.5 relative">
                  <div
                    className={`h-full rounded-full ${
                      isDone
                        ? 'bg-emerald-500'
                        : isOverdue
                        ? 'bg-rose-500'
                        : 'bg-gradient-to-r from-brand-500 to-indigo-600'
                    }`}
                    style={{
                      width: isDone ? '100%' : t.status === 'IN_PROGRESS' ? '60%' : '20%',
                    }}
                  />
                </div>

                {/* Date labels & Dependencies */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-500">
                  <div className="flex items-center gap-4">
                    <span>
                      Start: <strong className="text-slate-700 dark:text-slate-300">{format(start, 'MMM d, yyyy')}</strong>
                    </span>
                    <span>
                      Target Due: <strong className="text-slate-700 dark:text-slate-300">{format(due, 'MMM d, yyyy')}</strong>
                    </span>
                    {t.assignedTo && (
                      <span>
                        Assignee: <strong className="text-slate-700 dark:text-slate-300">{t.assignedTo.name}</strong>
                      </span>
                    )}
                  </div>

                  {t.dependencies && t.dependencies.length > 0 && (
                    <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-medium">
                      <GitBranch className="w-3.5 h-3.5" />
                      <span>
                        Prerequisites:{' '}
                        {t.dependencies.map((d: any) => d.dependsOnTask?.taskId).join(', ')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
