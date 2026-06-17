import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';
import classnames from 'classnames';

interface StatusBadgeProps {
  text: string;
  color?: string;
  bgColor?: string;
  size?: 'sm' | 'md';
  className?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({
  text,
  color = '#2563EB',
  bgColor = 'rgba(37, 99, 235, 0.1)',
  size = 'md',
  className
}) => {
  return (
    <View
      className={classnames(styles.badge, styles[size], className)}
      style={{ backgroundColor: bgColor, color }}
    >
      <Text className={styles.text}>{text}</Text>
    </View>
  );
};

export default StatusBadge;
