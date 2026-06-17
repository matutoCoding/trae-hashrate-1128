import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useDidShow, useRouter } from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';

import { useReconcileStore } from '@/store/useReconcileStore';
import { FlowRecord, DiscrepancyRecord } from '@/types/reconcile';
import { DISCREPANCY_TYPE_TEXT, DISCREPANCY_STATUS_TEXT, DISCREPANCY_STATUS_COLOR } from '@/types/reconcile';
import { formatCurrency } from '@/utils/amount';
import { formatDateTime } from '@/utils/date';

const SettlementDetailPage: React.FC = () => {
  const router = useRouter();
  const { getSettlementByPhotographer } = useReconcileStore();

  const photographerId = router.params.photographerId || '';
  const photographerName = decodeURIComponent(router.params.photographerName || '');
  const startDate = router.params.startDate || '';
  const endDate = router.params.endDate || '';

  const [activeTab, setActiveTab] = useState<'flows' | 'discrepancies'>('flows');

  const data = useMemo(() => {
    if (!photographerId) return null;
    return getSettlementByPhotographer(photographerId, startDate, endDate);
  }, [photographerId, startDate, endDate, getSettlementByPhotographer]);

  React.useEffect(() => {
    if (photographerName) {
      Taro.setNavigationBarTitle({ title: `${photographerName} - 结算详情` });
    }
  }, [photographerName]);

  useDidShow(() => {
    // 数据已通过 useMemo 自动更新
  });

  const handleViewFlowDetail = (flow: FlowRecord) => {
    Taro.navigateTo({
      url: `/pages/flow-detail/index?id=${flow.id}&source=${flow.source}`
    });
  };

  const handleViewDiscrepancy = (discrepancy: DiscrepancyRecord) => {
    Taro.navigateTo({
      url: `/pages/discrepancy-detail/index?id=${discrepancy.id}`
    });
  };

  if (!data) {
    return (
      <View className={styles.page}>
        <View className={styles.loadingContainer}>
          <Text className={styles.loadingText}>加载中...</Text>
        </View>
      </View>
    );
  }

  const { settlement, flows, discrepancies } = data;

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <View className={styles.photographerHeader}>
          <View className={styles.avatar}>
            <Text>{photographerName.charAt(0)}</Text>
          </View>
          <View className={styles.photographerInfo}>
            <Text className={styles.photographerName}>{photographerName}</Text>
            <Text className={styles.dateRange}>
              {startDate} 至 {endDate}
            </Text>
          </View>
        </View>

        <View className={styles.summaryGrid}>
          <View className={styles.summaryItem}>
            <Text className={styles.summaryLabel}>平台净额</Text>
            <Text className={styles.summaryValue}>{formatCurrency(settlement.platformNet)}</Text>
          </View>
          <View className={styles.summaryItem}>
            <Text className={styles.summaryLabel}>摄影师净额</Text>
            <Text className={styles.summaryValue}>{formatCurrency(settlement.photographerNet)}</Text>
          </View>
          <View className={styles.summaryItem}>
            <Text className={styles.summaryLabel}>差额</Text>
            <Text
              className={classnames(
                styles.summaryValue,
                Math.abs(settlement.diffAmount) > 0 && styles.hasDiff
              )}
            >
              {settlement.diffAmount > 0 ? '+' : ''}{formatCurrency(settlement.diffAmount)}
            </Text>
          </View>
          <View className={styles.summaryItem}>
            <Text className={styles.summaryLabel}>待处理差异</Text>
            <Text className={classnames(styles.summaryValue, styles.warning)}>
              {settlement.pendingDiscrepancyCount}
            </Text>
          </View>
        </View>

        <View className={styles.detailGrid}>
          <View className={styles.detailItem}>
            <Text className={styles.detailLabel}>平台收入</Text>
            <Text className={styles.detailValue}>{formatCurrency(settlement.platformIncome)}</Text>
          </View>
          <View className={styles.detailItem}>
            <Text className={styles.detailLabel}>平台支出</Text>
            <Text className={classnames(styles.detailValue, styles.expense)}>
              -{formatCurrency(settlement.platformExpense)}
            </Text>
          </View>
          <View className={styles.detailItem}>
            <Text className={styles.detailLabel}>摄影师收入</Text>
            <Text className={styles.detailValue}>{formatCurrency(settlement.photographerIncome)}</Text>
          </View>
          <View className={styles.detailItem}>
            <Text className={styles.detailLabel}>摄影师支出</Text>
            <Text className={classnames(styles.detailValue, styles.expense)}>
              -{formatCurrency(settlement.photographerExpense)}
            </Text>
          </View>
        </View>
      </View>

      <View className={styles.tabBar}>
        <View
          className={classnames(styles.tabItem, activeTab === 'flows' && styles.active)}
          onClick={() => setActiveTab('flows')}
        >
          <Text className={styles.tabText}>流水明细</Text>
          <Text className={styles.tabCount}>{flows.length}</Text>
        </View>
        <View
          className={classnames(styles.tabItem, activeTab === 'discrepancies' && styles.active)}
          onClick={() => setActiveTab('discrepancies')}
        >
          <Text className={styles.tabText}>差异明细</Text>
          <Text className={styles.tabCount}>{discrepancies.length}</Text>
        </View>
      </View>

      <ScrollView scrollY className={styles.content}>
        {activeTab === 'flows' && (
          <View className={styles.listContainer}>
            {flows.length === 0 ? (
              <View className={styles.emptyState}>
                <Text className={styles.emptyIcon}>📋</Text>
                <Text className={styles.emptyText}>暂无流水记录</Text>
              </View>
            ) : (
              flows.map((flow: FlowRecord) => (
                <View
                  key={`${flow.source}-${flow.id}`}
                  className={styles.flowCard}
                  onClick={() => handleViewFlowDetail(flow)}
                >
                  <View className={styles.flowHeader}>
                    <View className={styles.flowInfo}>
                      <Text className={styles.flowTitle}>
                        {flow.description || (flow.type === 'income' ? '收入' : '支出')}
                      </Text>
                      <Text className={styles.flowTime}>
                        {formatDateTime(flow.transactionTime || flow.createdAt)}
                      </Text>
                    </View>
                    <View className={styles.flowRight}>
                      <Text
                        className={classnames(
                          styles.flowAmount,
                          flow.type === 'income' ? styles.income : styles.expense
                        )}
                      >
                        {flow.type === 'income' ? '+' : '-'}{formatCurrency(flow.amount)}
                      </Text>
                      <Text className={styles.flowSource}>
                        {flow.source === 'platform' ? '平台' : '摄影师'}
                      </Text>
                    </View>
                  </View>
                  {flow.orderNo && (
                    <View className={styles.flowOrder}>
                      <Text className={styles.orderLabel}>订单号：</Text>
                      <Text className={styles.orderValue}>{flow.orderNo}</Text>
                    </View>
                  )}
                </View>
              ))
            )}
          </View>
        )}

        {activeTab === 'discrepancies' && (
          <View className={styles.listContainer}>
            {discrepancies.length === 0 ? (
              <View className={styles.emptyState}>
                <Text className={styles.emptyIcon}>✅</Text>
                <Text className={styles.emptyText}>暂无差异记录</Text>
              </View>
            ) : (
              discrepancies.map((disc: DiscrepancyRecord) => (
                <View
                  key={disc.id}
                  className={styles.discrepancyCard}
                  onClick={() => handleViewDiscrepancy(disc)}
                >
                  <View className={styles.discHeader}>
                    <View className={styles.discTypeRow}>
                      <Text className={styles.discType}>{DISCREPANCY_TYPE_TEXT[disc.type]}</Text>
                      <Text
                        className={styles.discStatus}
                        style={{ color: DISCREPANCY_STATUS_COLOR[disc.status] }}
                      >
                        {DISCREPANCY_STATUS_TEXT[disc.status]}
                      </Text>
                    </View>
                    <Text className={styles.discAmount}>
                      差额 <Text className={styles.bold}>{formatCurrency(disc.diffAmount)}</Text>
                    </Text>
                  </View>
                  <View className={styles.discBody}>
                    <View className={styles.descItem}>
                      <Text className={styles.descLabel}>订单号：</Text>
                      <Text className={styles.descValue} numberOfLines={1}>
                        {disc.orderNo}
                      </Text>
                    </View>
                    <View className={styles.descItem}>
                      <Text className={styles.descLabel}>平台金额：</Text>
                      <Text className={styles.descValue}>
                        {formatCurrency(disc.platformAmount)}
                      </Text>
                    </View>
                    <View className={styles.descItem}>
                      <Text className={styles.descLabel}>摄影师金额：</Text>
                      <Text className={styles.descValue}>
                        {formatCurrency(disc.photographerAmount)}
                      </Text>
                    </View>
                  </View>
                  <View className={styles.discFooter}>
                    <Text className={styles.discDate}>
                      发现时间：{formatDateTime(disc.createdAt)}
                    </Text>
                    <Text className={styles.arrow}>›</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default SettlementDetailPage;
