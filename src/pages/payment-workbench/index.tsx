import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Checkbox } from '@tarojs/components';
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';

import { useReconcileStore } from '@/store/useReconcileStore';
import { SettlementSheet, SETTLEMENT_SHEET_STATUS_TEXT, SETTLEMENT_SHEET_STATUS_COLOR } from '@/types/reconcile';
import { formatCurrency } from '@/utils/amount';
import { formatDateTime, formatDate } from '@/utils/date';

const PaymentWorkbenchPage: React.FC = () => {
  const { getSettlementSheets, markSettlementPaid, initReconcile, loading } = useReconcileStore();

  const [selectedPhotographer, setSelectedPhotographer] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('pending_payment');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'list' | 'batch'>('list');

  const allSheets = useMemo(() => getSettlementSheets(), [getSettlementSheets]);

  const filteredSheets = useMemo(() => {
    let result = allSheets;

    if (selectedPhotographer !== 'all') {
      result = result.filter(s => s.photographerId === selectedPhotographer);
    }

    if (selectedStatus !== 'all') {
      result = result.filter(s => s.status === selectedStatus);
    }

    if (startDate) {
      result = result.filter(s => s.startDate >= startDate);
    }
    if (endDate) {
      result = result.filter(s => s.endDate <= endDate + ' 23:59:59');
    }

    return result;
  }, [allSheets, selectedPhotographer, selectedStatus, startDate, endDate]);

  const photographers = useMemo(() => {
    const unique = new Map<string, string>();
    allSheets.forEach(s => {
      unique.set(s.photographerId, s.photographerName);
    });
    return Array.from(unique.entries()).map(([id, name]) => ({ id, name }));
  }, [allSheets]);

  const stats = useMemo(() => {
    const pending = allSheets.filter(s => s.status === 'pending_payment');
    const paid = allSheets.filter(s => s.status === 'paid');
    return {
      pendingCount: pending.length,
      pendingAmount: pending.reduce((sum, s) => sum + s.adjustedAmount, 0),
      paidCount: paid.length,
      paidAmount: paid.reduce((sum, s) => sum + s.adjustedAmount, 0),
      totalCount: filteredSheets.length,
      totalAmount: filteredSheets.reduce((sum, s) => sum + s.adjustedAmount, 0)
    };
  }, [allSheets, filteredSheets]);

  const allSelected = useMemo(() => {
    if (filteredSheets.length === 0) return false;
    return filteredSheets.every(s => selectedIds.has(s.id));
  }, [filteredSheets, selectedIds]);

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

  const handleViewDetail = (sheet: SettlementSheet) => {
    Taro.navigateTo({
      url: `/pages/settlement-detail/index?photographerId=${sheet.photographerId}&photographerName=${encodeURIComponent(sheet.photographerName)}&startDate=${sheet.startDate}&endDate=${sheet.endDate}`
    });
  };

  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      const newSet = new Set(filteredSheets.map(s => s.id));
      setSelectedIds(newSet);
    }
  };

  const handleSelectItem = (sheetId: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(sheetId)) {
      newSet.delete(sheetId);
    } else {
      newSet.add(sheetId);
    }
    setSelectedIds(newSet);
  };

  const handleBatchPay = () => {
    if (selectedIds.size === 0) {
      Taro.showToast({ title: '请选择结算单', icon: 'none' });
      return;
    }

    const pendingCount = Array.from(selectedIds).filter(id => {
      const sheet = allSheets.find(s => s.id === id);
      return sheet?.status === 'pending_payment';
    }).length;

    if (pendingCount === 0) {
      Taro.showToast({ title: '选中的单据没有待打款状态', icon: 'none' });
      return;
    }

    Taro.showModal({
      title: '批量确认打款',
      content: `确认对 ${pendingCount} 张待打款结算单执行打款操作？`,
      confirmText: '确认打款',
      confirmColor: '#059669',
      success: (res) => {
        if (res.confirm) {
          let successCount = 0;
          selectedIds.forEach(id => {
            const ok = markSettlementPaid(id);
            if (ok) successCount++;
          });
          setSelectedIds(new Set());
          Taro.showToast({ title: `已打款 ${successCount} 张`, icon: 'success' });
        }
      }
    });
  };

  const handleQuickDate = (days: number) => {
    const end = formatDate(new Date());
    const start = formatDate(new Date(Date.now() - (days - 1) * 86400000));
    setStartDate(start);
    setEndDate(end);
  };

  const quickFilter = (status: string) => {
    setSelectedStatus(status);
    setActiveTab('list');
  };

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <Text className={styles.headerTitle}>打款工作台</Text>
        <Text className={styles.headerSubtitle}>批量管理摄影师结算打款</Text>

        <View className={styles.statsRow}>
          <View className={styles.statCard}>
            <Text className={styles.statValue}>{formatCurrency(stats.pendingAmount)}</Text>
            <Text className={styles.statLabel}>待打款金额</Text>
            <Text className={styles.statCount}>{stats.pendingCount}张单据</Text>
          </View>
          <View className={styles.statCard}>
            <Text className={styles.statValue}>{formatCurrency(stats.paidAmount)}</Text>
            <Text className={styles.statLabel}>已打款金额</Text>
            <Text className={styles.statCount}>{stats.paidCount}张单据</Text>
          </View>
        </View>
      </View>

      <View className={styles.filterSection}>
        <View className={styles.quickFilters}>
          <View
            className={classnames(styles.quickFilter, selectedStatus === 'pending_payment' && styles.active)}
            onClick={() => quickFilter('pending_payment')}
          >
            <Text>待打款</Text>
          </View>
          <View
            className={classnames(styles.quickFilter, selectedStatus === 'paid' && styles.active)}
            onClick={() => quickFilter('paid')}
          >
            <Text>已打款</Text>
          </View>
          <View
            className={classnames(styles.quickFilter, selectedStatus === 'all' && styles.active)}
            onClick={() => quickFilter('all')}
          >
            <Text>全部</Text>
          </View>
        </View>

        <View className={styles.filterRow}>
          <View className={styles.filterItem}>
            <Text className={styles.filterLabel}>摄影师</Text>
            <picker
              mode="selector"
              range={['全部', ...photographers.map(p => p.name)]}
              rangeKey="name"
              value={selectedPhotographer === 'all' ? 0 : photographers.findIndex(p => p.id === selectedPhotographer) + 1}
              onChange={(e) => {
                const idx = e.detail.value;
                setSelectedPhotographer(idx === 0 ? 'all' : photographers[idx - 1].id);
              }}
            >
              <View className={styles.filterPicker}>
                <Text>{selectedPhotographer === 'all' ? '全部摄影师' : photographers.find(p => p.id === selectedPhotographer)?.name}</Text>
                <Text className={styles.pickerArrow}>›</Text>
              </View>
            </picker>
          </View>
        </View>

        <View className={styles.dateRow}>
          <View className={styles.dateItem}>
            <Text className={styles.dateLabel}>开始日期</Text>
            <picker
              mode="date"
              value={startDate}
              onChange={(e) => setStartDate(e.detail.value)}
            >
              <View className={styles.dateValue}>
                <Text>{startDate || '不限'}</Text>
              </View>
            </picker>
          </View>
          <Text className={styles.dateSeparator}>至</Text>
          <View className={styles.dateItem}>
            <Text className={styles.dateLabel}>结束日期</Text>
            <picker
              mode="date"
              value={endDate}
              onChange={(e) => setEndDate(e.detail.value)}
            >
              <View className={styles.dateValue}>
                <Text>{endDate || '不限'}</Text>
              </View>
            </picker>
          </View>
        </View>

        <View className={styles.quickDateRow}>
          <View className={styles.quickDateTag} onClick={() => handleQuickDate(7)}>
            <Text>近7天</Text>
          </View>
          <View className={styles.quickDateTag} onClick={() => handleQuickDate(30)}>
            <Text>近30天</Text>
          </View>
          <View className={styles.quickDateTag} onClick={() => { setStartDate(''); setEndDate(''); }}>
            <Text>清空</Text>
          </View>
        </View>
      </View>

      <View className={styles.toolbar}>
        <View className={styles.toolbarLeft}>
          <Text className={styles.resultCount}>共 {filteredSheets.length} 张</Text>
          <Text className={styles.resultAmount}>{formatCurrency(stats.totalAmount)}</Text>
        </View>
        <View className={styles.toolbarRight}>
          <View className={styles.batchBtn} onClick={() => setActiveTab(activeTab === 'batch' ? 'list' : 'batch')}>
            <Text>{activeTab === 'batch' ? '取消' : '批量操作'}</Text>
          </View>
        </View>
      </View>

      {activeTab === 'batch' && (
        <View className={styles.batchSelectBar}>
          <View className={styles.selectAll} onClick={handleSelectAll}>
            <Checkbox checked={allSelected} color="#2563EB" />
            <Text className={styles.selectAllText}>全选</Text>
          </View>
          <Text className={styles.selectedCount}>已选 {selectedIds.size} 张</Text>
          <View className={styles.batchPayBtn} onClick={handleBatchPay}>
            <Text>确认打款</Text>
          </View>
        </View>
      )}

      <ScrollView scrollY className={styles.listContainer}>
        {filteredSheets.length === 0 ? (
          <View className={styles.emptyState}>
            <Text className={styles.emptyIcon}>📄</Text>
            <Text className={styles.emptyText}>暂无结算单</Text>
            <Text className={styles.emptySubtext}>调整筛选条件或前往结算汇总生成</Text>
          </View>
        ) : (
          filteredSheets.map((sheet) => (
            <View
              key={sheet.id}
              className={classnames(styles.sheetCard, activeTab === 'batch' && sheet.status !== 'pending_payment' && styles.disabled)}
              onClick={() => {
                if (activeTab === 'batch') {
                  if (sheet.status === 'pending_payment') {
                    handleSelectItem(sheet.id);
                  }
                } else {
                  handleViewDetail(sheet);
                }
              }}
            >
              {activeTab === 'batch' && (
                <View className={styles.checkboxCol}>
                  <Checkbox
                    checked={selectedIds.has(sheet.id)}
                    disabled={sheet.status !== 'pending_payment'}
                    color="#2563EB"
                  />
                </View>
              )}

              <View className={styles.sheetContent}>
                <View className={styles.sheetHeader}>
                  <View className={styles.sheetPhotographer}>
                    <View className={styles.sheetAvatar}>
                      <Text>{sheet.photographerName.charAt(0)}</Text>
                    </View>
                    <View className={styles.sheetInfo}>
                      <Text className={styles.sheetName}>{sheet.photographerName}</Text>
                      <Text className={styles.sheetPeriod}>{sheet.startDate} ~ {sheet.endDate}</Text>
                    </View>
                  </View>
                  <Text
                    className={styles.sheetStatus}
                    style={{ color: SETTLEMENT_SHEET_STATUS_COLOR[sheet.status] }}
                  >
                    {SETTLEMENT_SHEET_STATUS_TEXT[sheet.status]}
                  </Text>
                </View>

                <View className={styles.sheetAmountRow}>
                  <View className={styles.sheetAmountItem}>
                    <Text className={styles.sheetAmountLabel}>平台应收</Text>
                    <Text className={styles.sheetAmountValue}>{formatCurrency(sheet.platformReceivable)}</Text>
                  </View>
                  <View className={styles.sheetAmountItem}>
                    <Text className={styles.sheetAmountLabel}>摄影师应收</Text>
                    <Text className={styles.sheetAmountValue}>{formatCurrency(sheet.photographerReceivable)}</Text>
                  </View>
                  <View className={styles.sheetAmountItem}>
                    <Text className={styles.sheetAmountLabel}>实付</Text>
                    <Text className={classnames(styles.sheetAmountValue, styles.bold)}>
                      {formatCurrency(sheet.adjustedAmount)}
                    </Text>
                  </View>
                </View>

                <View className={styles.sheetFooter}>
                  <View className={styles.sheetMeta}>
                    <Text className={styles.metaItem}>
                      单号：{sheet.id.slice(-10)}
                    </Text>
                    {sheet.pendingDiscrepancyCount > 0 && (
                      <Text className={styles.metaWarning}>
                        {sheet.pendingDiscrepancyCount}条待处理差异
                      </Text>
                    )}
                  </View>
                  {sheet.status === 'paid' && (
                    <View className={styles.paidInfo}>
                      <Text className={styles.paidText}>
                        打款时间：{sheet.paidAt ? formatDateTime(sheet.paidAt) : '-'}
                      </Text>
                    </View>
                  )}
                  {sheet.status !== 'paid' && (
                    <Text className={styles.arrow}>›</Text>
                  )}
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {activeTab === 'batch' && selectedIds.size > 0 && (
        <View className={styles.bottomAction}>
          <Text className={styles.bottomInfo}>
            已选 <Text className={styles.bold}>{selectedIds.size}</Text> 张，共
            <Text className={styles.bold}> {formatCurrency(
              Array.from(selectedIds).reduce((sum, id) => {
                const s = allSheets.find(x => x.id === id);
                return sum + (s?.adjustedAmount || 0);
              }, 0)
            )}</Text>
          </Text>
          <View className={styles.bottomPayBtn} onClick={handleBatchPay}>
            <Text>批量打款</Text>
          </View>
        </View>
      )}
    </View>
  );
};

export default PaymentWorkbenchPage;
