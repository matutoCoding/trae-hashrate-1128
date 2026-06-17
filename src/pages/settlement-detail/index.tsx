import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Button } from '@tarojs/components';
import Taro, { useDidShow, useRouter } from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';

import { useReconcileStore } from '@/store/useReconcileStore';
import { FlowRecord, DiscrepancyRecord, SettlementSheet, SETTLEMENT_SHEET_STATUS_TEXT, SETTLEMENT_SHEET_STATUS_COLOR } from '@/types/reconcile';
import { DISCREPANCY_TYPE_TEXT, DISCREPANCY_STATUS_TEXT, DISCREPANCY_STATUS_COLOR } from '@/types/reconcile';
import { formatCurrency } from '@/utils/amount';
import { formatDateTime } from '@/utils/date';

const SettlementDetailPage: React.FC = () => {
  const router = useRouter();
  const {
    getSettlementByPhotographer,
    createSettlementSheet,
    confirmSettlementSheet,
    markSettlementPaid,
    cancelSettlementSheet,
    getSettlementSheets,
    initReconcile
  } = useReconcileStore();

  const photographerId = router.params.photographerId || '';
  const photographerName = decodeURIComponent(router.params.photographerName || '');
  const initialStartDate = router.params.startDate || '';
  const initialEndDate = router.params.endDate || '';

  const [startDate, setStartDate] = useState<string>(initialStartDate);
  const [endDate, setEndDate] = useState<string>(initialEndDate);
  const [activeTab, setActiveTab] = useState<'flows' | 'discrepancies' | 'sheets'>('sheets');

  const data = useMemo(() => {
    if (!photographerId) return null;
    return getSettlementByPhotographer(photographerId, startDate, endDate);
  }, [photographerId, startDate, endDate, getSettlementByPhotographer]);

  const sheets = useMemo(() => {
    return getSettlementSheets(photographerId);
  }, [photographerId, getSettlementSheets]);

  React.useEffect(() => {
    if (photographerName) {
      Taro.setNavigationBarTitle({ title: `${photographerName} - 结算详情` });
    }
  }, [photographerName]);

  useDidShow(() => {
    initReconcile();
  });

  const handleViewFlowDetail = (flow: FlowRecord) => {
    Taro.navigateTo({
      url: `/pages/flow-detail/index?orderNo=${flow.orderNo}&source=${flow.source}`
    });
  };

  const handleViewDiscrepancy = (discrepancy: DiscrepancyRecord) => {
    Taro.navigateTo({
      url: `/pages/discrepancy-detail/index?id=${discrepancy.id}`
    });
  };

  const handleCreateSheet = () => {
    Taro.showModal({
      title: '生成结算单',
      content: `将为 ${photographerName} 生成 ${startDate} 至 ${endDate} 的结算单，确认生成？`,
      confirmText: '确认生成',
      confirmColor: '#2563EB',
      success: (res) => {
        if (res.confirm) {
          createSettlementSheet(photographerId, photographerName, startDate, endDate, '当前用户');
          Taro.showToast({ title: '结算单已生成', icon: 'success' });
          setActiveTab('sheets');
        }
      }
    });
  };

  const handleConfirmSheet = (sheetId: string) => {
    Taro.showModal({
      title: '确认结算单',
      content: '确认后将进入待打款状态，确认操作？',
      confirmText: '确认',
      confirmColor: '#2563EB',
      success: (res) => {
        if (res.confirm) {
          const ok = confirmSettlementSheet(sheetId);
          Taro.showToast({ title: ok ? '已确认，待打款' : '操作失败', icon: ok ? 'success' : 'error' });
        }
      }
    });
  };

  const handleMarkPaid = (sheetId: string) => {
    Taro.showModal({
      title: '确认打款',
      content: '确认已完成打款？此操作不可撤销。',
      confirmText: '确认打款',
      confirmColor: '#059669',
      success: (res) => {
        if (res.confirm) {
          const ok = markSettlementPaid(sheetId);
          Taro.showToast({ title: ok ? '已标记打款' : '操作失败', icon: ok ? 'success' : 'error' });
        }
      }
    });
  };

  const handleCancelSheet = (sheetId: string) => {
    Taro.showModal({
      title: '取消结算单',
      content: '确定要取消此结算单吗？',
      confirmText: '确认取消',
      confirmColor: '#DC2626',
      success: (res) => {
        if (res.confirm) {
          const ok = cancelSettlementSheet(sheetId);
          Taro.showToast({ title: ok ? '已取消' : '操作失败', icon: ok ? 'success' : 'error' });
        }
      }
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
            <Text className={styles.dateRangeLabel}>结算周期</Text>
          </View>
        </View>

        <View className={styles.datePickerRow}>
          <picker
            mode="date"
            value={startDate}
            onChange={(e) => setStartDate(e.detail.value)}
          >
            <View className={styles.datePickerItem}>
              <Text className={styles.datePickerLabel}>开始日期</Text>
              <Text className={styles.datePickerValue}>{startDate || '请选择'}</Text>
            </View>
          </picker>
          <Text className={styles.dateSeparator}>至</Text>
          <picker
            mode="date"
            value={endDate}
            onChange={(e) => setEndDate(e.detail.value)}
          >
            <View className={styles.datePickerItem}>
              <Text className={styles.datePickerLabel}>结束日期</Text>
              <Text className={styles.datePickerValue}>{endDate || '请选择'}</Text>
            </View>
          </picker>
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
          className={classnames(styles.tabItem, activeTab === 'sheets' && styles.active)}
          onClick={() => setActiveTab('sheets')}
        >
          <Text className={styles.tabText}>结算单</Text>
          <Text className={styles.tabCount}>{sheets.length}</Text>
        </View>
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
        {activeTab === 'sheets' && (
          <View className={styles.listContainer}>
            <View className={styles.createSheetCard} onClick={handleCreateSheet}>
              <View className={styles.createSheetIcon}>
                <Text className={styles.createSheetIconText}>+</Text>
              </View>
              <View className={styles.createSheetContent}>
                <Text className={styles.createSheetTitle}>生成结算单</Text>
                <Text className={styles.createSheetDesc}>
                  {startDate} 至 {endDate} 期间数据
                </Text>
              </View>
            </View>

            {sheets.length === 0 ? (
              <View className={styles.emptyState}>
                <Text className={styles.emptyIcon}>📄</Text>
                <Text className={styles.emptyText}>暂无结算单</Text>
                <Text className={styles.emptySubtext}>点击上方按钮生成结算单</Text>
              </View>
            ) : (
              sheets.map((sheet: SettlementSheet) => (
                <View key={sheet.id} className={styles.sheetCard}>
                  <View className={styles.sheetHeader}>
                    <View className={styles.sheetInfo}>
                      <Text className={styles.sheetId}>结算单 {sheet.id.slice(-6)}</Text>
                      <Text className={styles.sheetPeriod}>{sheet.startDate} 至 {sheet.endDate}</Text>
                    </View>
                    <Text
                      className={styles.sheetStatus}
                      style={{ color: SETTLEMENT_SHEET_STATUS_COLOR[sheet.status] }}
                    >
                      {SETTLEMENT_SHEET_STATUS_TEXT[sheet.status]}
                    </Text>
                  </View>

                  <View className={styles.sheetBody}>
                    <View className={styles.sheetAmountRow}>
                      <View className={styles.sheetAmountItem}>
                        <Text className={styles.sheetAmountLabel}>平台应收</Text>
                        <Text className={styles.sheetAmountValue}>{formatCurrency(sheet.platformReceivable)}</Text>
                      </View>
                      <View className={styles.sheetAmountItem}>
                        <Text className={styles.sheetAmountLabel}>摄影师应收</Text>
                        <Text className={styles.sheetAmountValue}>{formatCurrency(sheet.photographerReceivable)}</Text>
                      </View>
                    </View>
                    <View className={styles.sheetAmountRow}>
                      <View className={styles.sheetAmountItem}>
                        <Text className={styles.sheetAmountLabel}>差额调整</Text>
                        <Text className={classnames(styles.sheetAmountValue, Math.abs(sheet.diffAdjustment) > 0 && styles.hasDiff)}>
                          {sheet.diffAdjustment > 0 ? '+' : ''}{formatCurrency(sheet.diffAdjustment)}
                        </Text>
                      </View>
                      <View className={styles.sheetAmountItem}>
                        <Text className={styles.sheetAmountLabel}>调整后应付</Text>
                        <Text className={classnames(styles.sheetAmountValue, styles.bold)}>
                          {formatCurrency(sheet.adjustedAmount)}
                        </Text>
                      </View>
                    </View>
                    {sheet.pendingDiscrepancyCount > 0 && (
                      <View className={styles.sheetWarning}>
                        <Text className={styles.sheetWarningText}>
                          尚有 {sheet.pendingDiscrepancyCount} 条待处理差异，建议处理后再确认
                        </Text>
                      </View>
                    )}
                  </View>

                  <View className={styles.sheetFooter}>
                    <Text className={styles.sheetDate}>创建时间：{formatDateTime(sheet.createdAt)}</Text>
                    <View className={styles.sheetActions}>
                      {sheet.status === 'draft' && (
                        <>
                          <Button
                            className={classnames(styles.sheetActionBtn, styles.cancelActionBtn)}
                            onClick={() => handleCancelSheet(sheet.id)}
                          >
                            <Text>取消</Text>
                          </Button>
                          <Button
                            className={classnames(styles.sheetActionBtn, styles.confirmActionBtn)}
                            onClick={() => handleConfirmSheet(sheet.id)}
                          >
                            <Text>确认</Text>
                          </Button>
                        </>
                      )}
                      {sheet.status === 'pending_payment' && (
                        <>
                          <Button
                            className={classnames(styles.sheetActionBtn, styles.cancelActionBtn)}
                            onClick={() => handleCancelSheet(sheet.id)}
                          >
                            <Text>取消</Text>
                          </Button>
                          <Button
                            className={classnames(styles.sheetActionBtn, styles.paidActionBtn)}
                            onClick={() => handleMarkPaid(sheet.id)}
                          >
                            <Text>确认打款</Text>
                          </Button>
                        </>
                      )}
                      {sheet.status === 'paid' && (
                        <Text className={styles.sheetPaidLabel}>已打款 {sheet.paidAt ? formatDateTime(sheet.paidAt) : ''}</Text>
                      )}
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

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
