import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Button } from '@tarojs/components';
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';

import { useReconcileStore } from '@/store/useReconcileStore';
import { formatCurrency } from '@/utils/amount';
import { formatDateTime } from '@/utils/date';
import {
  DiscrepancyRecord,
  DISCREPANCY_TYPE_TEXT,
  DISCREPANCY_STATUS_TEXT,
  FLOW_TYPE_TEXT
} from '@/types/reconcile';

const DiscrepancyDetailPage: React.FC = () => {
  const {
    discrepancies,
    fetchDiscrepancies,
    resolveDiscrepancy,
    ignoreDiscrepancy,
    loading,
    initReconcile,
    getDiscrepancyById
  } = useReconcileStore();
  const [discrepancy, setDiscrepancy] = useState<DiscrepancyRecord | null>(null);
  const [id, setId] = useState<string>('');

  useEffect(() => {
    const params = Taro.getCurrentInstance().router?.params;
    const idParam = params?.id as string;
    if (idParam) {
      setId(idParam);
      loadDiscrepancyData(idParam);
    } else {
      Taro.showToast({ title: '参数错误', icon: 'error' });
    }
  }, []);

  useDidShow(() => {
    console.log('[DiscrepancyDetailPage] useDidShow');
    initReconcile();
    if (id) {
      const found = getDiscrepancyById(id);
      if (found) {
        setDiscrepancy(found);
      }
    }
  });

  usePullDownRefresh(async () => {
    if (id) {
      initReconcile();
      const found = getDiscrepancyById(id);
      if (found) {
        setDiscrepancy(found);
      }
    }
    Taro.stopPullDownRefresh();
  });

  const loadDiscrepancyData = async (idParam: string) => {
    console.log('[DiscrepancyDetailPage] 加载差异详情:', idParam);
    initReconcile();

    if (discrepancies.length === 0) {
      await fetchDiscrepancies();
    }

    const found = getDiscrepancyById(idParam);
    if (found) {
      setDiscrepancy(found);
    } else {
      Taro.showToast({ title: '差异记录不存在', icon: 'error' });
    }
  };

  const handleResolve = () => {
    Taro.showModal({
      title: '标记为已解决',
      content: '确定将此差异标记为已解决吗？请确保已完成人工核对。',
      confirmText: '确认解决',
      confirmColor: '#059669',
      success: async (res) => {
        if (res.confirm) {
          try {
            await resolveDiscrepancy(id, '人工核对后确认无误', '当前用户');
            const updated = getDiscrepancyById(id);
            if (updated) {
              setDiscrepancy(updated);
            }
            Taro.showToast({ title: '已标记为解决', icon: 'success' });
          } catch (e) {
            console.error('[DiscrepancyDetailPage] 解决失败:', e);
            Taro.showToast({ title: '操作失败', icon: 'error' });
          }
        }
      }
    });
  };

  const handleIgnore = () => {
    Taro.showModal({
      title: '忽略此差异',
      content: '确定忽略此差异吗？此操作不会删除记录，仅标记为已忽略。',
      confirmText: '确认忽略',
      confirmColor: '#64748B',
      success: async (res) => {
        if (res.confirm) {
          try {
            await ignoreDiscrepancy(id, '金额较小，忽略不计', '当前用户');
            const updated = getDiscrepancyById(id);
            if (updated) {
              setDiscrepancy(updated);
            }
            Taro.showToast({ title: '已忽略', icon: 'success' });
          } catch (e) {
            console.error('[DiscrepancyDetailPage] 忽略失败:', e);
            Taro.showToast({ title: '操作失败', icon: 'error' });
          }
        }
      }
    });
  };

  const handleViewFlow = (orderNo: string) => {
    Taro.navigateTo({
      url: `/pages/flow-detail/index?orderNo=${orderNo}`
    });
  };

  if (loading && !discrepancy) {
    return (
      <View className={styles.page}>
        <View className={styles.loadingContainer}>
          <Text className={styles.loadingText}>加载中...</Text>
        </View>
      </View>
    );
  }

  if (!discrepancy) {
    return (
      <View className={styles.page}>
        <ScrollView scrollY className={styles.content}>
          <View className={styles.emptyState}>
            <Text className={styles.emptyIcon}>📭</Text>
            <Text className={styles.emptyText}>未找到差异记录</Text>
            <Text className={styles.emptySubtext}>该差异记录不存在或已被删除</Text>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <Text className={styles.headerTitle}>差异详情</Text>
        <Text className={styles.headerSubtitle}>核对流水差异，确保账目准确</Text>
        <View className={styles.statsRow}>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{formatCurrency(Math.abs(discrepancy.diffAmount))}</Text>
            <Text className={styles.statLabel}>差异金额</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{formatCurrency(discrepancy.platformAmount)}</Text>
            <Text className={styles.statLabel}>平台金额</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{formatCurrency(discrepancy.photographerAmount)}</Text>
            <Text className={styles.statLabel}>摄影师金额</Text>
          </View>
        </View>
      </View>

      <ScrollView scrollY className={styles.content}>
        <View className={styles.infoCard}>
          <View className={styles.sectionTitle}>
            <Text>基本信息</Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>订单号</Text>
            <Text
              className={classnames(styles.infoValue, styles.infoHighlight)}
              onClick={() => handleViewFlow(discrepancy.orderNo)}
            >
              {discrepancy.orderNo}
            </Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>差异类型</Text>
            <View className={styles.infoValue}>
              <View className={styles.typeTag}>
                <Text>⚠️</Text>
                <Text>{DISCREPANCY_TYPE_TEXT[discrepancy.type]}</Text>
              </View>
            </View>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>当前状态</Text>
            <View className={styles.infoValue}>
              <View className={classnames(styles.statusTag, discrepancy.status)}>
                <Text>{discrepancy.status === 'pending' ? '⏳' : discrepancy.status === 'resolved' ? '✅' : '⊘'}</Text>
                <Text>{DISCREPANCY_STATUS_TEXT[discrepancy.status]}</Text>
              </View>
            </View>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>创建时间</Text>
            <Text className={styles.infoValue}>{formatDateTime(discrepancy.createdAt)}</Text>
          </View>
        </View>

        <View className={styles.compareCard}>
          <View className={styles.compareHeader}>
            <Text className={styles.compareTitle}>金额对比</Text>
            <Text className={styles.diffAmount}>
              {discrepancy.diffAmount > 0 ? '+' : ''}{formatCurrency(discrepancy.diffAmount)}
            </Text>
          </View>
          <View className={styles.compareContent}>
            <View className={styles.compareColumn}>
              <Text className={styles.compareLabel}>平台金额</Text>
              <Text className={classnames(styles.compareValue, styles.platform)}>{formatCurrency(discrepancy.platformAmount)}</Text>
            </View>
            <View className={styles.vsBadge}>VS</View>
            <View className={styles.compareColumn}>
              <Text className={styles.compareLabel}>摄影师金额</Text>
              <Text className={classnames(styles.compareValue, styles.photographer)}>{formatCurrency(discrepancy.photographerAmount)}</Text>
            </View>
          </View>
        </View>

        {discrepancy.remark && (
          <View className={styles.remarkSection}>
            <Text className={styles.remarkTitle}>
              <Text className={styles.remarkIcon}>📝</Text>
              差异说明
            </Text>
            <Text className={styles.remarkContent}>{discrepancy.remark}</Text>
          </View>
        )}

        {discrepancy.resolution && (
          <View className={styles.resolutionSection}>
            <Text className={styles.resolutionTitle}>
              <Text>✓</Text>
              处理结果
            </Text>
            <Text className={styles.resolutionContent}>{discrepancy.resolution}</Text>
            {discrepancy.resolvedBy && discrepancy.resolvedAt && (
              <Text className={styles.resolutionMeta}>
                由 {discrepancy.resolvedBy} 于 {formatDateTime(discrepancy.resolvedAt)} 处理
              </Text>
            )}
          </View>
        )}

        <View className={styles.flowPreview}>
          <View className={styles.sectionTitle}>
            <Text>流水明细</Text>
          </View>

          {!discrepancy.platformFlow && (
            <View className={styles.flowMissing}>
              <Text className={styles.flowMissingIcon}>⚠️</Text>
              <Text className={styles.flowMissingText}>平台缺少此订单的流水记录</Text>
            </View>
          )}

          {discrepancy.platformFlow && (
            <View
              className={styles.flowItem}
              onClick={() => handleViewFlow(discrepancy.platformFlow!.orderNo)}
            >
              <View className={styles.flowHeader}>
                <Text className={styles.flowSource}>
                  <Text>🏢</Text>
                  平台流水
                </Text>
                <Text className={classnames(styles.flowAmount, discrepancy.platformFlow.type)}>
                  {discrepancy.platformFlow.type === 'income' ? '+' : '-'}{formatCurrency(discrepancy.platformFlow.amount)}
                </Text>
              </View>
              <Text className={styles.flowSubject}>
                {FLOW_TYPE_TEXT[discrepancy.platformFlow.type]} · {discrepancy.platformFlow.subject}
              </Text>
              <Text className={styles.flowTime}>{formatDateTime(discrepancy.platformFlow.transactionTime)}</Text>
            </View>
          )}

          {!discrepancy.photographerFlow && (
            <View className={styles.flowMissing}>
              <Text className={styles.flowMissingIcon}>⚠️</Text>
              <Text className={styles.flowMissingText}>摄影师缺少此订单的流水记录</Text>
            </View>
          )}

          {discrepancy.photographerFlow && (
            <View
              className={styles.flowItem}
              onClick={() => handleViewFlow(discrepancy.photographerFlow!.orderNo)}
            >
              <View className={styles.flowHeader}>
                <Text className={styles.flowSource}>
                  <Text>👤</Text>
                  摄影师流水
                </Text>
                <Text className={classnames(styles.flowAmount, discrepancy.photographerFlow.type)}>
                  {discrepancy.photographerFlow.type === 'income' ? '+' : '-'}{formatCurrency(discrepancy.photographerFlow.amount)}
                </Text>
              </View>
              <Text className={styles.flowSubject}>
                {FLOW_TYPE_TEXT[discrepancy.photographerFlow.type]} · {discrepancy.photographerFlow.subject}
              </Text>
              <Text className={styles.flowTime}>{formatDateTime(discrepancy.photographerFlow.transactionTime)}</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {discrepancy.status === 'pending' && (
        <View className={styles.bottomBar}>
          <Button
            className={classnames(styles.actionBtn, styles.ignore)}
            onClick={handleIgnore}
          >
            <Text>忽略</Text>
          </Button>
          <Button
            className={classnames(styles.actionBtn, styles.resolve)}
            onClick={handleResolve}
          >
            <Text>标记解决</Text>
          </Button>
        </View>
      )}
    </View>
  );
};

export default DiscrepancyDetailPage;
