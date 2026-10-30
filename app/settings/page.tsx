'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings,
  Key,
  Database,
  Moon,
  Sun,
  Shield,
  Save,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  ExternalLink,
  Globe,
} from 'lucide-react';
import { useApp } from '@/components/AppContext';

export default function SettingsPage() {
  const { currentUser, theme, toggleTheme, refreshAppData } = useApp();

  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [googleClientId, setGoogleClientId] = useState('');
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [appName, setAppName] = useState('Antigravity Task & Requirement Portal');

  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(d => {
        if (d.settings) {
          if (d.settings.GEMINI_API_KEY !== undefined) setGeminiApiKey(d.settings.GEMINI_API_KEY);
          if (d.settings.GOOGLE_DRIVE_CLIENT_ID !== undefined) setGoogleClientId(d.settings.GOOGLE_DRIVE_CLIENT_ID);
          if (d.settings.TIMEZONE !== undefined) setTimezone(d.settings.TIMEZONE);
          if (d.settings.APP_NAME !== undefined) setAppName(d.settings.APP_NAME);
        }
      });
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: {
            GEMINI_API_KEY: geminiApiKey.trim(),
            GOOGLE_DRIVE_CLIENT_ID: googleClientId.trim(),
            TIMEZONE: timezone,
            APP_NAME: appName,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save settings.');

      setMessage({ type: 'success', text: 'System settings saved successfully!' });
      refreshAppData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleResetDatabase = async () => {
    if (!confirm('Are you sure you want to re-seed the database? This will restore all standard projects, tasks, and requirement documents.')) {
      return;
    }

    setResetting(true);
    setMessage(null);

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset_database' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reset database.');

      setMessage({ type: 'success', text: 'Database reseeded successfully with full demonstration datasets!' });
      refreshAppData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <Settings className="w-6 h-6 text-brand-600" />
          <span>Administrative System Settings</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Configure AI LLM engines, Google OAuth credentials, database restoration, and user environment preferences
        </p>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center gap-2 border ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-900/60'
              : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:border-rose-900/60'
          }`}
        >
          {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Form Settings */}
      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Section 1: AI Integration Settings */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
            <Key className="w-4 h-4 text-brand-600" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">AI Engine Configuration (Google Gemini)</h2>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Google Gemini API Key
            </label>
            <input
              type="password"
              value={geminiApiKey}
              onChange={e => setGeminiApiKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full px-3 py-2 text-sm font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              If left blank, the portal automatically uses the built-in intelligent structural NLP heuristic analyzer so document extraction and task generation work completely out of the box!
            </p>
          </div>
        </div>

        {/* Section 2: Google Drive & OAuth Integration */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
            <Globe className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Google Drive & Docs Integration</h2>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Google OAuth 2.0 Client ID (Optional)
            </label>
            <input
              type="text"
              value={googleClientId}
              onChange={e => setGoogleClientId(e.target.value)}
              placeholder="apps.googleusercontent.com..."
              className="w-full px-3 py-2 text-sm font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Enables direct authorized Drive file selection picker and Google Docs REST API synchronization.
            </p>
          </div>
        </div>

        {/* Section 3: Timezone & Portal Preferences */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
            <Shield className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Portal Preferences & Theme</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Portal Application Name
              </label>
              <input
                type="text"
                value={appName}
                onChange={e => setAppName(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Display Timezone
              </label>
              <select
                value={timezone}
                onChange={e => setTimezone(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="Asia/Kolkata">Asia/Kolkata (IST +05:30)</option>
                <option value="UTC">UTC (Coordinated Universal Time)</option>
                <option value="America/New_York">America/New_York (EST / EDT)</option>
                <option value="Europe/London">Europe/London (GMT / BST)</option>
                <option value="Asia/Singapore">Asia/Singapore (SGT)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
          </button>
        </div>
      </form>

      {/* Section 4: Database Maintenance & Demo Reseed */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
          <Database className="w-4 h-4 text-rose-600" />
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Database Maintenance & Demo Datasets</h2>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400">
          Reset and re-seed the SQLite database with full demonstration data (Projects, Users, Requirement Documents, Tasks, Dependencies, Comments, and Notifications).
        </p>

        <button
          type="button"
          onClick={handleResetDatabase}
          disabled={resetting}
          className="px-4 py-2 text-xs font-semibold rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60 transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>{resetting ? 'Resetting Database...' : 'Reset & Reseed Demo Database'}</span>
        </button>
      </div>
    </div>
  );
}
