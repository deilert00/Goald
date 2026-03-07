import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'Landing'> };

export default function LandingScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.heroBackdrop}>
        <View style={styles.blobMint} />
        <View style={styles.blobGold} />
        <View style={styles.blobSky} />
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.logo}>🌟</Text>
        <Text style={styles.title}>Visual Compounding</Text>
        <Text style={styles.subtitle}>Save with momentum, not just math.</Text>

        <View style={styles.artBoard}>
          <View style={styles.artCenter}>
            <Text style={styles.artCenterEmoji}>🎉</Text>
            <Text style={styles.artCenterText}>Goal Complete</Text>
          </View>

          <View style={[styles.goalBubble, styles.homeBubble]}>
            <Text style={styles.goalEmoji}>🏡</Text>
            <Text style={styles.goalLabel}>Home</Text>
          </View>

          <View style={[styles.goalBubble, styles.carBubble]}>
            <Text style={styles.goalEmoji}>🚗</Text>
            <Text style={styles.goalLabel}>Car</Text>
          </View>

          <View style={[styles.goalBubble, styles.vacationBubble]}>
            <Text style={styles.goalEmoji}>🏖️</Text>
            <Text style={styles.goalLabel}>Vacation</Text>
          </View>

          <View style={[styles.goalBubble, styles.savingsBubble]}>
            <Text style={styles.goalEmoji}>💰</Text>
            <Text style={styles.goalLabel}>Savings</Text>
          </View>
        </View>

        <Text style={styles.description}>
          Build multiple goals, watch each milestone come alive, and celebrate progress with
          streaks and badges that keep you motivated.
        </Text>

        <View style={styles.featureList}>
          <Text style={styles.feature}>• Progress visuals that feel rewarding</Text>
          <Text style={styles.feature}>• Smart projections for every contribution</Text>
          <Text style={styles.feature}>• Home, car, vacation, and savings goal journeys</Text>
        </View>

        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => navigation.navigate('Register')}
          accessibilityLabel="landing-register-btn"
        >
          <Text style={styles.primaryBtnText}>Create Account</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => navigation.navigate('Login')}
          accessibilityLabel="landing-login-btn"
        >
          <Text style={styles.secondaryBtnText}>Log In</Text>
        </TouchableOpacity>

        <Text style={styles.footerText}>Celebrate every deposit, not just the finish line.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F8FCF5',
  },
  heroBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 420,
  },
  blobMint: {
    position: 'absolute',
    top: -120,
    left: -40,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#D7F3D2',
  },
  blobGold: {
    position: 'absolute',
    top: -70,
    right: -70,
    width: 290,
    height: 290,
    borderRadius: 145,
    backgroundColor: '#F9E7B2',
  },
  blobSky: {
    position: 'absolute',
    top: 140,
    alignSelf: 'center',
    width: 320,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#D9EEFF',
  },
  container: {
    paddingHorizontal: 24,
    paddingTop: 34,
    paddingBottom: 28,
  },
  logo: {
    fontSize: 40,
    textAlign: 'center',
    marginBottom: 6,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#13311D',
    textAlign: 'center',
    letterSpacing: 0.4,
  },
  subtitle: {
    fontSize: 16,
    color: '#296B2D',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 18,
    fontWeight: '600',
  },
  artBoard: {
    height: 255,
    borderRadius: 24,
    backgroundColor: '#FFFFFFD9',
    borderWidth: 1,
    borderColor: '#D4E6D4',
    marginBottom: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  artCenter: {
    position: 'absolute',
    top: 86,
    alignSelf: 'center',
    width: 120,
    height: 92,
    borderRadius: 18,
    backgroundColor: '#2E7D32',
    justifyContent: 'center',
    alignItems: 'center',
  },
  artCenterEmoji: { fontSize: 24, marginBottom: 2 },
  artCenterText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  goalBubble: {
    position: 'absolute',
    width: 96,
    height: 72,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  homeBubble: {
    left: 14,
    top: 18,
    backgroundColor: '#E7F6E2',
    borderColor: '#BDDAB6',
  },
  carBubble: {
    right: 14,
    top: 24,
    backgroundColor: '#FFF3D6',
    borderColor: '#E5D1A2',
  },
  vacationBubble: {
    left: 22,
    bottom: 14,
    backgroundColor: '#E1F1FF',
    borderColor: '#BED9F0',
  },
  savingsBubble: {
    right: 22,
    bottom: 18,
    backgroundColor: '#F0E8FF',
    borderColor: '#D6C4EC',
  },
  goalEmoji: { fontSize: 24 },
  goalLabel: { marginTop: 2, fontSize: 12, fontWeight: '700', color: '#274132' },
  description: {
    textAlign: 'center',
    fontSize: 15,
    color: '#35553A',
    lineHeight: 21,
    marginBottom: 16,
  },
  featureList: {
    backgroundColor: '#FFFFFFE0',
    borderWidth: 1,
    borderColor: '#D8EAD7',
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
  },
  feature: {
    fontSize: 14,
    color: '#284232',
    marginVertical: 3,
  },
  primaryBtn: {
    backgroundColor: '#2E7D32',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  secondaryBtn: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#A5C8A5',
    backgroundColor: '#F7FFF7',
  },
  secondaryBtnText: {
    color: '#2E7D32',
    fontSize: 16,
    fontWeight: '800',
  },
  footerText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#577060',
    marginTop: 14,
  },
});
