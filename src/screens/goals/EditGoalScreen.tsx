import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { useAuth } from '../../hooks/useAuth';
import { useGoals } from '../../hooks/useGoals';
import ThemeSelector from '../../components/ThemeSelector';
import { ThemeType } from '../../types/Theme';
import {
  updateGoal,
  deleteGoalWithDeposits,
} from '../../services/goalService';
import { estimateCompletionMonths } from '../../utils/compoundInterest';
import AppButton from '../../components/AppButton';
import SidebarNav from '../../components/SidebarNav';
import { formatCurrency } from '../../utils/format';
import { captureError, trackEvent } from '../../services/telemetryService';
import { showToast } from '../../services/toastService';

type Props = NativeStackScreenProps<RootStackParamList, 'EditGoal'>;

export default function EditGoalScreen({ navigation, route }: Props) {
  const { goalId } = route.params;

  const { user } = useAuth();
  const { goals } = useGoals(user?.uid ?? null);

  const goal = useMemo(() => goals.find((g) => g.id === goalId), [goals, goalId]);

  const [name, setName] = useState(goal?.name ?? '');
  const [monthlyContribution, setMonthlyContribution] = useState(
    goal?.monthlyContribution?.toString() ?? ''
  );
  const [annualInterestRate, setAnnualInterestRate] = useState(
    goal?.annualInterestRate?.toString() ?? ''
  );
  const [timelineMonths, setTimelineMonths] = useState(goal?.timelineMonths?.toString() ?? '');
  const [visualTheme, setVisualTheme] = useState<ThemeType>(goal?.visualTheme ?? 'tree');
  const [loading, setLoading] = useState(false);
  const [wasSaved, setWasSaved] = useState(false);

  React.useEffect(() => {
    trackEvent('edit_goal_opened');
  }, []);

  React.useEffect(() => {
    if (!goal) return;
    setName(goal.name);
    setMonthlyContribution(String(goal.monthlyContribution));
    setAnnualInterestRate(String(goal.annualInterestRate));
    setTimelineMonths(goal.timelineMonths ? String(goal.timelineMonths) : '');
    setVisualTheme(goal.visualTheme ?? 'tree');
  }, [goal]);

  React.useEffect(() => {
    return () => {
      if (!wasSaved) {
        const isDirty =
          name.trim() !== (goal?.name ?? '') ||
          monthlyContribution.trim() !== String(goal?.monthlyContribution ?? '') ||
          annualInterestRate.trim() !== String(goal?.annualInterestRate ?? '') ||
          timelineMonths.trim() !== String(goal?.timelineMonths ?? '') ||
          visualTheme !== (goal?.visualTheme ?? 'tree');

        if (isDirty) {
          trackEvent('edit_goal_abandoned', { goalId });
        }
      }
    };
  }, [
    annualInterestRate,
    goal?.annualInterestRate,
    goal?.monthlyContribution,
    goal?.name,
    goal?.timelineMonths,
    goal?.visualTheme,
    goalId,
    monthlyContribution,
    name,
    timelineMonths,
    visualTheme,
    wasSaved,
  ]);

  const monthly = parseFloat(monthlyContribution) || 0;
  const rate = parseFloat(annualInterestRate) || 0;

  const estimatedMonths = useMemo(() => {
    if (!goal) return null;
    return estimateCompletionMonths(goal.currentBalance, goal.targetAmount, monthly, rate);
  }, [goal, monthly, rate]);

  async function handleSave() {
    if (!goal) return;
    if (!name.trim() || !monthlyContribution) {
      showToast('Please fill in goal name and monthly contribution.', 'error');
      return;
    }

    const timeline = timelineMonths.trim() ? parseInt(timelineMonths, 10) : undefined;
    if (timelineMonths.trim() && Number.isNaN(timeline)) {
      showToast('Timeline must be a valid number of months.', 'error');
      return;
    }

    setLoading(true);
    try {
      await updateGoal(goal.id, {
        name: name.trim(),
        monthlyContribution: monthly,
        annualInterestRate: rate,
        visualTheme,
        timelineMonths: timeline,
      });
      setWasSaved(true);
      showToast('Goal changes saved.', 'success');
      navigation.goBack();
    } catch (e: any) {
      captureError('edit_goal_save', e);
      showToast(e?.message ?? 'Failed to update goal.', 'error');
    } finally {
      setLoading(false);
    }
  }

  function handleDelete() {
    if (!goal) return;

    Alert.alert(
      'Delete Goal?',
      'This will permanently remove the goal and all associated deposits. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await deleteGoalWithDeposits(goal.id);
              setWasSaved(true);
              showToast('Goal deleted.', 'success');
              navigation.navigate('AppTabs');
            } catch (e: any) {
              captureError('edit_goal_delete', e);
              showToast(e?.message ?? 'Failed to delete goal.', 'error');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  }

  if (!goal) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Goal not found</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
        <SidebarNav
          onDashboard={() => navigation.navigate('AppTabs', { screen: 'Dashboard' })}
          onBadges={() => navigation.navigate('AppTabs', { screen: 'Badges' })}
          onCreateGoal={() => navigation.navigate('CreateGoal')}
        />

        <ThemeSelector selectedTheme={visualTheme} onSelectTheme={setVisualTheme} />

        <Text style={styles.label}>Goal Name *</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="e.g. Emergency Fund"
        />

        <Text style={styles.label}>Target Amount</Text>
        <TextInput
          style={[styles.input, styles.disabledInput]}
          value={formatCurrency(goal.targetAmount)}
          editable={false}
        />
        <Text style={styles.helperText}>Target amount is locked after goal creation.</Text>

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
              Updated estimate: {estimatedMonths} months ({(estimatedMonths / 12).toFixed(1)} years)
            </Text>
          </View>
        )}

        <AppButton
          label="Save Changes"
          loading={loading}
          onPress={handleSave}
          style={styles.saveBtn}
          accessibilityLabel="edit-goal-save"
        />

        <AppButton
          label="Delete Goal"
          variant="danger"
          disabled={loading}
          onPress={handleDelete}
          style={styles.deleteBtn}
          accessibilityLabel="edit-goal-delete"
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FFF8', padding: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: 16, color: '#777' },
  label: { fontSize: 14, fontWeight: '600', color: '#444', marginBottom: 6, marginTop: 14 },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
  },
  disabledInput: {
    color: '#777',
    backgroundColor: '#f2f2f2',
  },
  helperText: { marginTop: 6, color: '#888', fontSize: 12 },
  projection: {
    backgroundColor: '#E8F5E9',
    borderRadius: 10,
    padding: 14,
    marginTop: 20,
  },
  projectionText: { color: '#2E7D32', fontSize: 14, fontWeight: '600' },
  saveBtn: { marginTop: 24 },
  deleteBtn: { marginTop: 12 },
});
