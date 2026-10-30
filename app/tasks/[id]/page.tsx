'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Send,
  Sparkles,
  FileText,
  GitBranch,
  History,
  MessageSquare,
  Paperclip,
  Edit,
  Repeat,
  AlertCircle,
} from 'lucide-react';
import { useApp } from '@/components/AppContext';

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = params.id as string;

  const { currentUser, openNewTaskModal, refreshKey, refreshAppData } = useApp();

  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [statusRemarks, setStatusRemarks] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [workflowError, setWorkflowError] = useState<string | null>(null);

  const fetchTask = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}`);
      const data = await res.json();
      if (data.task) setTask(data.task);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTask();
  }, [taskId, refreshKey]);

  const handleStatusChange = async (newStatus: string) => {
    setUpdatingStatus(true);
    setWorkflowError(null);

    try {
      const res = await fetch(`/api/tasks/${task.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          remarks: statusRemarks.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setWorkflowError(data.error || 'Failed to update status.');
        return;
      }

      setStatusRemarks('');
      await fetchTask();
      refreshAppData();
    } catch (err: any) {
      setWorkflowError(err.message);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setSubmittingComment(true);

    try {
      const res = await fetch(`/api/tasks/${task.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: commentText.trim() }),
      });
      if (res.ok) {
        setCommentText('');
        fetchTask();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading) {
    return <div className="py-12 text-center text-xs text-slate-400">Loading task details...</div>;
  }

  if (!task) {
    return <div className="py-12 text-center text-xs text-rose-500">Task not found.</div>;
  }

  const isOverdue =
    task.status !== 'COMPLETED' && task.status !== 'CANCELLED' && new Date(task.dueDate) < new Date();

  const isCompleted = task.status === 'COMPLETED';

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Back button */}
      <div>
        <Link
          href="/tasks"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to All Tasks</span>
        </Link>
      </div>

      {workflowError && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-start gap-3 text-xs text-rose-700 dark:text-rose-400">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold">Workflow Validation Enforced: </span>
            {workflowError}
          </div>
          <button onClick={() => setWorkflowError(null)} className="text-rose-500 hover:text-rose-700">
            Dismiss
          </button>
        </div>
      )}

      {/* Main Task Header Card */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300">
                {task.taskId}
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {task.project?.code} - {task.project?.name}
              </span>
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                task.priority === 'Critical'
                  ? 'bg-rose-100 text-rose-700'
                  : task.priority === 'High'
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-blue-100 text-blue-700'
              }`}>
                {task.priority} Priority
              </span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">{task.title}</h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => openNewTaskModal(task)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>Edit Details</span>
            </button>
          </div>
        </div>

        {/* Status Transition Workflow Toolbar (Section 5.3) */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Current Status:</span>
            <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
              isCompleted
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                : task.status === 'IN_PROGRESS'
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                : task.status === 'ON_HOLD'
                ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
            }`}>
              {task.status.replace('_', ' ')}
            </span>
            {task.completionDate && (
              <span className="text-[11px] text-slate-400">
                (Completed on {new Date(task.completionDate).toLocaleDateString()})
              </span>
            )}
          </div>

          {/* Transition buttons */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <input
              type="text"
              value={statusRemarks}
              onChange={e => setStatusRemarks(e.target.value)}
              placeholder="Transition remarks (optional)..."
              className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700"
            />
            {task.status !== 'IN_PROGRESS' && (
              <button
                onClick={() => handleStatusChange('IN_PROGRESS')}
                disabled={updatingStatus}
                className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors disabled:opacity-50"
              >
                Mark In Progress
              </button>
            )}
            {task.status === 'IN_PROGRESS' && (
              <button
                onClick={() => handleStatusChange('ON_HOLD')}
                disabled={updatingStatus}
                className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold transition-colors disabled:opacity-50"
              >
                Put On Hold
              </button>
            )}
            {task.status !== 'COMPLETED' && (
              <button
                onClick={() => handleStatusChange('COMPLETED')}
                disabled={updatingStatus}
                className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition-colors disabled:opacity-50"
              >
                Complete Task
              </button>
            )}
            {task.status !== 'CANCELLED' && (
              <button
                onClick={() => handleStatusChange('CANCELLED')}
                disabled={updatingStatus}
                className="px-3 py-1 rounded-lg border border-slate-300 text-slate-600 dark:text-slate-400 hover:bg-slate-100 font-semibold transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        {/* Task Details Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs pt-2">
          <div>
            <span className="text-slate-400 block mb-0.5">Assigned To</span>
            {task.assignedTo ? (
              <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-white">
                <img
                  src={task.assignedTo.avatar || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150'}
                  alt=""
                  className="w-5 h-5 rounded-full object-cover"
                />
                <span>{task.assignedTo.name}</span>
              </div>
            ) : (
              <span className="text-slate-400 italic">Unassigned</span>
            )}
          </div>

          <div>
            <span className="text-slate-400 block mb-0.5">Start Date</span>
            <span className="font-semibold text-slate-900 dark:text-white">
              {task.startDate ? new Date(task.startDate).toLocaleDateString() : 'Immediate'}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block mb-0.5">Due Date</span>
            <span className={`font-semibold ${isOverdue ? 'text-rose-600 flex items-center gap-1' : 'text-slate-900 dark:text-white'}`}>
              {isOverdue && <AlertTriangle className="w-3.5 h-3.5" />}
              {new Date(task.dueDate).toLocaleDateString()}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block mb-0.5">Created By</span>
            <span className="font-semibold text-slate-900 dark:text-white">
              {task.createdBy?.name || 'Administrator'}
            </span>
          </div>
        </div>

        {/* Description & Deliverables */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Description</h2>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
              {task.description || 'No detailed description provided.'}
            </p>
          </div>

          {task.deliverable && (
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-xs">
              <span className="font-bold text-slate-500 block mb-0.5">Expected Deliverable:</span>
              <span className="font-semibold text-slate-900 dark:text-white">{task.deliverable}</span>
            </div>
          )}
        </div>
      </div>

      {/* Two-Way Traceability Section (Section 11) */}
      {task.requirement && (
        <div className="p-6 rounded-2xl bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-200/80 dark:border-indigo-900/50 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>Requirement-to-Task Traceability (Section 11)</span>
            </h2>
            <Link
              href={`/analysis?documentId=${task.requirement.documentId}`}
              className="text-xs text-brand-600 hover:underline font-semibold"
            >
              View in AI Analysis Screen →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-900/40">
              <span className="text-slate-400 block text-[11px] mb-1">Source Requirement:</span>
              <p className="font-bold text-slate-900 dark:text-white">
                {task.requirement.reqId}: {task.requirement.title}
              </p>
              <p className="text-slate-500 mt-1 line-clamp-2">{task.requirement.description}</p>
              <div className="mt-2 text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
                Reference: {task.sourceReference || task.requirement.sourceSection || 'Section Scope'}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-900/40">
              <span className="text-slate-400 block text-[11px] mb-1">Source Requirement Document:</span>
              <p className="font-bold text-slate-900 dark:text-white">{task.requirementDoc?.title}</p>
              <p className="text-slate-500 mt-1">
                Document ID: {task.requirementDoc?.docId} (v{task.requirementDoc?.version})
              </p>
              <Link
                href={`/documents/${task.requirementDoc?.id}`}
                className="mt-2 inline-block text-[11px] text-brand-600 hover:underline font-medium"
              >
                Inspect Original Document Content →
              </Link>
            </div>
          </div>

          {/* Sibling tasks under same requirement */}
          {task.requirement.tasks && task.requirement.tasks.length > 1 && (
            <div className="pt-2">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-2">
                All Implementation Tasks Under This Requirement ({task.requirement.tasks.length}):
              </span>
              <div className="space-y-1.5">
                {task.requirement.tasks.map((st: any) => (
                  <Link
                    key={st.id}
                    href={`/tasks/${st.id}`}
                    className={`p-2 rounded-lg text-xs flex items-center justify-between transition-colors block ${
                      st.id === task.id
                        ? 'bg-indigo-100/70 dark:bg-indigo-900/40 font-bold text-indigo-900 dark:text-indigo-200'
                        : 'bg-white dark:bg-slate-900 hover:bg-slate-50 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-slate-500">{st.taskId}</span>
                      <span>{st.title}</span>
                    </div>
                    <span className="text-[10px] font-semibold uppercase">{st.status}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Task Dependencies (Section 5.4) */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-brand-600" />
          <span>Task Dependencies & Workflow Guard (Section 5.4)</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-2">
              Prerequisite Tasks (Must be Completed First):
            </span>
            {(task.dependencies || []).length === 0 ? (
              <p className="text-slate-400 italic">No prerequisite dependencies.</p>
            ) : (
              (task.dependencies || []).map((d: any) => (
                <Link
                  key={d.id}
                  href={`/tasks/${d.dependsOnTask.id}`}
                  className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700 flex items-center justify-between mb-2 hover:bg-slate-100 block"
                >
                  <div>
                    <span className="font-mono text-slate-400 mr-2">{d.dependsOnTask.taskId}</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{d.dependsOnTask.title}</span>
                  </div>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    d.dependsOnTask.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                  }`}>
                    {d.dependsOnTask.status}
                  </span>
                </Link>
              ))
            )}
          </div>

          <div>
            <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-2">
              Dependent Tasks (Waiting for this task):
            </span>
            {(task.dependants || []).length === 0 ? (
              <p className="text-slate-400 italic">No other tasks currently blocked by this task.</p>
            ) : (
              (task.dependants || []).map((d: any) => (
                <Link
                  key={d.id}
                  href={`/tasks/${d.task.id}`}
                  className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700 flex items-center justify-between mb-2 hover:bg-slate-100 block"
                >
                  <div>
                    <span className="font-mono text-slate-400 mr-2">{d.task.taskId}</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{d.task.title}</span>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-500">{d.task.status}</span>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Comments & Activity Log Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Comments Section */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
              <MessageSquare className="w-4 h-4 text-brand-600" />
              <span>Comments & Remarks ({task.comments?.length || 0})</span>
            </h2>

            <div className="space-y-3 max-h-72 overflow-y-auto mb-4">
              {(task.comments || []).length === 0 ? (
                <p className="text-xs text-slate-400 italic">No comments yet.</p>
              ) : (
                task.comments.map((c: any) => (
                  <div key={c.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-xs space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{c.user?.name}</span>
                      <span>{new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300">{c.content}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <form onSubmit={handleAddComment} className="flex gap-2">
            <input
              type="text"
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              placeholder="Add remark or note..."
              className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <button
              type="submit"
              disabled={submittingComment || !commentText.trim()}
              className="px-3 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold disabled:opacity-50 flex items-center gap-1"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

        {/* Audit Log / History Section (Section 14) */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
            <History className="w-4 h-4 text-brand-600" />
            <span>Task Audit Timeline (Section 14)</span>
          </h2>

          <div className="space-y-3 max-h-80 overflow-y-auto text-xs">
            {(task.history || []).length === 0 ? (
              <p className="text-xs text-slate-400 italic">No modifications logged yet.</p>
            ) : (
              task.history.map((h: any) => (
                <div key={h.id} className="flex items-start gap-2.5 pb-2 border-b border-slate-100 dark:border-slate-800">
                  <div className="w-2 h-2 rounded-full bg-brand-500 mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{h.user?.name}</span>
                      <span>{new Date(h.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">
                      {h.changeType.replace('_', ' ')}: {h.oldValue ? `${h.oldValue} → ${h.newValue}` : h.newValue}
                    </p>
                    {h.remarks && <p className="text-[11px] text-slate-500 italic mt-0.5">{h.remarks}</p>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
