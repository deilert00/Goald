import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { useAuth } from '../../hooks/useAuth';
import { useGoals } from '../../hooks/useGoals';
import { addDeposit } from '../../services/depositService';
import { updateGoalBalance, markGoalCompleted } from '../../services/goalService';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { computeEarnedBadges, BadgeId } from '../../utils/badges';
import {
  sendMilestoneNotification,
  sendGoalCompletedNotification,
} from '../../services/notificationService';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'Deposit'>;

export default function DepositScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { goalId } = route.params;
  const { user } = useAuth();
  const { goals } = useGoals(user?.uid ?? null);

  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  const goal = goals.find((g) => g.id === goalId);

  function getCrossedMilestones(previousProgress: number, nextProgress: number): number[] {
    const milestones = [25, 50, 75];
    return milestones.filter(
      (m) => previousProgress < m / 100 && nextProgress >= m / 100
    );
  }

  async function handleDeposit() {
    const depositAmount = parseFloat(amount);
    if (!depositAmount || depositAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    if (!user || !goal) return;

    setLoading(true);
    try {
      await addDeposit(goalId, user.uid, depositAmount, note);

      const newBalance = goal.currentBalance + depositAmount;
      await updateGoalBalance(goalId, newBalance);

      const previousProgress = goal.targetAmount > 0 ? goal.currentBalance / goal.targetAmount : 0;
      const nextProgress = goal.targetAmount > 0 ? newBalance / goal.targetAmount : 0;
      const crossedMilestones = getCrossedMilestones(previousProgress, nextProgress);

      // Update streak and stats
      const statsRef = doc(db, 'userStats', user.uid);
      const statsSnap = await getDoc(statsRef);
      const stats = statsSnap.data() ?? {
        currentStreak: 0,
        lastDepositMonth: '',
        badges: [],
        totalDeposits: 0,
      };

      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const lastMonth = stats.lastDepositMonth as string;

      let newStreak = (stats.currentStreak as number) ?? 0;
      if (lastMonth !== currentMonth) {
        if (!lastMonth) {
          newStreak = 1;
        } else {
          const last = new Date(lastMonth + '-01');
          const diffMonths =
            (now.getFullYear() - last.getFullYear()) * 12 + (now.getMonth() - last.getMonth());
          newStreak = diffMonths === 1 ? newStreak + 1 : 1;
        }
      }

      const newTotalDeposits = ((stats.totalDeposits as number) ?? 0) + 1;
      const isCompleted = newBalance >= goal.targetAmount;
      const wasBelowHalfway = goal.currentBalance / goal.targetAmount < 0.5;
      const isNowAtOrAboveHalfway = newBalance / goal.targetAmount >= 0.5;

      const goalCount = goals.length;

      const newBadges = computeEarnedBadges({
        totalDeposits: newTotalDeposits,
        currentStreak: newStreak,
        goalCount,
        hasHalfway: wasBelowHalfway && isNowAtOrAboveHalfway,
        hasCompleted: isCompleted,
        existingBadges: ((stats.badges ?? []) as BadgeId[]),
      });

      await updateDoc(statsRef, {
        currentStreak: newStreak,
        lastDepositMonth: currentMonth,
        totalDeposits: newTotalDeposits,
        badges: newBadges,
      });

      await Promise.all(
        crossedMilestones.map((milestone) =>
          sendMilestoneNotification(user.uid, goalId, goal.name, milestone).catch(() => {})
        )
      );

      if (isCompleted && !goal.completedAt) {
        await sendGoalCompletedNotification(user.uid, goalId, goal.name).catch(() => {});
        await markGoalCompleted(goalId);
        navigation.replace('Celebration', { goalId, goalName: goal.name });
      } else {
        navigation.goBack();
      }
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text style={styles.title}>Add Deposit</Text>
      {goal && (
        <Text style={styles.goalName}>
          {goal.name} — ${goal.currentBalance.toFixed(2)} / ${goal.targetAmount.toFixed(2)}
        </Text>
      )}

      <Text style={styles.label}>Deposit Amount ($)</Text>
      <TextInput
        style={styles.input}
        value={amount}
        onChangeText={setAmount}
        placeholder="100"
        keyboardType="numeric"
        autoFocus
      />

      <Text style={styles.label}>Note (optional)</Text>
      <TextInput
        style={[styles.input, styles.noteInput]}
        value={note}
        onChangeText={setNote}
        placeholder="e.g. Freelance payout"
        maxLength={120}
      />

      <TouchableOpacity style={styles.btn} onPress={handleDeposit} disabled={loading}>
        <Text style={styles.btnText}>{loading ? 'Saving…' : 'Record Deposit'}</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FFF8',
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1A1A2E',
    marginBottom: 6,
    textAlign: 'center',
  },
  goalName: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 32 },
  label: { fontSize: 14, fontWeight: '600', color: '#444', marginBottom: 8 },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 10,
    padding: 14,
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 24,
  },
  noteInput: {
    fontSize: 16,
    textAlign: 'left',
    marginBottom: 24,
  },
  btn: { backgroundColor: '#4CAF50', borderRadius: 10, padding: 16, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
