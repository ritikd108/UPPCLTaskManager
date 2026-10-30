'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Download,
  Printer,
  Calendar,
  Layers,
  Sparkles,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { useApp } from '@/components/AppContext';

export default function ReportsPage() {
  const { selectedProjectId, refreshKey } = useApp();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeReportTab, setActiveReportTab] = useState<'summary' | 'performance' | 'requirements' | 'documents'>('summary');

  useEffect(() => {
    setLoading(true);
    const pId = selectedProjectId !== 'ALL' ? `?projectId=${selectedProjectId}` : '';
    fetch(`/api/reports${pId}`)
      .then(res => res.json())
      .then(d => setData(d))
      .finally(() => setLoading(false));
  }, [selectedProjectId, refreshKey]);

  const handleExportCsv = () => {
    const pId = selectedProjectId !== 'ALL' ? `?projectId=${selectedProjectId}&export=csv` : '?export=csv';
    window.location.href = `/api/reports${pId}`;
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <div className="py-12 text-center text-xs text-slate-400">Compiling executive analytics...</div>;
  }

  const summary = data?.summary || {};
  const userPerformance = data?.userPerformance || [];
  const projectProgress = data?.projectProgress || [];
  const monthlyTrend = data?.monthlyTrend || [];
  const avgCompletionDays = data?.avgCompletionDays || 3.5;
  const requirementProgress = data?.requirementProgress || [];
  const documentTaskGeneration = data?.documentTaskGeneration || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 print:p-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Reports & Analytics</h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Comprehensive audit reports, completion velocity, user performance, and requirement fulfillment analytics
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handlePrint}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors shadow-sm flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Print Report</span>
          </button>
          <button
            onClick={handleExportCsv}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-brand-600 hover:bg-brand-700 text-white shadow-sm transition-all shadow-brand-500/20 flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* 4 Primary Report Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6 text-xs font-semibold print:hidden">
        <button
          onClick={() => setActiveReportTab('summary')}
          className={`pb-2.5 border-b-2 transition-colors ${
            activeReportTab === 'summary'
              ? 'border-brand-600 text-brand-600 dark:text-brand-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          }`}
        >
          Overall Task & SLA Summary
        </button>
        <button
          onClick={() => setActiveReportTab('performance')}
          className={`pb-2.5 border-b-2 transition-colors ${
            activeReportTab === 'performance'
              ? 'border-brand-600 text-brand-600 dark:text-brand-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          }`}
        >
          User-Wise Performance & Velocity
        </button>
        <button
          onClick={() => setActiveReportTab('requirements')}
          className={`pb-2.5 border-b-2 transition-colors ${
            activeReportTab === 'requirements'
              ? 'border-brand-600 text-brand-600 dark:text-brand-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          }`}
        >
          Requirement Fulfillment Report
        </button>
        <button
          onClick={() => setActiveReportTab('documents')}
          className={`pb-2.5 border-b-2 transition-colors ${
            activeReportTab === 'documents'
              ? 'border-brand-600 text-brand-600 dark:text-brand-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          }`}
        >
          Document-Wise Generation Report
        </button>
      </div>

      {/* Tab 1: Overall Summary */}
      {activeReportTab === 'summary' && (
        <div className="space-y-6">
          {/* Executive KPI Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-xs text-slate-400">Total Tasks</span>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{summary.total || 0}</p>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-xs text-emerald-500">Completed</span>
              <p className="text-2xl font-bold text-emerald-600 mt-1">{summary.completed || 0}</p>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-xs text-blue-500">In Progress</span>
              <p className="text-2xl font-bold text-blue-600 mt-1">{summary.inProgress || 0}</p>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-950/60 shadow-sm">
              <span className="text-xs text-rose-500">Overdue</span>
              <p className="text-2xl font-bold text-rose-600 mt-1">{summary.overdue || 0}</p>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-xs text-slate-400">Avg Cycle Time</span>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{avgCompletionDays}d</p>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-xs text-indigo-500">Fulfillment Rate</span>
              <p className="text-2xl font-bold text-indigo-600 mt-1">
                {summary.total > 0 ? Math.round((summary.completed / summary.total) * 100) : 0}%
              </p>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Monthly Delivery Velocity</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="completed" stroke="#0c8ee9" strokeWidth={3} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Project Progress Breakdown</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={projectProgress}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="code" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="total" name="Total Tasks" fill="#93c5fd" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="completed" name="Completed" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: User-wise Performance */}
      {activeReportTab === 'performance' && (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-500 font-bold uppercase text-[10px]">
                  <th className="py-3 px-4">Team Member</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Assigned Tasks</th>
                  <th className="py-3 px-4">Completed</th>
                  <th className="py-3 px-4">In Progress</th>
                  <th className="py-3 px-4">Overdue</th>
                  <th className="py-3 px-4">Completion Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {userPerformance.map((u: any) => (
                  <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">{u.name}</td>
                    <td className="py-3.5 px-4 text-slate-500">{u.role}</td>
                    <td className="py-3.5 px-4 font-bold">{u.total}</td>
                    <td className="py-3.5 px-4 text-emerald-600 font-bold">{u.completed}</td>
                    <td className="py-3.5 px-4 text-blue-600">{u.inProgress}</td>
                    <td className="py-3.5 px-4 text-rose-600 font-bold">{u.overdue}</td>
                    <td className="py-3.5 px-4 font-bold text-brand-600">{u.rate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Requirement Fulfillment */}
      {activeReportTab === 'requirements' && (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-500 font-bold uppercase text-[10px]">
                  <th className="py-3 px-4">Requirement ID</th>
                  <th className="py-3 px-4">Requirement Title</th>
                  <th className="py-3 px-4">Document</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Total Tasks</th>
                  <th className="py-3 px-4">Completed</th>
                  <th className="py-3 px-4">Fulfillment %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {requirementProgress.map((r: any) => (
                  <tr key={r.reqId} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3.5 px-4 font-mono font-bold text-brand-600">{r.reqId}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">{r.title}</td>
                    <td className="py-3.5 px-4 text-slate-500">{r.documentTitle}</td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-[10px] uppercase">{r.priority}</span>
                    </td>
                    <td className="py-3.5 px-4 font-bold">{r.totalTasks}</td>
                    <td className="py-3.5 px-4 text-emerald-600 font-bold">{r.completedTasks}</td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 rounded-full bg-slate-200 overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${r.rate}%` }} />
                        </div>
                        <span className="font-bold text-emerald-600">{r.rate}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Document-wise Generation */}
      {activeReportTab === 'documents' && (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-500 font-bold uppercase text-[10px]">
                  <th className="py-3 px-4">Document ID</th>
                  <th className="py-3 px-4">Document Title</th>
                  <th className="py-3 px-4">Project</th>
                  <th className="py-3 px-4">Version</th>
                  <th className="py-3 px-4">Extracted Requirements</th>
                  <th className="py-3 px-4">Generated Tasks</th>
                  <th className="py-3 px-4">Completed Tasks</th>
                  <th className="py-3 px-4">Fulfillment %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {documentTaskGeneration.map((d: any) => (
                  <tr key={d.docId} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3.5 px-4 font-mono font-bold text-purple-600">{d.docId}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">{d.title}</td>
                    <td className="py-3.5 px-4 text-slate-500">{d.projectName}</td>
                    <td className="py-3.5 px-4 text-slate-400">v{d.version}</td>
                    <td className="py-3.5 px-4 font-bold">{d.requirementsCount}</td>
                    <td className="py-3.5 px-4 font-bold text-brand-600">{d.generatedTasksCount}</td>
                    <td className="py-3.5 px-4 font-bold text-emerald-600">{d.completedTasksCount}</td>
                    <td className="py-3.5 px-4 font-bold text-emerald-600">{d.fulfillmentRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
