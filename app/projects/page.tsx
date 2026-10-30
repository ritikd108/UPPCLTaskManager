'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FolderGit2,
  Plus,
  Users2,
  FileText,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Calendar,
  X,
  AlertCircle,
} from 'lucide-react';
import { useApp } from '@/components/AppContext';

export default function ProjectsPage() {
  const { currentUser, refreshKey, refreshAppData } = useApp();
  const [projects, setProjects] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New Project Modal State
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [managerId, setManagerId] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [startDate, setStartDate] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/projects');
      const data = await res.json();
      if (data.projects) setProjects(data.projects);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
    fetch('/api/team')
      .then(res => res.json())
      .then(d => {
        if (d.users) setUsers(d.users);
      });
  }, [refreshKey]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          code,
          description,
          managerId: managerId || currentUser?.id,
          memberIds: selectedMemberIds,
          startDate,
          targetDate,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create project.');

      setShowModal(false);
      setName('');
      setCode('');
      setDescription('');
      setSelectedMemberIds([]);
      fetchProjects();
      refreshAppData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Projects Management</h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Enterprise project portfolios, milestone tracking, team allocation and requirement document mapping
          </p>
        </div>
        {(currentUser?.role === 'ADMIN' || currentUser?.role === 'MANAGER') && (
          <button
            onClick={() => setShowModal(true)}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-brand-600 hover:bg-brand-700 text-white shadow-sm transition-all shadow-brand-500/20 flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Project</span>
          </button>
        )}
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-2 py-12 text-center text-xs text-slate-400">Loading projects...</div>
        ) : (
          projects.map(p => (
            <div
              key={p.id}
              className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                {/* Project Header */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300">
                      {p.code}
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                      {p.status}
                    </span>
                  </div>
                  <span className="font-mono text-xs text-slate-400">{p.projectId}</span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1.5">{p.name}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-4">{p.description}</p>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-xs mb-1 font-semibold">
                    <span className="text-slate-600 dark:text-slate-400">Completion</span>
                    <span className="text-brand-600">{p.stats?.progress || 0}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-brand-600 rounded-full transition-all duration-500"
                      style={{ width: `${p.stats?.progress || 0}%` }}
                    />
                  </div>
                </div>

                {/* KPI Metrics Strip */}
                <div className="grid grid-cols-4 gap-2 text-center p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 mb-4 text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase">Tasks</span>
                    <p className="font-bold text-slate-900 dark:text-white">{p.stats?.total || 0}</p>
                  </div>
                  <div>
                    <span className="text-emerald-500 text-[10px] uppercase">Done</span>
                    <p className="font-bold text-emerald-600">{p.stats?.completed || 0}</p>
                  </div>
                  <div>
                    <span className="text-blue-500 text-[10px] uppercase">Active</span>
                    <p className="font-bold text-blue-600">{p.stats?.inProgress || 0}</p>
                  </div>
                  <div>
                    <span className="text-purple-500 text-[10px] uppercase">PRDs</span>
                    <p className="font-bold text-purple-600">{p.stats?.docCount || 0}</p>
                  </div>
                </div>
              </div>

              {/* Footer with Team & Manager */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  {p.manager && (
                    <div className="flex items-center gap-1.5">
                      <img
                        src={p.manager.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'}
                        alt=""
                        className="w-5 h-5 rounded-full object-cover"
                      />
                      <span className="text-slate-600 dark:text-slate-400 font-medium">{p.manager.name}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <Link
                    href={`/documents?projectId=${p.id}`}
                    className="text-xs text-brand-600 hover:underline font-medium"
                  >
                    View Docs
                  </Link>
                  <Link
                    href={`/tasks?projectId=${p.id}`}
                    className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 hover:bg-brand-100 transition-colors"
                  >
                    View Tasks →
                  </Link>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* New Project Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Create New Project</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="p-6 space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-rose-50 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Project Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Next-Gen Mobile Checkout"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Project Code (Uppercase) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={e => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. MOBILE-PAY"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="High level project scope and business objectives..."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Target Date</label>
                  <input
                    type="date"
                    value={targetDate}
                    onChange={e => setTargetDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 rounded-lg hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg"
                >
                  {submitting ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
