import React from 'react';
import { View, Text, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';
import { Studio, STUDIO_STATUS_TEXT, STUDIO_STATUS_COLOR } from '@/types/studio';
import StatusBadge from '@/components/StatusBadge';
import { formatCurrency } from '@/utils/amount';

interface StudioCardProps {
  studio: Studio;
  onClick?: () => void;
  showStatus?: boolean;
}

const StudioCard: React.FC<StudioCardProps> = ({ studio, onClick, showStatus = true }) => {
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      Taro.navigateTo({
        url: `/pages/studio-detail/index?id=${studio.id}`
      });
    }
  };

  const statusColor = STUDIO_STATUS_COLOR[studio.status];

  return (
    <View className={styles.card} onClick={handleClick}>
      <View className={styles.imageContainer}>
        <Image
          className={styles.image}
          src={`https://picsum.photos/id/${studio.imageIds[0]}/400/240`}
          mode="aspectFill"
        />
        {showStatus && (
          <View className={styles.statusBadge}>
            <StatusBadge
              text={STUDIO_STATUS_TEXT[studio.status]}
              color={statusColor}
              bgColor={`${statusColor}1A`}
              size="sm"
            />
          </View>
        )}
      </View>

      <View className={styles.content}>
        <View className={styles.header}>
          <Text className={styles.name}>{studio.name}</Text>
          <Text className={styles.price}>{formatCurrency(studio.pricePerHour)}<Text className={styles.priceUnit}>/小时</Text></Text>
        </View>

        <View className={styles.meta}>
          <Text className={styles.type}>{studio.type}</Text>
          <Text className={styles.dot}>·</Text>
          <Text className={styles.area}>{studio.area}㎡</Text>
          <Text className={styles.dot}>·</Text>
          <Text className={styles.capacity}>容纳{studio.capacity}人</Text>
        </View>

        <View className={styles.features}>
          {studio.features.slice(0, 4).map((feature, index) => (
            <View key={index} className={styles.featureTag}>
              <Text className={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>

        <View className={styles.footer}>
          <Text className={styles.address}>{studio.address}</Text>
          <Text className={styles.deposit}>押金 {formatCurrency(studio.deposit)}</Text>
        </View>
      </View>
    </View>
  );
};

export default StudioCard;
