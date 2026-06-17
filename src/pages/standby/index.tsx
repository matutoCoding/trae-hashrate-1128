import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Button } from '@tarojs/components';
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';

import { useStandbyStore } from '@/store/useStandbyStore';
import { useStudioStore } from '@/store/useStudioStore';
import StandbyQueue from '@/components/StandbyQueue';
import StatusBadge from '@/components/StatusBadge';
import { STANDBY_STATUS_TEXT, STANDBY_STATUS_COLOR } from '@/types/standby';
import { formatDateTime, formatDate } from '@/utils/date';

const StandbyPage: React.FC = () => {
  const {
    standbyRecords,
    notifications,
    loading,
    fetchStandbyRecords,
    fetchNotifications,
    confirmStandby,
    cancelStandby,
    createStandby,
    getUnreadCount,
    markAllNotificationsRead
  } = useStandbyStore();
  const { studios, fetchStudios } = useStudioStore();

  const [activeTab, setActiveTab] = useState<'queue' | 'my'>('queue');
  const [countdown, setCountdown] = useState<number>(0);

  useEffect(() => {
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
    console.log('[StandbyPage] 初始化数据');
    await fetchStudios();
    await fetchStandbyRecords();
    await fetchNotifications();
  };

  useEffect(() => {
    const notified = standbyRecords.find(s => s.status === 'notified');
    if (notified && notified.notifiedAt) {
      const notifiedTime = new Date(notified.notifiedAt).getTime();
      const expireTime = notifiedTime + notified.validDuration * 60 * 1000;
      const updateCountdown = () => {
        const now = Date.now();
        const remaining = Math.max(0, Math.floor((expireTime - now) / 1000));
        setCountdown(remaining);
      };
      updateCountdown();
      const timer = setInterval(updateCountdown, 1000);
      return () => clearInterval(timer);
    } else {
      setCountdown(0);
    }
  }, [standbyRecords]);

  const notifiedRecord = standbyRecords.find(s => s.status === 'notified');
  const unreadCount = getUnreadCount();

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  const handleConfirm = async (id: string) => {
    Taro.showModal({
      title: '确认补位',
      content: '确认接受该时段补位？确认后将跳转至预约确认页面完成支付。',
      confirmText: '确认补位',
      confirmColor: '#059669',
      success: async (res) => {
        if (res.confirm) {
          try {
            await confirmStandby(id);
            const record = standbyRecords.find(s => s.id === id);
            if (record) {
              const studio = studios.find(s => s.id === record.studioId);
              const amount = (studio?.pricePerHour || 0) * record.duration;
              Taro.navigateTo({
                url: `/pages/booking-confirm/index?studioId=${record.studioId}&date=${record.date}&startTime=${record.startTime}&endTime=${record.endTime}&duration=${record.duration}&amount=${amount}&standbyId=${id}`
              });
            }
            Taro.showToast({ title: '已确认', icon: 'success' });
          } catch (e) {
            console.error('[StandbyPage] 确认失败:', e);
            Taro.showToast({ title: '操作失败', icon: 'error' });
          }
        }
      }
    });
  };

  const handleCancel = async (id: string) => {
    Taro.showModal({
      title: '取消候补',
      content: '确定要取消该候补登记吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await cancelStandby(id);
            Taro.showToast({ title: '已取消', icon: 'success' });
          } catch (e) {
            console.error('[StandbyPage] 取消失败:', e);
            Taro.showToast({ title: '操作失败', icon: 'error' });
          }
        }
      }
    });
  };

  const handleAddStandby = () => {
    if (studios.length === 0) {
      Taro.showToast({ title: '暂无可用影棚', icon: 'none' });
      return;
    }
    Taro.showActionSheet({
      itemList: studios.filter(s => s.status === 'available').map(s => s.name),
      success: async (res) => {
        const studio = studios.filter(s => s.status === 'available')[res.tapIndex];
        if (studio) {
          Taro.showModal({
            title: '候补登记',
            content: `确认加入 ${studio.name} 的候补队列？请选择希望候补的日期和时段。`,
            confirmText: '继续',
            success: async (modalRes) => {
              if (modalRes.confirm) {
                try {
                  await createStandby({
                    studioId: studio.id,
                    studioName: studio.name,
                    date: formatDate(new Date()),
                    startTime: '18:00',
                    endTime: '21:00',
                    userName: '当前用户',
                    userPhone: '138****8888'
                  });
                  Taro.showToast({ title: '候补登记成功', icon: 'success' });
                } catch (e) {
                  console.error('[StandbyPage] 候补登记失败:', e);
                  Taro.showToast({ title: '登记失败', icon: 'error' });
                }
              }
            }
          });
        }
      }
    });
  };

  const handleMarkAllRead = () => {
    markAllNotificationsRead();
    Taro.showToast({ title: '已全部标为已读', icon: 'success' });
  };

  const handleViewDetail = (id: string) => {
    Taro.navigateTo({
      url: `/pages/studio-detail/index?id=${id}`
    });
  };

  const queueRecords = standbyRecords.filter(s => s.status === 'waiting' || s.status === 'notified');
  const myRecords = standbyRecords;

  if (loading && standbyRecords.length === 0) {
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
        <Text className={styles.headerTitle}>候补补位</Text>
        <Text className={styles.headerSubtitle}>满员时段候补，空位自动通知</Text>
        <View className={styles.statsRow}>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{queueRecords.length}</Text>
            <Text className={styles.statLabel}>排队中</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{unreadCount}</Text>
            <Text className={styles.statLabel}>未读通知</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{standbyRecords.filter(s => s.status === 'confirmed').length}</Text>
            <Text className={styles.statLabel}>已成功</Text>
          </View>
        </View>
      </View>

      <View className={styles.tabs}>
        <View
          className={classnames(styles.tabItem, activeTab === 'queue' && styles.active)}
          onClick={() => setActiveTab('queue')}
        >
          <Text className={styles.tabText}>候补队列</Text>
        </View>
        <View
          className={classnames(styles.tabItem, activeTab === 'my' && styles.active)}
          onClick={() => setActiveTab('my')}
        >
          <Text className={styles.tabText}>我的候补</Text>
        </View>
      </View>

      <ScrollView scrollY className={styles.content}>
        {notifiedRecord && countdown > 0 && (
          <View className={styles.notificationCard}>
            <View className={styles.notificationHeader}>
              <View className={styles.notificationInfo}>
                <Text className={styles.notificationStudio}>{notifiedRecord.studioName}</Text>
                <Text className={styles.notificationTime}>
                  {notifiedRecord.date} {notifiedRecord.startTime}-{notifiedRecord.endTime}
                </Text>
              </View>
              <View className={styles.countdownBadge}>
                <Text className={styles.countdownText}>{formatCountdown(countdown)}</Text>
              </View>
            </View>
            <Text className={styles.notificationMessage}>
              该时段已产生空位，请在 {notifiedRecord.validDuration} 分钟内确认，超时将自动取消候补资格并通知下一位用户。
            </Text>
            <View className={styles.notificationActions}>
              <Button
                className={classnames(styles.actionBtn, styles.cancelBtn)}
                onClick={() => handleCancel(notifiedRecord.id)}
              >
                <Text className={styles.btnText}>放弃</Text>
              </Button>
              <Button
                className={classnames(styles.actionBtn, styles.confirmBtn)}
                onClick={() => handleConfirm(notifiedRecord.id)}
              >
                <Text className={styles.btnText}>立即确认</Text>
              </Button>
            </View>
          </View>
        )}

        {activeTab === 'queue' && (
          <>
            <View className={styles.sectionTitle}>
              <Text>快速候补</Text>
            </View>

            <View className={styles.addStandbyCard} onClick={handleAddStandby}>
              <View className={styles.addStandbyIcon}>
                <Text className={styles.iconText}>+</Text>
              </View>
              <Text className={styles.addStandbyText}>加入候补队列</Text>
            </View>

            <View className={styles.ruleCard}>
              <Text className={styles.ruleTitle}>候补规则说明</Text>
              <View className={styles.ruleList}>
                <Text className={styles.ruleItem}>预约满员时段可登记候补，按登记时间排序</Text>
                <Text className={styles.ruleItem}>预约超时释放后，自动通知队列第一位用户</Text>
                <Text className={styles.ruleItem}>收到通知后需在15分钟内确认，超时顺延下一位</Text>
                <Text className={styles.ruleItem}>候补确认成功后需在30分钟内完成支付</Text>
                <Text className={styles.ruleItem}>可随时主动取消候补，不产生任何费用</Text>
              </View>
            </View>

            <View className={styles.sectionTitle}>
              <Text>当前排队</Text>
            </View>

            <StandbyQueue
              records={queueRecords}
              onConfirm={handleConfirm}
              onCancel={handleCancel}
            />

            <View className={styles.sectionTitle}>
              <Text>通知消息</Text>
              <Text className={styles.sectionAction} onClick={handleMarkAllRead}>全部已读</Text>
            </View>

            <View className={styles.notificationList}>
              {notifications.length > 0 ? (
                notifications.slice(0, 5).map(notification => (
                  <View
                    key={notification.id}
                    className={classnames(styles.notificationItem, !notification.read && styles.unread)}
                  >
                    {!notification.read && <View className={styles.notificationDot} />}
                    <View className={styles.notificationContent}>
                      <Text className={styles.notificationMsg}>{notification.message}</Text>
                      <Text className={styles.notificationDate}>{formatDateTime(notification.createdAt)}</Text>
                    </View>
                  </View>
                ))
              ) : (
                <View className={styles.emptyState}>
                  <View className={styles.emptyIcon}>
                    <Text className={styles.iconText}>🔔</Text>
                  </View>
                  <Text className={styles.emptyText}>暂无通知消息</Text>
                </View>
              )}
            </View>
          </>
        )}

        {activeTab === 'my' && (
          <View className={styles.myStandbySection}>
            <StandbyQueue
              records={myRecords}
              onConfirm={handleConfirm}
              onCancel={handleCancel}
            />

            {myRecords.length === 0 && (
              <View className={styles.emptyState}>
                <View className={styles.emptyIcon}>
                  <Text className={styles.iconText}>📋</Text>
                </View>
                <Text className={styles.emptyText}>暂无候补记录</Text>
                <Text className={styles.emptySubtext}>点击"加入候补队列"开始登记</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default StandbyPage;
