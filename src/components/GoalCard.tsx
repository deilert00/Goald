import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Goal } from '../services/goalService';
import ProgressBar from './ProgressBar';
import MilestoneAnimation from './MilestoneAnimation';

interface Props {
  goal: Goal;
  onPress: () => void;
}

const PROGRESS_GOLD = '#FFD700';
const PROGRESS_ORANGE = '#FF6B35';
const PROGRESS_GREEN = '#4CAF50';
const PROGRESS_LIGHT_GREEN = '#8BC34A';
const PROGRESS_GOLD_DARK = '#B8860B';

function progressColor(p: number) {
  if (p >= 1) return PROGRESS_GOLD;
  if (p >= 0.66) return PROGRESS_ORANGE;
  if (p >= 0.33) return PROGRESS_GREEN;
  return PROGRESS_LIGHT_GREEN;
}

function progressLabel(p: number): { text: string; color: string } {
  if (p >= 1) return { text: '✅ Completed', color: PROGRESS_GOLD_DARK };
  if (p >= 0.75) return { text: 'Almost there!', color: PROGRESS_ORANGE };
  if (p >= 0.5) return { text: 'Halfway!', color: PROGRESS_GREEN };
  if (p >= 0.25) return { text: 'Making progress', color: '#558B2F' };
  return { text: 'Just started', color: PROGRESS_LIGHT_GREEN };
}

export default function GoalCard({ goal, onPress }: Props) {
  const progress = goal.targetAmount > 0 ? goal.currentBalance / goal.targetAmount : 0;
  const pct = Math.min(progress * 100, 100).toFixed(1);
  const label = progressLabel(progress);
  const isCompleted = progress >= 1;

  return (
    <TouchableOpacity
      style={[styles.card, isCompleted && styles.cardCompleted]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.row}>
        <Text style={styles.name} numberOfLines={1}>{goal.name}</Text>
        <View style={styles.pctBadge}>
          <Text style={[styles.pct, { color: progressColor(progress) }]}>{pct}%</Text>
        </View>
      </View>
      <ProgressBar progress={progress} color={progressColor(progress)} />
      <View style={styles.row}>
        <Text style={styles.sub}>${goal.currentBalance.toFixed(2)} saved</Text>
        <Text style={styles.sub}>of ${goal.targetAmount.toFixed(2)}</Text>
      </View>
      <View style={styles.labelRow}>
        <Text style={[styles.statusLabel, { color: label.color }]}>{label.text}</Text>
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
    borderWidth: 1,
    borderColor: 'transparent',
  },
  cardCompleted: {
    borderColor: '#FFD700',
    backgroundColor: '#FFFEF0',
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, alignItems: 'center' },
  name: { fontSize: 18, fontWeight: '700', color: '#1A1A2E', flex: 1, marginRight: 8 },
  pctBadge: {
    minWidth: 48,
    alignItems: 'flex-end',
  },
  pct: { fontSize: 16, fontWeight: '700' },
  sub: { fontSize: 13, color: '#888', marginTop: 6 },
  labelRow: { marginTop: 4, marginBottom: 4 },
  statusLabel: { fontSize: 12, fontWeight: '600' },
});
