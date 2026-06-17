import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Button, Image } from '@tarojs/components';
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';

import { useStudioStore } from '@/store/useStudioStore';
import EquipmentList from '@/components/EquipmentList';
import StatusBadge from '@/components/StatusBadge';
import { formatCurrency } from '@/utils/amount';
import { STUDIO_STATUS_TEXT, STUDIO_STATUS_COLOR, Studio } from '@/types/studio';

const StudioDetailPage: React.FC = () => {
  const { studios, currentStudio, loading, fetchStudioById, fetchStudios } = useStudioStore();
  const [studioId, setStudioId] = useState<string>('');

  useEffect(() => {
    const id = Taro.getCurrentInstance().router?.params?.id as string;
    if (id) {
      setStudioId(id);
      initData(id);
    } else {
      Taro.showToast({ title: '参数错误', icon: 'error' });
    }
  }, []);

  useDidShow(() => {
    if (studioId && studios.length === 0) {
      fetchStudios();
    }
  });

  usePullDownRefresh(async () => {
    if (studioId) {
      await fetchStudioById(studioId);
    }
    Taro.stopPullDownRefresh();
  });

  const initData = async (id: string) => {
    console.log('[StudioDetailPage] 初始化数据:', id);
    if (studios.length === 0) {
      await fetchStudios();
    }
    await fetchStudioById(id);
  };

  const displayStudio = currentStudio || studios.find(s => s.id === studioId) || null;

  const handleBook = () => {
    if (!displayStudio) return;

    if (displayStudio.status !== 'available') {
      Taro.showToast({ title: '该影棚暂不可预约', icon: 'none' });
      return;
    }

    Taro.navigateTo({
      url: `/pages/schedule/index?studioId=${displayStudio.id}`
    });
  };

  if (loading && !displayStudio) {
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
        <Text className={styles.headerTitle}>影棚详情</Text>
        <Text className={styles.headerSubtitle}>了解影棚设施，选择合适时段</Text>
        <View className={styles.statsRow}>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{displayStudio?.area || 0}</Text>
            <Text className={styles.statLabel}>面积(㎡)</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{displayStudio?.capacity || 0}</Text>
            <Text className={styles.statLabel}>容纳人数</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{displayStudio?.equipments?.length || 0}</Text>
            <Text className={styles.statLabel}>设备种类</Text>
          </View>
        </View>
      </View>

      <ScrollView scrollY className={styles.content}>
        <View className={styles.studioCard}>
          <View className={styles.studioImage}>
            <Text className={styles.imagePlaceholder}>🎬</Text>
          </View>

          <Text className={styles.studioName}>{displayStudio?.name}</Text>

          <View className={styles.studioInfo}>
            <StatusBadge
              text={STUDIO_STATUS_TEXT[displayStudio?.status || 'available']}
              color={STUDIO_STATUS_COLOR[displayStudio?.status || 'available']}
              bgColor={`${STUDIO_STATUS_COLOR[displayStudio?.status || 'available']}1A`}
            />
            <View className={styles.infoItem}>
              <Text className={styles.infoIcon}>📐</Text>
              <Text>{displayStudio?.type}</Text>
            </View>
          </View>

          <View className={styles.priceRow}>
            <Text className={styles.priceValue}>{formatCurrency(displayStudio?.pricePerHour || 0)}</Text>
            <Text className={styles.priceUnit}>/小时</Text>
            <Text className={styles.depositText}>押金 {formatCurrency(displayStudio?.deposit || 0)}</Text>
          </View>

          <Text className={styles.studioDesc}>{displayStudio?.description}</Text>

          <View className={styles.sectionTitle}>
            <Text>影棚特色</Text>
          </View>
          <View className={styles.featuresList}>
            {displayStudio?.features?.map((feature, index) => (
              <View key={index} className={styles.featureTag}>
                <Text className={styles.featureIcon}>✓</Text>
                <Text>{feature}</Text>
              </View>
            ))}
          </View>
        </View>

        <View className={styles.contactSection}>
          <View className={styles.sectionTitle}>
            <Text>联系方式</Text>
          </View>
          <View className={styles.contactRow}>
            <View className={styles.contactIcon}>
              <Text>📍</Text>
            </View>
            <View className={styles.contactContent}>
              <Text className={styles.contactLabel}>地址</Text>
              <Text className={styles.contactValue}>{displayStudio?.address}</Text>
            </View>
          </View>
          <View className={styles.contactRow}>
            <View className={styles.contactIcon}>
              <Text>📞</Text>
            </View>
            <View className={styles.contactContent}>
              <Text className={styles.contactLabel}>联系电话</Text>
              <Text className={styles.contactValue}>{displayStudio?.contact}</Text>
            </View>
          </View>
        </View>

        <View className={styles.equipmentSection}>
          <View className={styles.sectionTitle}>
            <Text>设备清单</Text>
          </View>
          {displayStudio?.equipments && displayStudio.equipments.length > 0 ? (
            <EquipmentList equipments={displayStudio.equipments} />
          ) : (
            <Text style={{ color: '$color-text-tertiary', fontSize: '$font-size-sm' }}>暂无设备信息</Text>
          )}
        </View>
      </ScrollView>

      <View className={styles.bottomBar}>
        <View className={styles.priceInfo}>
          <Text className={styles.totalPrice}>
            {formatCurrency(displayStudio?.pricePerHour || 0)}
            <Text className={styles.priceUnit}>&nbsp;/&nbsp;小时</Text>
          </Text>
          <Text className={styles.priceTip}>超时15分钟自动释放 · 可随时取消</Text>
        </View>
        <Button
          className={classnames(styles.bookBtn, displayStudio?.status !== 'available' && styles.disabled)}
          onClick={handleBook}
          disabled={displayStudio?.status !== 'available'}
        >
          <Text className={styles.btnText}>
            {displayStudio?.status === 'available' ? '立即预约' : '暂不可用'}
          </Text>
        </Button>
      </View>
    </View>
  );
};

export default StudioDetailPage;
