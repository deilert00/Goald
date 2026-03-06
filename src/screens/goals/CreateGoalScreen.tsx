import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { useAuth } from '../../hooks/useAuth';
import { createGoal } from '../../services/goalService';
import { estimateCompletionMonths } from '../../utils/compoundInterest';
import { scheduleMonthlyReminder } from '../../services/notificationService';
import { ThemeType } from '../../types/Theme';
import ThemeSelector from '../../components/ThemeSelector';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function CreateGoalScreen() {
  const navigation = useNavigation<Nav>();
  const { user } = useAuth();

  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [monthlyContribution, setMonthlyContribution] = useState('');
  const [annualInterestRate, setAnnualInterestRate] = useState('');
  const [timelineMonths, setTimelineMonths] = useState('');
    const [visualTheme, setVisualTheme] = useState<ThemeType>('tree');
  const [loading, setLoading] = useState(false);

  const target = parseFloat(targetAmount) || 0;
  const monthly = parseFloat(monthlyContribution) || 0;
  const rate = parseFloat(annualInterestRate) || 0;
  const estimatedMonths =
    target > 0 && monthly > 0 ? estimateCompletionMonths(0, target, monthly, rate) : null;

  async function handleCreate() {
    if (!name.trim() || !targetAmount || !monthlyContribution) {
      Alert.alert('Error', 'Please fill in name, target amount, and monthly contribution');
      return;
    }
    if (!user) return;

    setLoading(true);
    try {
      await createGoal(user.uid, {
        name: name.trim(),
        targetAmount: target,
        monthlyContribution: monthly,
        annualInterestRate: rate,
          visualTheme,
        ...(timelineMonths ? { timelineMonths: parseInt(timelineMonths) } : {}),
      });
      await scheduleMonthlyReminder(name.trim()).catch(() => {});
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView 
        style={styles.container} 
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <ThemeSelector 
          selectedTheme={visualTheme}
          onSelectTheme={setVisualTheme}
        />

        <Text style={styles.label}>Goal Name *</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="e.g. Emergency Fund"
        />

        <Text style={styles.label}>Target Amount ($) *</Text>
        <TextInput
          style={styles.input}
          value={targetAmount}
          onChangeText={setTargetAmount}
          placeholder="10000"
          keyboardType="numeric"
        />

        <Text style={styles.label}>Monthly Contribution ($) *</Text>
        <TextInput
          style={styles.input}
          value={monthlyContribution}
          onChangeText={setMonthlyContribution}
          placeholder="500"
          keyboardType="numeric"
        />

        <Text style={styles.label}>Annual Interest Rate (%)</Text>
        <TextInput
          style={styles.input}
          value={annualInterestRate}
          onChangeText={setAnnualInterestRate}
          placeholder="5"
          keyboardType="numeric"
        />

        <Text style={styles.label}>Timeline (months, optional)</Text>
        <TextInput
          style={styles.input}
          value={timelineMonths}
          onChangeText={setTimelineMonths}
          placeholder="24"
          keyboardType="numeric"
        />

        {estimatedMonths !== null && isFinite(estimatedMonths) && (
          <View style={styles.projection}>
            <Text style={styles.projectionText}>
              📈 Estimated completion: {estimatedMonths} months (
              {(estimatedMonths / 12).toFixed(1)} years)
            </Text>
          </View>
        )}

        <TouchableOpacity style={styles.btn} onPress={handleCreate} disabled={loading}>
          <Text style={styles.btnText}>{loading ? 'Creating…' : 'Create Goal'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FFF8', padding: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#444', marginBottom: 6, marginTop: 14 },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
  },
  projection: {
    backgroundColor: '#E8F5E9',
    borderRadius: 10,
    padding: 14,
    marginTop: 20,
  },
  projectionText: { color: '#2E7D32', fontSize: 14, fontWeight: '600' },
  btn: {
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
