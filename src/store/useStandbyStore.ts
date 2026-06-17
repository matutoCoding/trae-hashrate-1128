import { create } from 'zustand';
import { StandbyRecord, StandbyNotification, SlotFlowEvent } from '@/types/standby';
import {
  mockStandbyRecords,
  mockStandbyNotifications
} from '@/data/standby';

interface StandbyState {
  standbyRecords: StandbyRecord[];
  notifications: StandbyNotification[];
  slotFlowEvents: SlotFlowEvent[];
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
  addSlotFlowEvent: (event: Omit<SlotFlowEvent, 'id' | 'createdAt'>) => void;
  getSlotFlowEvents: (studioId: string, date: string, startTime: string) => SlotFlowEvent[];
  getAllSlotFlowEvents: () => SlotFlowEvent[];
  getSlotCurrentHolder: (studioId: string, date: string, startTime: string) => { userId: string; userName: string; status: string } | null;
  getSlotFlowGroups: () => {
    key: string;
    studioId: string;
    studioName: string;
    date: string;
    startTime: string;
    endTime: string;
    events: SlotFlowEvent[];
    currentHolder: { userId: string; userName: string; status: string } | null;
    latestEventTime: string;
  }[];
}

export const useStandbyStore = create<StandbyState>((set, get) => ({
  standbyRecords: [],
  notifications: [],
  slotFlowEvents: [],
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
      const updated: StandbyRecord[] = state.standbyRecords.map(s => {
        if (s.id === standbyId) {
          const confirmed: StandbyRecord = {
            ...s,
            status: 'confirmed',
            confirmedAt: new Date().toISOString()
          };
          confirmedStandby = confirmed;
          return confirmed;
        }
        return s;
      });

      if (confirmedStandby) {
        const cs = confirmedStandby;
        const othersToAdvance = updated.filter(
          s => s.studioId === cs.studioId &&
               s.date === cs.date &&
               s.startTime === cs.startTime &&
               (s.status === 'waiting' || s.status === 'notified') &&
               s.queuePosition > cs.queuePosition
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

    if (confirmedStandby) {
      const cs: StandbyRecord = confirmedStandby;
      get().addSlotFlowEvent({
        studioId: cs.studioId,
        studioName: cs.studioName,
        date: cs.date,
        startTime: cs.startTime,
        endTime: cs.endTime,
        eventType: 'confirmed',
        userId: cs.userId,
        userName: cs.userName,
        queuePosition: cs.queuePosition,
        description: `${cs.userName} 确认补位`
      });
    }

    return true;
  },

  cancelStandby: async (standbyId: string) => {
    const { initialized, initStandby } = get();
    if (!initialized) {
      initStandby();
    }

    await new Promise(resolve => setTimeout(resolve, 200));

    let cancelledStandby: StandbyRecord | null = null;
    let originalStatus: string | null = null;

    set(state => {
      const original = state.standbyRecords.find(s => s.id === standbyId);
      if (original) {
        originalStatus = original.status;
      }

      const updated: StandbyRecord[] = state.standbyRecords.map(s => {
        if (s.id === standbyId) {
          const cancelled: StandbyRecord = {
            ...s,
            status: 'cancelled',
            cancelledAt: new Date().toISOString()
          };
          cancelledStandby = cancelled;
          return cancelled;
        }
        return s;
      });

      if (cancelledStandby && (originalStatus === 'waiting' || originalStatus === 'notified')) {
        const cl = cancelledStandby;
        const cancelledPos = cl.queuePosition;
        const sameQueue = updated.filter(
          s => s.studioId === cl.studioId &&
               s.date === cl.date &&
               s.startTime === cl.startTime &&
               (s.status === 'waiting' || s.status === 'notified') &&
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

    if (cancelledStandby && originalStatus) {
      const cl: StandbyRecord = cancelledStandby;
      get().addSlotFlowEvent({
        studioId: cl.studioId,
        studioName: cl.studioName,
        date: cl.date,
        startTime: cl.startTime,
        endTime: cl.endTime,
        eventType: 'abandoned',
        userId: cl.userId,
        userName: cl.userName,
        queuePosition: cl.queuePosition,
        description: `${cl.userName} 放弃候补`
      });
    }

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
          if ((s.status === 'waiting' || s.status === 'notified') &&
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
      const expiredRecord = get().standbyRecords.find(s => s.id === standbyId);
      if (expiredRecord) {
        get().addSlotFlowEvent({
          studioId: expiredRecord.studioId,
          studioName: expiredRecord.studioName,
          date: expiredRecord.date,
          startTime: expiredRecord.startTime,
          endTime: expiredRecord.endTime,
          eventType: 'expired',
          userId: expiredRecord.userId,
          userName: expiredRecord.userName,
          queuePosition: expiredRecord.queuePosition,
          description: `${expiredRecord.userName} 通知超时，自动释放空位`
        });
      }
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

    get().addSlotFlowEvent({
      studioId: nextStandby.studioId,
      studioName: nextStandby.studioName,
      date: nextStandby.date,
      startTime: nextStandby.startTime,
      endTime: nextStandby.endTime,
      eventType: 'notified',
      userId: nextStandby.userId,
      userName: nextStandby.userName,
      queuePosition: nextStandby.queuePosition,
      description: `空位通知 ${nextStandby.userName}（排位第${nextStandby.queuePosition}）`
    });

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
  },

  addSlotFlowEvent: (event: Omit<SlotFlowEvent, 'id' | 'createdAt'>) => {
    const newEvent: SlotFlowEvent = {
      ...event,
      id: `sfe-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      createdAt: new Date().toISOString()
    };

    set(state => ({
      slotFlowEvents: [newEvent, ...state.slotFlowEvents]
    }));

    console.log('[StandbyStore] 空位流转事件:', event.eventType, event.description);
  },

  getSlotFlowEvents: (studioId: string, date: string, startTime: string): SlotFlowEvent[] => {
    return get().slotFlowEvents.filter(
      e => e.studioId === studioId && e.date === date && e.startTime === startTime
    ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  getAllSlotFlowEvents: (): SlotFlowEvent[] => {
    return get().slotFlowEvents.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  getSlotCurrentHolder: (studioId: string, date: string, startTime: string): { userId: string; userName: string; status: string } | null => {
    const { standbyRecords } = get();
    const notified = standbyRecords.find(
      s => s.studioId === studioId && s.date === date &&
           s.startTime === startTime && s.status === 'notified'
    );
    if (notified) {
      return { userId: notified.userId, userName: notified.userName, status: 'notified' };
    }

    const firstWaiting = standbyRecords
      .filter(s => s.studioId === studioId && s.date === date &&
                   s.startTime === startTime && s.status === 'waiting')
      .sort((a, b) => a.queuePosition - b.queuePosition)[0];
    if (firstWaiting) {
      return { userId: firstWaiting.userId, userName: firstWaiting.userName, status: 'waiting' };
    }

    return null;
  },

  getSlotFlowGroups: () => {
    const { slotFlowEvents } = get();
    const groups = new Map<string, {
      key: string;
      studioId: string;
      studioName: string;
      date: string;
      startTime: string;
      endTime: string;
      events: SlotFlowEvent[];
      currentHolder: { userId: string; userName: string; status: string } | null;
      latestEventTime: string;
    }>();

    slotFlowEvents.forEach(event => {
      const key = `${event.studioId}-${event.date}-${event.startTime}`;
      if (!groups.has(key)) {
        groups.set(key, {
          key,
          studioId: event.studioId,
          studioName: event.studioName,
          date: event.date,
          startTime: event.startTime,
          endTime: event.endTime,
          events: [],
          currentHolder: null,
          latestEventTime: event.createdAt
        });
      }
      const group = groups.get(key)!;
      group.events.push(event);
      if (new Date(event.createdAt).getTime() > new Date(group.latestEventTime).getTime()) {
        group.latestEventTime = event.createdAt;
      }
    });

    const result = Array.from(groups.values()).map(g => {
      g.events.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      g.currentHolder = get().getSlotCurrentHolder(g.studioId, g.date, g.startTime);
      return g;
    });

    return result.sort((a, b) =>
      new Date(b.latestEventTime).getTime() - new Date(a.latestEventTime).getTime()
    );
  }
}));
