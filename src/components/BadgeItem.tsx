import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Badge } from '../utils/badges';

interface Props {
  badge: Badge;
  earned: boolean;
}

export default function BadgeItem({ badge, earned }: Props) {
  return (
    <View style={[styles.container, !earned && styles.unearned]}>
      <Text style={[styles.emoji, !earned && styles.unearnedEmoji]}>{badge.emoji}</Text>
      <Text style={[styles.title, !earned && styles.unearnedText]}>{badge.title}</Text>
      <Text style={[styles.desc, !earned && styles.unearnedText]}>{badge.description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    margin: 8,
    width: 140,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  unearned: { backgroundColor: '#F5F5F5' },
  emoji: { fontSize: 40, marginBottom: 8 },
  unearnedEmoji: { opacity: 0.3 },
  title: { fontSize: 14, fontWeight: '700', textAlign: 'center', color: '#1A1A2E' },
  desc: { fontSize: 11, textAlign: 'center', color: '#666', marginTop: 4 },
  unearnedText: { color: '#BDBDBD' },
});
