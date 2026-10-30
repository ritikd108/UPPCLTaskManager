'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Layers,
  Plus,
  AlertTriangle,
  Clock,
  CheckCircle2,
  MoreVertical,
  ChevronRight,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { useApp } from '@/components/AppContext';

export default function KanbanPage() {
  const { selectedProjectId, openNewTaskModal, refreshKey } = useApp();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);
  const [workflowError, setWorkflowError] = useState<string | null>(null);

  const columns = [
    { id: 'NOT_STARTED', title: 'Not Started', color: 'border-slate-300 dark:border-slate-700', bg: 'bg-slate-50 dark:bg-slate-900/40' },
    { id: 'IN_PROGRESS', title: 'In Progress', color: 'border-blue-400 dark:border-blue-600', bg: 'bg-blue-50/30 dark:bg-blue-950/20' },
    { id: 'ON_HOLD', title: 'On Hold', color: 'border-amber-400 dark:border-amber-600', bg: 'bg-amber-50/30 dark:bg-amber-950/20' },
    { id: 'COMPLETED', title: 'Completed', color: 'border-emerald-400 dark:border-emerald-600', bg: 'bg-emerald-50/30 dark:bg-emerald-950/20' },
    { id: 'CANCELLED', title: 'Cancelled', color: 'border-rose-300 dark:border-rose-800', bg: 'bg-rose-50/20 dark:bg-rose-950/20' },
  ];

  const fetchTasks = async () => {
    setLoading(true);
    const pId = selectedProjectId !== 'ALL' ? `?projectId=${selectedProjectId}&limit=100` : '?limit=100';
    try {
      const res = await fetch(`/api/tasks${pId}`);
      const data = await res.json();
      if (data.tasks) setTasks(data.tasks);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [selectedProjectId, refreshKey]);

  const handleMoveStatus = async (taskId: string, newStatus: string) => {
    setUpdatingTaskId(taskId);
    setWorkflowError(null);

    try {
      const res = await fetch(`/api/tasks/${taskId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          remarks: `Moved to ${newStatus} via Kanban Board`,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setWorkflowError(data.error || 'Failed to update status.');
        return;
      }

      await fetchTasks();
    } catch (err: any) {
      setWorkflowError(err.message);
    } finally {
      setUpdatingTaskId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Kanban Board</h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Interactive visual workflow tracking with dependency validation and status progression
          </p>
        </div>
        <button
          onClick={() => openNewTaskModal()}
          className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-brand-600 hover:bg-brand-700 text-white shadow-sm transition-all shadow-brand-500/20 flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Task</span>
        </button>
      </div>

      {workflowError && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-start gap-3 text-xs text-rose-700 dark:text-rose-400">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold">Workflow Rule Enforced: </span>
            {workflowError}
          </div>
          <button onClick={() => setWorkflowError(null)} className="text-rose-500 hover:text-rose-700">
            Dismiss
          </button>
        </div>
      )}

      {/* Columns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 items-start">
        {columns.map(col => {
          const colTasks = tasks.filter(t => t.status === col.id);

          return (
            <div
              key={col.id}
              className={`rounded-2xl border-t-4 ${col.color} bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col min-h-[500px]`}
            >
              {/* Column Header */}
              <div className="p-3.5 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-white">
                    {col.title}
                  </span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    {colTasks.length}
                  </span>
                </div>
              </div>

              {/* Cards Container */}
              <div className="p-3 space-y-3 flex-1 overflow-y-auto max-h-[70vh]">
                {loading ? (
                  <div className="text-center py-8 text-xs text-slate-400">Loading cards...</div>
                ) : colTasks.length === 0 ? (
                  <div className="text-center py-10 text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                    No tasks in {col.title}
                  </div>
                ) : (
                  colTasks.map(t => {
                    const isOverdue =
                      t.status !== 'COMPLETED' && t.status !== 'CANCELLED' && new Date(t.dueDate) < new Date();
                    const hasDependencies = t.dependencies && t.dependencies.length > 0;

                    return (
                      <div
                        key={t.id}
                        className={`p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 shadow-sm hover:shadow-md transition-all group ${
                          updatingTaskId === t.id ? 'opacity-50 pointer-events-none' : ''
                        }`}
                      >
                        {/* Task Card Header */}
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-mono text-[11px] font-bold text-brand-600 dark:text-brand-400">
                            {t.taskId}
                          </span>
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                            t.priority === 'Critical'
                              ? 'bg-rose-100 text-rose-700'
                              : t.priority === 'High'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {t.priority}
                          </span>
                        </div>

                        {/* Title */}
                        <Link
                          href={`/tasks/${t.id}`}
                          className="font-semibold text-xs text-slate-900 dark:text-white group-hover:text-brand-600 block line-clamp-2 mb-2"
                        >
                          {t.title}
                        </Link>

                        {/* Dependencies tag if present */}
                        {hasDependencies && (
                          <div className="mb-2 text-[10px] text-amber-600 dark:text-amber-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>Depends on {t.dependencies.length} prerequisite task(s)</span>
                          </div>
                        )}

                        {/* Deliverable snippet */}
                        {t.deliverable && (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mb-2">
                            Deliverable: {t.deliverable}
                          </p>
                        )}

                        {/* Assignee & Due Date */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-[11px]">
                          <div className="flex items-center gap-1.5">
                            <img
                              src={t.assignedTo?.avatar || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150'}
                              alt=""
                              className="w-4 h-4 rounded-full object-cover"
                            />
                            <span className="text-slate-600 dark:text-slate-400 truncate max-w-[80px]">
                              {t.assignedTo?.name?.split(' ')[0] || 'Unassigned'}
                            </span>
                          </div>
                          <span className={`font-medium ${isOverdue ? 'text-rose-600 font-bold' : 'text-slate-500'}`}>
                            {new Date(t.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </span>
                        </div>

                        {/* Quick Move Status Action */}
                        <div className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[11px]">
                          <span className="text-slate-400">Move to:</span>
                          <select
                            value={t.status}
                            onChange={e => handleMoveStatus(t.id, e.target.value)}
                            className="text-[10px] font-semibold bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded px-1.5 py-0.5 focus:outline-none"
                          >
                            <option value="NOT_STARTED">Not Started</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="ON_HOLD">On Hold</option>
                            <option value="COMPLETED">Completed</option>
                            <option value="CANCELLED">Cancelled</option>
                          </select>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
