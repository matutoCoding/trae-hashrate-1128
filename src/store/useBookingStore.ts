import { create } from 'zustand';
import { Booking, TimeSlot } from '@/types/booking';
import { mockBookings, generateTimeSlots, getBookingsByStudio, getReleasedBookings } from '@/data/bookings';

interface BookingState {
  bookings: Booking[];
  currentBooking: Booking | null;
  timeSlots: TimeSlot[];
  loading: boolean;
  selectedDate: string;
  selectedStudioId: string | null;
  selectedSlots: string[];

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
}

export const useBookingStore = create<BookingState>((set, get) => ({
  bookings: [],
  currentBooking: null,
  timeSlots: [],
  loading: false,
  selectedDate: '',
  selectedStudioId: null,
  selectedSlots: [],

  fetchBookings: async () => {
    set({ loading: true });
    await new Promise(resolve => setTimeout(resolve, 300));
    set({ bookings: [...mockBookings], loading: false });
    console.log('[BookingStore] 预约列表加载完成，共', mockBookings.length, '条');
  },

  fetchTimeSlots: async (date: string, studioId: string) => {
    set({ loading: true, selectedDate: date, selectedStudioId: studioId });
    await new Promise(resolve => setTimeout(resolve, 200));
    const slots = generateTimeSlots(date, studioId);
    set({ timeSlots: slots, loading: false, selectedSlots: [] });
    console.log('[BookingStore] 时段加载完成:', date, studioId, '共', slots.length, '个时段');
  },

  setSelectedDate: (date: string) => {
    set({ selectedDate: date, selectedSlots: [] });
  },

  setSelectedStudioId: (id: string) => {
    set({ selectedStudioId: id, selectedSlots: [] });
  },

  toggleSlotSelection: (slotId: string) => {
    const slot = get().timeSlots.find(s => s.id === slotId);
    if (!slot || slot.status !== 'available' && slot.status !== 'released') return;

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

  createBooking: async (data: Partial<Booking>) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    const newBooking: Booking = {
      id: `bk-${Date.now()}`,
      studioId: data.studioId || '',
      studioName: data.studioName || '',
      userId: 'user-current',
      userName: data.userName || '当前用户',
      userPhone: data.userPhone || '',
      date: data.date || '',
      startTime: data.startTime || '',
      endTime: data.endTime || '',
      duration: data.duration || 1,
      totalAmount: data.totalAmount || 0,
      deposit: data.deposit || 0,
      status: 'confirmed',
      paymentStatus: 'paid',
      bookedAt: new Date().toISOString(),
      equipments: data.equipments || []
    };
    set(state => ({ bookings: [newBooking, ...state.bookings] }));
    console.log('[BookingStore] 创建预约成功:', newBooking.id);
    return newBooking;
  },

  releaseBooking: async (bookingId: string, reason: 'timeout' | 'user_cancel' | 'system') => {
    await new Promise(resolve => setTimeout(resolve, 300));
    set(state => ({
      bookings: state.bookings.map(b =>
        b.id === bookingId
          ? { ...b, status: 'released', releasedAt: new Date().toISOString(), releaseReason: reason }
          : b
      )
    }));
    console.log('[BookingStore] 释放预约:', bookingId, '原因:', reason);
    return true;
  },

  checkIn: async (bookingId: string) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    set(state => ({
      bookings: state.bookings.map(b =>
        b.id === bookingId
          ? { ...b, status: 'checked_in', checkedInAt: new Date().toISOString() }
          : b
      )
    }));
    console.log('[BookingStore] 签到成功:', bookingId);
    return true;
  }
}));
