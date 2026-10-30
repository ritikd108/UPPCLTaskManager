'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface User {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'USER';
  department?: string;
  designation?: string;
  avatar?: string;
}

interface AppContextType {
  currentUser: User | null;
  availableUsers: User[];
  selectedProjectId: string; // 'ALL' or project id
  theme: 'light' | 'dark';
  unreadNotifications: number;
  isTaskModalOpen: boolean;
  isDocModalOpen: boolean;
  editingTask: any | null;
  setSelectedProjectId: (id: string) => void;
  switchUser: (userId: string) => Promise<void>;
  toggleTheme: () => void;
  openNewTaskModal: (task?: any) => void;
  closeTaskModal: () => void;
  openDocModal: () => void;
  closeDocModal: () => void;
  refreshAppData: () => void;
  refreshKey: number;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('ALL');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [unreadNotifications, setUnreadNotifications] = useState<number>(0);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState<boolean>(false);
  const [isDocModalOpen, setIsDocModalOpen] = useState<boolean>(false);
  const [editingTask, setEditingTask] = useState<any | null>(null);
  const [refreshKey, setRefreshKey] = useState<number>(0);

  const fetchAuth = async () => {
    try {
      const res = await fetch('/api/auth');
      const data = await res.json();
      if (data.currentUser) setCurrentUser(data.currentUser);
      if (data.availableUsers) setAvailableUsers(data.availableUsers);
    } catch (err) {
      console.error('Error fetching auth:', err);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      const data = await res.json();
      if (typeof data.unreadCount === 'number') {
        setUnreadNotifications(data.unreadCount);
      }
    } catch (err) {
      // ignore
    }
  };

  useEffect(() => {
    fetchAuth();
    fetchNotifications();
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    }
  }, [refreshKey]);

  const switchUser = async (userId: string) => {
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) {
        await fetchAuth();
        setRefreshKey(prev => prev + 1);
      }
    } catch (err) {
      console.error('Switch user error:', err);
    }
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
    document.documentElement.classList.toggle('dark', nextTheme === 'dark');
  };

  const openNewTaskModal = (task?: any) => {
    setEditingTask(task || null);
    setIsTaskModalOpen(true);
  };

  const closeTaskModal = () => {
    setEditingTask(null);
    setIsTaskModalOpen(false);
  };

  const openDocModal = () => setIsDocModalOpen(true);
  const closeDocModal = () => setIsDocModalOpen(false);

  const refreshAppData = () => setRefreshKey(prev => prev + 1);

  return (
    <AppContext.Provider
      value={{
        currentUser,
        availableUsers,
        selectedProjectId,
        theme,
        unreadNotifications,
        isTaskModalOpen,
        isDocModalOpen,
        editingTask,
        setSelectedProjectId,
        switchUser,
        toggleTheme,
        openNewTaskModal,
        closeTaskModal,
        openDocModal,
        closeDocModal,
        refreshAppData,
        refreshKey,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
