import { StandbyRecord, StandbyNotification } from '@/types/standby';
import { formatDate, formatDateTime } from '@/utils/date';

const today = formatDate(new Date());

export const mockStandbyRecords: StandbyRecord[] = [
  {
    id: 'sb-001',
    studioId: 'studio-001',
    studioName: '光影一号棚',
    userId: 'user-010',
    userName: '郑十一',
    userPhone: '131****9999',
    date: today,
    startTime: '18:00',
    endTime: '21:00',
    queuePosition: 1,
    status: 'notified',
    createdAt: '2025-06-16 20:00:00',
    notifiedAt: formatDateTime(new Date()),
    validDuration: 15,
    originalBookingId: 'bk-003'
  },
  {
    id: 'sb-002',
    studioId: 'studio-001',
    studioName: '光影一号棚',
    userId: 'user-011',
    userName: '冯十二',
    userPhone: '130****0000',
    date: today,
    startTime: '18:00',
    endTime: '21:00',
    queuePosition: 2,
    status: 'waiting',
    createdAt: '2025-06-16 21:30:00',
    validDuration: 15
  },
  {
    id: 'sb-003',
    studioId: 'studio-002',
    studioName: '星空二号棚',
    userId: 'user-012',
    userName: '陈十三',
    userPhone: '159****1111',
    date: today,
    startTime: '19:00',
    endTime: '22:00',
    queuePosition: 1,
    status: 'waiting',
    createdAt: '2025-06-17 08:00:00',
    validDuration: 15
  },
  {
    id: 'sb-004',
    studioId: 'studio-005',
    studioName: '简约五号棚',
    userId: 'user-013',
    userName: '褚十四',
    userPhone: '158****2222',
    date: today,
    startTime: '14:00',
    endTime: '17:00',
    queuePosition: 1,
    status: 'confirmed',
    createdAt: '2025-06-16 10:00:00',
    notifiedAt: '2025-06-17 08:30:00',
    confirmedAt: '2025-06-17 08:35:00',
    validDuration: 15
  },
  {
    id: 'sb-005',
    studioId: 'studio-001',
    studioName: '光影一号棚',
    userId: 'user-014',
    userName: '卫十五',
    userPhone: '157****3333',
    date: today,
    startTime: '09:00',
    endTime: '12:00',
    queuePosition: 1,
    status: 'expired',
    createdAt: '2025-06-15 14:00:00',
    notifiedAt: '2025-06-17 07:00:00',
    expiredAt: '2025-06-17 07:15:00',
    validDuration: 15
  },
  {
    id: 'sb-006',
    studioId: 'studio-004',
    studioName: '矩阵四号棚',
    userId: 'user-015',
    userName: '蒋十六',
    userPhone: '156****4444',
    date: formatDate(new Date(Date.now() + 86400000)),
    startTime: '10:00',
    endTime: '16:00',
    queuePosition: 1,
    status: 'waiting',
    createdAt: '2025-06-17 09:00:00',
    validDuration: 15
  }
];

export const mockStandbyNotifications: StandbyNotification[] = [
  {
    id: 'notif-001',
    standbyId: 'sb-001',
    studioName: '光影一号棚',
    date: today,
    time: '18:00-21:00',
    message: '光影一号棚 18:00-21:00 时段有空位，请在15分钟内确认',
    read: false,
    createdAt: formatDateTime(new Date())
  },
  {
    id: 'notif-002',
    standbyId: 'sb-004',
    studioName: '简约五号棚',
    date: today,
    time: '14:00-17:00',
    message: '简约五号棚 14:00-17:00 时段候补确认成功',
    read: true,
    createdAt: '2025-06-17 08:35:00'
  },
  {
    id: 'notif-003',
    standbyId: 'sb-005',
    studioName: '光影一号棚',
    date: today,
    time: '09:00-12:00',
    message: '候补确认超时，已自动取消',
    read: true,
    createdAt: '2025-06-17 07:15:00'
  }
];

export const getStandbyByStudio = (studioId: string, date?: string): StandbyRecord[] => {
  return mockStandbyRecords.filter(
    s => s.studioId === studioId && (!date || s.date === date)
  ).sort((a, b) => a.queuePosition - b.queuePosition);
};

export const getStandbyByUser = (userId: string): StandbyRecord[] => {
  return mockStandbyRecords.filter(s => s.userId === userId);
};

export const getActiveStandby = (): StandbyRecord[] => {
  return mockStandbyRecords.filter(s => s.status === 'waiting' || s.status === 'notified');
};

export const getUnreadNotifications = (): StandbyNotification[] => {
  return mockStandbyNotifications.filter(n => !n.read);
};
