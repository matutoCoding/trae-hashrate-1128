import { create } from 'zustand';
import { StandbyRecord, StandbyNotification } from '@/types/standby';
import {
  mockStandbyRecords,
  mockStandbyNotifications,
  getActiveStandby,
  getStandbyByStudio,
  getStandbyByUser,
  getUnreadNotifications
} from '@/data/standby';

interface StandbyState {
  standbyRecords: StandbyRecord[];
  notifications: StandbyNotification[];
  loading: boolean;
  currentStandby: StandbyRecord | null;

  fetchStandbyRecords: () => Promise<void>;
  fetchStandbyByStudio: (studioId: string, date?: string) => Promise<void>;
  fetchStandbyByUser: (userId: string) => Promise<void>;
  fetchNotifications: () => Promise<void>;
  createStandby: (data: Partial<StandbyRecord>) => Promise<StandbyRecord>;
  confirmStandby: (standbyId: string) => Promise<boolean>;
  cancelStandby: (standbyId: string) => Promise<boolean>;
  notifyNextStandby: (studioId: string, date: string, startTime: string) => Promise<StandbyRecord | null>;
  markNotificationRead: (notificationId: string) => void;
  markAllNotificationsRead: () => void;
  getUnreadCount: () => number;
}

export const useStandbyStore = create<StandbyState>((set, get) => ({
  standbyRecords: [],
  notifications: [],
  loading: false,
  currentStandby: null,

  fetchStandbyRecords: async () => {
    set({ loading: true });
    await new Promise(resolve => setTimeout(resolve, 300));
    set({ standbyRecords: getActiveStandby(), loading: false });
    console.log('[StandbyStore] 候补队列加载完成，共', getActiveStandby().length, '条');
  },

  fetchStandbyByStudio: async (studioId: string, date?: string) => {
    set({ loading: true });
    await new Promise(resolve => setTimeout(resolve, 200));
    const records = getStandbyByStudio(studioId, date);
    set({ standbyRecords: records, loading: false });
    console.log('[StandbyStore] 影棚候补队列加载完成:', studioId, date, '共', records.length, '条');
  },

  fetchStandbyByUser: async (userId: string) => {
    set({ loading: true });
    await new Promise(resolve => setTimeout(resolve, 200));
    const records = getStandbyByUser(userId);
    set({ standbyRecords: records, loading: false });
    console.log('[StandbyStore] 用户候补记录加载完成，共', records.length, '条');
  },

  fetchNotifications: async () => {
    set({ loading: true });
    await new Promise(resolve => setTimeout(resolve, 200));
    set({
      notifications: [...mockStandbyNotifications].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
      loading: false
    });
  },

  createStandby: async (data: Partial<StandbyRecord>) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    const existingQueue = getStandbyByStudio(data.studioId!, data.date!);
    const newPosition = existingQueue.length > 0
      ? Math.max(...existingQueue.map(s => s.queuePosition)) + 1
      : 1;

    const newStandby: StandbyRecord = {
      id: `sb-${Date.now()}`,
      studioId: data.studioId || '',
      studioName: data.studioName || '',
      userId: 'user-current',
      userName: data.userName || '当前用户',
      userPhone: data.userPhone || '',
      date: data.date || '',
      startTime: data.startTime || '',
      endTime: data.endTime || '',
      queuePosition: newPosition,
      status: 'waiting',
      createdAt: new Date().toISOString(),
      validDuration: 15
    };
    set(state => ({ standbyRecords: [newStandby, ...state.standbyRecords] }));
    console.log('[StandbyStore] 创建候补成功:', newStandby.id, '队列位置:', newPosition);
    return newStandby;
  },

  confirmStandby: async (standbyId: string) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    set(state => ({
      standbyRecords: state.standbyRecords.map(s =>
        s.id === standbyId
          ? { ...s, status: 'confirmed', confirmedAt: new Date().toISOString() }
          : s
      )
    }));
    console.log('[StandbyStore] 候补确认成功:', standbyId);
    return true;
  },

  cancelStandby: async (standbyId: string) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    set(state => ({
      standbyRecords: state.standbyRecords.map(s =>
        s.id === standbyId
          ? { ...s, status: 'cancelled', cancelledAt: new Date().toISOString() }
          : s
      )
    }));
    console.log('[StandbyStore] 候补取消成功:', standbyId);
    return true;
  },

  notifyNextStandby: async (studioId: string, date: string, startTime: string) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const queue = getStandbyByStudio(studioId, date)
      .filter(s => s.startTime === startTime && s.status === 'waiting')
      .sort((a, b) => a.queuePosition - b.queuePosition);

    if (queue.length === 0) {
      console.log('[StandbyStore] 无待通知的候补用户');
      return null;
    }

    const nextStandby = queue[0];
    set(state => ({
      standbyRecords: state.standbyRecords.map(s =>
        s.id === nextStandby.id
          ? { ...s, status: 'notified', notifiedAt: new Date().toISOString() }
          : s
      )
    }));

    const newNotification: StandbyNotification = {
      id: `notif-${Date.now()}`,
      standbyId: nextStandby.id,
      studioName: nextStandby.studioName,
      date: nextStandby.date,
      time: `${nextStandby.startTime}-${nextStandby.endTime}`,
      message: `${nextStandby.studioName} ${nextStandby.date} ${nextStandby.startTime}-${nextStandby.endTime} 时段有空位，请在15分钟内确认`,
      read: false,
      createdAt: new Date().toISOString()
    };
    set(state => ({ notifications: [newNotification, ...state.notifications] }));

    console.log('[StandbyStore] 已通知候补用户:', nextStandby.userName, '位置:', nextStandby.queuePosition);
    return nextStandby;
  },

  markNotificationRead: (notificationId: string) => {
    set(state => ({
      notifications: state.notifications.map(n =>
        n.id === notificationId ? { ...n, read: true } : n
      )
    }));
  },

  markAllNotificationsRead: () => {
    set(state => ({
      notifications: state.notifications.map(n => ({ ...n, read: true }))
    }));
  },

  getUnreadCount: () => {
    return get().notifications.filter(n => !n.read).length;
  }
}));
