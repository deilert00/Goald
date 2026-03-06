import { User } from 'firebase/auth';
import { Timestamp } from 'firebase/firestore';
import { Goal } from './goalService';
import { Deposit } from './depositService';
import { UserStats } from '../hooks/useStreak';

function fakeTimestamp(date: Date): Timestamp {
  return {
    toDate: () => date,
    toMillis: () => date.getTime(),
    seconds: Math.floor(date.getTime() / 1000),
    nanoseconds: 0,
    isEqual: () => false,
    toJSON: () => ({ seconds: Math.floor(date.getTime() / 1000), nanoseconds: 0 }),
    valueOf: () => date.toISOString(),
  } as unknown as Timestamp;
}

const now = new Date();
const createdA = new Date(now.getTime() - 1000 * 60 * 60 * 24 * 30);
const createdB = new Date(now.getTime() - 1000 * 60 * 60 * 24 * 90);

export const e2eUser = {
  uid: 'e2e-user',
  email: 'e2e@goald.local',
} as User;

let currentUser: User | null = null;

let goals: Goal[] = [
  {
    id: 'goal-e2e-1',
    userId: e2eUser.uid,
    name: 'E2E House Fund',
    targetAmount: 10000,
    monthlyContribution: 500,
    annualInterestRate: 5,
    timelineMonths: 24,
    visualTheme: 'house',
    createdAt: fakeTimestamp(createdA),
    currentBalance: 3200,
  },
  {
    id: 'goal-e2e-2',
    userId: e2eUser.uid,
    name: 'E2E Rocket Goal',
    targetAmount: 4000,
    monthlyContribution: 300,
    annualInterestRate: 4,
    timelineMonths: 12,
    visualTheme: 'rocket',
    createdAt: fakeTimestamp(createdB),
    completedAt: fakeTimestamp(new Date(now.getTime() - 1000 * 60 * 60 * 24 * 10)),
    currentBalance: 4000,
  },
];

let deposits: Deposit[] = [
  {
    id: 'dep-e2e-1',
    goalId: 'goal-e2e-1',
    userId: e2eUser.uid,
    amount: 150,
    note: 'Seed deposit',
    date: fakeTimestamp(new Date(now.getTime() - 1000 * 60 * 60 * 24 * 2)),
  },
  {
    id: 'dep-e2e-2',
    goalId: 'goal-e2e-1',
    userId: e2eUser.uid,
    amount: 200,
    note: 'Freelance payout',
    date: fakeTimestamp(new Date(now.getTime() - 1000 * 60 * 60 * 24 * 1)),
  },
];

let stats: UserStats = {
  currentStreak: 3,
  lastDepositMonth: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
  badges: ['first_deposit', 'halfway_there'],
  totalDeposits: deposits.length,
};

const goalSubs = new Set<(goals: Goal[]) => void>();
const depositSubs = new Map<string, Set<(deposits: Deposit[]) => void>>();
const authSubs = new Set<(user: User | null) => void>();
const streakSubs = new Set<(stats: UserStats) => void>();

function notifyGoals() {
  goalSubs.forEach((cb) => cb([...goals]));
}

function notifyDeposits(goalId: string) {
  const forGoal = deposits.filter((d) => d.goalId === goalId);
  depositSubs.get(goalId)?.forEach((cb) => cb([...forGoal]));
}

function notifyAuth(user: User | null) {
  authSubs.forEach((cb) => cb(user));
}

function notifyStats() {
  streakSubs.forEach((cb) => cb({ ...stats }));
}

export function e2eAuthSubscribe(cb: (user: User | null) => void): () => void {
  authSubs.add(cb);
  cb(currentUser);
  return () => authSubs.delete(cb);
}

export function e2eAuthLogout() {
  currentUser = null;
  notifyAuth(currentUser);
}

export function e2eAuthLogin() {
  currentUser = e2eUser;
  notifyAuth(currentUser);
}

export function e2eGoalsSubscribe(userId: string, cb: (rows: Goal[]) => void): () => void {
  const emit = () => cb(goals.filter((g) => g.userId === userId));
  goalSubs.add(emit);
  emit();
  return () => goalSubs.delete(emit);
}

export function e2eGetGoals(userId: string): Goal[] {
  return goals.filter((g) => g.userId === userId);
}

export function e2eCreateGoal(userId: string, data: Omit<Goal, 'id' | 'userId' | 'createdAt' | 'currentBalance'>): string {
  const id = `goal-e2e-${Date.now()}`;
  goals = [
    ...goals,
    {
      id,
      userId,
      createdAt: fakeTimestamp(new Date()),
      currentBalance: 0,
      ...data,
    },
  ];
  notifyGoals();
  return id;
}

export function e2eUpdateGoal(goalId: string, updates: Partial<Goal>) {
  goals = goals.map((g) => (g.id === goalId ? { ...g, ...updates } : g));
  notifyGoals();
}

export function e2eDeleteGoal(goalId: string) {
  goals = goals.filter((g) => g.id !== goalId);
  deposits = deposits.filter((d) => d.goalId !== goalId);
  notifyGoals();
  notifyDeposits(goalId);
}

export function e2eDepositsSubscribe(goalId: string, cb: (rows: Deposit[]) => void): () => void {
  const existing = depositSubs.get(goalId) ?? new Set<(rows: Deposit[]) => void>();
  existing.add(cb);
  depositSubs.set(goalId, existing);
  cb(deposits.filter((d) => d.goalId === goalId));
  return () => {
    existing.delete(cb);
    if (existing.size === 0) depositSubs.delete(goalId);
  };
}

export function e2eGetDeposits(goalId: string): Deposit[] {
  return deposits.filter((d) => d.goalId === goalId);
}

export function e2eAddDeposit(goalId: string, userId: string, amount: number, note?: string): string {
  const id = `dep-e2e-${Date.now()}`;
  const row: Deposit = {
    id,
    goalId,
    userId,
    amount,
    ...(note ? { note: note.trim() } : {}),
    date: fakeTimestamp(new Date()),
  };
  deposits = [...deposits, row];
  stats = {
    ...stats,
    totalDeposits: stats.totalDeposits + 1,
  };
  notifyDeposits(goalId);
  notifyStats();
  return id;
}

export function e2eStreakSubscribe(cb: (next: UserStats) => void): () => void {
  streakSubs.add(cb);
  cb({ ...stats });
  return () => streakSubs.delete(cb);
}

export function e2eGetStreak(): UserStats {
  return { ...stats };
}
