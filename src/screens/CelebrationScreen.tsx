import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, DimensionValue } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'Celebration'>;

const EMOJIS = ['🎉', '🌟', '✨', '🎊', '💰', '🏆'];

function ConfettiItem({ index }: { index: number }) {
  const anim = useRef(new Animated.Value(0)).current;
  const left = useRef(Math.floor(Math.random() * 100)).current;
  const delay = useRef(Math.random() * 1500).current;
  const duration = useRef(1500 + Math.random() * 1000).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(anim, {
        toValue: 1,
        duration: duration,
        delay: delay,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [-50, 800] });
  const opacity = anim.interpolate({ inputRange: [0, 0.8, 1], outputRange: [1, 1, 0] });

  return (
    <Animated.Text
      style={[
        styles.confettiItem,
        { left: `${left}%` as DimensionValue, transform: [{ translateY }], opacity },
      ]}
    >
      {EMOJIS[index % EMOJIS.length]}
    </Animated.Text>
  );
}

function Confetti() {
  const items = Array.from({ length: 20 }, (_, i) => i);
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {items.map((i) => (
        <ConfettiItem key={i} index={i} />
      ))}
    </View>
  );
}

export default function CelebrationScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { goalName } = route.params;

  const scale = useRef(new Animated.Value(0)).current;
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
      Animated.loop(
        Animated.timing(rotation, { toValue: 1, duration: 3000, useNativeDriver: true })
      ),
    ]).start();
  }, []);

  const spin = rotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <View style={styles.container}>
      <Confetti />

      <Animated.View style={{ transform: [{ scale }, { rotate: spin }] }}>
        <Text style={styles.trophy}>🏆</Text>
      </Animated.View>

      <Text style={styles.congrats}>Goal Achieved!</Text>
      <Text style={styles.goalName}>"{goalName}"</Text>
      <Text style={styles.sub}>You crushed it! Keep the momentum going.</Text>

      <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate('AppTabs')}>
        <Text style={styles.btnText}>Back to Dashboard</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A2E',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  trophy: { fontSize: 96 },
  congrats: {
    fontSize: 36,
    fontWeight: '900',
    color: '#FFD700',
    marginTop: 24,
    textAlign: 'center',
  },
  goalName: {
    fontSize: 20,
    color: '#fff',
    marginTop: 8,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  sub: { fontSize: 16, color: '#AAA', marginTop: 16, textAlign: 'center' },
  btn: {
    marginTop: 40,
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingHorizontal: 40,
    paddingVertical: 16,
  },
  btnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  confettiItem: { position: 'absolute', fontSize: 24 },
});
