import { create } from 'zustand';
import { Booking, TimeSlot, BookingType } from '@/types/booking';
import { mockBookings } from '@/data/bookings';
import { formatDate } from '@/utils/date';

interface BookingState {
  bookings: Booking[];
  currentBooking: Booking | null;
  timeSlots: TimeSlot[];
  loading: boolean;
  selectedDate: string;
  selectedStudioId: string | null;
  selectedSlots: string[];
  initialized: boolean;
  autoReleaseTimer: ReturnType<typeof setInterval> | null;
  onBookingReleased: ((booking: Booking) => void) | null;

  initBookings: () => void;
  fetchBookings: () => Promise<void>;
  fetchTimeSlots: (date: string, studioId: string) => Promise<void>;
  setSelectedDate: (date: string) => void;
  setSelectedStudioId: (id: string) => void;
  toggleSlotSelection: (slotId: string) => void;
  clearSlotSelection: () => void;
  createBooking: (data: Partial<Booking>) => Promise<Booking>;
  releaseBooking: (bookingId: string, reason: 'timeout' | 'user_cancel' | 'system') => Promise<boolean>;
  checkIn: (bookingId: string) => Promise<boolean>;
  getSelectedSlotsInfo: () => { startTime: string; endTime: string; duration: number } | null;
  getBookingsByStudioAndDate: (studioId: string, date: string) => Booking[];
  generateTimeSlotsFromBookings: (date: string, studioId: string) => TimeSlot[];
  checkAndReleaseTimeouts: () => Booking[];
  startAutoReleaseTimer: () => void;
  stopAutoReleaseTimer: () => void;
  setOnBookingReleased: (callback: (booking: Booking) => void) => void;
}

