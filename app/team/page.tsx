'use client';

import React, { useState, useEffect } from 'react';
import {
  Users2,
  Plus,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  UserPlus,
  X,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { useApp } from '@/components/AppContext';

export default function TeamPage() {
  const { currentUser, refreshKey, refreshAppData } = useApp();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'MANAGER' | 'USER'>('USER');
  const [department, setDepartment] = useState('');
  const [designation, setDesignation] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/team');
      const data = await res.json();
      if (data.users) setUsers(data.users);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [refreshKey]);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, role, department, designation }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add user.');

      setShowModal(false);
      setName('');
      setEmail('');
      setDepartment('');
      setDesignation('');
      fetchUsers();
      refreshAppData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (u: any) => {
    if (currentUser?.role !== 'ADMIN') {
      alert('Only Administrators can activate or deactivate users.');
      return;
    }

    try {
      const res = await fetch('/api/team', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: u.id, isActive: !u.isActive }),
      });
      if (res.ok) fetchUsers();
    } catch (e) {
      console.error(e);
    }
  };

  const handleRoleChange = async (u: any, newRole: string) => {
    if (currentUser?.role !== 'ADMIN') {
      alert('Only Administrators can assign user roles.');
      return;
    }

    try {
      const res = await fetch('/api/team', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: u.id, role: newRole }),
      });
      if (res.ok) {
        fetchUsers();
        refreshAppData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Team Members & Role-Based Access
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            User management, permission governance (Administrator, Manager, User/Employee), and individual delivery velocity
          </p>
        </div>
        {currentUser?.role === 'ADMIN' && (
          <button
            onClick={() => setShowModal(true)}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-brand-600 hover:bg-brand-700 text-white shadow-sm transition-all shadow-brand-500/20 flex items-center gap-1.5 self-start sm:self-auto"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add User</span>
          </button>
        )}
      </div>

      {/* Team Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-3 py-12 text-center text-xs text-slate-400">Loading team members...</div>
        ) : (
          users.map(u => (
            <div
              key={u.id}
              className={`p-6 rounded-2xl bg-white dark:bg-slate-900 border transition-all ${
                u.isActive
                  ? 'border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md'
                  : 'border-slate-200 dark:border-slate-800 opacity-60 bg-slate-50'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <img
                    src={u.avatar || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150'}
                    alt=""
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-brand-500/20"
                  />
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">{u.name}</h3>
                    <p className="text-xs text-slate-400">{u.designation || u.email}</p>
                    <span className="font-mono text-[10px] text-slate-400">{u.userId}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleToggleActive(u)}
                  title={u.isActive ? 'Deactivate user' : 'Activate user'}
                  className="text-slate-400 hover:text-slate-700"
                >
                  {u.isActive ? (
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                      Active
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                      Inactive
                    </span>
                  )}
                </button>
              </div>

              {/* Role Selector & Department */}
              <div className="flex items-center justify-between text-xs py-2 border-y border-slate-100 dark:border-slate-800 mb-4">
                <span className="text-slate-500">System Role:</span>
                {currentUser?.role === 'ADMIN' ? (
                  <select
                    value={u.role}
                    onChange={e => handleRoleChange(u, e.target.value)}
                    className="text-xs font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border-none focus:ring-1 focus:ring-brand-500 cursor-pointer"
                  >
                    <option value="ADMIN">ADMIN</option>
                    <option value="MANAGER">MANAGER</option>
                    <option value="USER">USER / EMPLOYEE</option>
                  </select>
                ) : (
                  <span className="font-bold text-slate-800 dark:text-slate-200">{u.role}</span>
                )}
              </div>

              {/* Performance Metrics */}
              <div className="grid grid-cols-4 gap-2 text-center p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-xs">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase">Tasks</span>
                  <p className="font-bold text-slate-900 dark:text-white">{u.stats?.totalTasks || 0}</p>
                </div>
                <div>
                  <span className="text-emerald-500 text-[10px] uppercase">Done</span>
                  <p className="font-bold text-emerald-600">{u.stats?.completedTasks || 0}</p>
                </div>
                <div>
                  <span className="text-blue-500 text-[10px] uppercase">Active</span>
                  <p className="font-bold text-blue-600">{u.stats?.inProgressTasks || 0}</p>
                </div>
                <div>
                  <span className="text-rose-500 text-[10px] uppercase">Late</span>
                  <p className="font-bold text-rose-600">{u.stats?.overdueTasks || 0}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add User Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Add New User Account</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddUser} className="p-6 space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-rose-50 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Maya Lin"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="maya@portal.com"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Role</label>
                  <select
                    value={role}
                    onChange={e => setRole(e.target.value as any)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="USER">User / Employee</option>
                    <option value="MANAGER">Manager</option>
                    <option value="ADMIN">Administrator</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Designation
                  </label>
                  <input
                    type="text"
                    value={designation}
                    onChange={e => setDesignation(e.target.value)}
                    placeholder="e.g. Lead QA Engineer"
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
                  {submitting ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
