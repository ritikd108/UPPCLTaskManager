'use client';

import React, { useState, useEffect } from 'react';
import { X, Calendar, AlertCircle, CheckCircle, Clock, Link2, Repeat } from 'lucide-react';
import { useApp } from './AppContext';

export default function TaskModal() {
  const { isTaskModalOpen, closeTaskModal, editingTask, refreshAppData } = useApp();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [assignedToId, setAssignedToId] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [status, setStatus] = useState('NOT_STARTED');
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [deliverable, setDeliverable] = useState('');
  const [remarks, setRemarks] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceRule, setRecurrenceRule] = useState('WEEKLY');
  const [selectedDependencies, setSelectedDependencies] = useState<string[]>([]);
  const [sourceReference, setSourceReference] = useState('');

  const [projects, setProjects] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [existingTasks, setExistingTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isTaskModalOpen) {
      // Load projects and users
      fetch('/api/projects')
        .then(res => res.json())
        .then(d => {
          if (d.projects) {
            setProjects(d.projects);
            if (!projectId && d.projects.length > 0) setProjectId(d.projects[0].id);
          }
        });

      fetch('/api/team')
        .then(res => res.json())
        .then(d => {
          if (d.users) setUsers(d.users);
        });

      fetch('/api/tasks?limit=100')
        .then(res => res.json())
        .then(d => {
          if (d.tasks) setExistingTasks(d.tasks);
        });

      if (editingTask) {
        setTitle(editingTask.title || '');
        setDescription(editingTask.description || '');
        setProjectId(editingTask.projectId || '');
        setCategoryId(editingTask.categoryId || '');
        setAssignedToId(editingTask.assignedToId || '');
        setPriority(editingTask.priority || 'Medium');
        setStatus(editingTask.status || 'NOT_STARTED');
        setStartDate(editingTask.startDate ? editingTask.startDate.split('T')[0] : '');
        setDueDate(editingTask.dueDate ? editingTask.dueDate.split('T')[0] : '');
        setDeliverable(editingTask.deliverable || '');
        setRemarks(editingTask.remarks || '');
        setIsRecurring(Boolean(editingTask.isRecurring));
        setRecurrenceRule(editingTask.recurrenceRule || 'WEEKLY');
        setSourceReference(editingTask.sourceReference || '');
        if (editingTask.dependencies) {
          setSelectedDependencies(editingTask.dependencies.map((d: any) => d.dependsOnTaskId || d.dependsOnTask?.id));
        }
      } else {
        // Reset defaults
        setTitle('');
        setDescription('');
        setCategoryId('');
        setAssignedToId('');
        setPriority('Medium');
        setStatus('NOT_STARTED');
        const now = new Date();
        setStartDate(now.toISOString().split('T')[0]);
        const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        setDueDate(nextWeek.toISOString().split('T')[0]);
        setDeliverable('');
        setRemarks('');
        setIsRecurring(false);
        setRecurrenceRule('WEEKLY');
        setSelectedDependencies([]);
        setSourceReference('');
      }
      setError('');
    }
  }, [isTaskModalOpen, editingTask]);

  if (!isTaskModalOpen) return null;

  const currentProject = projects.find(p => p.id === projectId);
  const categories = currentProject?.categories || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        title,
        description,
        projectId,
        categoryId: categoryId || null,
        assignedToId: assignedToId || null,
        priority,
        status,
        startDate,
        dueDate,
        deliverable,
        remarks,
        isRecurring,
        recurrenceRule: isRecurring ? recurrenceRule : null,
        dependencyTaskIds: selectedDependencies,
        sourceReference,
      };

      const url = editingTask ? `/api/tasks/${editingTask.id}` : '/api/tasks';
      const method = editingTask ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save task.');
      }

      refreshAppData();
      closeTaskModal();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl my-8 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {editingTask ? `Edit Task (${editingTask.taskId})` : 'Create New Task'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {editingTask ? 'Modify task parameters, dependencies, or progress' : 'Enter task details to assign responsibilities and set deliverables'}
            </p>
          </div>
          <button
            onClick={closeTaskModal}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-center gap-2 text-xs text-rose-700 dark:text-rose-400">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Task Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Implement webhook signature verification"
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>

          {/* Project & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Project <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={projectId}
                onChange={e => setProjectId(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
              >
                {projects.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.code})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Category</label>
              <select
                value={categoryId}
                onChange={e => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
              >
                <option value="">No Category</option>
                {categories.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Assignee & Priority & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Assign To</label>
              <select
                value={assignedToId}
                onChange={e => setAssignedToId(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
              >
                <option value="">Unassigned</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Priority</label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
              >
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
              >
                <option value="NOT_STARTED">Not Started</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="ON_HOLD">On Hold</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Due Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Deliverable & Source Reference */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Expected Deliverable
              </label>
              <input
                type="text"
                value={deliverable}
                onChange={e => setDeliverable(e.target.value)}
                placeholder="e.g. Tested API endpoint & Swagger docs"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Source Document Reference
              </label>
              <input
                type="text"
                value={sourceReference}
                onChange={e => setSourceReference(e.target.value)}
                placeholder="e.g. Section 3.2: Payment Gateway"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Provide detailed implementation requirements, edge cases, acceptance criteria..."
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>

          {/* Dependencies */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Prerequisite Tasks (Dependencies)
            </label>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
              Select tasks that must be Completed before this task can be progressed.
            </p>
            <div className="max-h-32 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-lg p-2 space-y-1 bg-slate-50/50 dark:bg-slate-800/50">
              {existingTasks
                .filter(t => !editingTask || t.id !== editingTask.id)
                .map(t => {
                  const isChecked = selectedDependencies.includes(t.id);
                  return (
                    <label
                      key={t.id}
                      className="flex items-center gap-2 p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700/50 text-xs cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={e => {
                          if (e.target.checked) {
                            setSelectedDependencies([...selectedDependencies, t.id]);
                          } else {
                            setSelectedDependencies(selectedDependencies.filter(id => id !== t.id));
                          }
                        }}
                        className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                      />
                      <span className="font-mono text-slate-500">{t.taskId}</span>
                      <span className="text-slate-800 dark:text-slate-200 truncate flex-1">{t.title}</span>
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                        t.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {t.status}
                      </span>
                    </label>
                  );
                })}
            </div>
          </div>

          {/* Recurring Schedule Switch */}
          <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Repeat className="w-4 h-4 text-brand-600" />
              <div>
                <p className="text-xs font-semibold text-slate-900 dark:text-white">Recurring Task</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Automatically generate the next task upon completion
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={e => setIsRecurring(e.target.checked)}
                className="w-4 h-4 rounded text-brand-600"
              />
              {isRecurring && (
                <select
                  value={recurrenceRule}
                  onChange={e => setRecurrenceRule(e.target.value)}
                  className="px-2 py-1 text-xs rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                >
                  <option value="DAILY">Daily</option>
                  <option value="WEEKLY">Weekly</option>
                  <option value="MONTHLY">Monthly</option>
                  <option value="YEARLY">Yearly</option>
                </select>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={closeTaskModal}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-sm transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : editingTask ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
