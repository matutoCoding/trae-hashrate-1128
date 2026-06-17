import React, { useState } from 'react';
import { View, Text, ScrollView, Button } from '@tarojs/components';
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';

import { useReconcileStore } from '@/store/useReconcileStore';
import DiscrepancyCard from '@/components/DiscrepancyCard';
import {
  DISCREPANCY_TYPE_TEXT,
  DiscrepancyType,
  DiscrepancyStatus
} from '@/types/reconcile';
import { formatCurrency } from '@/utils/amount';

const DiscrepancyPage: React.FC = () => {
  const {
    discrepancies,
    loading,
    fetchDiscrepancies,
    resolveDiscrepancy,
    ignoreDiscrepancy,
    getRecentlyHandledDiscrepancies,
    initReconcile
  } = useReconcileStore();

  const [activeTab, setActiveTab] = useState<DiscrepancyStatus | 'all' | 'recent'>('pending');
  const [filterType, setFilterType] = useState<DiscrepancyType | 'all'>('all');

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
    console.log('[DiscrepancyPage] 初始化数据');
    initReconcile();
    await fetchDiscrepancies();
  };

  const pendingCount = discrepancies.filter(d => d.status === 'pending').length;
  const resolvedCount = discrepancies.filter(d => d.status === 'resolved').length;
  const ignoredCount = discrepancies.filter(d => d.status === 'ignored').length;

  const recentCount = discrepancies.filter(d => d.status !== 'pending').length;

  const getFilteredDiscrepancies = () => {
    let list = discrepancies;
    if (activeTab === 'recent') {
      list = getRecentlyHandledDiscrepancies();
    } else if (activeTab !== 'all') {
      list = list.filter(d => d.status === activeTab);
    }
    if (filterType !== 'all') {
      list = list.filter(d => d.type === filterType);
    }
    return list;
  };

  const filteredDiscrepancies = getFilteredDiscrepancies();

  const pendingDiscrepancies = discrepancies.filter(d => d.status === 'pending');
  const totalDiffAmount = pendingDiscrepancies.reduce((sum, d) => sum + Math.abs(d.diffAmount), 0);

  const handleResolve = async (id: string) => {
    Taro.showModal({
      title: '标记为已解决',
      content: '确定将此差异标记为已解决吗？请确保已完成人工核对。',
      confirmText: '确认解决',
      confirmColor: '#059669',
      success: async (res) => {
        if (res.confirm) {
          try {
            await resolveDiscrepancy(id, '人工核对后确认无误', '当前用户');
            Taro.showToast({ title: '已标记为解决', icon: 'success' });
          } catch (e) {
            console.error('[DiscrepancyPage] 解决失败:', e);
            Taro.showToast({ title: '操作失败', icon: 'error' });
          }
        }
      }
    });
  };

  const handleIgnore = async (id: string) => {
    Taro.showModal({
      title: '忽略此差异',
      content: '确定忽略此差异吗？此操作不会删除记录，仅标记为已忽略。',
      confirmText: '确认忽略',
      confirmColor: '#64748B',
      success: async (res) => {
        if (res.confirm) {
          try {
            await ignoreDiscrepancy(id, '金额较小，忽略不计', '当前用户');
            Taro.showToast({ title: '已忽略', icon: 'success' });
          } catch (e) {
            console.error('[DiscrepancyPage] 忽略失败:', e);
            Taro.showToast({ title: '操作失败', icon: 'error' });
          }
        }
      }
    });
  };

  const handleBatchResolve = async () => {
    const pendingIds = pendingDiscrepancies.map(d => d.id);
    if (pendingIds.length === 0) {
      Taro.showToast({ title: '暂无待处理差异', icon: 'none' });
      return;
    }
    Taro.showModal({
      title: '批量解决',
      content: `确定将 ${pendingIds.length} 条待处理差异全部标记为已解决吗？`,
      confirmText: '确认批量解决',
      confirmColor: '#059669',
      success: async (res) => {
        if (res.confirm) {
          try {
            for (const id of pendingIds) {
              await resolveDiscrepancy(id, '批量处理：人工核对确认', '当前用户');
            }
            Taro.showToast({ title: `已批量解决 ${pendingIds.length} 条`, icon: 'success' });
          } catch (e) {
            console.error('[DiscrepancyPage] 批量解决失败:', e);
            Taro.showToast({ title: '操作失败', icon: 'error' });
          }
        }
      }
    });
  };

  const handleBatchIgnore = async () => {
    const pendingIds = pendingDiscrepancies.map(d => d.id);
    if (pendingIds.length === 0) {
      Taro.showToast({ title: '暂无待处理差异', icon: 'none' });
      return;
    }
    Taro.showModal({
      title: '批量忽略',
      content: `确定忽略全部 ${pendingIds.length} 条待处理差异吗？`,
      confirmText: '确认批量忽略',
      confirmColor: '#64748B',
      success: async (res) => {
        if (res.confirm) {
          try {
            for (const id of pendingIds) {
              await ignoreDiscrepancy(id, '批量忽略', '当前用户');
            }
            Taro.showToast({ title: `已批量忽略 ${pendingIds.length} 条`, icon: 'success' });
          } catch (e) {
            console.error('[DiscrepancyPage] 批量忽略失败:', e);
            Taro.showToast({ title: '操作失败', icon: 'error' });
          }
        }
      }
    });
  };

  const handleViewDetail = (id: string) => {
    Taro.navigateTo({
      url: `/pages/discrepancy-detail/index?id=${id}`
    });
  };

  const discrepancyTypes: Array<DiscrepancyType | 'all'> = ['all', 'amount_mismatch', 'missing_platform', 'missing_photographer', 'type_mismatch'];

  if (loading && discrepancies.length === 0) {
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
        <Text className={styles.headerTitle}>差异处理</Text>
        <Text className={styles.headerSubtitle}>人工核对流水差异，确保账目准确</Text>
        <View className={styles.statsRow}>
          <View className={styles.statCard}>
            <Text className={styles.statValue}>{pendingCount}</Text>
            <Text className={styles.statLabel}>待处理</Text>
          </View>
          <View className={styles.statCard}>
            <Text className={styles.statValue}>{resolvedCount}</Text>
            <Text className={styles.statLabel}>已解决</Text>
          </View>
          <View className={styles.statCard}>
            <Text className={styles.statValue}>{ignoredCount}</Text>
            <Text className={styles.statLabel}>已忽略</Text>
          </View>
        </View>
      </View>

      <View className={styles.tabs}>
        <View
          className={classnames(styles.tabItem, activeTab === 'pending' && styles.active)}
          onClick={() => setActiveTab('pending')}
        >
          <Text className={styles.tabText}>待处理</Text>
          {pendingCount > 0 && (
            <View className={styles.tabBadge}>
              <Text>{pendingCount}</Text>
            </View>
          )}
        </View>
        <View
          className={classnames(styles.tabItem, activeTab === 'recent' && styles.active)}
          onClick={() => setActiveTab('recent')}
        >
          <Text className={styles.tabText}>最近处理</Text>
          {recentCount > 0 && (
            <View className={styles.tabBadge}>
              <Text>{recentCount}</Text>
            </View>
          )}
        </View>
        <View
          className={classnames(styles.tabItem, activeTab === 'resolved' && styles.active)}
          onClick={() => setActiveTab('resolved')}
        >
          <Text className={styles.tabText}>已解决</Text>
        </View>
        <View
          className={classnames(styles.tabItem, activeTab === 'ignored' && styles.active)}
          onClick={() => setActiveTab('ignored')}
        >
          <Text className={styles.tabText}>已忽略</Text>
        </View>
      </View>

      <ScrollView scrollY className={styles.content}>
        {activeTab === 'pending' && pendingDiscrepancies.length > 0 && (
          <>
            <View className={styles.summaryCard}>
              <Text className={styles.summaryTitle}>待处理差异汇总</Text>
              <View className={styles.summaryStats}>
                <View className={styles.summaryStatItem}>
                  <Text className={classnames(styles.summaryStatValue, styles.pending)}>{pendingCount}</Text>
                  <Text className={styles.summaryStatLabel}>差异条数</Text>
                </View>
                <View className={styles.summaryStatItem}>
                  <Text className={classnames(styles.summaryStatValue, styles.pending)}>{formatCurrency(totalDiffAmount)}</Text>
                  <Text className={styles.summaryStatLabel}>差额总计</Text>
                </View>
                <View className={styles.summaryStatItem}>
                  <Text className={classnames(styles.summaryStatValue, styles.pending)}>{formatCurrency(totalDiffAmount / pendingCount || 0)}</Text>
                  <Text className={styles.summaryStatLabel}>平均差额</Text>
                </View>
              </View>
            </View>

            <View className={styles.batchActions}>
              <View className={classnames(styles.batchBtn, styles.resolve)} onClick={handleBatchResolve}>
                <Text>✓</Text>
                <Text>批量解决</Text>
              </View>
              <View className={classnames(styles.batchBtn, styles.ignore)} onClick={handleBatchIgnore}>
                <Text>⊘</Text>
                <Text>批量忽略</Text>
              </View>
            </View>
          </>
        )}

        {activeTab === 'pending' && totalDiffAmount > 1000 && (
          <View className={styles.actionCard}>
            <Text className={styles.actionCardTitle}>⚠️ 大额差异提醒</Text>
            <Text className={styles.actionCardDesc}>
              当前待处理差异总金额为 {formatCurrency(totalDiffAmount)}，金额较大，建议优先处理。
            </Text>
          </View>
        )}

        <View className={styles.sectionTitle}>
          <Text>{activeTab === 'pending' ? '待处理差异' : activeTab === 'resolved' ? '已解决差异' : '已忽略差异'}</Text>
          <Text className={styles.sectionAction}>共{filteredDiscrepancies.length}条</Text>
        </View>

        <View className={styles.filterBar}>
          {discrepancyTypes.map(type => (
            <View
              key={type}
              className={classnames(styles.filterChip, filterType === type && styles.active)}
              onClick={() => setFilterType(type)}
            >
              <Text>{type === 'all' ? '全部类型' : DISCREPANCY_TYPE_TEXT[type]}</Text>
            </View>
          ))}
        </View>

        <View className={styles.discrepancyList}>
          {filteredDiscrepancies.length > 0 ? (
            filteredDiscrepancies.map(discrepancy => (
              <View key={discrepancy.id}>
                <DiscrepancyCard
                  discrepancy={discrepancy}
                  onClick={() => handleViewDetail(discrepancy.id)}
                />
                {discrepancy.status === 'pending' && (
                  <View style={{ display: 'flex', gap: '12px', marginTop: '12px', marginBottom: '16px' }}>
                    <Button
                      className={classnames(styles.actionBtn, styles.btnSecondary)}
                      style={{ flex: 1, height: '64px', borderRadius: '12px' }}
                      onClick={() => handleIgnore(discrepancy.id)}
                    >
                      <Text className={styles.btnText}>忽略</Text>
                    </Button>
                    <Button
                      className={styles.actionBtn}
                      style={{ flex: 1, height: '64px', borderRadius: '12px', background: '#059669' }}
                      onClick={() => handleResolve(discrepancy.id)}
                    >
                      <Text className={styles.btnText}>标记解决</Text>
                    </Button>
                  </View>
                )}
              </View>
            ))
          ) : (
            <View className={styles.emptyState}>
              <View className={styles.emptyIcon}>
                <Text className={styles.iconText}>✅</Text>
              </View>
              <Text className={styles.emptyText}>
                {activeTab === 'pending' ? '暂无待处理差异' :
                 activeTab === 'resolved' ? '暂无已解决差异' : '暂无已忽略差异'}
              </Text>
              <Text className={styles.emptySubtext}>
                {activeTab === 'pending' ? '所有流水已核对一致' : '处理过的差异将显示在这里'}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default DiscrepancyPage;
