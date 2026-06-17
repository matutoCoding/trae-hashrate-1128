import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Button } from '@tarojs/components';
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';

import { useBookingStore } from '@/store/useBookingStore';
import StatusBadge from '@/components/StatusBadge';
import { formatCurrency } from '@/utils/amount';
import { formatDate, getWeekDay } from '@/utils/date';
import {
  Booking,
  BOOKING_STATUS_TEXT,
  BOOKING_STATUS_COLOR,
  PAYMENT_STATUS_TEXT,
  BookingStatus
} from '@/types/booking';

type TabType = 'all' | 'unpaid' | 'completed' | 'cancelled';

const OrderListPage: React.FC = () => {
  const { bookings, loading, fetchBookings, checkIn, releaseBooking } = useBookingStore();
  const [activeTab, setActiveTab] = useState<TabType>('all');

  React.useEffect(() => {
    initData();
  }, []);

  useDidShow(() => {
    initData();
  });

  usePullDownRefresh(async () => {
    await initData();
    Taro.stopPullDownRefresh();
  });

  const initData = async () => {
    console.log('[OrderListPage] 初始化订单数据');
    await fetchBookings();
  };

  const tabs: Array<{ key: TabType; label: string }> = [
    { key: 'all', label: '全部' },
    { key: 'unpaid', label: '待支付' },
    { key: 'completed', label: '已完成' },
    { key: 'cancelled', label: '已取消' }
  ];

  const unpaidCount = useMemo(() =>
    bookings.filter(b => b.paymentStatus === 'unpaid' && b.status !== 'cancelled' && b.status !== 'released').length,
    [bookings]
  );

  const filteredBookings = useMemo(() => {
    return bookings.filter(booking => {
      switch (activeTab) {
        case 'unpaid':
          return booking.paymentStatus === 'unpaid' && booking.status !== 'cancelled' && booking.status !== 'released';
        case 'completed':
          return booking.status === 'completed';
        case 'cancelled':
          return booking.status === 'cancelled' || booking.status === 'released';
        default:
          return true;
      }
    }).sort((a, b) => new Date(b.bookedAt).getTime() - new Date(a.bookedAt).getTime());
  }, [bookings, activeTab]);

  const stats = useMemo(() => ({
    total: bookings.length,
    unpaid: unpaidCount,
    completed: bookings.filter(b => b.status === 'completed').length,
    cancelled: bookings.filter(b => b.status === 'cancelled' || b.status === 'released').length
  }), [bookings, unpaidCount]);

  const handleViewDetail = (booking: Booking) => {
    console.log('[OrderListPage] 查看订单详情:', booking.id);
    Taro.showToast({ title: '订单详情开发中', icon: 'none' });
  };

  const handleCheckIn = async (bookingId: string) => {
    Taro.showModal({
      title: '确认签到',
      content: '确认已到达影棚并开始使用？',
      confirmText: '确认签到',
      confirmColor: '#059669',
      success: async (res) => {
        if (res.confirm) {
          try {
            await checkIn(bookingId);
            Taro.showToast({ title: '签到成功', icon: 'success' });
          } catch (e) {
            console.error('[OrderListPage] 签到失败:', e);
            Taro.showToast({ title: '签到失败', icon: 'error' });
          }
        }
      }
    });
  };

  const handleCancel = async (bookingId: string) => {
    Taro.showModal({
      title: '取消预约',
      content: '确定要取消此预约吗？取消后押金将按规则退还。',
      confirmText: '确认取消',
      confirmColor: '#DC2626',
      success: async (res) => {
        if (res.confirm) {
          try {
            await releaseBooking(bookingId, 'user_cancel');
            Taro.showToast({ title: '已取消', icon: 'success' });
          } catch (e) {
            console.error('[OrderListPage] 取消失败:', e);
            Taro.showToast({ title: '取消失败', icon: 'error' });
          }
        }
      }
    });
  };

  const handlePay = (booking: Booking) => {
    console.log('[OrderListPage] 去支付:', booking.id);
    Taro.navigateTo({
      url: `/pages/booking-confirm/index?studioId=${booking.studioId}&date=${booking.date}&startTime=${booking.startTime}&endTime=${booking.endTime}&duration=${booking.duration}&amount=${booking.totalAmount}`
    });
  };

  const formatOrderTime = (booking: Booking) => {
    const weekDay = getWeekDay(booking.date);
    return `${formatDate(booking.date)} ${weekDay} ${booking.startTime}-${booking.endTime}`;
  };

  if (loading && bookings.length === 0) {
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
        <Text className={styles.headerTitle}>我的订单</Text>
        <Text className={styles.headerSubtitle}>查看和管理您的预约订单</Text>
        <View className={styles.statsRow}>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{stats.total}</Text>
            <Text className={styles.statLabel}>全部订单</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{stats.unpaid}</Text>
            <Text className={styles.statLabel}>待支付</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{stats.completed}</Text>
            <Text className={styles.statLabel}>已完成</Text>
          </View>
        </View>
      </View>

      <View className={styles.tabs}>
        {tabs.map(tab => (
          <View
            key={tab.key}
            className={classnames(styles.tabItem, activeTab === tab.key && styles.active)}
            onClick={() => setActiveTab(tab.key)}
          >
            <Text className={styles.tabText}>{tab.label}</Text>
            {tab.key === 'unpaid' && unpaidCount > 0 && (
              <View className={styles.tabBadge}>
                <Text>{unpaidCount}</Text>
              </View>
            )}
          </View>
        ))}
      </View>

      <ScrollView scrollY className={styles.content}>
        {filteredBookings.length > 0 ? (
          filteredBookings.map(booking => (
            <View
              key={booking.id}
              className={styles.orderCard}
              onClick={() => handleViewDetail(booking)}
            >
              <View className={styles.orderHeader}>
                <Text className={styles.orderNo}>订单号: {booking.id}</Text>
                <StatusBadge
                  text={booking.paymentStatus === 'unpaid' && booking.status !== 'cancelled' && booking.status !== 'released'
                    ? PAYMENT_STATUS_TEXT[booking.paymentStatus]
                    : BOOKING_STATUS_TEXT[booking.status]}
                  color={booking.paymentStatus === 'unpaid' && booking.status !== 'cancelled' && booking.status !== 'released'
                    ? '#D97706'
                    : BOOKING_STATUS_COLOR[booking.status]}
                  bgColor={booking.paymentStatus === 'unpaid' && booking.status !== 'cancelled' && booking.status !== 'released'
                    ? 'rgba(217, 119, 6, 0.1)'
                    : `${BOOKING_STATUS_COLOR[booking.status]}1A`}
                  size="sm"
                />
              </View>

              <View className={styles.orderContent}>
                <View className={styles.studioIcon}>🎬</View>
                <View className={styles.orderInfo}>
                  <Text className={styles.studioName}>{booking.studioName}</Text>
                  <View className={styles.orderTime}>
                    <Text className={styles.timeIcon}>📅</Text>
                    <Text>{formatOrderTime(booking)}</Text>
                  </View>
                  <View className={styles.orderTime}>
                    <Text className={styles.timeIcon}>⏱️</Text>
                    <Text>时长 {booking.duration} 小时</Text>
                  </View>
                </View>
              </View>

              <View className={styles.orderAmount}>
                <Text className={styles.amountLabel}>订单金额</Text>
                <Text className={styles.amountValue}>{formatCurrency(booking.totalAmount + booking.deposit)}</Text>
              </View>

              {booking.status === 'confirmed' && (
                <View className={styles.orderActions}>
                  <Button
                    className={styles.actionBtn}
                    onClick={(e) => { e.stopPropagation(); handleCancel(booking.id); }}
                  >
                    <Text>取消预约</Text>
                  </Button>
                  <Button
                    className={classnames(styles.actionBtn, styles.primary)}
                    onClick={(e) => { e.stopPropagation(); handleCheckIn(booking.id); }}
                  >
                    <Text>签到</Text>
                  </Button>
                </View>
              )}

              {booking.paymentStatus === 'unpaid' && booking.status !== 'cancelled' && booking.status !== 'released' && (
                <View className={styles.orderActions}>
                  <Button
                    className={styles.actionBtn}
                    onClick={(e) => { e.stopPropagation(); handleCancel(booking.id); }}
                  >
                    <Text>取消订单</Text>
                  </Button>
                  <Button
                    className={classnames(styles.actionBtn, styles.primary)}
                    onClick={(e) => { e.stopPropagation(); handlePay(booking); }}
                  >
                    <Text>去支付</Text>
                  </Button>
                </View>
              )}
            </View>
          ))
        ) : (
          <View className={styles.emptyState}>
            <Text className={styles.emptyIcon}>📋</Text>
            <Text className={styles.emptyText}>
              {activeTab === 'all' ? '暂无订单' :
               activeTab === 'unpaid' ? '暂无待支付订单' :
               activeTab === 'completed' ? '暂无已完成订单' : '暂无已取消订单'}
            </Text>
            <Text className={styles.emptySubtext}>
              {activeTab === 'all' ? '快去预约心仪的影棚吧，开启您的创作之旅' :
               activeTab === 'unpaid' ? '您的所有订单都已完成支付' :
               activeTab === 'completed' ? '完成的订单将显示在这里' : '取消的订单将显示在这里'}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default OrderListPage;
