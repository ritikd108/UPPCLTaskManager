'use client';

import React, { useState, useEffect } from 'react';
import { X, UploadCloud, FileText, CheckCircle, AlertCircle, Link, FileCheck2 } from 'lucide-react';
import { useApp } from './AppContext';

export default function DocumentUploadModal() {
  const { isDocModalOpen, closeDocModal, refreshAppData } = useApp();

  const [tab, setTab] = useState<'upload' | 'google_drive'>('upload');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState('');
  const [version, setVersion] = useState('1.0');
  const [file, setFile] = useState<File | null>(null);
  const [googleDocUrl, setGoogleDocUrl] = useState('');
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isDocModalOpen) {
      fetch('/api/projects')
        .then(res => res.json())
        .then(d => {
          if (d.projects) {
            setProjects(d.projects);
            if (d.projects.length > 0 && !projectId) setProjectId(d.projects[0].id);
          }
        });
      setTitle('');
      setDescription('');
      setFile(null);
      setGoogleDocUrl('');
      setError('');
    }
  }, [isDocModalOpen]);

  if (!isDocModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (tab === 'upload') {
        if (!file) throw new Error('Please select a document file (.docx, .pdf, .xlsx, .txt)');
        const formData = new FormData();
        formData.append('file', file);
        formData.append('title', title || file.name.replace(/\.[^/.]+$/, ''));
        formData.append('description', description);
        formData.append('projectId', projectId);
        formData.append('version', version);

        const res = await fetch('/api/documents', {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to upload document.');
      } else {
        if (!googleDocUrl.trim()) throw new Error('Please enter a Google Docs URL or Document ID.');
        const res = await fetch('/api/documents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: title || 'Imported Google Doc',
            description,
            projectId,
            version,
            googleDocUrl: googleDocUrl.trim(),
            fileType: 'GOOGLE_DOC',
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to import Google Doc.');
      }

      refreshAppData();
      closeDocModal();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Upload Requirement Document</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Upload functional specifications, PRDs, or import Google Docs for AI analysis
            </p>
          </div>
          <button
            onClick={closeDocModal}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 pt-3 gap-6 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setTab('upload')}
            className={`pb-2.5 border-b-2 flex items-center gap-2 transition-colors ${
              tab === 'upload'
                ? 'border-brand-600 text-brand-600 dark:text-brand-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <UploadCloud className="w-4 h-4" />
            <span>File Upload (DOCX, PDF, XLSX, TXT)</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('google_drive')}
            className={`pb-2.5 border-b-2 flex items-center gap-2 transition-colors ${
              tab === 'google_drive'
                ? 'border-brand-600 text-brand-600 dark:text-brand-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Link className="w-4 h-4 text-emerald-500" />
            <span>Google Docs / Drive Import</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-center gap-2 text-xs text-rose-700 dark:text-rose-400">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {tab === 'upload' ? (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Select Document File
              </label>
              <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-6 text-center hover:border-brand-500 transition-colors bg-slate-50/50 dark:bg-slate-800/30">
                <input
                  type="file"
                  id="doc-file-input"
                  accept=".docx,.pdf,.xlsx,.xls,.txt,.md"
                  onChange={e => {
                    if (e.target.files && e.target.files[0]) {
                      const f = e.target.files[0];
                      setFile(f);
                      if (!title) setTitle(f.name.replace(/\.[^/.]+$/, ''));
                    }
                  }}
                  className="hidden"
                />
                <label htmlFor="doc-file-input" className="cursor-pointer">
                  {file ? (
                    <div className="flex flex-col items-center">
                      <FileCheck2 className="w-8 h-8 text-emerald-500 mb-1.5" />
                      <p className="text-xs font-bold text-slate-900 dark:text-white">{file.name}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {(file.size / 1024).toFixed(1)} KB · Click to change file
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <UploadCloud className="w-8 h-8 text-slate-400 mb-2" />
                      <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        Click or drag document to upload
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Supports Microsoft Word (.docx), PDF (.pdf), Excel (.xlsx), and Text (.txt)
                      </p>
                    </div>
                  )}
                </label>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Google Docs URL or Document ID <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={googleDocUrl}
                onChange={e => setGoogleDocUrl(e.target.value)}
                placeholder="https://docs.google.com/document/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Integrates via Google Drive API OAuth 2.0 to extract document requirements.
              </p>
            </div>
          )}

          {/* Title & Project */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Document Title
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Payment & Order Management PRD"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Associated Project <span className="text-rose-500">*</span>
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
          </div>

          {/* Version & Description */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="sm:col-span-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Version</label>
              <input
                type="text"
                value={version}
                onChange={e => setVersion(e.target.value)}
                placeholder="1.0"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>
            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Description</label>
              <input
                type="text"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Brief summary of document purpose..."
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={closeDocModal}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-sm transition-colors disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Upload Document'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