export const useBookingStore = create<BookingState>((set, get) => ({
  bookings: [],
  currentBooking: null,
  timeSlots: [],
  loading: false,
  selectedDate: '',
  selectedStudioId: null,
  selectedSlots: [],
  initialized: false,
  autoReleaseTimer: null,
  onBookingReleased: null,

  initBookings: () => {
    if (get().initialized) return;
    set({ bookings: [...mockBookings], initialized: true });
    console.log('[BookingStore] 初始化预约数据，共', mockBookings.length, '条');
  },

  fetchBookings: async () => {
    const { initialized, initBookings } = get();
    if (!initialized) {
      initBookings();
    }
    set({ loading: true });
    await new Promise(resolve => setTimeout(resolve, 200));
    set({ loading: false });
    console.log('[BookingStore] 预约列表加载完成，共', get().bookings.length, '条');
  },

  fetchTimeSlots: async (date: string, studioId: string) => {
    const { initialized, initBookings, generateTimeSlotsFromBookings } = get();
    if (!initialized) {
      initBookings();
    }
    set({ loading: true, selectedDate: date, selectedStudioId: studioId });
    await new Promise(resolve => setTimeout(resolve, 150));
    const slots = generateTimeSlotsFromBookings(date, studioId);
    set({ timeSlots: slots, loading: false, selectedSlots: [] });
    console.log('[BookingStore] 时段加载完成:', date, studioId, '共', slots.length, '个时段');
  },

  generateTimeSlotsFromBookings: (date: string, studioId: string): TimeSlot[] => {
    const { bookings } = get();
    const slots: TimeSlot[] = [];
    const activeBookings = bookings.filter(
      b => b.studioId === studioId && b.date === date &&
           b.status !== 'cancelled' && b.status !== 'released'
    );
    const releasedBookings = bookings.filter(
      b => b.studioId === studioId && b.date === date && b.status === 'released'
    );

    for (let hour = 8; hour < 22; hour++) {
      const startTime = `${String(hour).padStart(2, '0')}:00`;
      const endTime = `${String(hour + 1).padStart(2, '0')}:00`;

      const isBooked = activeBookings.some(b => {
        const startH = parseInt(b.startTime.split(':')[0]);
        const endH = parseInt(b.endTime.split(':')[0]);
        return hour >= startH && hour < endH;
      });

      const isReleased = releasedBookings.some(b => {
        const startH = parseInt(b.startTime.split(':')[0]);
        const endH = parseInt(b.endTime.split(':')[0]);
        return hour >= startH && hour < endH;
      });

      slots.push({
        id: `slot-${date}-${hour}`,
        startTime,
        endTime,
        status: isReleased ? 'released' : isBooked ? 'booked' : 'available'
      });
    }

    return slots;
  },

  setSelectedDate: (date: string) => {
    set({ selectedDate: date, selectedSlots: [] });
  },

  setSelectedStudioId: (id: string) => {
    set({ selectedStudioId: id, selectedSlots: [] });
  },

  toggleSlotSelection: (slotId: string) => {
    const slot = get().timeSlots.find(s => s.id === slotId);
    if (!slot || (slot.status !== 'available' && slot.status !== 'released')) return;

    set(state => {
      const isSelected = state.selectedSlots.includes(slotId);
      if (isSelected) {
        return { selectedSlots: state.selectedSlots.filter(id => id !== slotId) };
      } else {
        return { selectedSlots: [...state.selectedSlots, slotId].sort() };
      }
    });
  },

  clearSlotSelection: () => {
    set({ selectedSlots: [] });
  },

  getSelectedSlotsInfo: () => {
    const { selectedSlots, timeSlots } = get();
    if (selectedSlots.length === 0) return null;

    const sortedSlots = selectedSlots
      .map(id => timeSlots.find(s => s.id === id)!)
      .filter(Boolean)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

    if (sortedSlots.length === 0) return null;

    return {
      startTime: sortedSlots[0].startTime,
      endTime: sortedSlots[sortedSlots.length - 1].endTime,
      duration: sortedSlots.length
    };
  },

  getBookingsByStudioAndDate: (studioId: string, date: string): Booking[] => {
    return get().bookings.filter(b => b.studioId === studioId && b.date === date);
  },

  createBooking: async (data: Partial<Booking>) => {
    const { initialized, initBookings, selectedDate, selectedStudioId } = get();
    if (!initialized) {
      initBookings();
    }

    await new Promise(resolve => setTimeout(resolve, 400));

    const date = data.date || selectedDate;
    const studioId = data.studioId || selectedStudioId;

    const newBooking: Booking = {
      id: `bk-${Date.now()}`,
      studioId: studioId || '',
      studioName: data.studioName || '',
      userId: 'user-current',
      userName: data.userName || '当前用户',
      userPhone: data.userPhone || '138****8888',
      date: date || '',
      startTime: data.startTime || '',
      endTime: data.endTime || '',
      duration: data.duration || 1,
      totalAmount: data.totalAmount || 0,
      deposit: data.deposit || 0,
      status: 'confirmed',
      paymentStatus: 'paid',
      bookedAt: new Date().toISOString(),
      equipments: data.equipments || [],
      photographerId: 'p-current',
      photographerName: '当前摄影师'
    };

    set(state => {
      const newBookings = [newBooking, ...state.bookings];

      if (date && studioId) {
        const slots = state.timeSlots.map(slot => {
          const slotHour = parseInt(slot.startTime.split(':')[0]);
          const startH = parseInt(newBooking.startTime.split(':')[0]);
          const endH = parseInt(newBooking.endTime.split(':')[0]);
          if (slotHour >= startH && slotHour < endH) {
            return { ...slot, status: 'booked' as const };
          }
          return slot;
        });
        return { bookings: newBookings, timeSlots: slots };
      }

      return { bookings: newBookings };
    });

    console.log('[BookingStore] 创建预约成功:', newBooking.id, newBooking.date, newBooking.startTime, '-', newBooking.endTime);
    return newBooking;
  },

  releaseBooking: async (bookingId: string, reason: 'timeout' | 'user_cancel' | 'system') => {
    const { initialized, initBookings } = get();
    if (!initialized) {
      initBookings();
    }

    await new Promise(resolve => setTimeout(resolve, 200));

    let releasedBooking: Booking | null = null;

    set(state => {
      const newBookings = state.bookings.map(b => {
        if (b.id === bookingId) {
          releasedBooking = {
            ...b,
            status: 'released',
            releasedAt: new Date().toISOString(),
            releaseReason: reason
          };
          return releasedBooking;
        }
        return b;
      });

      if (releasedBooking && state.selectedStudioId === releasedBooking.studioId && state.selectedDate === releasedBooking.date) {
        const newSlots = state.timeSlots.map(slot => {
          const slotHour = parseInt(slot.startTime.split(':')[0]);
          const startH = parseInt(releasedBooking!.startTime.split(':')[0]);
          const endH = parseInt(releasedBooking!.endTime.split(':')[0]);
          if (slotHour >= startH && slotHour < endH) {
            return { ...slot, status: 'released' as const };
          }
          return slot;
        });
        return { bookings: newBookings, timeSlots: newSlots };
      }

      return { bookings: newBookings };
    });

    console.log('[BookingStore] 释放预约:', bookingId, '原因:', reason);
    return true;
  },

  checkIn: async (bookingId: string) => {
    const { initialized, initBookings } = get();
    if (!initialized) {
      initBookings();
    }

    await new Promise(resolve => setTimeout(resolve, 200));

    set(state => ({
      bookings: state.bookings.map(b =>
        b.id === bookingId
          ? { ...b, status: 'checked_in', checkedInAt: new Date().toISOString() }
          : b
      )
    }));

    console.log('[BookingStore] 签到成功:', bookingId);
    return true;
  },

  checkAndReleaseTimeouts: (): Booking[] => {
    const { initialized, initBookings, bookings } = get();
    if (!initialized) {
      initBookings();
      return [];
    }

    const now = new Date();
    const today = formatDate(now);
    const released: Booking[] = [];

    const updatedBookings = bookings.map(booking => {
      if (booking.status !== 'confirmed' || booking.date !== today) {
        return booking;
      }

      const [startH, startM] = booking.startTime.split(':').map(Number);
      const bookingStartTime = new Date();
      bookingStartTime.setHours(startH, startM, 0, 0);

      const diffMinutes = (now.getTime() - bookingStartTime.getTime()) / (1000 * 60);

      if (diffMinutes > 15) {
        const releasedBooking: Booking = {
          ...booking,
          status: 'released',
          releasedAt: now.toISOString(),
          releaseReason: 'timeout',
          remark: '超时15分钟未到，系统自动释放'
        };
        released.push(releasedBooking);
        console.log('[BookingStore] 检测到超时预约，自动释放:', booking.id, booking.studioName, booking.startTime);
        return releasedBooking;
      }

      return booking;
    });

    if (released.length > 0) {
      const { selectedDate, selectedStudioId } = get();
      set(state => {
        const newState: Partial<BookingState> = { bookings: updatedBookings };

        if (selectedDate && selectedStudioId && released.some(r => r.date === selectedDate && r.studioId === selectedStudioId)) {
          const newSlots = state.timeSlots.map(slot => {
            const slotHour = parseInt(slot.startTime.split(':')[0]);
            const isReleased = released.some(r => {
              const startH = parseInt(r.startTime.split(':')[0]);
              const endH = parseInt(r.endTime.split(':')[0]);
              return r.date === selectedDate && r.studioId === selectedStudioId &&
                     slotHour >= startH && slotHour < endH;
            });
            if (isReleased) {
              return { ...slot, status: 'released' as const };
            }
            return slot;
          });
          newState.timeSlots = newSlots;
        }

        return newState;
      });
    }

    return released;
  },

  startAutoReleaseTimer: () => {
    const { autoReleaseTimer, checkAndReleaseTimeouts, onBookingReleased } = get();
    if (autoReleaseTimer) {
      return;
    }

    console.log('[BookingStore] 启动自动释放定时器');
    const timer = setInterval(() => {
      const releasedBookings = checkAndReleaseTimeouts();
      if (releasedBookings.length > 0 && onBookingReleased) {
        releasedBookings.forEach(booking => {
          onBookingReleased(booking);
        });
      }
    }, 60000);

    set({ autoReleaseTimer: timer });
  },

  stopAutoReleaseTimer: () => {
    const { autoReleaseTimer } = get();
    if (autoReleaseTimer) {
      clearInterval(autoReleaseTimer);
      set({ autoReleaseTimer: null });
      console.log('[BookingStore] 停止自动释放定时器');
    }
  },

  setOnBookingReleased: (callback: (booking: Booking) => void) => {
    set({ onBookingReleased: callback });
  }
}));
