import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Goal } from '../services/goalService';
import ProgressBar from './ProgressBar';
import MilestoneAnimation from './MilestoneAnimation';

interface Props {
  goal: Goal;
  onPress: () => void;
}

function progressColor(p: number) {
  if (p >= 1) return '#FFD700';
  if (p >= 0.66) return '#FF6B35';
  if (p >= 0.33) return '#4CAF50';
  return '#8BC34A';
}

export default function GoalCard({ goal, onPress }: Props) {
  const progress = goal.targetAmount > 0 ? goal.currentBalance / goal.targetAmount : 0;
  const pct = Math.min(progress * 100, 100).toFixed(1);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.row}>
        <Text style={styles.name}>{goal.name}</Text>
        <Text style={styles.pct}>{pct}%</Text>
      </View>
      <ProgressBar progress={progress} color={progressColor(progress)} />
      <View style={styles.row}>
        <Text style={styles.sub}>${goal.currentBalance.toFixed(2)} saved</Text>
        <Text style={styles.sub}>Target: ${goal.targetAmount.toFixed(2)}</Text>
      </View>
      <MilestoneAnimation progress={progress} theme={goal.visualTheme} showLabel={false} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  name: { fontSize: 18, fontWeight: '700', color: '#1A1A2E' },
  pct: { fontSize: 16, fontWeight: '600', color: '#666' },
  sub: { fontSize: 13, color: '#888', marginTop: 6 },
});
