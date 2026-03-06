import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import AppButton from './AppButton';

interface SidebarNavProps {
  onDashboard: () => void;
  onBadges: () => void;
  onCreateGoal?: () => void;
}

export default function SidebarNav({ onDashboard, onBadges, onCreateGoal }: SidebarNavProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Quick Navigation</Text>
      <AppButton
        label="Dashboard"
        onPress={onDashboard}
        variant="secondary"
        style={styles.btn}
        accessibilityLabel="sidebar-dashboard"
      />
      <AppButton
        label="Badges"
        onPress={onBadges}
        variant="secondary"
        style={styles.btn}
        accessibilityLabel="sidebar-badges"
      />
      {!!onCreateGoal && (
        <AppButton
          label="Create Goal"
          onPress={onCreateGoal}
          style={styles.btn}
          accessibilityLabel="sidebar-create-goal"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DCEBDD',
    padding: 12,
    marginBottom: 12,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2E7D32',
    marginBottom: 10,
  },
  btn: {
    marginBottom: 8,
  },
});
