import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

interface Props {
  progress: number; // 0 to 1
}

function getStage(progress: number) {
  if (progress >= 1) return { emoji: '🏆', label: 'Goal Complete!', color: '#FFD700' };
  if (progress >= 0.66) return { emoji: '🚀', label: 'Almost there!', color: '#FF6B35' };
  if (progress >= 0.33) return { emoji: '🌳', label: 'Growing strong', color: '#4CAF50' };
  return { emoji: '🌱', label: 'Just getting started', color: '#8BC34A' };
}

export default function MilestoneAnimation({ progress }: Props) {
  const anim = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const rotation = useRef(new Animated.Value(0)).current;

  const stage = getStage(progress);

  useEffect(() => {
    if (progress >= 1) {
      Animated.loop(
        Animated.timing(rotation, { toValue: 1, duration: 1000, useNativeDriver: true })
      ).start();
    } else if (progress >= 0.66) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(translateY, { toValue: -10, duration: 400, useNativeDriver: true }),
          Animated.timing(translateY, { toValue: 0, duration: 400, useNativeDriver: true }),
        ])
      ).start();
    } else {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, { toValue: 1.2, duration: 600, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [progress]);

  const spin = rotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <View style={styles.container}>
      <Animated.Text
        style={[
          styles.emoji,
          {
            transform: [
              { scale: anim },
              { translateY },
              { rotate: spin },
            ],
          },
        ]}
      >
        {stage.emoji}
      </Animated.Text>
      <Text style={[styles.label, { color: stage.color }]}>{stage.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', paddingVertical: 12 },
  emoji: { fontSize: 64 },
  label: { marginTop: 8, fontSize: 16, fontWeight: '600' },
});
