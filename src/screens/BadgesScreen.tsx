import React from 'react';
import { View, Text, FlatList, StyleSheet, SafeAreaView } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { useStreak } from '../hooks/useStreak';
import { ALL_BADGES, BadgeId } from '../utils/badges';
import BadgeItem from '../components/BadgeItem';

export default function BadgesScreen() {
  const { user } = useAuth();
  const stats = useStreak(user?.uid ?? null);

  const earnedSet = new Set<BadgeId>(stats.badges as BadgeId[]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>🏅 Badges</Text>
        <Text style={styles.sub}>
          {earnedSet.size}/{ALL_BADGES.length} earned · 🔥 {stats.currentStreak}-month streak
        </Text>
      </View>

      <FlatList
        data={ALL_BADGES}
        keyExtractor={(b) => b.id}
        numColumns={2}
        contentContainerStyle={styles.grid}
        renderItem={({ item }) => (
          <BadgeItem badge={item} earned={earnedSet.has(item.id)} />
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F0FFF0' },
  header: { padding: 20, paddingBottom: 8 },
  title: { fontSize: 28, fontWeight: '800', color: '#1A1A2E' },
  sub: { fontSize: 14, color: '#666', marginTop: 4 },
  grid: { padding: 8, alignItems: 'center' },
});
