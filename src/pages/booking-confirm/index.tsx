import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, Button } from '@tarojs/components';
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';

import { useStudioStore } from '@/store/useStudioStore';
import { useBookingStore } from '@/store/useBookingStore';
import { formatCurrency } from '@/utils/amount';
import { formatDate, getWeekDay } from '@/utils/date';
import { Studio } from '@/types/studio';

interface BookingParams {
  studioId: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: string;
  amount: string;
  standbyId?: string;
}

const BookingConfirmPage: React.FC = () => {
  const { currentStudio, fetchStudioById } = useStudioStore();
  const { createBooking } = useBookingStore();
  const [params, setParams] = useState<BookingParams | null>(null);
  const [studio, setStudio] = useState<Studio | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const routerParams = Taro.getCurrentInstance().router?.params;
    if (routerParams) {
      setParams(routerParams as unknown as BookingParams);
      if (routerParams.studioId) {
        loadStudioData(routerParams.studioId as string);
      }
    } else {
      Taro.showToast({ title: '参数错误', icon: 'error' });
    }
  }, []);

  useDidShow(() => {
    if (params?.studioId && !studio) {
      loadStudioData(params.studioId);
    }
  });

  usePullDownRefresh(async () => {
    if (params?.studioId) {
      await loadStudioData(params.studioId);
    }
    Taro.stopPullDownRefresh();
  });

  const loadStudioData = async (id: string) => {
    setLoading(true);
    console.log('[BookingConfirmPage] 加载影棚信息:', id);
    const data = await fetchStudioById(id);
    if (data) {
      setStudio(data);
    }
    setLoading(false);
  };

  const displayStudio = studio || currentStudio;
  const duration = params?.duration ? parseInt(params.duration) : 0;
  const amount = params?.amount ? parseFloat(params.amount) : 0;
  const deposit = displayStudio?.deposit || 0;
  const totalAmount = useMemo(() => amount + deposit, [amount, deposit]);

  const formattedDate = useMemo(() => {
    if (!params?.date) return '';
    const weekDay = getWeekDay(params.date);
    return `${formatDate(params.date)} ${weekDay}`;
  }, [params?.date]);

  const handleConfirm = async () => {
    if (!params || !displayStudio) {
      Taro.showToast({ title: '信息不完整', icon: 'none' });
      return;
    }

    Taro.showModal({
      title: '确认支付',
      content: `确认预约 ${displayStudio.name} ${params.date} ${params.startTime}-${params.endTime}，共 ${duration} 小时，需支付 ${formatCurrency(totalAmount)}（含押金 ${formatCurrency(deposit)}）`,
      confirmText: '确认支付',
      confirmColor: '#059669',
      success: async (res) => {
        if (res.confirm) {
          try {
            setLoading(true);
            console.log('[BookingConfirmPage] 提交预约:', params);

            await createBooking({
              studioId: params.studioId,
              studioName: displayStudio.name,
              date: params.date,
              startTime: params.startTime,
              endTime: params.endTime,
              duration: duration,
              totalAmount: amount,
              deposit: deposit,
              equipments: displayStudio.equipments.slice(0, 6).map(eq => ({
                id: eq.id,
                name: eq.name,
                quantity: eq.quantity
              }))
            });

            Taro.showToast({ title: '预约成功', icon: 'success' });

            setTimeout(() => {
              Taro.redirectTo({
                url: '/pages/order-list/index'
              });
            }, 1500);
          } catch (e) {
            console.error('[BookingConfirmPage] 预约失败:', e);
            Taro.showToast({ title: '预约失败', icon: 'error' });
          } finally {
            setLoading(false);
          }
        }
      }
    });
  };

  if (loading && !displayStudio) {
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
        <Text className={styles.headerTitle}>预约确认</Text>
        <Text className={styles.headerSubtitle}>请核对预约信息后确认支付</Text>
        <View className={styles.statsRow}>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{duration}</Text>
            <Text className={styles.statLabel}>时长(小时)</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{formatCurrency(amount)}</Text>
            <Text className={styles.statLabel}>使用费</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{formatCurrency(deposit)}</Text>
            <Text className={styles.statLabel}>押金</Text>
          </View>
        </View>
      </View>

      <ScrollView scrollY className={styles.content}>
        {params?.standbyId && (
          <View className={styles.standbyInfo}>
            <Text className={styles.standbyIcon}>⏰</Text>
            <View className={styles.standbyContent}>
              <Text className={styles.standbyTitle}>候补订单</Text>
              <Text className={styles.standbyDesc}>您正在从候补队列中转正，请尽快完成支付</Text>
            </View>
          </View>
        )}

        <View className={styles.infoCard}>
          <View className={styles.sectionTitle}>
            <Text>影棚信息</Text>
          </View>
          <View className={styles.studioInfo}>
            <View className={styles.studioIcon}>🎬</View>
            <View className={styles.studioDetail}>
              <Text className={styles.studioName}>{displayStudio?.name}</Text>
              <Text className={styles.studioType}>{displayStudio?.type} · {displayStudio?.area}㎡ · 容纳{displayStudio?.capacity}人</Text>
            </View>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>单价</Text>
            <Text className={styles.infoValue}>{formatCurrency(displayStudio?.pricePerHour || 0)}/小时</Text>
          </View>
        </View>

        <View className={styles.infoCard}>
          <View className={styles.sectionTitle}>
            <Text>预约时间</Text>
          </View>
          <View className={styles.timeInfo}>
            <Text className={styles.timeIcon}>📅</Text>
            <View className={styles.timeContent}>
              <Text className={styles.timeRange}>{params?.startTime} - {params?.endTime}</Text>
              <Text className={styles.timeDate}>{formattedDate}</Text>
            </View>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>预约时长</Text>
            <Text className={styles.infoValue}>{duration} 小时</Text>
          </View>
        </View>

        <View className={styles.amountCard}>
          <View className={styles.amountRow}>
            <Text className={styles.amountLabel}>场地使用费</Text>
            <Text className={styles.amountValue}>{formatCurrency(amount)}</Text>
          </View>
          <View className={styles.amountRow}>
            <Text className={styles.amountLabel}>押金（可退）</Text>
            <Text className={styles.amountValue}>{formatCurrency(deposit)}</Text>
          </View>
          <View className={classnames(styles.amountRow, styles.amountTotal)}>
            <Text className={styles.amountTotalLabel}>应付金额</Text>
            <Text className={styles.amountTotalValue}>{formatCurrency(totalAmount)}</Text>
          </View>
        </View>

        {displayStudio?.equipments && displayStudio.equipments.length > 0 && (
          <View className={styles.equipmentPreview}>
            <View className={styles.equipmentHeader}>
              <Text className={styles.equipmentTitle}>配套设备</Text>
              <Text style={{ fontSize: '24rpx', color: '#94A3B8' }}>免费使用</Text>
            </View>
            <View className={styles.equipmentTags}>
              {displayStudio.equipments.slice(0, 8).map(eq => (
                <View key={eq.id} className={styles.equipmentTag}>
                  <Text>{eq.name} ×{eq.quantity}</Text>
                </View>
              ))}
              {displayStudio.equipments.length > 8 && (
                <View className={styles.equipmentTag}>
                  <Text>+{displayStudio.equipments.length - 8}种</Text>
                </View>
              )}
            </View>
          </View>
        )}

        <View className={styles.noticeCard}>
          <Text className={styles.noticeTitle}>
            <Text className={styles.noticeIcon}>⚠️</Text>
            预约须知
          </Text>
          <View className={styles.noticeList}>
            <Text className={styles.noticeItem}>请在预约开始前15分钟到达影棚，超时15分钟未签到系统将自动释放</Text>
            <Text className={styles.noticeItem}>押金在使用结束后无设备损坏将原路退回</Text>
            <Text className={styles.noticeItem}>如需取消预约，请提前24小时操作，否则将扣除部分押金</Text>
            <Text className={styles.noticeItem}>如需延长使用时间，请提前联系工作人员</Text>
          </View>
        </View>
      </ScrollView>

      <View className={styles.bottomBar}>
        <View className={styles.priceInfo}>
          <Text className={styles.totalPrice}>
            {formatCurrency(totalAmount)}
            <Text className={styles.priceUnit}>&nbsp;元</Text>
          </Text>
          <Text className={styles.priceTip}>含押金 {formatCurrency(deposit)} · 支持微信支付</Text>
        </View>
        <Button
          className={styles.confirmBtn}
          onClick={handleConfirm}
          disabled={loading}
        >
          <Text className={styles.btnText}>确认支付</Text>
        </Button>
      </View>
    </View>
  );
};

export default BookingConfirmPage;
