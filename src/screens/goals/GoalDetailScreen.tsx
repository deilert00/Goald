import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { useGoals } from '../../hooks/useGoals';
import { useDeposits } from '../../hooks/useDeposits';
import { useAuth } from '../../hooks/useAuth';
import ProgressBar from '../../components/ProgressBar';
import MilestoneAnimation from '../../components/MilestoneAnimation';
import { projectGrowth, estimateCompletionMonths } from '../../utils/compoundInterest';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'GoalDetail'>;

export default function GoalDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { goalId } = route.params;
  const { user } = useAuth();
  const { goals } = useGoals(user?.uid ?? null);
  const { deposits } = useDeposits(goalId);

  const goal = goals.find((g) => g.id === goalId);

  const progress = goal ? Math.min(goal.currentBalance / goal.targetAmount, 1) : 0;

  const projections = useMemo(() => {
    if (!goal) return [];
    return projectGrowth(goal.currentBalance, goal.monthlyContribution, goal.annualInterestRate, 24);
  }, [goal]);

  const estimatedMonths = useMemo(() => {
    if (!goal) return null;
    if (goal.currentBalance >= goal.targetAmount) return 0;
    return estimateCompletionMonths(
      goal.currentBalance,
      goal.targetAmount,
      goal.monthlyContribution,
      goal.annualInterestRate
    );
  }, [goal]);

  if (!goal) {
    return (
      <View style={styles.center}>
        <Text>Goal not found</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>{goal.name}</Text>

        <MilestoneAnimation progress={progress} />

        <ProgressBar progress={progress} height={16} />
        <Text style={styles.balanceText}>
          ${goal.currentBalance.toFixed(2)} / ${goal.targetAmount.toFixed(2)}
        </Text>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>${goal.monthlyContribution}/mo</Text>
            <Text style={styles.statLabel}>Contribution</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{goal.annualInterestRate}%</Text>
            <Text style={styles.statLabel}>Annual Rate</Text>
          </View>
          {estimatedMonths !== null && isFinite(estimatedMonths) && estimatedMonths > 0 && (
            <View style={styles.stat}>
              <Text style={styles.statValue}>{estimatedMonths}mo</Text>
              <Text style={styles.statLabel}>To complete</Text>
            </View>
          )}
        </View>

        {projections.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📈 24-Month Projection</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {projections.map((bal, i) => (
                <View key={i} style={styles.projItem}>
                  <Text style={styles.projMonth}>Mo {i + 1}</Text>
                  <Text style={styles.projBal}>${bal.toFixed(0)}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💳 Deposit History ({deposits.length})</Text>
          {deposits.length === 0 ? (
            <Text style={styles.empty}>No deposits yet</Text>
          ) : (
            deposits
              .slice()
              .reverse()
              .map((d) => (
                <View key={d.id} style={styles.depositRow}>
                  <Text style={styles.depositAmount}>+${d.amount.toFixed(2)}</Text>
                  <Text style={styles.depositDate}>
                    {d.date?.toDate ? d.date.toDate().toLocaleDateString() : 'Recent'}
                  </Text>
                </View>
              ))
          )}
        </View>

        <TouchableOpacity
          style={styles.depositBtn}
          onPress={() => navigation.navigate('Deposit', { goalId })}
        >
          <Text style={styles.depositBtnText}>+ Add Deposit</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FFF8' },
  container: { padding: 20, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1A1A2E',
    marginBottom: 8,
    textAlign: 'center',
  },
  balanceText: { textAlign: 'center', fontSize: 16, color: '#555', marginTop: 8, marginBottom: 16 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 16 },
  stat: { alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '700', color: '#1A1A2E' },
  statLabel: { fontSize: 12, color: '#888', marginTop: 2 },
  section: { marginTop: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#333', marginBottom: 10 },
  projItem: {
    alignItems: 'center',
    marginRight: 12,
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    padding: 8,
    minWidth: 60,
  },
  projMonth: { fontSize: 11, color: '#666' },
  projBal: { fontSize: 13, fontWeight: '600', color: '#2E7D32' },
  empty: { color: '#999', fontStyle: 'italic' },
  depositRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  depositAmount: { fontSize: 16, fontWeight: '600', color: '#4CAF50' },
  depositDate: { fontSize: 14, color: '#888' },
  depositBtn: {
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  depositBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
