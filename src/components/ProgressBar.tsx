import React from 'react';
import { View, StyleSheet } from 'react-native';

interface Props {
  progress: number; // 0 to 1
  color?: string;
  height?: number;
}

export default function ProgressBar({ progress, color = '#4CAF50', height = 12 }: Props) {
  const clamped = Math.min(Math.max(progress, 0), 1);
  return (
    <View style={[styles.track, { height }]}>
      <View style={[styles.fill, { width: `${clamped * 100}%`, backgroundColor: color, height }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    backgroundColor: '#E0E0E0',
    borderRadius: 6,
    overflow: 'hidden',
    width: '100%',
  },
  fill: {
    borderRadius: 6,
  },
});
