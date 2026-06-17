import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Picker } from '@tarojs/components';
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';

import { useReconcileStore } from '@/store/useReconcileStore';
import { PhotographerSettlement } from '@/types/reconcile';
import { formatCurrency } from '@/utils/amount';
import { formatDate } from '@/utils/date';

const SettlementPage: React.FC = () => {
  const { getPhotographerSettlements, initReconcile, loading } = useReconcileStore();

  const [startDate, setStartDate] = useState<string>(formatDate(new Date(Date.now() - 30 * 86400000)));
  const [endDate, setEndDate] = useState<string>(formatDate(new Date()));

  const settlements = useMemo(() => {
    return getPhotographerSettlements(startDate, endDate);
  }, [startDate, endDate, getPhotographerSettlements]);

  const totalDiff = useMemo(() => {
    return settlements.reduce((sum, s) => sum + Math.abs(s.diffAmount), 0);
  }, [settlements]);

  const totalPending = useMemo(() => {
    return settlements.reduce((sum, s) => sum + s.pendingDiscrepancyCount, 0);
  }, [settlements]);

  React.useEffect(() => {
    initReconcile();
  }, []);

  useDidShow(() => {
    initReconcile();
  });

  usePullDownRefresh(() => {
    initReconcile();
    Taro.stopPullDownRefresh();
  });

  const handleViewDetail = (photographerId: string, photographerName: string) => {
    Taro.navigateTo({
      url: `/pages/settlement-detail/index?photographerId=${photographerId}&photographerName=${encodeURIComponent(photographerName)}&startDate=${startDate}&endDate=${endDate}`
    });
  };

  const handleDateChange = (type: 'start' | 'end', e: any) => {
    const value = e.detail.value;
    if (type === 'start') {
      setStartDate(value);
    } else {
      setEndDate(value);
    }
  };

  const quickSelect = (days: number) => {
    const end = formatDate(new Date());
    const start = formatDate(new Date(Date.now() - (days - 1) * 86400000));
    setStartDate(start);
    setEndDate(end);
  };

  if (loading && settlements.length === 0) {
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
        <Text className={styles.headerTitle}>摄影师结算汇总</Text>
        <Text className={styles.headerSubtitle}>按摄影师统计收入与差异</Text>

        <View className={styles.summaryRow}>
          <View className={styles.summaryItem}>
            <Text className={styles.summaryValue}>{settlements.length}</Text>
            <Text className={styles.summaryLabel}>摄影师数</Text>
          </View>
          <View className={styles.summaryItem}>
            <Text className={styles.summaryValue}>{formatCurrency(totalDiff)}</Text>
            <Text className={styles.summaryLabel}>差异总额</Text>
          </View>
          <View className={styles.summaryItem}>
            <Text className={classnames(styles.summaryValue, styles.warning)}>{totalPending}</Text>
            <Text className={styles.summaryLabel}>待处理差异</Text>
          </View>
        </View>
      </View>

      <View className={styles.filterSection}>
        <View className={styles.datePickerRow}>
          <View className={styles.datePickerItem}>
            <Text className={styles.dateLabel}>开始日期</Text>
            <Picker
              mode="date"
              value={startDate}
              onChange={(e) => handleDateChange('start', e)}
            >
              <View className={styles.dateValue}>
                <Text>{startDate}</Text>
              </View>
            </Picker>
          </View>
          <Text className={styles.dateSeparator}>至</Text>
          <View className={styles.datePickerItem}>
            <Text className={styles.dateLabel}>结束日期</Text>
            <Picker
              mode="date"
              value={endDate}
              onChange={(e) => handleDateChange('end', e)}
            >
              <View className={styles.dateValue}>
                <Text>{endDate}</Text>
              </View>
            </Picker>
          </View>
        </View>

        <View className={styles.quickSelectRow}>
          <View
            className={styles.quickTag}
            onClick={() => quickSelect(7)}
          >
            <Text>近7天</Text>
          </View>
          <View
            className={styles.quickTag}
            onClick={() => quickSelect(30)}
          >
            <Text>近30天</Text>
          </View>
          <View
            className={styles.quickTag}
            onClick={() => quickSelect(90)}
          >
            <Text>近90天</Text>
          </View>
        </View>
      </View>

      <ScrollView scrollY className={styles.content}>
        {settlements.length === 0 ? (
          <View className={styles.emptyState}>
            <Text className={styles.emptyIcon}>📊</Text>
            <Text className={styles.emptyText}>暂无结算数据</Text>
            <Text className={styles.emptySubtext}>选择其他日期范围试试</Text>
          </View>
        ) : (
          settlements.map((item: PhotographerSettlement) => (
            <View
              key={item.photographerId}
              className={styles.settlementCard}
              onClick={() => handleViewDetail(item.photographerId, item.photographerName)}
            >
              <View className={styles.cardHeader}>
                <View className={styles.photographerInfo}>
                  <View className={styles.avatar}>
                    <Text>{item.photographerName.charAt(0)}</Text>
                  </View>
                  <View className={styles.photographerText}>
                    <Text className={styles.photographerName}>{item.photographerName}</Text>
                    <Text className={styles.orderCount}>{item.orderCount}笔订单</Text>
                  </View>
                </View>
                <View className={styles.diffBadge}>
                  <Text
                    className={classnames(
                      styles.diffValue,
                      Math.abs(item.diffAmount) > 0 && styles.hasDiff
                    )}
                  >
                    {item.diffAmount > 0 ? '+' : ''}{formatCurrency(item.diffAmount)}
                  </Text>
                </View>
              </View>

              <View className={styles.cardBody}>
                <View className={styles.amountRow}>
                  <View className={styles.amountItem}>
                    <Text className={styles.amountLabel}>平台收入</Text>
                    <Text className={styles.amountValue}>{formatCurrency(item.platformIncome)}</Text>
                  </View>
                  <View className={styles.amountItem}>
                    <Text className={styles.amountLabel}>平台支出</Text>
                    <Text className={styles.amountValue}>
                      <Text className={styles.expense}>-{formatCurrency(item.platformExpense)}</Text>
                    </Text>
                  </View>
                  <View className={styles.amountItem}>
                    <Text className={styles.amountLabel}>平台净额</Text>
                    <Text className={classnames(styles.amountValue, styles.bold)}>
                      {formatCurrency(item.platformNet)}
                    </Text>
                  </View>
                </View>

                <View className={styles.divider} />

                <View className={styles.amountRow}>
                  <View className={styles.amountItem}>
                    <Text className={styles.amountLabel}>摄影师收入</Text>
                    <Text className={styles.amountValue}>{formatCurrency(item.photographerIncome)}</Text>
                  </View>
                  <View className={styles.amountItem}>
                    <Text className={styles.amountLabel}>摄影师支出</Text>
                    <Text className={styles.amountValue}>
                      <Text className={styles.expense}>-{formatCurrency(item.photographerExpense)}</Text>
                    </Text>
                  </View>
                  <View className={styles.amountItem}>
                    <Text className={styles.amountLabel}>摄影师净额</Text>
                    <Text className={classnames(styles.amountValue, styles.bold)}>
                      {formatCurrency(item.photographerNet)}
                    </Text>
                  </View>
                </View>
              </View>

              <View className={styles.cardFooter}>
                <View className={styles.discrepancyInfo}>
                  <Text className={styles.discrepancyText}>
                    差异 <Text className={styles.bold}>{item.discrepancyCount}</Text> 条
                  </Text>
                  {item.pendingDiscrepancyCount > 0 && (
                    <Text className={styles.pendingBadge}>
                      {item.pendingDiscrepancyCount}条待处理
                    </Text>
                  )}
                </View>
                <Text className={styles.arrow}>›</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
};

export default SettlementPage;
