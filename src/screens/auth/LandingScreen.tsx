import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'Landing'> };

export default function LandingScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.heroBackdrop}>
        <View style={styles.blobOne} />
        <View style={styles.blobTwo} />
      </View>

      <View style={styles.container}>
        <Text style={styles.logo}>💰</Text>
        <Text style={styles.title}>Visual Compounding</Text>
        <Text style={styles.subtitle}>Save with momentum, not just math.</Text>

        <Text style={styles.description}>
          Goald turns financial goals into visual journeys. Build your goal through milestones,
          earn badges, and stay motivated with every deposit.
        </Text>

        <View style={styles.featureList}>
          <Text style={styles.feature}>• Animated goal progress</Text>
          <Text style={styles.feature}>• Compound growth projections</Text>
          <Text style={styles.feature}>• Streaks, badges, and celebrations</Text>
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
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F4FBF3',
  },
  heroBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 360,
  },
  blobOne: {
    position: 'absolute',
    top: -80,
    left: -30,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: '#D9F2D8',
  },
  blobTwo: {
    position: 'absolute',
    top: 40,
    right: -60,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: '#CFEACD',
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 48,
    justifyContent: 'center',
  },
  logo: {
    fontSize: 62,
    textAlign: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 34,
    fontWeight: '900',
    color: '#163020',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 16,
    color: '#2E7D32',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 14,
    fontWeight: '600',
  },
  description: {
    textAlign: 'center',
    fontSize: 15,
    color: '#35553A',
    lineHeight: 22,
    marginBottom: 16,
  },
  featureList: {
    backgroundColor: '#FFFFFFCC',
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
});
