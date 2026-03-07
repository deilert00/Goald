import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
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
import AppButton from '../../components/AppButton';
import SidebarNav from '../../components/SidebarNav';
import { formatCurrency, parseNumberInput } from '../../utils/format';
import { captureError, trackEvent } from '../../services/telemetryService';
import { showToast } from '../../services/toastService';

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
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const didCompleteRef = useRef(false);

  const target = parseNumberInput(targetAmount);
  const monthly = parseNumberInput(monthlyContribution);
  const rate = parseNumberInput(annualInterestRate);
  const estimatedMonths =
    target > 0 && monthly > 0 ? estimateCompletionMonths(0, target, monthly, rate) : null;

  const trimmedName = name.trim();
  const hasAnyInput =
    trimmedName.length > 0 ||
    targetAmount.trim().length > 0 ||
    monthlyContribution.trim().length > 0 ||
    annualInterestRate.trim().length > 0 ||
    timelineMonths.trim().length > 0;

  useEffect(() => {
    trackEvent('create_goal_opened');
  }, []);

  useEffect(() => {
    return () => {
      if (!didCompleteRef.current && hasAnyInput) {
        trackEvent('create_goal_abandoned', { hadInput: true });
      }
    };
  }, [hasAnyInput]);

  const fieldErrors = {
    name: submitAttempted && !trimmedName ? 'Goal name is required.' : '',
    targetAmount:
      submitAttempted && target <= 0 ? 'Enter a target amount greater than zero.' : '',
    monthlyContribution:
      submitAttempted && monthly <= 0
        ? 'Enter a monthly contribution greater than zero.'
        : '',
  };

  async function handleCreate() {
    setSubmitAttempted(true);

    const currentFieldErrors = {
      name: !trimmedName ? 'Goal name is required.' : '',
      targetAmount: target <= 0 ? 'Enter a target amount greater than zero.' : '',
      monthlyContribution:
        monthly <= 0 ? 'Enter a monthly contribution greater than zero.' : '',
    };

    if (
      currentFieldErrors.name ||
      currentFieldErrors.targetAmount ||
      currentFieldErrors.monthlyContribution
    ) {
      showToast('Please fix the highlighted fields and try again.', 'error');
      return;
    }
    if (!user) {
      showToast('Please log in again before creating a goal.', 'error');
      return;
    }

    setLoading(true);
    try {
      const goalId = await createGoal(user.uid, {
        name: trimmedName,
        targetAmount: target,
        monthlyContribution: monthly,
        annualInterestRate: rate,
        visualTheme,
        ...(timelineMonths ? { timelineMonths: parseInt(timelineMonths) } : {}),
      });
      await scheduleMonthlyReminder(trimmedName).catch(() => {});
      trackEvent('goal_created', { theme: visualTheme });
      didCompleteRef.current = true;
      showToast('Goal created successfully.', 'success');
      navigation.replace('GoalDetail', { goalId });
    } catch (e: any) {
      captureError('create_goal_submit', e);
      showToast(e?.message ?? 'Failed to create goal.', 'error');
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
        <SidebarNav
          onDashboard={() => navigation.navigate('AppTabs', { screen: 'Dashboard' })}
          onBadges={() => navigation.navigate('AppTabs', { screen: 'Badges' })}
        />

        <ThemeSelector 
          selectedTheme={visualTheme}
          onSelectTheme={setVisualTheme}
        />

        <View style={styles.hintCard}>
          <Text style={styles.hintTitle}>Input guidance</Text>
          <Text style={styles.hintLine}>• Placeholder text shows examples only.</Text>
          <Text style={styles.hintLine}>• Empty fields are not treated as defaults.</Text>
          <Text style={styles.hintLine}>• Entered amounts are previewed with commas below.</Text>
        </View>

        <Text style={styles.label}>Goal Name *</Text>
        <TextInput
          style={[styles.input, fieldErrors.name ? styles.inputError : undefined]}
          value={name}
          onChangeText={(value) => setName(value)}
          placeholder="e.g. Emergency Fund"
          placeholderTextColor="#9BA7A0"
        />
        {fieldErrors.name ? <Text style={styles.errorText}>{fieldErrors.name}</Text> : null}
        {!fieldErrors.name && !!trimmedName ? (
          <Text style={styles.enteredText}>Entered: {trimmedName}</Text>
        ) : (
          <Text style={styles.exampleText}>Example: Emergency Fund</Text>
        )}

        <Text style={styles.label}>Target Amount ($) *</Text>
        <TextInput
          style={[styles.input, fieldErrors.targetAmount ? styles.inputError : undefined]}
          value={targetAmount}
          onChangeText={setTargetAmount}
          placeholder="10000"
          placeholderTextColor="#9BA7A0"
          keyboardType="numeric"
        />
        {fieldErrors.targetAmount ? (
          <Text style={styles.errorText}>{fieldErrors.targetAmount}</Text>
        ) : null}
        {target > 0 ? (
          <Text style={styles.enteredText}>Entered: {formatCurrency(target)}</Text>
        ) : (
          <Text style={styles.exampleText}>Example only, not pre-filled: {formatCurrency(10000)}</Text>
        )}

        <Text style={styles.label}>Monthly Contribution ($) *</Text>
        <TextInput
          style={[styles.input, fieldErrors.monthlyContribution ? styles.inputError : undefined]}
          value={monthlyContribution}
          onChangeText={setMonthlyContribution}
          placeholder="500"
          placeholderTextColor="#9BA7A0"
          keyboardType="numeric"
        />
        {fieldErrors.monthlyContribution ? (
          <Text style={styles.errorText}>{fieldErrors.monthlyContribution}</Text>
        ) : null}
        {monthly > 0 ? (
          <Text style={styles.enteredText}>Entered: {formatCurrency(monthly)} / month</Text>
        ) : (
          <Text style={styles.exampleText}>Example only, not pre-filled: {formatCurrency(500)} / month</Text>
        )}

        <Text style={styles.label}>Annual Interest Rate (%)</Text>
        <TextInput
          style={styles.input}
          value={annualInterestRate}
          onChangeText={setAnnualInterestRate}
          placeholder="5"
          placeholderTextColor="#9BA7A0"
          keyboardType="numeric"
        />

        <Text style={styles.label}>Timeline (months, optional)</Text>
        <TextInput
          style={styles.input}
          value={timelineMonths}
          onChangeText={setTimelineMonths}
          placeholder="24"
          placeholderTextColor="#9BA7A0"
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

        <AppButton
          label="Create Goal"
          loading={loading}
          onPress={handleCreate}
          style={styles.btn}
          accessibilityLabel="create-goal-submit"
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FFF8', padding: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#444', marginBottom: 6, marginTop: 14 },
  hintCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDEBDD',
    borderRadius: 10,
    padding: 12,
    marginTop: 14,
  },
  hintTitle: { fontSize: 13, fontWeight: '700', color: '#2E7D32', marginBottom: 4 },
  hintLine: { fontSize: 12, color: '#4B6253', lineHeight: 18 },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
  },
  inputError: {
    borderColor: '#E53935',
    backgroundColor: '#FFF5F5',
  },
  errorText: {
    color: '#C62828',
    fontSize: 12,
    marginTop: 6,
  },
  exampleText: {
    color: '#70867A',
    fontSize: 12,
    marginTop: 6,
  },
  enteredText: {
    color: '#2E7D32',
    fontSize: 12,
    marginTop: 6,
    fontWeight: '600',
  },
  projection: {
    backgroundColor: '#E8F5E9',
    borderRadius: 10,
    padding: 14,
    marginTop: 20,
  },
  projectionText: { color: '#2E7D32', fontSize: 14, fontWeight: '600' },
  btn: { marginTop: 24 },
});
