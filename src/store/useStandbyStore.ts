import { create } from 'zustand';
import { StandbyRecord, StandbyNotification } from '@/types/standby';
import {
  mockStandbyRecords,
  mockStandbyNotifications
} from '@/data/standby';

interface StandbyState {
  standbyRecords: StandbyRecord[];
  notifications: StandbyNotification[];
  loading: boolean;
  currentStandby: StandbyRecord | null;
  initialized: boolean;

  initStandby: () => void;
  fetchStandbyRecords: () => Promise<void>;
  fetchStandbyByStudio: (studioId: string, date?: string) => Promise<StandbyRecord[]>;
  fetchStandbyByUser: (userId: string) => Promise<StandbyRecord[]>;
  fetchNotifications: () => Promise<void>;
  createStandby: (data: Partial<StandbyRecord>) => Promise<StandbyRecord>;
  confirmStandby: (standbyId: string) => Promise<boolean>;
  cancelStandby: (standbyId: string) => Promise<boolean>;
  notifyNextStandby: (studioId: string, date: string, startTime: string) => Promise<StandbyRecord | null>;
  markNotificationRead: (notificationId: string) => void;
  markAllNotificationsRead: () => void;
  getUnreadCount: () => number;
  getQueuePosition: (studioId: string, date: string, startTime: string, userId: string) => number;
  getUserQueuePositions: (userId: string) => { standbyId: string; position: number; total: number }[];
  expireStandby: (standbyId: string) => boolean;
  checkAndExpireNotifications: () => StandbyRecord[];
}

