'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  FileText,
  Sparkles,
  GitCompare,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Layers,
  AlertTriangle,
  History,
  Archive,
  Download,
  AlertCircle,
} from 'lucide-react';
import { useApp } from '@/components/AppContext';

export default function DocumentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const docId = params.id as string;
  const { refreshKey } = useApp();

  const [document, setDocument] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'preview' | 'requirements' | 'revisions'>('preview');

  // Revision comparison state
  const [revisedContent, setRevisedContent] = useState('');
  const [comparing, setComparing] = useState(false);
  const [diffResult, setDiffResult] = useState<any>(null);
  const [diffError, setDiffError] = useState('');

  const fetchDoc = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/documents/${docId}`);
      const data = await res.json();
      if (data.document) {
        setDocument(data.document);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoc();
  }, [docId, refreshKey]);

  const handleCompare = async () => {
    if (!revisedContent.trim()) return;
    setComparing(true);
    setDiffError('');

    try {
      const res = await fetch(`/api/documents/${docId}/compare`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ revisedContent }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to compare revisions.');
      setDiffResult(data.comparison);
    } catch (err: any) {
      setDiffError(err.message);
    } finally {
      setComparing(false);
    }
  };

  if (loading) {
    return <div className="py-12 text-center text-xs text-slate-400">Loading document details...</div>;
  }

  if (!document) {
    return <div className="py-12 text-center text-xs text-rose-500">Document not found.</div>;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Back button */}
      <div>
        <Link
          href="/documents"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Requirement Documents</span>
        </Link>
      </div>

      {/* Document Header Card */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300">
              {document.docId}
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              v{document.version}
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
              {document.status}
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">{document.title}</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Project: <strong className="text-slate-700 dark:text-slate-300">{document.project?.name}</strong> · Uploaded by {document.uploadedBy?.name} on {new Date(document.createdAt).toLocaleDateString()}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href={`/analysis?documentId=${document.id}`}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm flex items-center gap-1.5 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Analyse with AI</span>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('preview')}
          className={`pb-2.5 border-b-2 flex items-center gap-1.5 transition-colors ${
            activeTab === 'preview'
              ? 'border-brand-600 text-brand-600 dark:text-brand-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Raw Document Text</span>
        </button>

        <button
          onClick={() => setActiveTab('requirements')}
          className={`pb-2.5 border-b-2 flex items-center gap-1.5 transition-colors ${
            activeTab === 'requirements'
              ? 'border-brand-600 text-brand-600 dark:text-brand-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Extracted Requirements ({document.requirements?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('revisions')}
          className={`pb-2.5 border-b-2 flex items-center gap-1.5 transition-colors ${
            activeTab === 'revisions'
              ? 'border-brand-600 text-brand-600 dark:text-brand-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          }`}
        >
          <GitCompare className="w-3.5 h-3.5" />
          <span>Version Revision & AI Diff</span>
        </button>
      </div>

      {/* Tab 1: Raw Preview */}
      {activeTab === 'preview' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Extracted Content Preview</h2>
          <pre className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 text-xs font-mono text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed max-h-[600px] overflow-y-auto">
            {document.rawContent || 'No raw content available for this document.'}
          </pre>
        </div>
      )}

      {/* Tab 2: Extracted Requirements */}
      {activeTab === 'requirements' && (
        <div className="space-y-4">
          {(document.requirements || []).length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              No requirements extracted yet. Click &quot;Analyse with AI&quot; to scan and extract.
            </div>
          ) : (
            document.requirements.map((req: any) => (
              <div
                key={req.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-brand-600 bg-brand-50 dark:bg-brand-950/60 px-2 py-0.5 rounded">
                      {req.reqId}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">
                      {req.sourceSection || 'General Scope'}
                    </span>
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                    req.priority === 'Critical'
                      ? 'bg-rose-100 text-rose-700'
                      : req.priority === 'High'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {req.priority}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 dark:text-white">{req.title}</h3>
                <p className="text-xs text-slate-600 dark:text-slate-300">{req.description}</p>

                {req.deliverable && (
                  <p className="text-xs text-slate-500">
                    Expected Deliverable: <strong className="text-slate-700 dark:text-slate-300">{req.deliverable}</strong>
                  </p>
                )}

                {/* Linked Tasks */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                    Linked Tasks ({req.tasks?.length || 0}):
                  </span>
                  <div className="space-y-1.5">
                    {(req.tasks || []).map((t: any) => (
                      <Link
                        key={t.id}
                        href={`/tasks/${t.id}`}
                        className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 text-xs flex items-center justify-between transition-colors block"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-slate-500">{t.taskId}</span>
                          <span className="font-medium text-slate-900 dark:text-white">{t.title}</span>
                        </div>
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                          t.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {t.status}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 3: Revisions & AI Diff */}
      {activeTab === 'revisions' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Document Revision & Change Detection (Section 12)</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Paste revised document specification to compare against version {document.version}. The AI will identify Added, Modified, and Removed requirements, and flag existing tasks affected by modifications.
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Revised Specification Content (e.g. Version {parseFloat(document.version || '1.0') + 0.1})
            </label>
            <textarea
              rows={6}
              value={revisedContent}
              onChange={e => setRevisedContent(e.target.value)}
              placeholder="Paste updated document text or revised requirements here..."
              className="w-full p-3 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                // Populate realistic revision test data
                setRevisedContent(`${document.rawContent}

## Section 3.6: Instant Refund Webhook Processing (Added Requirement)
Every refund request must be processed within 5 seconds and emit refund.processed events to Kafka.
Deliverable: Automated refund worker and telemetry monitor.

## Section 3.2: Payment Gateway Integration (Modified Requirement)
Updated requirement: Must also support Apple Pay, Google Pay, and UPI auto-debit recurring mandates.
Deliverable: Updated checkout SDK and recurring token storage.`);
              }}
              className="text-xs text-brand-600 hover:underline"
            >
              Load Sample Revised Document (v1.1)
            </button>

            <button
              onClick={handleCompare}
              disabled={comparing || !revisedContent.trim()}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-brand-600 hover:bg-brand-700 text-white transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              <GitCompare className="w-3.5 h-3.5" />
              <span>{comparing ? 'Analyzing Revision...' : 'Run AI Revision Comparison'}</span>
            </button>
          </div>

          {diffError && (
            <div className="p-3 rounded-lg bg-rose-50 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{diffError}</span>
            </div>
          )}

          {/* Diff Results Table */}
          {diffResult && (
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-4">
              <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-xs text-indigo-700 dark:text-indigo-300 font-medium">
                {diffResult.summary}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-500 font-bold uppercase text-[10px]">
                      <th className="py-2.5 px-3">Change Type</th>
                      <th className="py-2.5 px-3">Requirement Title</th>
                      <th className="py-2.5 px-3">Section</th>
                      <th className="py-2.5 px-3">Description of Change</th>
                      <th className="py-2.5 px-3">Affected Tasks</th>
                      <th className="py-2.5 px-3">Recommendation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {diffResult.diffs.map((d: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            d.changeType === 'Added'
                              ? 'bg-emerald-100 text-emerald-700'
                              : d.changeType === 'Modified'
                              ? 'bg-amber-100 text-amber-700'
                              : d.changeType === 'Removed'
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            {d.changeType}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">
                          {d.requirementTitle}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500">{d.section}</td>
                        <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300 max-w-xs">{d.description}</td>
                        <td className="py-2.5 px-3 font-bold text-center">
                          {d.affectedTaskCount > 0 ? (
                            <span className="text-amber-600">{d.affectedTaskCount} task(s)</span>
                          ) : (
                            <span className="text-slate-400">0</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500 text-[11px] max-w-xs">{d.recommendation}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
