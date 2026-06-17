import React from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import styles from './index.module.scss';
import classnames from 'classnames';
import { FlowRecord, FLOW_TYPE_TEXT } from '@/types/reconcile';
import StatusBadge from '@/components/StatusBadge';
import { formatCurrency } from '@/utils/amount';
import { formatDateTime } from '@/utils/date';

interface FlowCompareProps {
  platformFlows: FlowRecord[];
  photographerFlows: FlowRecord[];
}

const FlowCompare: React.FC<FlowCompareProps> = ({ platformFlows, photographerFlows }) => {
  const mergedFlows: Array<{
    orderNo: string;
    platformFlow?: FlowRecord;
    photographerFlow?: FlowRecord;
    matched: boolean;
  }> = [];

  const platformMap = new Map(platformFlows.map(f => [f.orderNo, f]));
  const photographerMap = new Map(photographerFlows.map(f => [f.orderNo, f]));
  const allOrderNos = new Set([...platformMap.keys(), ...photographerMap.keys()]);

  allOrderNos.forEach(orderNo => {
    const pf = platformMap.get(orderNo);
    const phf = photographerMap.get(orderNo);
    const matched = pf && phf && Math.abs(pf.amount - phf.amount) < 0.01 && pf.type === phf.type;
    mergedFlows.push({
      orderNo,
      platformFlow: pf,
      photographerFlow: phf,
      matched: !!matched
    });
  });

  mergedFlows.sort((a, b) => {
    const aTime = a.platformFlow?.transactionTime || a.photographerFlow?.transactionTime || '';
    const bTime = b.platformFlow?.transactionTime || b.photographerFlow?.transactionTime || '';
    return bTime.localeCompare(aTime);
  });

  return (
    <View className={styles.container}>
      <View className={styles.header}>
        <View className={styles.headerCol}>
          <Text className={styles.headerText}>订单号</Text>
        </View>
        <View className={styles.headerCol}>
          <Text className={styles.headerText}>平台流水</Text>
        </View>
        <View className={styles.headerCol}>
          <Text className={styles.headerText}>摄影师流水</Text>
        </View>
        <View className={styles.headerCol}>
          <Text className={styles.headerText}>状态</Text>
        </View>
      </View>

      <ScrollView scrollY className={styles.list}>
        {mergedFlows.map(item => (
          <View key={item.orderNo} className={classnames(styles.row, !item.matched && styles.rowMismatch)}>
            <View className={styles.col}>
              <Text className={styles.orderNo}>{item.orderNo}</Text>
              <Text className={styles.time}>
                {formatDateTime(item.platformFlow?.transactionTime || item.photographerFlow?.transactionTime || '')}
              </Text>
            </View>

            <View className={styles.col}>
              {item.platformFlow ? (
                <>
                  <Text className={classnames(
                    styles.amount,
                    item.platformFlow.type === 'income' ? styles.income : styles.expense
                  )}>
                    {formatCurrency(item.platformFlow.amount)}
                  </Text>
                  <Text className={styles.typeText}>{FLOW_TYPE_TEXT[item.platformFlow.type]}</Text>
                </>
              ) : (
                <Text className={styles.missingText}>—</Text>
              )}
            </View>

            <View className={styles.col}>
              {item.photographerFlow ? (
                <>
                  <Text className={classnames(
                    styles.amount,
                    item.photographerFlow.type === 'income' ? styles.income : styles.expense
                  )}>
                    {formatCurrency(item.photographerFlow.amount)}
                  </Text>
                  <Text className={styles.typeText}>{FLOW_TYPE_TEXT[item.photographerFlow.type]}</Text>
                </>
              ) : (
                <Text className={styles.missingText}>—</Text>
              )}
            </View>

            <View className={styles.col}>
              <StatusBadge
                text={item.matched ? '已匹配' : '不匹配'}
                color={item.matched ? '#059669' : '#DC2626'}
                bgColor={item.matched ? 'rgba(5, 150, 105, 0.1)' : 'rgba(220, 38, 38, 0.1)'}
                size="sm"
              />
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

export default FlowCompare;
