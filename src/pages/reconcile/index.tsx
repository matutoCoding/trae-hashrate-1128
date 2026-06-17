import React, { useState } from 'react';
import { View, Text, ScrollView, Button } from '@tarojs/components';
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';

import { useReconcileStore } from '@/store/useReconcileStore';
import FlowCompare from '@/components/FlowCompare';
import StatusBadge from '@/components/StatusBadge';
import { formatCurrency } from '@/utils/amount';
import { formatDate, formatDateTime } from '@/utils/date';

const ReconcilePage: React.FC = () => {
  const {
    platformFlows,
    photographerFlows,
    reconcileResults,
    loading,
    fetchFlows,
    fetchReconcileResults,
    fetchDiscrepancies,
    runReconciliation,
    getSummary
  } = useReconcileStore();

  const [activeTab, setActiveTab] = useState<'overview' | 'compare' | 'history'>('overview');
  const [reconciling, setReconciling] = useState(false);

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
    console.log('[ReconcilePage] 初始化数据');
    await fetchFlows();
    await fetchReconcileResults();
    await fetchDiscrepancies();
  };

  const summary = getSummary();

  const platformIncome = platformFlows.filter(f => f.type === 'income').reduce((sum, f) => sum + f.amount, 0);
  const platformExpense = platformFlows.filter(f => f.type === 'expense').reduce((sum, f) => sum + f.amount, 0);
  const photographerIncome = photographerFlows.filter(f => f.type === 'income').reduce((sum, f) => sum + f.amount, 0);
  const photographerExpense = photographerFlows.filter(f => f.type === 'expense').reduce((sum, f) => sum + f.amount, 0);

  const handleRunReconciliation = async () => {
    Taro.showModal({
      title: '执行对账',
      content: '确定要执行今日双向对账吗？系统将自动比对平台和摄影师的所有流水记录。',
      confirmText: '开始对账',
      confirmColor: '#059669',
      success: async (res) => {
        if (res.confirm) {
          try {
            setReconciling(true);
            const today = formatDate(new Date());
            const result = await runReconciliation(today, today);
            Taro.showToast({
              title: `对账完成，发现${result.discrepancyCount}处差异`,
              icon: result.discrepancyCount > 0 ? 'none' : 'success',
              duration: 2000
            });
            if (result.discrepancyCount > 0) {
              setTimeout(() => {
                Taro.switchTab({ url: '/pages/discrepancy/index' });
              }, 1500);
            }
          } catch (e) {
            console.error('[ReconcilePage] 对账失败:', e);
            Taro.showToast({ title: '对账失败', icon: 'error' });
          } finally {
            setReconciling(false);
          }
        }
      }
    });
  };

  const handleViewDiscrepancies = () => {
    Taro.switchTab({ url: '/pages/discrepancy/index' });
  };

  const handleViewSettlement = () => {
    Taro.navigateTo({
      url: '/pages/settlement/index'
    });
  };

  const handleViewFlowDetail = (orderNo: string) => {
    Taro.navigateTo({
      url: `/pages/flow-detail/index?orderNo=${orderNo}`
    });
  };

  if (loading && platformFlows.length === 0) {
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
        <Text className={styles.headerTitle}>双向对账</Text>
        <Text className={styles.headerSubtitle}>平台与摄影师流水自动比对</Text>
        <View className={styles.summaryRow}>
          <View className={styles.summaryCard}>
            <Text className={styles.summaryValue}>{formatCurrency(summary.platformTotal)}</Text>
            <Text className={styles.summaryLabel}>平台净额</Text>
          </View>
          <View className={styles.summaryCard}>
            <Text className={styles.summaryValue}>{formatCurrency(summary.photographerTotal)}</Text>
            <Text className={styles.summaryLabel}>摄影师净额</Text>
          </View>
          <View className={styles.summaryCard}>
            <Text className={classnames(styles.summaryValue, Math.abs(summary.diff) > 0.01 && styles.summaryValueAlert)}>
              {formatCurrency(summary.diff)}
            </Text>
            <Text className={styles.summaryLabel}>差额</Text>
          </View>
        </View>
      </View>

      <View className={styles.tabs}>
        <View
          className={classnames(styles.tabItem, activeTab === 'overview' && styles.active)}
          onClick={() => setActiveTab('overview')}
        >
          <Text className={styles.tabText}>总览</Text>
        </View>
        <View
          className={classnames(styles.tabItem, activeTab === 'compare' && styles.active)}
          onClick={() => setActiveTab('compare')}
        >
          <Text className={styles.tabText}>流水比对</Text>
        </View>
        <View
          className={classnames(styles.tabItem, activeTab === 'history' && styles.active)}
          onClick={() => setActiveTab('history')}
        >
          <Text className={styles.tabText}>对账历史</Text>
        </View>
      </View>

      <ScrollView scrollY className={styles.content}>
        {activeTab === 'overview' && (
          <>
            <View className={styles.sectionTitle}>
              <Text>今日收支概览</Text>
            </View>

            <View className={styles.statGrid}>
              <View className={styles.statCard}>
                <Text className={classnames(styles.statValue, styles.income)}>{formatCurrency(platformIncome)}</Text>
                <Text className={styles.statLabel}>平台收入</Text>
                <Text className={styles.statSubvalue}>共{platformFlows.filter(f => f.type === 'income').length}笔</Text>
              </View>
              <View className={styles.statCard}>
                <Text className={classnames(styles.statValue, styles.expense)}>{formatCurrency(platformExpense)}</Text>
                <Text className={styles.statLabel}>平台支出</Text>
                <Text className={styles.statSubvalue}>共{platformFlows.filter(f => f.type === 'expense').length}笔</Text>
              </View>
              <View className={styles.statCard}>
                <Text className={classnames(styles.statValue, styles.income)}>{formatCurrency(photographerIncome)}</Text>
                <Text className={styles.statLabel}>摄影师收入</Text>
                <Text className={styles.statSubvalue}>共{photographerFlows.filter(f => f.type === 'income').length}笔</Text>
              </View>
              <View className={styles.statCard}>
                <Text className={classnames(styles.statValue, Math.abs(summary.diff) > 0.01 && styles.diff)}>
                  {formatCurrency(summary.diff)}
                </Text>
                <Text className={styles.statLabel}>差额</Text>
                <Text className={styles.statSubvalue}>{summary.pendingDiscrepancyCount}处待处理</Text>
              </View>
            </View>

            <View className={styles.actionCard}>
              <Text className={styles.actionCardTitle}>一键对账</Text>
              <Text className={styles.actionCardDesc}>
                系统将自动比对平台和摄影师的所有流水记录，标记差异项供人工核对。
              </Text>
              <Button
                className={styles.actionBtn}
                loading={reconciling}
                onClick={handleRunReconciliation}
              >
                <Text className={styles.btnText}>{reconciling ? '对账中...' : '开始对账'}</Text>
              </Button>
            </View>

            <View className={styles.settlementEntry} onClick={handleViewSettlement}>
              <View className={styles.settlementIcon}>
                <Text>💰</Text>
              </View>
              <View className={styles.settlementContent}>
                <Text className={styles.settlementTitle}>摄影师结算汇总</Text>
                <Text className={styles.settlementDesc}>按摄影师查看收入、支出与差异明细</Text>
              </View>
              <Text className={styles.settlementArrow}>›</Text>
            </View>

            {summary.pendingDiscrepancyCount > 0 && (
              <View className={styles.flowSection} onClick={handleViewDiscrepancies}>
                <View className={styles.sectionTitle}>
                  <Text>待处理差异</Text>
                  <Text className={styles.sectionAction}>去处理 →</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: '16px', marginTop: '8px' }}>
                  <StatusBadge
                    text={`${summary.pendingDiscrepancyCount}处待处理`}
                    color="#DC2626"
                    bgColor="rgba(220, 38, 38, 0.1)"
                    size="md"
                  />
                  <Text style={{ fontSize: '24px', color: '#64748B' }}>点击前往差异处理页面</Text>
                </View>
              </View>
            )}

            <View className={styles.flowSection}>
              <Text className={styles.flowTitle}>平台流水</Text>
              <View className={styles.flowSummary}>
                <View className={styles.flowSummaryItem}>
                  <Text className={styles.flowSummaryLabel}>总收入</Text>
                  <Text className={classnames(styles.flowSummaryValue, styles.income)}>{formatCurrency(platformIncome)}</Text>
                </View>
                <View className={styles.flowSummaryItem}>
                  <Text className={styles.flowSummaryLabel}>总支出</Text>
                  <Text className={classnames(styles.flowSummaryValue, styles.expense)}>{formatCurrency(platformExpense)}</Text>
                </View>
                <View className={styles.flowSummaryItem}>
                  <Text className={styles.flowSummaryLabel}>净额</Text>
                  <Text className={classnames(styles.flowSummaryValue, styles.net)}>{formatCurrency(platformIncome - platformExpense)}</Text>
                </View>
              </View>
            </View>

            <View className={styles.flowSection}>
              <Text className={styles.flowTitle}>摄影师流水</Text>
              <View className={styles.flowSummary}>
                <View className={styles.flowSummaryItem}>
                  <Text className={styles.flowSummaryLabel}>总收入</Text>
                  <Text className={classnames(styles.flowSummaryValue, styles.income)}>{formatCurrency(photographerIncome)}</Text>
                </View>
                <View className={styles.flowSummaryItem}>
                  <Text className={styles.flowSummaryLabel}>总支出</Text>
                  <Text className={classnames(styles.flowSummaryValue, styles.expense)}>{formatCurrency(photographerExpense)}</Text>
                </View>
                <View className={styles.flowSummaryItem}>
                  <Text className={styles.flowSummaryLabel}>净额</Text>
                  <Text className={classnames(styles.flowSummaryValue, styles.net)}>{formatCurrency(photographerIncome - photographerExpense)}</Text>
                </View>
              </View>
            </View>
          </>
        )}

        {activeTab === 'compare' && (
          <>
            <View className={styles.sectionTitle}>
              <Text>流水比对明细</Text>
              <Text className={styles.sectionAction} onClick={() => handleViewFlowDetail('all')}>查看全部</Text>
            </View>
            <FlowCompare
              platformFlows={platformFlows}
              photographerFlows={photographerFlows}
            />
          </>
        )}

        {activeTab === 'history' && (
          <>
            <View className={styles.sectionTitle}>
              <Text>对账历史记录</Text>
            </View>

            {reconcileResults.length > 0 ? (
              reconcileResults.map(result => (
                <View key={result.id} className={styles.historyCard}>
                  <View className={styles.historyHeader}>
                    <Text className={styles.historyPeriod}>{result.period}</Text>
                    <StatusBadge
                      text={result.status === 'completed' ? '已完成' : '处理中'}
                      color={result.status === 'completed' ? '#059669' : '#2563EB'}
                      bgColor={result.status === 'completed' ? 'rgba(5, 150, 105, 0.1)' : 'rgba(37, 99, 235, 0.1)'}
                      size="sm"
                    />
                  </View>

                  <View className={styles.historyStats}>
                    <View className={styles.historyStatItem}>
                      <Text className={styles.historyStatValue}>{formatCurrency(result.platformNetAmount)}</Text>
                      <Text className={styles.historyStatLabel}>平台净额</Text>
                    </View>
                    <View className={styles.historyStatItem}>
                      <Text className={styles.historyStatValue}>{formatCurrency(result.photographerNetAmount)}</Text>
                      <Text className={styles.historyStatLabel}>摄影师净额</Text>
                    </View>
                    <View className={styles.historyStatItem}>
                      <Text className={styles.historyStatValue}>{result.matchedCount}</Text>
                      <Text className={styles.historyStatLabel}>已匹配</Text>
                    </View>
                    <View className={styles.historyStatItem}>
                      <Text className={classnames(styles.historyStatValue, result.discrepancyCount > 0 && styles.alert)}>
                        {result.discrepancyCount}
                      </Text>
                      <Text className={styles.historyStatLabel}>差异</Text>
                    </View>
                  </View>

                  <Text className={styles.historyTime}>对账时间：{formatDateTime(result.completedAt || result.createdAt)}</Text>
                </View>
              ))
            ) : (
              <View className={styles.emptyState}>
                <View className={styles.emptyIcon}>
                  <Text className={styles.iconText}>📊</Text>
                </View>
                <Text className={styles.emptyText}>暂无对账记录</Text>
                <Text className={styles.emptySubtext}>点击"开始对账"执行首次对账</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
};

export default ReconcilePage;
