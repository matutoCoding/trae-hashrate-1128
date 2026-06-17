export interface StandbyRecord {
  id: string;
  studioId: string;
  studioName: string;
  userId: string;
  userName: string;
  userPhone: string;
  date: string;
  startTime: string;
  endTime: string;
  queuePosition: number;
  status: 'waiting' | 'notified' | 'confirmed' | 'expired' | 'cancelled';
  createdAt: string;
  notifiedAt?: string;
  confirmedAt?: string;
  expiredAt?: string;
  cancelledAt?: string;
  validDuration: number;
  originalBookingId?: string;
}

export type StandbyStatus = StandbyRecord['status'];

export const STANDBY_STATUS_TEXT: Record<StandbyStatus, string> = {
  waiting: '等待中',
  notified: '已通知',
  confirmed: '已确认',
  expired: '已过期',
  cancelled: '已取消'
};

export const STANDBY_STATUS_COLOR: Record<StandbyStatus, string> = {
  waiting: '#D97706',
  notified: '#2563EB',
  confirmed: '#059669',
  expired: '#64748B',
  cancelled: '#94A3B8'
};

export interface StandbyNotification {
  id: string;
  standbyId: string;
  studioName: string;
  date: string;
  time: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export type SlotFlowEventType = 'released' | 'notified' | 'confirmed' | 'abandoned' | 'expired' | 'timeout_released';

export interface SlotFlowEvent {
  id: string;
  studioId: string;
  studioName: string;
  date: string;
  startTime: string;
  endTime: string;
  eventType: SlotFlowEventType;
  userId?: string;
  userName?: string;
  queuePosition?: number;
  description: string;
  createdAt: string;
}

export const SLOT_FLOW_EVENT_TEXT: Record<SlotFlowEventType, string> = {
  released: '超时释放',
  notified: '通知候补',
  confirmed: '候补确认',
  abandoned: '主动放弃',
  expired: '通知超时',
  timeout_released: '超时自动释放'
};

export const SLOT_FLOW_EVENT_COLOR: Record<SlotFlowEventType, string> = {
  released: '#DC2626',
  notified: '#2563EB',
  confirmed: '#059669',
  abandoned: '#D97706',
  expired: '#64748B',
  timeout_released: '#94A3B8'
};

export const SLOT_FLOW_EVENT_ICON: Record<SlotFlowEventType, string> = {
  released: '🔓',
  notified: '📨',
  confirmed: '✅',
  abandoned: '🚫',
  expired: '⏰',
  timeout_released: '⏳'
};
