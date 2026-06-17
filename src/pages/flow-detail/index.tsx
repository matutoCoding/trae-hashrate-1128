import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Button } from '@tarojs/components';
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';

import { useReconcileStore } from '@/store/useReconcileStore';
import { formatCurrency } from '@/utils/amount';
import { formatDateTime } from '@/utils/date';
import {
  FlowRecord,
  FLOW_TYPE_TEXT,
  FLOW_SOURCE_TEXT
} from '@/types/reconcile';

const FlowDetailPage: React.FC = () => {
  const { platformFlows, photographerFlows, fetchFlows, loading } = useReconcileStore();
  const [flow, setFlow] = useState<FlowRecord | null>(null);
  const [orderNo, setOrderNo] = useState<string>('');
  const [source, setSource] = useState<string>('');

  useEffect(() => {
    const params = Taro.getCurrentInstance().router?.params;
    const orderNoParam = params?.orderNo as string;
    const sourceParam = params?.source as string;
    if (orderNoParam) {
      setOrderNo(orderNoParam);
      setSource(sourceParam || '');
      loadFlowData(orderNoParam, sourceParam);
    } else {
      Taro.showToast({ title: '参数错误', icon: 'error' });
    }
  }, []);

  useDidShow(() => {
    if (orderNo && !flow) {
      loadFlowData(orderNo, source);
    }
  });

  usePullDownRefresh(async () => {
    if (orderNo) {
      await loadFlowData(orderNo, source);
    }
    Taro.stopPullDownRefresh();
  });

  const loadFlowData = async (orderNoParam: string, sourceParam?: string) => {
    console.log('[FlowDetailPage] 加载流水详情:', orderNoParam, '来源:', sourceParam);

    if (platformFlows.length === 0 || photographerFlows.length === 0) {
      await fetchFlows();
    }

    const currentPlatformFlows = useReconcileStore.getState().platformFlows;
    const currentPhotographerFlows = useReconcileStore.getState().photographerFlows;

    let foundFlow: FlowRecord | null = null;

    if (sourceParam === 'platform') {
      foundFlow = currentPlatformFlows.find(f => f.orderNo === orderNoParam) || null;
    } else if (sourceParam === 'photographer') {
      foundFlow = currentPhotographerFlows.find(f => f.orderNo === orderNoParam) || null;
    } else {
      const allFlows = [...currentPlatformFlows, ...currentPhotographerFlows];
      foundFlow = allFlows.find(f => f.orderNo === orderNoParam) || null;
    }

    if (foundFlow) {
      setFlow(foundFlow);
    } else {
      Taro.showToast({ title: '流水记录不存在', icon: 'error' });
    }
  };

  const handleViewOrder = () => {
    if (flow?.relatedBookingId) {
      console.log('[FlowDetailPage] 查看关联订单:', flow.relatedBookingId);
      Taro.showToast({ title: '订单详情开发中', icon: 'none' });
    }
  };

  if (loading && !flow) {
    return (
      <View className={styles.page}>
        <View className={styles.loadingContainer}>
          <Text className={styles.loadingText}>加载中...</Text>
        </View>
      </View>
    );
  }

  if (!flow) {
    return (
      <View className={styles.page}>
        <ScrollView scrollY className={styles.content}>
          <View className={styles.emptyState}>
            <Text className={styles.emptyIcon}>📭</Text>
            <Text className={styles.emptyText}>未找到流水记录</Text>
            <Text className={styles.emptySubtext}>该订单号对应的流水记录不存在或已被删除</Text>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <Text className={styles.headerTitle}>流水详情</Text>
        <Text className={styles.headerSubtitle}>查看交易流水的详细信息</Text>
        <View className={styles.amountSection}>
          <Text className={styles.amountLabel}>交易金额</Text>
          <Text className={classnames(styles.amountValue, flow.type)}>
            <Text className={styles.amountIcon}>{flow.type === 'income' ? '+' : '-'}</Text>
            {formatCurrency(flow.amount)}
          </Text>
        </View>
      </View>

      <ScrollView scrollY className={styles.content}>
        <View className={styles.infoCard}>
          <View className={styles.sectionTitle}>
            <Text>基本信息</Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>订单号</Text>
            <Text className={classnames(styles.infoValue, styles.infoHighlight)}>{flow.orderNo}</Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>交易类型</Text>
            <View className={styles.infoValue}>
              <View className={classnames(styles.typeTag, flow.type)}>
                <Text>{flow.type === 'income' ? '💰' : '💸'}</Text>
                <Text>{FLOW_TYPE_TEXT[flow.type]}</Text>
              </View>
            </View>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>数据来源</Text>
            <View className={styles.infoValue}>
              <View className={styles.sourceTag}>
                <Text>{flow.source === 'platform' ? '🏢' : '👤'}</Text>
                <Text>{FLOW_SOURCE_TEXT[flow.source]}</Text>
              </View>
            </View>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>交易时间</Text>
            <Text className={styles.infoValue}>{formatDateTime(flow.transactionTime)}</Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>创建时间</Text>
            <Text className={styles.infoValue}>{formatDateTime(flow.createdAt)}</Text>
          </View>
        </View>

        <View className={styles.subjectCard}>
          <Text className={styles.subjectTitle}>{flow.subject}</Text>
          <Text className={styles.subjectDesc}>{flow.description}</Text>
        </View>

        <View className={styles.infoCard}>
          <View className={styles.sectionTitle}>
            <Text>金额明细</Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>交易金额</Text>
            <Text className={classnames(styles.infoValue, flow.type === 'income' ? '' : '')}
              style={{ color: flow.type === 'income' ? '#059669' : '#DC2626', fontWeight: 700 }}>
              {flow.type === 'income' ? '+' : '-'}{formatCurrency(flow.amount)}
            </Text>
          </View>
        </View>

        {flow.relatedBookingId && (
          <View className={styles.orderSection}>
            <View className={styles.sectionTitle}>
              <Text>关联订单</Text>
            </View>
            <View className={styles.orderInfo}>
              <View className={styles.orderIcon}>📋</View>
              <View className={styles.orderDetail}>
                <Text className={styles.orderNo}>{flow.relatedBookingId}</Text>
                {flow.relatedStudioName && (
                  <Text className={styles.orderStudio}>{flow.relatedStudioName}</Text>
                )}
                {flow.photographerName && (
                  <Text className={styles.orderStudio}>摄影师: {flow.photographerName}</Text>
                )}
              </View>
              <Button
                className={styles.actionBtn}
                onClick={handleViewOrder}
              >
                <Text>查看</Text>
              </Button>
            </View>
          </View>
        )}

        <View className={styles.infoCard}>
          <View className={styles.sectionTitle}>
            <Text>主体信息</Text>
          </View>
          {flow.relatedStudioName && (
            <View className={styles.infoRow}>
              <Text className={styles.infoLabel}>影棚</Text>
              <Text className={styles.infoValue}>{flow.relatedStudioName}</Text>
            </View>
          )}
          {flow.photographerName && (
            <View className={styles.infoRow}>
              <Text className={styles.infoLabel}>摄影师</Text>
              <Text className={styles.infoValue}>{flow.photographerName}</Text>
            </View>
          )}
          {!flow.relatedStudioName && !flow.photographerName && (
            <View className={styles.infoRow}>
              <Text className={styles.infoLabel}>主体</Text>
              <Text className={styles.infoValue}>{FLOW_SOURCE_TEXT[flow.source]}</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default FlowDetailPage;
