'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  FileText,
  Plus,
  Trash2,
  Edit2,
  Save,
  CheckSquare,
  Clock,
  Layers,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { useApp } from '@/components/AppContext';

function AnalysisContent() {
  const searchParams = useSearchParams();
  const initialDocId = searchParams.get('documentId') || '';

  const { refreshKey, refreshAppData } = useApp();

  const [documents, setDocuments] = useState<any[]>([]);
  const [selectedDocId, setSelectedDocId] = useState(initialDocId);
  const [users, setUsers] = useState<any[]>([]);

  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Editable Review Tasks
  // Each item: { id, reqId, title, description, priority, deliverable, assignedToId, estimatedDays, selected, isNew }
  const [reviewTasks, setReviewTasks] = useState<any[]>([]);
  const [savingTasks, setSavingTasks] = useState(false);

  useEffect(() => {
    fetch('/api/documents')
      .then(res => res.json())
      .then(d => {
        if (d.documents) {
          setDocuments(d.documents);
          if (!selectedDocId && d.documents.length > 0) {
            setSelectedDocId(d.documents[0].id);
          }
        }
      });

    fetch('/api/team')
      .then(res => res.json())
      .then(d => {
        if (d.users) setUsers(d.users);
      });
  }, [refreshKey]);

  const handleRunAnalysis = async () => {
    if (!selectedDocId) return;
    setAnalyzing(true);
    setError('');
    setSuccessMsg('');
    setAnalysisResult(null);

    try {
      const res = await fetch(`/api/documents/${selectedDocId}/analyze`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'AI Analysis failed.');

      setAnalysisResult(data.analysis);

      // Flatten suggested tasks from all extracted requirements for the review screen
      const flatReviewTasks: any[] = [];
      data.analysis.requirements.forEach((req: any) => {
        (req.suggestedTasks || []).forEach((st: any, idx: number) => {
          flatReviewTasks.push({
            id: `${req.id || req.reqId}-task-${idx}`,
            requirementId: req.id,
            reqId: req.reqId,
            requirementTitle: req.title,
            title: st.title,
            description: st.description,
            priority: st.priority || req.priority || 'Medium',
            deliverable: st.deliverable || req.deliverable || 'Verified deliverable',
            assignedToId: '',
            estimatedDays: st.estimatedDays || 5,
            selected: true,
          });
        });
      });

      setReviewTasks(flatReviewTasks);
      setSuccessMsg(`AI successfully extracted ${data.analysis.requirements.length} requirements and generated ${flatReviewTasks.length} actionable tasks for review.`);
      refreshAppData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    setReviewTasks(reviewTasks.map(t => ({ ...t, selected: checked })));
  };

  const handleToggleTask = (id: string) => {
    setReviewTasks(reviewTasks.map(t => (t.id === id ? { ...t, selected: !t.selected } : t)));
  };

  const handleUpdateTaskField = (id: string, field: string, val: any) => {
    setReviewTasks(reviewTasks.map(t => (t.id === id ? { ...t, [field]: val } : t)));
  };

  const handleRemoveTask = (id: string) => {
    setReviewTasks(reviewTasks.filter(t => t.id !== id));
  };

  const handleAddNewTask = () => {
    const newTask = {
      id: `manual-task-${Date.now()}`,
      requirementId: analysisResult?.requirements[0]?.id || '',
      reqId: analysisResult?.requirements[0]?.reqId || 'MANUAL',
      requirementTitle: analysisResult?.requirements[0]?.title || 'Custom Task',
      title: 'New implementation task',
      description: 'Detail implementation step...',
      priority: 'Medium',
      deliverable: 'Task deliverable',
      assignedToId: '',
      estimatedDays: 3,
      selected: true,
      isNew: true,
    };
    setReviewTasks([...reviewTasks, newTask]);
  };

  const handleApproveSelectedTasks = async () => {
    const selected = reviewTasks.filter(t => t.selected);
    if (selected.length === 0) {
      setError('Please select at least one task to approve and save.');
      return;
    }

    setSavingTasks(true);
    setError('');

    try {
      // Group tasks by requirementId
      const grouped = new Map<string, any[]>();
      selected.forEach(t => {
        const reqId = t.requirementId || analysisResult?.requirements[0]?.id;
        if (!grouped.has(reqId)) grouped.set(reqId, []);
        grouped.get(reqId)!.push(t);
      });

      let totalSaved = 0;
      for (const [reqId, tasks] of Array.from(grouped.entries())) {
        const res = await fetch('/api/requirements/approve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            requirementId: reqId,
            approvedTasks: tasks,
          }),
        });
        const data = await res.json();
        if (res.ok) {
          totalSaved += data.tasks?.length || 0;
        }
      }

      setSuccessMsg(`Approved and saved ${totalSaved} task(s) into the Task Tracker with full requirement traceability!`);
      // Remove approved tasks from review list
      setReviewTasks(reviewTasks.filter(t => !t.selected));
      refreshAppData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSavingTasks(false);
    }
  };

  const selectedDocument = documents.find(d => d.id === selectedDocId);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-brand-600" />
          <span>AI Requirement Analysis & Task Generation</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Automated requirement extraction, deliverable synthesis, ambiguity discovery, and interactive task approval
        </p>
      </div>

      {/* Selector & Action Card */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1 max-w-md">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Select Requirement Document to Analyze
          </label>
          <select
            value={selectedDocId}
            onChange={e => setSelectedDocId(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
          >
            {documents.map(d => (
              <option key={d.id} value={d.id}>
                {d.docId} - {d.title} (v{d.version})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRunAnalysis}
            disabled={analyzing || !selectedDocId}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 text-white text-xs font-semibold shadow-md transition-all disabled:opacity-50 flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>{analyzing ? 'Analyzing Document with AI...' : 'Analyse Requirements with AI'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 text-rose-700 text-xs flex items-center gap-2 border border-rose-200">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 text-emerald-700 text-xs flex items-center gap-2 border border-emerald-200">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Analysis Overview Cards (if analyzed) */}
      {analysisResult && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm md:col-span-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Document Objective</h2>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">{analysisResult.objective}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">{analysisResult.summary}</p>
          </div>

          <div className="p-5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/50 shadow-sm">
            <h2 className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 mb-1 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4" />
              <span>Identified Ambiguities / Risks</span>
            </h2>
            <ul className="text-xs text-amber-900 dark:text-amber-200 space-y-1.5 list-disc list-inside mt-2">
              {(analysisResult.ambiguities || []).map((amb: string, idx: number) => (
                <li key={idx}>{amb}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Review Screen (Section 10.3) */}
      {reviewTasks.length > 0 && (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>AI-Generated Task Review & Approval Screen</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                  {reviewTasks.length} pending approval
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Review, edit, assign, or delete suggested tasks before saving them to the Task Tracker.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleAddNewTask}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Task Manually</span>
              </button>

              <button
                type="button"
                onClick={handleApproveSelectedTasks}
                disabled={savingTasks}
                className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{savingTasks ? 'Saving...' : `Approve Selected (${reviewTasks.filter(t => t.selected).length})`}</span>
              </button>
            </div>
          </div>

          {/* Select all bar */}
          <div className="flex items-center justify-between text-xs py-1 text-slate-500">
            <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={reviewTasks.every(t => t.selected)}
                onChange={e => handleSelectAll(e.target.checked)}
                className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
              />
              <span>Select / Deselect All</span>
            </label>
            <span>{reviewTasks.filter(t => t.selected).length} tasks selected</span>
          </div>

          {/* Tasks Table / Cards */}
          <div className="space-y-3">
            {reviewTasks.map(t => (
              <div
                key={t.id}
                className={`p-4 rounded-xl border transition-all ${
                  t.selected
                    ? 'border-brand-300 dark:border-brand-700/60 bg-brand-50/20 dark:bg-brand-950/10'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 opacity-75'
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={t.selected}
                    onChange={() => handleToggleTask(t.id)}
                    className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 mt-1"
                  />

                  <div className="flex-1 space-y-3">
                    {/* Top row: Title and Requirement badge */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <input
                        type="text"
                        value={t.title}
                        onChange={e => handleUpdateTaskField(t.id, 'title', e.target.value)}
                        className="text-sm font-bold text-slate-900 dark:text-white bg-transparent border-b border-transparent hover:border-slate-300 focus:border-brand-500 focus:outline-none flex-1"
                      />
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                          {t.reqId}
                        </span>
                        <button
                          onClick={() => handleRemoveTask(t.id)}
                          className="p-1 text-slate-400 hover:text-rose-500 rounded"
                          title="Remove task suggestion"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Description */}
                    <textarea
                      rows={2}
                      value={t.description}
                      onChange={e => handleUpdateTaskField(t.id, 'description', e.target.value)}
                      className="w-full text-xs text-slate-600 dark:text-slate-300 bg-transparent border border-slate-200 dark:border-slate-700 rounded-lg p-2 focus:ring-1 focus:ring-brand-500 focus:outline-none"
                    />

                    {/* Controls row: Priority, Deliverable, Assignee, Days */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">Priority</label>
                        <select
                          value={t.priority}
                          onChange={e => handleUpdateTaskField(t.id, 'priority', e.target.value)}
                          className="w-full p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        >
                          <option value="Critical">Critical</option>
                          <option value="High">High</option>
                          <option value="Medium">Medium</option>
                          <option value="Low">Low</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">Assigned To</label>
                        <select
                          value={t.assignedToId}
                          onChange={e => handleUpdateTaskField(t.id, 'assignedToId', e.target.value)}
                          className="w-full p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
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
                        <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">Est. Days</label>
                        <input
                          type="number"
                          min="1"
                          max="90"
                          value={t.estimatedDays}
                          onChange={e => handleUpdateTaskField(t.id, 'estimatedDays', parseInt(e.target.value) || 1)}
                          className="w-full p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">Expected Deliverable</label>
                        <input
                          type="text"
                          value={t.deliverable}
                          onChange={e => handleUpdateTaskField(t.id, 'deliverable', e.target.value)}
                          className="w-full p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white truncate"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AnalysisPage() {
  return (
    <Suspense fallback={<div className="py-12 text-center text-xs text-slate-400">Loading analysis workspace...</div>}>
      <AnalysisContent />
    </Suspense>
  );
}
