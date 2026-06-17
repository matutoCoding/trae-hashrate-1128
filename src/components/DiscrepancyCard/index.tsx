import React from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';
import {
  DiscrepancyRecord,
  DISCREPANCY_TYPE_TEXT,
  DISCREPANCY_STATUS_TEXT,
  DISCREPANCY_STATUS_COLOR
} from '@/types/reconcile';
import StatusBadge from '@/components/StatusBadge';
import { formatCurrency } from '@/utils/amount';
import { formatDateTime } from '@/utils/date';

interface DiscrepancyCardProps {
  discrepancy: DiscrepancyRecord;
  onClick?: () => void;
}

const DiscrepancyCard: React.FC<DiscrepancyCardProps> = ({ discrepancy, onClick }) => {
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      Taro.navigateTo({
        url: `/pages/discrepancy-detail/index?id=${discrepancy.id}`
      });
    }
  };

  const statusColor = DISCREPANCY_STATUS_COLOR[discrepancy.status];

  return (
    <View className={styles.card} onClick={handleClick}>
      <View className={styles.header}>
        <View className={styles.orderInfo}>
          <Text className={styles.orderNo}>{discrepancy.orderNo}</Text>
          <StatusBadge
            text={DISCREPANCY_TYPE_TEXT[discrepancy.type]}
            color={discrepancy.status === 'pending' ? '#DC2626' : '#94A3B8'}
            bgColor={discrepancy.status === 'pending' ? 'rgba(220, 38, 38, 0.1)' : 'rgba(148, 163, 184, 0.1)'}
            size="sm"
          />
        </View>
        <StatusBadge
          text={DISCREPANCY_STATUS_TEXT[discrepancy.status]}
          color={statusColor}
          bgColor={`${statusColor}1A`}
          size="sm"
        />
      </View>

      <View className={styles.amountRow}>
        <View className={styles.amountItem}>
          <Text className={styles.amountLabel}>平台金额</Text>
          <Text className={classnames(styles.amountValue, discrepancy.platformAmount >= 0 ? styles.income : styles.expense)}>
            {formatCurrency(discrepancy.platformAmount)}
          </Text>
        </View>
        <View className={styles.vsIcon}>
          <Text className={styles.vsText}>VS</Text>
        </View>
        <View className={styles.amountItem}>
          <Text className={styles.amountLabel}>摄影师金额</Text>
          <Text className={classnames(styles.amountValue, discrepancy.photographerAmount >= 0 ? styles.income : styles.expense)}>
            {formatCurrency(discrepancy.photographerAmount)}
          </Text>
        </View>
      </View>

      <View className={styles.diffRow}>
        <Text className={styles.diffLabel}>差额</Text>
        <Text className={classnames(styles.diffValue, discrepancy.diffAmount !== 0 && styles.diffAlert)}>
          {formatCurrency(discrepancy.diffAmount)}
        </Text>
      </View>

      <View className={styles.remarkRow}>
        <Text className={styles.remarkText}>{discrepancy.remark}</Text>
      </View>

      <View className={styles.footer}>
        <Text className={styles.time}>{formatDateTime(discrepancy.createdAt)}</Text>
        {discrepancy.status !== 'pending' && (
          <Text className={styles.resolvedBy}>处理人：{discrepancy.resolvedBy}</Text>
        )}
      </View>
    </View>
  );
};

export default DiscrepancyCard;
