import { Booking, TimeSlot } from '@/types/booking';
import { formatDate } from '@/utils/date';

const today = formatDate(new Date());
const tomorrow = formatDate(new Date(Date.now() + 86400000));
const dayAfter = formatDate(new Date(Date.now() + 86400000 * 2));

export const mockBookings: Booking[] = [
  {
    id: 'bk-001',
    studioId: 'studio-001',
    studioName: '光影一号棚',
    userId: 'user-001',
    userName: '张三',
    userPhone: '138****1111',
    date: today,
    startTime: '09:00',
    endTime: '12:00',
    duration: 3,
    totalAmount: 1140,
    deposit: 500,
    status: 'confirmed',
    paymentStatus: 'paid',
    bookedAt: '2025-06-16 14:30:00',
    photographerId: 'p-001',
    photographerName: '李摄影师',
    equipments: [
      { id: 'eq-001', name: '神牛DP600II闪光灯', quantity: 4 }
    ]
  },
  {
    id: 'bk-002',
    studioId: 'studio-001',
    studioName: '光影一号棚',
    userId: 'user-002',
    userName: '李四',
    userPhone: '139****2222',
    date: today,
    startTime: '14:00',
    endTime: '17:00',
    duration: 3,
    totalAmount: 1140,
    deposit: 500,
    status: 'checked_in',
    paymentStatus: 'paid',
    bookedAt: '2025-06-15 10:20:00',
    checkedInAt: '2025-06-17 13:55:00',
    photographerId: 'p-002',
    photographerName: '王摄影师',
    equipments: []
  },
  {
    id: 'bk-003',
    studioId: 'studio-001',
    studioName: '光影一号棚',
    userId: 'user-003',
    userName: '王五',
    userPhone: '137****3333',
    date: today,
    startTime: '18:00',
    endTime: '21:00',
    duration: 3,
    totalAmount: 1140,
    deposit: 500,
    status: 'released',
    paymentStatus: 'partial_refund',
    bookedAt: '2025-06-16 09:15:00',
    releasedAt: formatDate(new Date(), 'YYYY-MM-DD HH:mm:ss'),
    releaseReason: 'timeout',
    equipments: [],
    remark: '超时15分钟未到，系统自动释放'
  },
  {
    id: 'bk-004',
    studioId: 'studio-002',
    studioName: '星空二号棚',
    userId: 'user-004',
    userName: '赵六',
    userPhone: '136****4444',
    date: today,
    startTime: '10:00',
    endTime: '13:00',
    duration: 3,
    totalAmount: 840,
    deposit: 300,
    status: 'completed',
    paymentStatus: 'paid',
    bookedAt: '2025-06-14 16:45:00',
    checkedInAt: '2025-06-17 09:58:00',
    completedAt: '2025-06-17 13:02:00',
    photographerId: 'p-001',
    photographerName: '李摄影师',
    equipments: []
  },
  {
    id: 'bk-005',
    studioId: 'studio-002',
    studioName: '星空二号棚',
    userId: 'user-005',
    userName: '钱七',
    userPhone: '135****5555',
    date: today,
    startTime: '14:00',
    endTime: '18:00',
    duration: 4,
    totalAmount: 1120,
    deposit: 300,
    status: 'confirmed',
    paymentStatus: 'paid',
    bookedAt: '2025-06-15 11:30:00',
    equipments: []
  },
  {
    id: 'bk-006',
    studioId: 'studio-004',
    studioName: '矩阵四号棚',
    userId: 'user-006',
    userName: '孙八',
    userPhone: '134****6666',
    date: tomorrow,
    startTime: '08:00',
    endTime: '18:00',
    duration: 10,
    totalAmount: 6800,
    deposit: 1000,
    status: 'confirmed',
    paymentStatus: 'paid',
    bookedAt: '2025-06-10 09:00:00',
    photographerId: 'p-003',
    photographerName: '陈摄影师',
    equipments: []
  },
  {
    id: 'bk-007',
    studioId: 'studio-005',
    studioName: '简约五号棚',
    userId: 'user-007',
    userName: '周九',
    userPhone: '133****7777',
    date: today,
    startTime: '09:00',
    endTime: '12:00',
    duration: 3,
    totalAmount: 540,
    deposit: 200,
    status: 'completed',
    paymentStatus: 'paid',
    bookedAt: '2025-06-16 08:00:00',
    checkedInAt: '2025-06-17 08:55:00',
    completedAt: '2025-06-17 12:05:00',
    equipments: []
  },
  {
    id: 'bk-008',
    studioId: 'studio-005',
    studioName: '简约五号棚',
    userId: 'user-008',
    userName: '吴十',
    userPhone: '132****8888',
    date: dayAfter,
    startTime: '13:00',
    endTime: '16:00',
    duration: 3,
    totalAmount: 540,
    deposit: 200,
    status: 'pending',
    paymentStatus: 'unpaid',
    bookedAt: '2025-06-17 08:30:00',
    equipments: []
  }
];

export const generateTimeSlots = (date: string, studioId: string): TimeSlot[] => {
  const slots: TimeSlot[] = [];
  const bookings = mockBookings.filter(
    b => b.studioId === studioId && b.date === date && b.status !== 'cancelled' && b.status !== 'released'
  );

  for (let hour = 8; hour < 22; hour++) {
    const startTime = `${String(hour).padStart(2, '0')}:00`;
    const endTime = `${String(hour + 1).padStart(2, '0')}:00`;

    const isBooked = bookings.some(b => {
      const startH = parseInt(b.startTime.split(':')[0]);
      const endH = parseInt(b.endTime.split(':')[0]);
      return hour >= startH && hour < endH;
    });

    const isReleased = mockBookings.some(b => {
      const startH = parseInt(b.startTime.split(':')[0]);
      const endH = parseInt(b.endTime.split(':')[0]);
      return b.studioId === studioId && b.date === date && b.status === 'released' && hour >= startH && hour < endH;
    });

    slots.push({
      id: `slot-${date}-${hour}`,
      startTime,
      endTime,
      status: isReleased ? 'released' : isBooked ? 'booked' : 'available'
    });
  }

  return slots;
};

export const getBookingById = (id: string): Booking | undefined => {
  return mockBookings.find(b => b.id === id);
};

export const getBookingsByStudio = (studioId: string, date?: string): Booking[] => {
  return mockBookings.filter(b => b.studioId === studioId && (!date || b.date === date));
};

export const getBookingsByUser = (userId: string): Booking[] => {
  return mockBookings.filter(b => b.userId === userId);
};

export const getReleasedBookings = (): Booking[] => {
  return mockBookings.filter(b => b.status === 'released');
};
