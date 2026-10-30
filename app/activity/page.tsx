'use client';

import React, { useState, useEffect } from 'react';
import {
  History,
  Activity,
  User,
  Filter,
  CheckCircle2,
  FileText,
  CheckSquare,
  Sparkles,
} from 'lucide-react';

export default function ActivityPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [entityType, setEntityType] = useState('ALL');

  useEffect(() => {
    setLoading(true);
    const query = entityType !== 'ALL' ? `?entityType=${entityType}&limit=100` : '?limit=100';
    fetch(`/api/activity${query}`)
      .then(res => res.json())
      .then(d => {
        if (d.logs) setLogs(d.logs);
      })
      .finally(() => setLoading(false));
  }, [entityType]);

  const getEntityIcon = (type: string) => {
    switch (type) {
      case 'TASK':
        return <CheckSquare className="w-4 h-4 text-brand-600" />;
      case 'DOCUMENT':
        return <FileText className="w-4 h-4 text-purple-600" />;
      case 'REQUIREMENT':
        return <Sparkles className="w-4 h-4 text-indigo-600" />;
      case 'PROJECT':
        return <Activity className="w-4 h-4 text-emerald-600" />;
      default:
        return <User className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <History className="w-6 h-6 text-brand-600" />
            <span>System Activity & Audit Log</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Immutable audit trail of task creations, status transitions, priority elevations, and document processing
          </p>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={entityType}
            onChange={e => setEntityType(e.target.value)}
            className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
          >
            <option value="ALL">All Event Types</option>
            <option value="TASK">Task Operations</option>
            <option value="DOCUMENT">Document Operations</option>
            <option value="REQUIREMENT">AI Requirements</option>
            <option value="PROJECT">Project Changes</option>
            <option value="USER">User Account Events</option>
          </select>
        </div>
      </div>

      {/* Logs Timeline */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4">
        {loading ? (
          <div className="text-center py-12 text-xs text-slate-400">Loading audit records...</div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12 text-xs text-slate-400">No events found in audit log.</div>
        ) : (
          <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
            {logs.map(log => (
              <div key={log.id} className="relative group">
                {/* Dot */}
                <div className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-white dark:bg-slate-900 border-2 border-brand-500 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-500" />
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 hover:bg-slate-100 transition-colors">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <div className="flex items-center gap-2">
                      {getEntityIcon(log.entityType)}
                      <span className="font-bold text-slate-900 dark:text-white">{log.action}</span>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {new Date(log.createdAt).toLocaleDateString()} {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {log.details && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">{log.details}</p>
                  )}

                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-200/40 dark:border-slate-700/40 text-[11px] text-slate-400">
                    <span>Performed by:</span>
                    <strong className="text-slate-700 dark:text-slate-300">{log.user?.name || 'System Automation'}</strong>
                    {log.user?.role && (
                      <span className="px-1.5 py-0.2 rounded uppercase tracking-wider text-[9px] bg-slate-200 dark:bg-slate-700">
                        {log.user.role}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