export const useStandbyStore = create<StandbyState>((set, get) => ({
  standbyRecords: [],
  notifications: [],
  loading: false,
  currentStandby: null,
  initialized: false,

  initStandby: () => {
    if (get().initialized) return;
    set({
      standbyRecords: [...mockStandbyRecords],
      notifications: [...mockStandbyNotifications],
      initialized: true
    });
    console.log('[StandbyStore] 初始化候补数据，共', mockStandbyRecords.length, '条候补，', mockStandbyNotifications.length, '条通知');
  },

  fetchStandbyRecords: async () => {
    const { initialized, initStandby } = get();
    if (!initialized) {
      initStandby();
    }
    set({ loading: true });
    await new Promise(resolve => setTimeout(resolve, 200));
    set({ loading: false });
    console.log('[StandbyStore] 候补队列加载完成，共', get().standbyRecords.length, '条');
  },

  fetchStandbyByStudio: async (studioId: string, date?: string) => {
    const { initialized, initStandby, standbyRecords } = get();
    if (!initialized) {
      initStandby();
    }
    set({ loading: true });
    await new Promise(resolve => setTimeout(resolve, 150));
    const records = standbyRecords.filter(
      s => s.studioId === studioId && (!date || s.date === date)
    ).sort((a, b) => a.queuePosition - b.queuePosition);
    set({ loading: false });
    console.log('[StandbyStore] 影棚候补队列加载完成:', studioId, date, '共', records.length, '条');
    return records;
  },

  fetchStandbyByUser: async (userId: string) => {
    const { initialized, initStandby, standbyRecords } = get();
    if (!initialized) {
      initStandby();
    }
    set({ loading: true });
    await new Promise(resolve => setTimeout(resolve, 150));
    const records = standbyRecords.filter(s => s.userId === userId);
    set({ loading: false });
    console.log('[StandbyStore] 用户候补记录加载完成，共', records.length, '条');
    return records;
  },

  fetchNotifications: async () => {
    const { initialized, initStandby } = get();
    if (!initialized) {
      initStandby();
    }
    set({ loading: true });
    await new Promise(resolve => setTimeout(resolve, 150));
    set(state => ({
      notifications: [...state.notifications].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
      loading: false
    }));
  },

  createStandby: async (data: Partial<StandbyRecord>) => {
    const { initialized, initStandby, standbyRecords } = get();
    if (!initialized) {
      initStandby();
    }

    await new Promise(resolve => setTimeout(resolve, 400));

    const existingQueue = standbyRecords.filter(
      s => s.studioId === data.studioId && s.date === data.date &&
           s.startTime === data.startTime &&
           (s.status === 'waiting' || s.status === 'notified')
    );

    const newPosition = existingQueue.length > 0
      ? Math.max(...existingQueue.map(s => s.queuePosition)) + 1
      : 1;

    const newStandby: StandbyRecord = {
      id: `sb-${Date.now()}`,
      studioId: data.studioId || '',
      studioName: data.studioName || '',
      userId: 'user-current',
      userName: data.userName || '当前用户',
      userPhone: data.userPhone || '138****8888',
      date: data.date || '',
      startTime: data.startTime || '',
      endTime: data.endTime || '',
      queuePosition: newPosition,
      status: 'waiting',
      createdAt: new Date().toISOString(),
      validDuration: 15
    };

    set(state => ({
      standbyRecords: [...state.standbyRecords, newStandby]
    }));

    console.log('[StandbyStore] 创建候补成功:', newStandby.id, '队列位置:', newPosition);
    return newStandby;
  },

  confirmStandby: async (standbyId: string) => {
    const { initialized, initStandby } = get();
    if (!initialized) {
      initStandby();
    }

    await new Promise(resolve => setTimeout(resolve, 200));

    let confirmedStandby: StandbyRecord | null = null;

    set(state => {
      const updated = state.standbyRecords.map(s => {
        if (s.id === standbyId) {
          confirmedStandby = {
            ...s,
            status: 'confirmed',
            confirmedAt: new Date().toISOString()
          };
          return confirmedStandby;
        }
        return s;
      });

      if (confirmedStandby) {
        const othersToAdvance = updated.filter(
          s => s.studioId === confirmedStandby!.studioId &&
               s.date === confirmedStandby!.date &&
               s.startTime === confirmedStandby!.startTime &&
               s.status === 'waiting' &&
               s.queuePosition > confirmedStandby!.queuePosition
        );

        if (othersToAdvance.length > 0) {
          return {
            standbyRecords: updated.map(s => {
              if (othersToAdvance.some(o => o.id === s.id)) {
                return { ...s, queuePosition: s.queuePosition - 1 };
              }
              return s;
            })
          };
        }
      }

      return { standbyRecords: updated };
    });

    console.log('[StandbyStore] 候补确认成功:', standbyId);
    return true;
  },

  cancelStandby: async (standbyId: string) => {
    const { initialized, initStandby } = get();
    if (!initialized) {
      initStandby();
    }

    await new Promise(resolve => setTimeout(resolve, 200));

    let cancelledStandby: StandbyRecord | null = null;

    set(state => {
      const updated = state.standbyRecords.map(s => {
        if (s.id === standbyId) {
          cancelledStandby = {
            ...s,
            status: 'cancelled',
            cancelledAt: new Date().toISOString()
          };
          return cancelledStandby;
        }
        return s;
      });

      if (cancelledStandby && (cancelledStandby.status === 'waiting' || cancelledStandby.status === 'notified')) {
        const cancelledPos = cancelledStandby.queuePosition;
        const sameQueue = updated.filter(
          s => s.studioId === cancelledStandby!.studioId &&
               s.date === cancelledStandby!.date &&
               s.startTime === cancelledStandby!.startTime &&
               s.status === 'waiting' &&
               s.queuePosition > cancelledPos
        );

        if (sameQueue.length > 0) {
          return {
            standbyRecords: updated.map(s => {
              if (sameQueue.some(o => o.id === s.id)) {
                return { ...s, queuePosition: s.queuePosition - 1 };
              }
              return s;
            })
          };
        }
      }

      return { standbyRecords: updated };
    });

    console.log('[StandbyStore] 候补取消成功:', standbyId);
    return true;
  },

  expireStandby: (standbyId: string): boolean => {
    let expired = false;

    set(state => {
      const updated: StandbyRecord[] = state.standbyRecords.map(s => {
        if (s.id === standbyId && s.status === 'notified') {
          expired = true;
          return {
            ...s,
            status: 'expired' as const,
            expiredAt: new Date().toISOString()
          };
        }
        return s;
      });

      if (expired) {
        const expiredRecord = updated.find(s => s.id === standbyId)!;
        const expiredPos = expiredRecord.queuePosition;

        const advanced = updated.map(s => {
          if (s.status === 'waiting' &&
              s.studioId === expiredRecord.studioId &&
              s.date === expiredRecord.date &&
              s.startTime === expiredRecord.startTime &&
              s.queuePosition > expiredPos) {
            return { ...s, queuePosition: s.queuePosition - 1 };
          }
          return s;
        });
        return { standbyRecords: advanced };
      }

      return { standbyRecords: updated };
    });

    if (expired) {
      console.log('[StandbyStore] 候补已过期:', standbyId);
    }
    return expired;
  },

  notifyNextStandby: async (studioId: string, date: string, startTime: string) => {
    const { initialized, initStandby, standbyRecords } = get();
    if (!initialized) {
      initStandby();
    }

    await new Promise(resolve => setTimeout(resolve, 200));

    const queue = standbyRecords
      .filter(s =>
        s.studioId === studioId &&
        s.date === date &&
        s.startTime === startTime &&
        s.status === 'waiting'
      )
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

    set(state => ({
      notifications: [newNotification, ...state.notifications]
    }));

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
  },

  getQueuePosition: (studioId: string, date: string, startTime: string, userId: string): number => {
    const record = get().standbyRecords.find(
      s => s.studioId === studioId && s.date === date &&
           s.startTime === startTime && s.userId === userId &&
           (s.status === 'waiting' || s.status === 'notified')
    );
    return record?.queuePosition || -1;
  },

  getUserQueuePositions: (userId: string): { standbyId: string; position: number; total: number }[] => {
    const { standbyRecords } = get();
    const userRecords = standbyRecords.filter(
      s => s.userId === userId && (s.status === 'waiting' || s.status === 'notified')
    );

    return userRecords.map(record => {
      const totalInQueue = standbyRecords.filter(
        s => s.studioId === record.studioId &&
             s.date === record.date &&
             s.startTime === record.startTime &&
             (s.status === 'waiting' || s.status === 'notified')
      ).length;

      return {
        standbyId: record.id,
        position: record.queuePosition,
        total: totalInQueue
      };
    });
  },

  checkAndExpireNotifications: (): StandbyRecord[] => {
    const { initialized, initStandby, standbyRecords } = get();
    if (!initialized) {
      initStandby();
      return [];
    }

    const now = new Date();
    const expired: StandbyRecord[] = [];

    standbyRecords.forEach(record => {
      if (record.status === 'notified' && record.notifiedAt) {
        const notifiedTime = new Date(record.notifiedAt);
        const diffMinutes = (now.getTime() - notifiedTime.getTime()) / (1000 * 60);
        if (diffMinutes >= record.validDuration) {
          expired.push(record);
        }
      }
    });

    if (expired.length > 0) {
      expired.forEach(e => get().expireStandby(e.id));
    }

    return expired;
  }
}));
