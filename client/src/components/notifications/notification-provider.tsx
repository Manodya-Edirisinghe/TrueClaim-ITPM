'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { toast } from 'sonner';

const STORAGE_KEY = 'trueclaim_notifications';

type NotificationType = 'success' | 'info';

export type AppNotification = {
  id: string;
  message: string;
  type: NotificationType;
  timestamp: string;
  isRead: boolean;
};

type NotificationContextValue = {
  notifications: AppNotification[];
  unreadCount: number;
  addNotification: (message: string, type?: NotificationType) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
};

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

function readStoredNotifications(): AppNotification[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as AppNotification[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  useEffect(() => {
    setNotifications(readStoredNotifications());
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  }, [notifications]);

  const addNotification = useCallback((message: string, type: NotificationType = 'info') => {
    const next: AppNotification = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      message,
      type,
      timestamp: new Date().toISOString(),
      isRead: false,
    };

    setNotifications((prev) => [next, ...prev]);

    if (type === 'success') {
      toast.success(message, { duration: 3000 });
    } else {
      toast.info(message, { duration: 3000 });
    }
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((entry) => (entry.id === id ? { ...entry, isRead: true } : entry))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((entry) => ({ ...entry, isRead: true })));
  }, []);

  const deleteNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((entry) => entry.id !== id));
  }, []);

  const value = useMemo<NotificationContextValue>(() => {
    const unreadCount = notifications.filter((entry) => !entry.isRead).length;

    return {
      notifications,
      unreadCount,
      addNotification,
      markAsRead,
      markAllAsRead,
      deleteNotification,
    };
  }, [notifications, addNotification, markAsRead, markAllAsRead, deleteNotification]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications(): NotificationContextValue {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
}
