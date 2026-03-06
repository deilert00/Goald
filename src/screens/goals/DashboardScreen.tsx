import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
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

      {loading ? (
        <ActivityIndicator style={{ flex: 1 }} size="large" color="#4CAF50" />
      ) : goals.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🌱</Text>
          <Text style={styles.emptyText}>No goals yet. Create your first goal!</Text>
        </View>
      ) : (
        <FlatList
          data={goals}
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
