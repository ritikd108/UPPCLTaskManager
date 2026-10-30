'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FileText,
  UploadCloud,
  Sparkles,
  Link2,
  FileCheck2,
  ExternalLink,
  History,
  Archive,
  Trash2,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { useApp } from '@/components/AppContext';

export default function DocumentsPage() {
  const { selectedProjectId, openDocModal, refreshKey } = useApp();
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDocs = async () => {
    setLoading(true);
    const pId = selectedProjectId !== 'ALL' ? `?projectId=${selectedProjectId}` : '';
    try {
      const res = await fetch(`/api/documents${pId}`);
      const data = await res.json();
      if (data.documents) setDocuments(data.documents);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, [selectedProjectId, refreshKey]);

  const getFormatBadge = (type: string) => {
    switch (type) {
      case 'DOCX':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300';
      case 'PDF':
        return 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300';
      case 'XLSX':
      case 'XLS':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300';
      case 'GOOGLE_DOC':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Requirement Documents</h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Repository of functional specifications, PRDs, Google Docs and Word documents with automated AI analysis
          </p>
        </div>
        <button
          onClick={openDocModal}
          className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-brand-600 hover:bg-brand-700 text-white shadow-sm transition-all shadow-brand-500/20 flex items-center gap-1.5 self-start sm:self-auto"
        >
          <UploadCloud className="w-3.5 h-3.5" />
          <span>Upload Document / Import Drive</span>
        </button>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-3 py-12 text-center text-xs text-slate-400">Loading requirement documents...</div>
        ) : documents.length === 0 ? (
          <div className="col-span-3 py-16 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            <FileText className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No requirement documents uploaded yet</p>
            <p className="text-xs text-slate-400 mt-1">Upload a DOCX, PDF, XLSX, or import a Google Doc to get started.</p>
          </div>
        ) : (
          documents.map(doc => (
            <div
              key={doc.id}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                {/* Top badges */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                      {doc.docId}
                    </span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${getFormatBadge(doc.fileType)}`}>
                      {doc.fileType.replace('_', ' ')}
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400">v{doc.version}</span>
                </div>

                {/* Title & Description */}
                <h3 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-2 mb-1.5">{doc.title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-4">{doc.description}</p>

                {/* Associated Project */}
                <div className="text-xs text-slate-600 dark:text-slate-400 mb-4 flex items-center justify-between">
                  <span>Project:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{doc.project?.name}</span>
                </div>

                {/* Extraction Stats */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs mb-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-slate-500">Requirements Extracted:</span>
                    <span className="font-bold text-slate-900 dark:text-white">{doc.stats?.requirementCount || 0}</span>
                  </div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-slate-500">Generated Tasks:</span>
                    <span className="font-bold text-brand-600">{doc.stats?.taskCount || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Fulfillment:</span>
                    <span className="font-bold text-emerald-600">{doc.stats?.completionRate || 0}%</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <Link
                  href={`/analysis?documentId=${doc.id}`}
                  className="flex-1 py-2 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Analyse with AI</span>
                </Link>

                <Link
                  href={`/documents/${doc.id}`}
                  className="py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center justify-center transition-colors"
                  title="View document text, requirements, and revisions"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
