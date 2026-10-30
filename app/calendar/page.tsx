'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
} from 'date-fns';
import { useApp } from '@/components/AppContext';

export default function CalendarPage() {
  const { selectedProjectId, refreshKey } = useApp();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const pId = selectedProjectId !== 'ALL' ? `?projectId=${selectedProjectId}&limit=200` : '?limit=200';
    fetch(`/api/tasks${pId}`)
      .then(res => res.json())
      .then(d => {
        if (d.tasks) setTasks(d.tasks);
      })
      .finally(() => setLoading(false));
  }, [selectedProjectId, refreshKey]);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(viewMode === 'month' ? monthStart : currentDate);
  const endDate = endOfWeek(viewMode === 'month' ? monthEnd : currentDate);

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const prev = () => {
    if (viewMode === 'month') setCurrentDate(subMonths(currentDate, 1));
    else setCurrentDate(subWeeks(currentDate, 1));
  };

  const next = () => {
    if (viewMode === 'month') setCurrentDate(addMonths(currentDate, 1));
    else setCurrentDate(addWeeks(currentDate, 1));
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Calendar View</h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Sprint timelines, task delivery deadlines, and milestone schedules
          </p>
        </div>

        {/* View toggle & Month navigation */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1 text-xs font-semibold">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                viewMode === 'month'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Month View
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                viewMode === 'week'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Week View
            </button>
          </div>

          <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1 shadow-sm">
            <button
              onClick={prev}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-xs font-bold text-slate-800 dark:text-slate-200 min-w-[120px] text-center">
              {format(currentDate, viewMode === 'month' ? 'MMMM yyyy' : "'Week of' MMM d, yyyy")}
            </span>
            <button
              onClick={next}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Days of week header */}
        <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/40 text-center py-2.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          <div>Sun</div>
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div>Sat</div>
        </div>

        {/* Days cells */}
        <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100 dark:divide-slate-800">
          {days.map(day => {
            const isToday = isSameDay(day, new Date());
            const isCurrentMonth = isSameMonth(day, currentDate);
            const dayTasks = tasks.filter(t => isSameDay(new Date(t.dueDate), day));

            return (
              <div
                key={day.toISOString()}
                className={`min-h-[120px] p-2 flex flex-col transition-colors ${
                  !isCurrentMonth ? 'bg-slate-50/50 dark:bg-slate-950/30 opacity-40' : ''
                } ${isToday ? 'bg-brand-50/30 dark:bg-brand-950/20' : ''}`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${
                      isToday
                        ? 'bg-brand-600 text-white'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {format(day, 'd')}
                  </span>
                  {dayTasks.length > 0 && (
                    <span className="text-[10px] font-semibold text-slate-400">
                      {dayTasks.length} due
                    </span>
                  )}
                </div>

                {/* Day Tasks Badges */}
                <div className="space-y-1 flex-1 overflow-y-auto max-h-24">
                  {dayTasks.map(t => {
                    const isDone = t.status === 'COMPLETED';
                    const isOverdue = !isDone && t.status !== 'CANCELLED' && new Date(t.dueDate) < new Date();

                    return (
                      <Link
                        key={t.id}
                        href={`/tasks/${t.id}`}
                        className={`block p-1 rounded text-[11px] truncate font-medium border transition-colors ${
                          isDone
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                            : isOverdue
                            ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300'
                            : 'bg-brand-50 dark:bg-brand-950/40 border-brand-200 dark:border-brand-800 text-brand-700 dark:text-brand-300'
                        }`}
                        title={`${t.taskId}: ${t.title} (${t.status})`}
                      >
                        <span className="font-mono font-bold mr-1">{t.taskId}</span>
                        <span>{t.title}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
