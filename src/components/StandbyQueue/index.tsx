import React from 'react';
import { View, Text, Button } from '@tarojs/components';
import styles from './index.module.scss';
import classnames from 'classnames';
import {
  StandbyRecord,
  STANDBY_STATUS_TEXT,
  STANDBY_STATUS_COLOR
} from '@/types/standby';
import StatusBadge from '@/components/StatusBadge';
import { formatDate, formatDateTime } from '@/utils/date';

interface StandbyQueueProps {
  records: StandbyRecord[];
  onConfirm?: (id: string) => void;
  onCancel?: (id: string) => void;
}

const StandbyQueue: React.FC<StandbyQueueProps> = ({ records, onConfirm, onCancel }) => {
  const groupedByStudio = records.reduce((acc, record) => {
    const key = `${record.studioId}-${record.date}-${record.startTime}`;
    if (!acc[key]) {
      acc[key] = {
        studioId: record.studioId,
        studioName: record.studioName,
        date: record.date,
        startTime: record.startTime,
        endTime: record.endTime,
        records: []
      };
    }
    acc[key].records.push(record);
    return acc;
  }, {} as Record<string, {
    studioId: string;
    studioName: string;
    date: string;
    startTime: string;
    endTime: string;
    records: StandbyRecord[];
  }>);

  return (
    <View className={styles.container}>
      {Object.values(groupedByStudio).map(group => (
        <View key={`${group.studioId}-${group.date}`} className={styles.groupCard}>
          <View className={styles.groupHeader}>
            <View className={styles.groupInfo}>
              <Text className={styles.studioName}>{group.studioName}</Text>
              <View className={styles.timeInfo}>
                <Text className={styles.dateText}>{formatDate(group.date)}</Text>
                <Text className={styles.timeText}>{group.startTime}-{group.endTime}</Text>
              </View>
            </View>
            <View className={styles.queueCount}>
              <Text className={styles.countNum}>{group.records.length}</Text>
              <Text className={styles.countLabel}>人排队</Text>
            </View>
          </View>

          <View className={styles.queueList}>
            {group.records
              .sort((a, b) => {
                if (a.status === 'notified' && b.status !== 'notified') return -1;
                if (b.status === 'notified' && a.status !== 'notified') return 1;
                return a.queuePosition - b.queuePosition;
              })
              .map((record) => {
              const statusColor = STANDBY_STATUS_COLOR[record.status];
              const isCurrentUser = record.userId === 'user-current';
              return (
                <View key={record.id} className={classnames(styles.queueItem, isCurrentUser && styles.currentUser)}>
                  <View className={classnames(styles.positionBadge, record.queuePosition === 1 && styles.firstPosition)}>
                    <Text className={styles.positionText}>{record.queuePosition}</Text>
                  </View>

                  <View className={styles.userInfo}>
                    <Text className={styles.userName}>{record.userName}</Text>
                    <Text className={styles.userPhone}>{record.userPhone}</Text>
                    <Text className={styles.queueTime}>
                      排队时间：{formatDateTime(record.createdAt)}
                    </Text>
                  </View>

                  <View className={styles.itemRight}>
                    <StatusBadge
                      text={STANDBY_STATUS_TEXT[record.status]}
                      color={statusColor}
                      bgColor={`${statusColor}1A`}
                      size="sm"
                    />
                    {record.status === 'notified' && (
                      <View className={styles.actionButtons}>
                        {onConfirm && (
                          <Button
                            className={classnames(styles.actionBtn, styles.confirmBtn)}
                            onClick={(e) => {
                              e.stopPropagation();
                              onConfirm(record.id);
                            }}
                          >
                            <Text className={styles.btnText}>确认</Text>
                          </Button>
                        )}
                        {onCancel && (
                          <Button
                            className={classnames(styles.actionBtn, styles.cancelBtn)}
                            onClick={(e) => {
                              e.stopPropagation();
                              onCancel(record.id);
                            }}
                          >
                            <Text className={styles.btnText}>取消</Text>
                          </Button>
                        )}
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      ))}

      {records.length === 0 && (
        <View className={styles.emptyState}>
          <Text className={styles.emptyText}>暂无候补排队记录</Text>
        </View>
      )}
    </View>
  );
};

export default StandbyQueue;
