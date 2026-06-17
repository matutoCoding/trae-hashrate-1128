export interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  status: 'available' | 'booked' | 'occupied' | 'released';
}

export interface Booking {
  id: string;
  studioId: string;
  studioName: string;
  userId: string;
  userName: string;
  userPhone: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  totalAmount: number;
  deposit: number;
  status: 'pending' | 'confirmed' | 'checked_in' | 'completed' | 'cancelled' | 'released';
  paymentStatus: 'unpaid' | 'paid' | 'refunded' | 'partial_refund';
  bookedAt: string;
  checkedInAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  releasedAt?: string;
  releaseReason?: 'timeout' | 'user_cancel' | 'system';
  photographerId?: string;
  photographerName?: string;
  remark?: string;
  equipments: {
    id: string;
    name: string;
    quantity: number;
  }[];
}

export type BookingStatus = Booking['status'];
export type PaymentStatus = Booking['paymentStatus'];
export type ReleaseReason = Booking['releaseReason'];

export const BOOKING_STATUS_TEXT: Record<BookingStatus, string> = {
  pending: '待确认',
  confirmed: '已预约',
  checked_in: '已签到',
  completed: '已完成',
  cancelled: '已取消',
  released: '已释放'
};

export const BOOKING_STATUS_COLOR: Record<BookingStatus, string> = {
  pending: '#D97706',
  confirmed: '#2563EB',
  checked_in: '#059669',
  completed: '#64748B',
  cancelled: '#94A3B8',
  released: '#DC2626'
};

export const PAYMENT_STATUS_TEXT: Record<PaymentStatus, string> = {
  unpaid: '待支付',
  paid: '已支付',
  refunded: '已退款',
  partial_refund: '部分退款'
};

export const RELEASE_REASON_TEXT: Record<NonNullable<ReleaseReason>, string> = {
  timeout: '超时未到',
  user_cancel: '用户取消',
  system: '系统释放'
};
