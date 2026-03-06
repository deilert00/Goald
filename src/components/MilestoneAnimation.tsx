import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { ThemeType, getTheme, calculateProgressStage } from '../types/Theme';

interface Props {
  progress: number; // 0 to 1  
  theme?: ThemeType; // Visual theme for the goal
  showLabel?: boolean; // Whether to show progress label
}

function getStageInfo(progress: number, progressStage: number, theme: ThemeType) {
  const themeData = getTheme(theme);
  
  // Stage-based labels
  if (progress >= 1) return { emoji: '🏆', label: 'Goal Complete!', color: '#FFD700' };
  if (progressStage >= 7) return { emoji: themeData.emoji, label: 'Almost there!', color: '#FF6B35' };
  if (progressStage >= 4) return { emoji: themeData.emoji, label: 'Halfway there!', color: '#4CAF50' };
  if (progressStage >= 1) return { emoji: themeData.emoji, label: 'Making progress', color: '#8BC34A' };
  return { emoji: '🌱', label: 'Just getting started', color: '#9E9E9E' };
}

export default function MilestoneAnimation({ 
  progress, 
  theme = 'tree',
  showLabel = true,
}: Props) {
  const anim = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const rotation = useRef(new Animated.Value(0)).current;

  const progressPercent = progress * 100;
  const progressStage = calculateProgressStage(progressPercent);
  const stage = getStageInfo(progress, progressStage, theme);
  
  // TODO: Check if Lottie file exists for this theme and stage
  // For now, we use emoji-based fallback
  // Future: const lottieSource = require(`../../assets/animations/${theme}/stage-${progressStage}.json`);

  useEffect(() => {
    anim.setValue(1);
    translateY.setValue(0);
    rotation.setValue(0);

    if (progress >= 1) {
      // Completed: Continuous rotation
      Animated.loop(
        Animated.timing(rotation, { toValue: 1, duration: 1000, useNativeDriver: true })
      ).start();
    } else if (progressStage >= 7) {
      // High progress: Bounce animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(translateY, { toValue: -10, duration: 400, useNativeDriver: true }),
          Animated.timing(translateY, { toValue: 0, duration: 400, useNativeDriver: true }),
        ])
      ).start();
    } else if (progressStage >= 4) {
      // Mid progress: Gentle bounce with slight rotation
      Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(translateY, { toValue: -5, duration: 500, useNativeDriver: true }),
            Animated.timing(translateY, { toValue: 0, duration: 500, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(rotation, { toValue: 0.05, duration: 500, useNativeDriver: true }),
            Animated.timing(rotation, { toValue: 0, duration: 500, useNativeDriver: true }),
          ]),
        ])
      ).start();
    } else {
      // Low progress: Breathing animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, { toValue: 1.2, duration: 600, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [progress, progressStage]);

  const spin = rotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const gentleRotate = rotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '20deg'] });

  return (
    <View style={styles.container}>
      {/* TODO: Add Lottie animation when assets are available */}
      <Animated.Text
        style={[
          styles.emoji,
          {
            transform: [
              { scale: anim },
              { translateY },
              { rotate: progress >= 1 ? spin : gentleRotate },
            ],
          },
        ]}
      >
        {stage.emoji}
      </Animated.Text>
      
      {showLabel && (
        <View style={styles.labelContainer}>
          <Text style={[styles.label, { color: stage.color }]}>{stage.label}</Text>
          <Text style={styles.stageText}>Stage {progressStage + 1} of 11</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    alignItems: 'center', 
    paddingVertical: 12,
    minHeight: 120,
    justifyContent: 'center',
  },
  lottie: {
    width: 200,
    height: 200,
  },
  emoji: { fontSize: 64 },
  labelContainer: { 
    marginTop: 8, 
    alignItems: 'center',
  },
  label: { 
    fontSize: 16, 
    fontWeight: '600',
    marginBottom: 4,
  },
  stageText: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
  },
});
