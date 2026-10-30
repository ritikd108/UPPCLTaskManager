'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Search,
  Filter,
  Download,
  Plus,
  ArrowUpDown,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Layers,
} from 'lucide-react';
import { useApp } from '@/components/AppContext';

function TasksContent() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get('search') || '';
  const initialOverdue = searchParams.get('isOverdue') === 'true';

  const { selectedProjectId, openNewTaskModal, refreshKey } = useApp();

  const [tasks, setTasks] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState(initialSearch);
  const [status, setStatus] = useState('ALL');
  const [priority, setPriority] = useState('ALL');
  const [assignedToId, setAssignedToId] = useState('ALL');
  const [categoryId, setCategoryId] = useState('ALL');
  const [sourceType, setSourceType] = useState('ALL');
  const [isOverdue, setIsOverdue] = useState(initialOverdue);
  const [sortBy, setSortBy] = useState('updatedAt');
  const [sortOrder, setSortOrder] = useState('desc');

  // Options
  const [projects, setProjects] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/projects')
      .then(res => res.json())
      .then(d => {
        if (d.projects) setProjects(d.projects);
      });
    fetch('/api/team')
      .then(res => res.json())
      .then(d => {
        if (d.users) setUsers(d.users);
      });
  }, []);

  const fetchTasks = async () => {
    setLoading(true);
    const pId = selectedProjectId !== 'ALL' ? selectedProjectId : undefined;
    const query = new URLSearchParams({
      page: String(page),
      limit: '20',
      search,
      status,
      priority,
      assignedToId,
      categoryId,
      sourceType,
      sortBy,
      sortOrder,
      ...(pId ? { projectId: pId } : {}),
      ...(isOverdue ? { isOverdue: 'true' } : {}),
    });

    try {
      const res = await fetch(`/api/tasks?${query.toString()}`);
      const data = await res.json();
      if (data.tasks) {
        setTasks(data.tasks);
        setTotalCount(data.pagination?.totalCount || 0);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [page, status, priority, assignedToId, categoryId, sourceType, isOverdue, sortBy, sortOrder, selectedProjectId, refreshKey]);

  const handleExportCsv = () => {
    const pId = selectedProjectId !== 'ALL' ? selectedProjectId : undefined;
    const query = new URLSearchParams({
      export: 'csv',
      search,
      status,
      priority,
      assignedToId,
      categoryId,
      sourceType,
      sortBy,
      sortOrder,
      ...(pId ? { projectId: pId } : {}),
      ...(isOverdue ? { isOverdue: 'true' } : {}),
    });
    window.location.href = `/api/tasks?${query.toString()}`;
  };

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case 'Critical':
        return 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200';
      case 'High':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200';
      case 'Medium':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200';
    }
  };

  const getStatusBadge = (s: string) => {
    switch (s) {
      case 'COMPLETED':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200';
      case 'ON_HOLD':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200';
      case 'CANCELLED':
        return 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-300';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">All Tasks</h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Complete central task tracker with advanced search, multi-axis filters, and requirement traceability
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCsv}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors shadow-sm flex items-center gap-1.5"
            title="Export filtered tasks to Excel/CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => openNewTaskModal()}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-brand-600 hover:bg-brand-700 text-white shadow-sm transition-all shadow-brand-500/20 flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        {/* Top search input */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && fetchTasks()}
              placeholder="Search by Task ID (TSK-501), Title, Description, or Project..."
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <button
            onClick={fetchTasks}
            className="px-4 py-2 text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white rounded-xl shadow-sm transition-colors flex items-center justify-center gap-1.5"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search</span>
          </button>
        </div>

        {/* Filter controls row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          {/* Status filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Status</label>
            <select
              value={status}
              onChange={e => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="w-full p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
            >
              <option value="ALL">All Statuses</option>
              <option value="NOT_STARTED">Not Started</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="ON_HOLD">On Hold</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          {/* Priority filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Priority</label>
            <select
              value={priority}
              onChange={e => {
                setPriority(e.target.value);
                setPage(1);
              }}
              className="w-full p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
            >
              <option value="ALL">All Priorities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          {/* Assignee filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Assigned To</label>
            <select
              value={assignedToId}
              onChange={e => {
                setAssignedToId(e.target.value);
                setPage(1);
              }}
              className="w-full p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
            >
              <option value="ALL">All Members</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>

          {/* Source Type filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Source Type</label>
            <select
              value={sourceType}
              onChange={e => {
                setSourceType(e.target.value);
                setPage(1);
              }}
              className="w-full p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
            >
              <option value="ALL">All Sources</option>
              <option value="REQUIREMENT_DOC">Requirement Doc</option>
              <option value="MANUAL">Manual Entry</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Sort By</label>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="w-full p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
            >
              <option value="updatedAt">Last Updated</option>
              <option value="dueDate">Due Date</option>
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="priority">Priority</option>
            </select>
          </div>

          {/* Overdue Checkbox */}
          <div className="flex items-center pt-5">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-rose-600 dark:text-rose-400">
              <input
                type="checkbox"
                checked={isOverdue}
                onChange={e => {
                  setIsOverdue(e.target.checked);
                  setPage(1);
                }}
                className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500"
              />
              <span>Only Overdue Tasks</span>
            </label>
          </div>
        </div>
      </div>

      {/* Tasks Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            Showing {tasks.length} of {totalCount} Tasks
          </span>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400">Click any row to view full details & traceability</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Task ID</th>
                <th className="py-3 px-4">Task Title & Deliverable</th>
                <th className="py-3 px-4">Project</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Assigned To</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4">Source / Requirement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading tasks...
                  </td>
                </tr>
              ) : tasks.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No matching tasks found. Adjust search terms or filters.
                  </td>
                </tr>
              ) : (
                tasks.map(t => {
                  const isPastDue =
                    t.status !== 'COMPLETED' && t.status !== 'CANCELLED' && new Date(t.dueDate) < new Date();

                  return (
                    <tr
                      key={t.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer"
                    >
                      {/* Task ID */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                        <Link href={`/tasks/${t.id}`} className="hover:text-brand-600 flex items-center gap-1">
                          <span>{t.taskId}</span>
                        </Link>
                      </td>

                      {/* Title & Deliverable */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <Link href={`/tasks/${t.id}`} className="block">
                          <p className="font-semibold text-slate-900 dark:text-white group-hover:text-brand-600 truncate">
                            {t.title}
                          </p>
                          {t.deliverable && (
                            <p className="text-[11px] text-slate-400 truncate mt-0.5">
                              Deliverable: {t.deliverable}
                            </p>
                          )}
                        </Link>
                      </td>

                      {/* Project */}
                      <td className="py-3.5 px-4">
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          {t.project?.code}
                        </span>
                      </td>

                      {/* Priority */}
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${getPriorityBadge(t.priority)}`}>
                          {t.priority}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${getStatusBadge(t.status)}`}>
                          {t.status.replace('_', ' ')}
                        </span>
                      </td>

                      {/* Assignee */}
                      <td className="py-3.5 px-4">
                        {t.assignedTo ? (
                          <div className="flex items-center gap-2">
                            <img
                              src={t.assignedTo.avatar || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150'}
                              alt=""
                              className="w-5 h-5 rounded-full object-cover"
                            />
                            <span className="text-slate-800 dark:text-slate-200">{t.assignedTo.name}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Unassigned</span>
                        )}
                      </td>

                      {/* Due Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`font-medium ${isPastDue ? 'text-rose-600 font-bold flex items-center gap-1' : 'text-slate-600 dark:text-slate-400'}`}>
                          {isPastDue && <AlertTriangle className="w-3 h-3 text-rose-500" />}
                          {new Date(t.dueDate).toLocaleDateString()}
                        </span>
                      </td>

                      {/* Requirement Traceability Link */}
                      <td className="py-3.5 px-4 max-w-xs truncate">
                        {t.requirement ? (
                          <Link
                            href={`/analysis?reqId=${t.requirement.reqId}`}
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-brand-600 hover:underline bg-brand-50 dark:bg-brand-950/40 px-2 py-0.5 rounded"
                          >
                            <Sparkles className="w-3 h-3" />
                            <span>{t.requirement.reqId}</span>
                          </Link>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Manual Entry</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-500">Page {page} of {Math.max(1, Math.ceil(totalCount / 20))}</span>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>
            <button
              disabled={page * 20 >= totalCount}
              onClick={() => setPage(page + 1)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TasksPage() {
  return (
    <Suspense fallback={<div className="py-12 text-center text-xs text-slate-400">Loading tasks...</div>}>
      <TasksContent />
    </Suspense>
  );
}
