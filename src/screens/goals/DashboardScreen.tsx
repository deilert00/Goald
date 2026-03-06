import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { useAuth } from '../../hooks/useAuth';
import { useGoals } from '../../hooks/useGoals';
import { useStreak } from '../../hooks/useStreak';
import GoalCard from '../../components/GoalCard';
import { logout } from '../../services/authService';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function DashboardScreen() {
  const navigation = useNavigation<Nav>();
  const { user } = useAuth();
  const { goals, loading } = useGoals(user?.uid ?? null);
  const stats = useStreak(user?.uid ?? null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [sortBy, setSortBy] = useState<'created' | 'progress' | 'target'>('created');

  const filteredGoals = useMemo(() => {
    let next = goals;

    if (statusFilter === 'active') {
      next = next.filter((g) => !g.completedAt);
    } else if (statusFilter === 'completed') {
      next = next.filter((g) => !!g.completedAt);
    }

    return next.slice().sort((a, b) => {
      if (sortBy === 'progress') {
        const ap = a.targetAmount > 0 ? a.currentBalance / a.targetAmount : 0;
        const bp = b.targetAmount > 0 ? b.currentBalance / b.targetAmount : 0;
        return bp - ap;
      }
      if (sortBy === 'target') {
        return b.targetAmount - a.targetAmount;
      }
      const at = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
      const bt = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
      return bt - at;
    });
  }, [goals, statusFilter, sortBy]);

  const insights = useMemo(() => {
    const totalSaved = goals.reduce((sum, g) => sum + g.currentBalance, 0);
    const totalMonthly = goals.reduce((sum, g) => sum + g.monthlyContribution, 0);
    return {
      totalSaved,
      totalMonthly,
      activeGoals: goals.filter((g) => !g.completedAt).length,
    };
  }, [goals]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>My Goals</Text>
          <Text style={styles.streak}>🔥 {stats.currentStreak}-month streak</Text>
        </View>
        <TouchableOpacity onPress={() => logout()}>
          <Text style={styles.logoutBtn}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.insightsCard}>
        <Text style={styles.insightsTitle}>Portfolio Snapshot</Text>
        <Text style={styles.insightsText}>Saved: ${insights.totalSaved.toFixed(2)}</Text>
        <Text style={styles.insightsText}>Monthly plan: ${insights.totalMonthly.toFixed(2)}/mo</Text>
        <Text style={styles.insightsText}>Active goals: {insights.activeGoals}</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.controlsRow}
      >
        <TouchableOpacity
          style={[styles.chip, statusFilter === 'all' && styles.chipActive]}
          onPress={() => setStatusFilter('all')}
          accessibilityLabel="filter-all"
        >
          <Text style={[styles.chipText, statusFilter === 'all' && styles.chipTextActive]}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.chip, statusFilter === 'active' && styles.chipActive]}
          onPress={() => setStatusFilter('active')}
          accessibilityLabel="filter-active"
        >
          <Text style={[styles.chipText, statusFilter === 'active' && styles.chipTextActive]}>
            Active
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.chip, statusFilter === 'completed' && styles.chipActive]}
          onPress={() => setStatusFilter('completed')}
          accessibilityLabel="filter-completed"
        >
          <Text
            style={[styles.chipText, statusFilter === 'completed' && styles.chipTextActive]}
          >
            Completed
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.chip, sortBy === 'created' && styles.chipActive]}
          onPress={() => setSortBy('created')}
          accessibilityLabel="sort-newest"
        >
          <Text style={[styles.chipText, sortBy === 'created' && styles.chipTextActive]}>
            Newest
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.chip, sortBy === 'progress' && styles.chipActive]}
          onPress={() => setSortBy('progress')}
          accessibilityLabel="sort-progress"
        >
          <Text style={[styles.chipText, sortBy === 'progress' && styles.chipTextActive]}>
            Progress
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.chip, sortBy === 'target' && styles.chipActive]}
          onPress={() => setSortBy('target')}
          accessibilityLabel="sort-target"
        >
          <Text style={[styles.chipText, sortBy === 'target' && styles.chipTextActive]}>Target</Text>
        </TouchableOpacity>
      </ScrollView>

      {loading ? (
        <ActivityIndicator style={{ flex: 1 }} size="large" color="#4CAF50" />
      ) : filteredGoals.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🌱</Text>
          <Text style={styles.emptyText}>No goals match this filter.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredGoals}
          keyExtractor={(g) => g.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <GoalCard
              goal={item}
              onPress={() => navigation.navigate('GoalDetail', { goalId: item.id })}
            />
          )}
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('CreateGoal')}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F0FFF0' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 8,
  },
  title: { fontSize: 28, fontWeight: '800', color: '#1A1A2E' },
  streak: { fontSize: 14, color: '#FF6B35', marginTop: 2 },
  logoutBtn: { color: '#999', fontSize: 14 },
  insightsCard: {
    marginHorizontal: 16,
    marginTop: 6,
    marginBottom: 10,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#DDF0DE',
    padding: 12,
  },
  insightsTitle: { fontSize: 14, fontWeight: '700', color: '#2E7D32', marginBottom: 4 },
  insightsText: { fontSize: 13, color: '#35553A' },
  controlsRow: {
    paddingHorizontal: 16,
    paddingBottom: 6,
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderColor: '#D2DAD3',
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
  },
  chipActive: {
    backgroundColor: '#E8F5E9',
    borderColor: '#8BC34A',
  },
  chipText: { fontSize: 12, color: '#555', fontWeight: '600' },
  chipTextActive: { color: '#2E7D32' },
  list: { padding: 16 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyEmoji: { fontSize: 64, marginBottom: 16 },
  emptyText: { fontSize: 16, color: '#666', textAlign: 'center' },
  fab: {
    position: 'absolute',
    bottom: 90,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  fabText: { fontSize: 32, color: '#fff', lineHeight: 36 },
});
