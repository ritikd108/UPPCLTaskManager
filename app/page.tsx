'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  CheckSquare,
  Clock,
  AlertTriangle,
  Calendar,
  FolderGit2,
  FileText,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  Activity,
  Layers,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  User,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts';
import { useApp } from '@/components/AppContext';

export default function DashboardPage() {
  const { selectedProjectId, refreshKey, openNewTaskModal, openDocModal } = useApp();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const query = selectedProjectId !== 'ALL' ? `?projectId=${selectedProjectId}` : '';
    fetch(`/api/dashboard${query}`)
      .then(res => res.json())
      .then(json => {
        setData(json);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [selectedProjectId, refreshKey]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-500">Loading project position & telemetry...</p>
        </div>
      </div>
    );
  }

  const kpis = data?.kpis || {};
  const charts = data?.charts || {};
  const widgets = data?.widgets || {};

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Title & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Main Dashboard</h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Real-time project position, task metrics, requirement extraction status and team execution telemetry
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={openDocModal}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-200 transition-colors shadow-sm flex items-center gap-1.5"
          >
            <FileText className="w-3.5 h-3.5 text-brand-600" />
            <span>Upload Document</span>
          </button>
          <button
            onClick={() => openNewTaskModal()}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-brand-600 hover:bg-brand-700 text-white shadow-sm transition-all shadow-brand-500/20 flex items-center gap-1.5"
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Create Task</span>
          </button>
        </div>
      </div>

      {/* 10 KPI Cards (Section 4.1) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* 1. Total Tasks */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow transition-shadow">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-medium">Total Tasks</span>
            <Layers className="w-4 h-4 text-brand-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{kpis.totalTasks ?? 0}</p>
          <p className="text-[11px] text-slate-400 mt-1">Across all active sprints</p>
        </div>

        {/* 2. Pending Tasks */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow transition-shadow">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-medium">Pending Tasks</span>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-bold text-slate-700 dark:text-slate-200">{kpis.pendingTasks ?? 0}</p>
          <p className="text-[11px] text-slate-400 mt-1">Not started yet</p>
        </div>

        {/* 3. In Progress Tasks */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow transition-shadow">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-medium">In Progress</span>
            <Activity className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{kpis.inProgressTasks ?? 0}</p>
          <p className="text-[11px] text-blue-500/80 mt-1">Active development</p>
        </div>

        {/* 4. Completed Tasks */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow transition-shadow">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-medium">Completed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{kpis.completedTasks ?? 0}</p>
          <p className="text-[11px] text-emerald-600/80 mt-1">Verified deliverables</p>
        </div>

        {/* 5. Overdue Tasks */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-950/60 shadow-sm hover:shadow transition-shadow">
          <div className="flex items-center justify-between text-rose-600 dark:text-rose-400 mb-2">
            <span className="text-xs font-medium">Overdue Tasks</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">{kpis.overdueTasks ?? 0}</p>
          <p className="text-[11px] text-rose-500/80 mt-1">Requires immediate attention</p>
        </div>

        {/* 6. Tasks Due Today */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-950/60 shadow-sm hover:shadow transition-shadow">
          <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 mb-2">
            <span className="text-xs font-medium">Tasks Due Today</span>
            <Calendar className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{kpis.tasksDueToday ?? 0}</p>
          <p className="text-[11px] text-amber-600/80 mt-1">EOD commitment</p>
        </div>

        {/* 7. Upcoming Tasks */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow transition-shadow">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-medium">Upcoming (7d)</span>
            <TrendingUp className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{kpis.upcomingTasks ?? 0}</p>
          <p className="text-[11px] text-slate-400 mt-1">Next 7 calendar days</p>
        </div>

        {/* 8. Active Projects */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow transition-shadow">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-medium">Active Projects</span>
            <FolderGit2 className="w-4 h-4 text-brand-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{kpis.activeProjects ?? 0}</p>
          <p className="text-[11px] text-slate-400 mt-1">In execution phase</p>
        </div>

        {/* 9. Total Requirement Documents */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow transition-shadow">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-medium">Req Documents</span>
            <FileText className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {kpis.totalRequirementDocuments ?? 0}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">PRDs, Specs, Drive docs</p>
        </div>

        {/* 10. Requirements Awaiting Task Creation */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow transition-shadow">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-medium">Awaiting Tasks</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {kpis.requirementsAwaitingTaskCreation ?? 0}
          </p>
          <p className="text-[11px] text-amber-600/80 mt-1">AI review pending</p>
        </div>
      </div>

      {/* Visualizations (Section 4.2) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Donut Chart - Status Distribution */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Task Status Distribution</h2>
            <span className="text-xs text-slate-400">Current Sprint</span>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts.statusDistribution || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {(charts.statusDistribution || []).map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-3 pt-2 text-[11px]">
            {(charts.statusDistribution || []).map((s: any) => (
              <div key={s.name} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                <span className="text-slate-600 dark:text-slate-300">{s.name}:</span>
                <span className="font-bold text-slate-900 dark:text-white">{s.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Chart 2: Priority-wise Task Distribution */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Priority Breakdown</h2>
            <span className="text-xs text-slate-400">By Severity</span>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.priorityDistribution || []}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="priority" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {(charts.priorityDistribution || []).map((entry: any, index: number) => (
                    <Cell key={`bar-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="pt-2 text-center text-[11px] text-slate-400">
            Critical tasks trigger priority SLA alerts and immediate oversight.
          </div>
        </div>

        {/* Chart 3: Weekly Task Completion */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Weekly Completion Velocity</h2>
            <span className="text-xs text-slate-400">Last 7 Days</span>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={charts.weeklyCompletion || []}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="pt-2 text-center text-[11px] text-slate-400">
            Total completed over the past week reflecting delivery velocity.
          </div>
        </div>
      </div>

      {/* Row 2 Visualizations: User Allocation & Project Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 4: User-wise Task Allocation */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">User Workload Allocation</h2>
            <Link href="/team" className="text-xs text-brand-600 hover:underline">
              View Team →
            </Link>
          </div>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.userAllocation || []}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="total" name="Total Tasks" fill="#93c5fd" radius={[4, 4, 0, 0]} />
                <Bar dataKey="completed" name="Completed" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 5: Project-wise Progress */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Project Completion Progress</h2>
            <Link href="/projects" className="text-xs text-brand-600 hover:underline">
              Manage Projects →
            </Link>
          </div>
          <div className="space-y-4 pt-1">
            {(charts.projectProgress || []).map((p: any) => (
              <div key={p.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white">{p.name}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                      {p.code}
                    </span>
                  </div>
                  <span className="font-bold text-brand-600">{p.progress}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-brand-500 to-indigo-600 rounded-full transition-all duration-500"
                    style={{ width: `${p.progress}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
                  <span>{p.completed} of {p.total} tasks completed</span>
                  <span className="text-emerald-500 font-medium">{p.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Widgets Grid (Section 4.3) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Widget 1: Upcoming Deadlines */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-amber-500" />
              <span>Upcoming Deadlines</span>
            </h3>
            <Link href="/tasks?sortBy=dueDate" className="text-xs text-brand-600 hover:underline">
              View All
            </Link>
          </div>
          <div className="space-y-2.5 flex-1">
            {(widgets.upcomingDeadlines || []).length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No upcoming deadlines this week.</p>
            ) : (
              (widgets.upcomingDeadlines || []).map((t: any) => (
                <Link
                  key={t.id}
                  href={`/tasks/${t.id}`}
                  className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors block text-xs"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-slate-400">{t.taskId}</span>
                    <span className="text-amber-600 font-semibold text-[11px]">
                      Due {new Date(t.dueDate).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="font-semibold text-slate-800 dark:text-slate-100 truncate">{t.title}</p>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Widget 2: Overdue Tasks Alert */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
              <span>Overdue Tasks</span>
            </h3>
            <Link href="/tasks?isOverdue=true" className="text-xs text-rose-600 hover:underline">
              Review All
            </Link>
          </div>
          <div className="space-y-2.5 flex-1">
            {(widgets.overdueTasks || []).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center text-slate-400">
                <CheckCircle2 className="w-6 h-6 text-emerald-500 mb-1" />
                <p className="text-xs font-medium text-slate-600 dark:text-slate-300">All tasks are on track!</p>
              </div>
            ) : (
              (widgets.overdueTasks || []).map((t: any) => (
                <Link
                  key={t.id}
                  href={`/tasks/${t.id}`}
                  className="p-2.5 rounded-xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200/50 dark:border-rose-900/40 block text-xs hover:bg-rose-100/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-rose-600 font-bold">{t.taskId}</span>
                    <span className="text-[10px] font-bold uppercase text-rose-600 bg-rose-100 dark:bg-rose-900/60 px-1.5 py-0.5 rounded">
                      {t.priority}
                    </span>
                  </div>
                  <p className="font-semibold text-slate-900 dark:text-white truncate">{t.title}</p>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Widget 3: Recent Activities */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-brand-600" />
              <span>Recent Activity Audit</span>
            </h3>
            <Link href="/activity" className="text-xs text-brand-600 hover:underline">
              Audit Log →
            </Link>
          </div>
          <div className="space-y-2.5 flex-1">
            {(widgets.recentActivities || []).map((act: any) => (
              <div key={act.id} className="text-xs p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40">
                <div className="flex items-center justify-between text-slate-400 text-[10px] mb-0.5">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{act.user?.name || 'System'}</span>
                  <span>{new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <p className="font-medium text-slate-800 dark:text-slate-200">{act.action}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
