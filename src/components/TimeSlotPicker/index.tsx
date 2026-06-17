import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';
import classnames from 'classnames';
import { TimeSlot } from '@/types/booking';

interface TimeSlotPickerProps {
  slots: TimeSlot[];
  selectedSlots: string[];
  onSlotClick: (slotId: string) => void;
}

const TimeSlotPicker: React.FC<TimeSlotPickerProps> = ({
  slots, selectedSlots, onSlotClick }) => {
  const getSlotClass = (slot: TimeSlot) => {
    const isSelected = selectedSlots.includes(slot.id);
    return classnames(
      styles.slot,
      slot.status === 'booked' && styles.booked,
      slot.status === 'occupied' && styles.occupied,
      slot.status === 'released' && styles.released,
      isSelected && styles.selected,
      (slot.status === 'available' || slot.status === 'released') && styles.clickable
    );
  };

  const handleClick = (slot: TimeSlot) => {
    if (slot.status === 'booked' || slot.status === 'occupied') return;
    onSlotClick(slot.id);
  };

  return (
    <View className={styles.container}>
      <View className={styles.legend}>
        <View className={styles.legendItem}>
          <View className={classnames(styles.legendDot, styles.availableDot} />
          <Text className={styles.legendText}>可预约</Text>
        </View>
        <View className={styles.legendItem}>
          <View className={classnames(styles.legendDot, styles.releasedDot)} />
          <Text className={styles.legendText}>已释放</Text>
        </View>
        <View className={styles.legendItem}>
          <View className={classnames(styles.legendDot, styles.bookedDot} />
          <Text className={styles.legendText}>已预约</Text>
        </View>
        <View className={styles.legendItem}>
          <View className={classnames(styles.legendDot, styles.selectedDot)} />
          <Text className={styles.legendText}>已选择</Text>
        </View>
      </View>

      <View className={styles.slotGrid}>
        {slots.map(slot => (
          <View
            key={slot.id}
            className={getSlotClass(slot)}
            onClick={() => handleClick(slot)}
          >
            <Text className={styles.slotTime}>{slot.startTime}</Text>
            <Text className={styles.slotStatus}>
              {slot.status === 'available' && '可约'}
              {slot.status === 'booked' && '已约'}
              {slot.status === 'occupied' && '使用中'}
              {slot.status === 'released' && '释放'}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

export default TimeSlotPicker;
