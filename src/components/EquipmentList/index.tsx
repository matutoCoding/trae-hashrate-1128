import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';
import { Equipment, EQUIPMENT_CATEGORY_TEXT } from '@/types/studio';

interface EquipmentListProps {
  equipments: Equipment[];
}

const EquipmentList: React.FC<EquipmentListProps> = ({ equipments }) => {
  const groupedEquipments = equipments.reduce((acc, eq) => {
    if (!acc[eq.category]) {
      acc[eq.category] = [];
    }
    acc[eq.category].push(eq);
    return acc;
  }, {} as Record<Equipment['category'], Equipment[]>);

  const categories = Object.entries(groupedEquipments) as [Equipment['category'], Equipment[]][];

  return (
    <View className={styles.container}>
      {categories.map(([category, items]) => (
        <View key={category} className={styles.categorySection}>
          <View className={styles.categoryHeader}>
            <Text className={styles.categoryTitle}>
              {EQUIPMENT_CATEGORY_TEXT[category]}
            </Text>
            <Text className={styles.categoryCount}>{items.length}种</Text>
          </View>
          <View className={styles.equipmentGrid}>
            {items.map(eq => (
              <View key={eq.id} className={styles.equipmentItem}>
                <View className={styles.equipmentInfo}>
                  <Text className={styles.equipmentName}>{eq.name}</Text>
                  {eq.description && (
                    <Text className={styles.equipmentDesc}>{eq.description}</Text>
                  )}
                </View>
                <View className={styles.equipmentQty}>
                  <Text className={styles.qtyText}>×{eq.quantity}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
};

export default EquipmentList;
