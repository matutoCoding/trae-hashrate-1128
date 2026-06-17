import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, Button } from '@tarojs/components';
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';

import { useStudioStore } from '@/store/useStudioStore';
import { useBookingStore } from '@/store/useBookingStore';
import { useStandbyStore } from '@/store/useStandbyStore';
import TimeSlotPicker from '@/components/TimeSlotPicker';
import { formatDate, generateDateRange, getWeekDay, isToday } from '@/utils/date';
import { formatCurrency } from '@/utils/amount';
import { Booking } from '@/types/booking';

const SchedulePage: React.FC = () => {
  const { studios, loading, fetchStudios, currentStudio, setCurrentStudio } = useStudioStore();
  const {
    timeSlots,
    selectedSlots,
    selectedDate,
    selectedStudioId,
    fetchTimeSlots,
    toggleSlotSelection,
    clearSlotSelection,
    getSelectedSlotsInfo,
    startAutoReleaseTimer,
    stopAutoReleaseTimer,
    setOnBookingReleased,
    checkAndReleaseTimeouts,
    initBookings
  } = useBookingStore();
  const { notifyNextStandby, initStandby } = useStandbyStore();

  const dates = useMemo(() => generateDateRange(formatDate(new Date()), 14), []);
  const [activeDateIndex, setActiveDateIndex] = useState(0);
  const [releaseNotice, setReleaseNotice] = useState<Booking | null>(null);

  useEffect(() => {
    initData();
    setupAutoRelease();
    return () => {
      stopAutoReleaseTimer();
    };
  }, []);

  useDidShow(() => {
    console.log('[SchedulePage] useDidShow');
    if (studios.length === 0) {
      fetchStudios();
    }
    initBookings();
    initStandby();

    const released = checkAndReleaseTimeouts();
    if (released.length > 0) {
      released.forEach(booking => handleBookingReleased(booking));
    }

    if (selectedStudioId && selectedDate) {
      fetchTimeSlots(selectedDate, selectedStudioId);
    }
  });

  usePullDownRefresh(async () => {
    const released = checkAndReleaseTimeouts();
    if (released.length > 0) {
      released.forEach(booking => handleBookingReleased(booking));
    }
    if (selectedStudioId && selectedDate) {
      await fetchTimeSlots(selectedDate, selectedStudioId);
    }
    Taro.stopPullDownRefresh();
  });

  const setupAutoRelease = () => {
    setOnBookingReleased((booking) => {
      handleBookingReleased(booking);
    });
    startAutoReleaseTimer();
  };

  const handleBookingReleased = async (booking: Booking) => {
    console.log('[SchedulePage] 预约已释放，通知候补:', booking.id, booking.studioId, booking.startTime);
    setReleaseNotice(booking);
    try {
      const nextStandby = await notifyNextStandby(booking.studioId, booking.date, booking.startTime);
      if (nextStandby) {
        console.log('[SchedulePage] 已通知候补用户:', nextStandby.userName);
      }
    } catch (e) {
      console.error('[SchedulePage] 通知候补失败:', e);
    }
    setTimeout(() => setReleaseNotice(null), 3000);
  };

  const initData = async () => {
    console.log('[SchedulePage] 初始化数据');
    await fetchStudios();
    initBookings();
    initStandby();

    const released = checkAndReleaseTimeouts();
    if (released.length > 0) {
      released.forEach(booking => handleBookingReleased(booking));
    }

    const studioList = useStudioStore.getState().studios;
    const currentStudioId = useBookingStore.getState().selectedStudioId;
    const currentDate = useBookingStore.getState().selectedDate;

    if (studioList.length > 0 && !currentStudioId) {
      const firstAvailable = studioList.find(s => s.status === 'available');
      if (firstAvailable) {
        selectStudio(firstAvailable);
      }
    } else if (currentStudioId && currentDate) {
      await fetchTimeSlots(currentDate, currentStudioId);
    }
  };

  const selectStudio = async (studio: Studio) => {
    setCurrentStudio(studio);
    clearSlotSelection();
    const date = dates[activeDateIndex];
    await fetchTimeSlots(date, studio.id);
  };

  const handleDateClick = async (index: number) => {
    setActiveDateIndex(index);
    clearSlotSelection();
    if (selectedStudioId) {
      await fetchTimeSlots(dates[index], selectedStudioId);
    }
  };

  const handleSlotClick = (slotId: string) => {
    toggleSlotSelection(slotId);
  };

  const selectedInfo = getSelectedSlotsInfo();
  const selectedStudio = studios.find(s => s.id === selectedStudioId) || currentStudio;

  const totalAmount = useMemo(() => {
    if (!selectedStudio || !selectedInfo) return 0;
    return selectedStudio.pricePerHour * selectedInfo.duration;
  }, [selectedStudio, selectedInfo]);

  const handleBook = async () => {
    if (!selectedStudio || !selectedInfo || selectedSlots.length === 0) {
      Taro.showToast({ title: '请先选择时段', icon: 'none' });
      return;
    }

    console.log('[SchedulePage] 提交预约:', {
      studioId: selectedStudio.id,
      date: dates[activeDateIndex],
      startTime: selectedInfo.startTime,
      endTime: selectedInfo.endTime,
      duration: selectedInfo.duration,
      totalAmount
    });

    Taro.navigateTo({
      url: `/pages/booking-confirm/index?studioId=${selectedStudio.id}&date=${dates[activeDateIndex]}&startTime=${selectedInfo.startTime}&endTime=${selectedInfo.endTime}&duration=${selectedInfo.duration}&amount=${totalAmount}`
    });
  };

  const handleRelease = async (bookingId: string, date: string, startTime: string) => {
    Taro.showModal({
      title: '确认释放',
      content: '确认将该预约标记为超时未到并释放？释放后将通知候补队列中的下一位用户。',
      confirmText: '确认释放',
      confirmColor: '#DC2626',
      success: async (res) => {
        if (res.confirm) {
          try {
            await useBookingStore.getState().releaseBooking(bookingId, 'timeout');
            await notifyNextStandby(selectedStudioId!, date, startTime);
            await fetchTimeSlots(date, selectedStudioId!);
            Taro.showToast({ title: '已释放并通知候补', icon: 'success' });
          } catch (e) {
            console.error('[SchedulePage] 释放预约失败:', e);
            Taro.showToast({ title: '操作失败', icon: 'error' });
          }
        }
      }
    });
  };

  const viewEquipment = () => {
    if (selectedStudio) {
      Taro.navigateTo({
        url: `/pages/studio-detail/index?id=${selectedStudio.id}&tab=equipment`
      });
    }
  };

  if (loading && studios.length === 0) {
    return (
      <View className={styles.page}>
        <View className={styles.loadingContainer}>
          <Text className={styles.loadingText}>加载中...</Text>
        </View>
      </View>
    );
  }

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <Text className={styles.headerTitle}>影棚排期</Text>
        <Text className={styles.headerSubtitle}>选择影棚和时段，快速预约</Text>
        <View className={styles.statsRow}>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{studios.length}</Text>
            <Text className={styles.statLabel}>可用影棚</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{selectedSlots.length}</Text>
            <Text className={styles.statLabel}>已选时段</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{timeSlots.filter(s => s.status === 'released').length}</Text>
            <Text className={styles.statLabel}>已释放</Text>
          </View>
        </View>
      </View>

      <ScrollView scrollY className={styles.content}>
        <View className={styles.releaseNotice}>
          <View className={styles.noticeIcon}>
            <Text className={styles.iconText}>!</Text>
          </View>
          <View className={styles.noticeContent}>
            <Text className={styles.noticeTitle}>超时自动释放规则</Text>
            <Text className={styles.noticeText}>预约开始后15分钟未签到，系统将自动释放该时段并通知候补队列中的下一位用户。已释放时段（橙色）可直接预约。</Text>
          </View>
        </View>

        <View className={styles.sectionTitle}>
          <Text>选择日期</Text>
        </View>
        <ScrollView scrollX className={styles.dateScroll}>
          <View className={styles.dateContainer}>
            {dates.map((date, index) => (
              <View
                key={date}
                className={classnames(
                  styles.dateItem,
                  index === activeDateIndex && styles.active,
                  isToday(date) && styles.today
                )}
                onClick={() => handleDateClick(index)}
              >
                <Text className={styles.dateWeek}>{getWeekDay(date)}</Text>
                <Text className={styles.dateDay}>{parseInt(date.split('-')[2])}</Text>
                <Text className={styles.dateMonth}>{date.split('-').slice(1).join('/')}</Text>
              </View>
            ))}
          </View>
        </ScrollView>

        <View className={styles.sectionTitle}>
          <Text>选择影棚</Text>
        </View>
        <ScrollView scrollX className={styles.dateScroll}>
          <View className={styles.dateContainer}>
            {studios.map(studio => (
              <View
                key={studio.id}
                className={classnames(styles.dateItem, studio.id === selectedStudioId && styles.active)}
                style={{ width: 'auto', minWidth: '200rpx', padding: '0 32rpx' }}
                onClick={() => selectStudio(studio)}
              >
                <Text className={classnames(styles.dateDay, { [styles['dateDay-active']]: studio.id === selectedStudioId })} style={{ fontSize: '28rpx' }}>
                  {studio.name}
                </Text>
                <Text className={classnames(styles.dateMonth, { [styles['dateMonth-active']]: studio.id === selectedStudioId })}>
                  {formatCurrency(studio.pricePerHour)}/时
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>

        {selectedStudio && (
          <>
            <View className={styles.sectionTitle}>
              <Text>{selectedStudio.name} - 时段选择</Text>
              <Text className={styles.sectionAction} onClick={viewEquipment}>查看设备</Text>
            </View>

            {selectedInfo && (
              <View className={styles.selectedInfo}>
                <Text className={styles.selectedTime}>
                  已选择：{selectedInfo.startTime} - {selectedInfo.endTime}
                </Text>
                <Text className={styles.selectedDuration}>共 {selectedInfo.duration} 小时</Text>
              </View>
            )}

            <View className={styles.timeSlotSection}>
              <TimeSlotPicker
                slots={timeSlots}
                selectedSlots={selectedSlots}
                onSlotClick={handleSlotClick}
              />
            </View>

            <View className={styles.equipmentPreview}>
              <View className={styles.equipmentHeader}>
                <Text className={styles.equipmentTitle}>灯光道具清单</Text>
                <Text className={styles.viewAll} onClick={viewEquipment}>查看全部 ›</Text>
              </View>
              <View className={styles.equipmentTags}>
                {selectedStudio.equipments.slice(0, 6).map(eq => (
                  <View key={eq.id} className={styles.equipmentTag}>
                    <Text className={styles.equipmentTagText}>{eq.name} ×{eq.quantity}</Text>
                  </View>
                ))}
                {selectedStudio.equipments.length > 6 && (
                  <View className={styles.equipmentTag}>
                    <Text className={styles.equipmentTagText}>+{selectedStudio.equipments.length - 6}种</Text>
                  </View>
                )}
              </View>
            </View>
          </>
        )}

        {!selectedStudio && studios.length > 0 && (
          <View className={styles.emptyState}>
            <Text className={styles.emptyText}>请先选择一个影棚</Text>
          </View>
        )}
      </ScrollView>

      {selectedStudio && (
        <View className={styles.bottomBar}>
          <View className={styles.priceInfo}>
            <Text className={styles.totalPrice}>
              {formatCurrency(totalAmount)}
              <Text className={styles.priceUnit}>&nbsp;/&nbsp;{selectedInfo?.duration || 0}小时</Text>
            </Text>
            <Text className={styles.priceTip}>押金 {formatCurrency(selectedStudio.deposit)} · 超时15分钟自动释放</Text>
          </View>
          <Button
            className={classnames(styles.bookBtn, selectedSlots.length === 0 && styles.disabled)}
            onClick={handleBook}
            disabled={selectedSlots.length === 0}
          >
            <Text className={styles.btnText}>
              {selectedSlots.length === 0 ? '请选择时段' : '立即预约'}
            </Text>
          </Button>
        </View>
      )}
    </View>
  );
};

export default SchedulePage;
