import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  getDocs,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  QueryDocumentSnapshot,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';

import { ThemeType } from '../types/Theme';
import { isE2EMode } from '../config/runtime';
import {
  e2eCreateGoal,
  e2eDeleteGoal,
  e2eGetGoals,
  e2eGoalsSubscribe,
  e2eUpdateGoal,
} from './e2eStore';

export interface Goal {
  id: string;
  userId: string;
  name: string;
  targetAmount: number;
  monthlyContribution: number;
  annualInterestRate: number;
  timelineMonths?: number;
  visualTheme: ThemeType;
  createdAt: Timestamp;
  completedAt?: Timestamp;
  currentBalance: number;
}

/** Typed shape of a goal document as stored in Firestore. */
interface GoalDocData {
  userId: string;
  name: string;
  targetAmount: number;
  monthlyContribution: number;
  annualInterestRate: number;
  timelineMonths?: number;
  visualTheme?: ThemeType;
  createdAt: Timestamp;
  completedAt?: Timestamp;
  currentBalance?: number;
}

function mapGoal(snap: QueryDocumentSnapshot): Goal {
  const d = snap.data() as GoalDocData;
  return {
    id: snap.id,
    userId: d.userId,
    name: d.name,
    targetAmount: d.targetAmount,
    monthlyContribution: d.monthlyContribution,
    annualInterestRate: d.annualInterestRate,
    timelineMonths: d.timelineMonths,
    visualTheme: d.visualTheme ?? 'tree',
    createdAt: d.createdAt,
    completedAt: d.completedAt,
    currentBalance: d.currentBalance ?? 0,
  };
}

export async function createGoal(
  userId: string,
  data: Omit<Goal, 'id' | 'userId' | 'createdAt' | 'currentBalance'>
): Promise<string> {
  if (isE2EMode) {
    return e2eCreateGoal(userId, data);
  }
  const ref = await addDoc(collection(db, 'goals'), {
    ...data,
    userId,
    currentBalance: 0,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateGoalBalance(goalId: string, newBalance: number): Promise<void> {
  if (isE2EMode) {
    e2eUpdateGoal(goalId, { currentBalance: newBalance });
    return;
  }
  await updateDoc(doc(db, 'goals', goalId), { currentBalance: newBalance });
}

export async function markGoalCompleted(goalId: string): Promise<void> {
  if (isE2EMode) {
    e2eUpdateGoal(goalId, { completedAt: Timestamp.now() });
    return;
  }
  await updateDoc(doc(db, 'goals', goalId), { completedAt: serverTimestamp() });
}

export async function updateGoal(
  goalId: string,
  updates: Partial<
    Pick<Goal, 'name' | 'monthlyContribution' | 'annualInterestRate' | 'visualTheme' | 'timelineMonths'>
  >
): Promise<void> {
  if (isE2EMode) {
    e2eUpdateGoal(goalId, updates as Partial<Goal>);
    return;
  }
  await updateDoc(doc(db, 'goals', goalId), updates);
}

export async function deleteGoal(goalId: string): Promise<void> {
  if (isE2EMode) {
    e2eDeleteGoal(goalId);
    return;
  }
  await deleteDoc(doc(db, 'goals', goalId));
}

export async function deleteGoalWithDeposits(goalId: string): Promise<void> {
  if (isE2EMode) {
    e2eDeleteGoal(goalId);
    return;
  }
  const batch = writeBatch(db);

  const depositsQuery = query(collection(db, 'deposits'), where('goalId', '==', goalId));
  const depositsSnap = await getDocs(depositsQuery);
  depositsSnap.docs.forEach((depositDoc) => {
    batch.delete(depositDoc.ref);
  });

  batch.delete(doc(db, 'goals', goalId));
  await batch.commit();
}

export function subscribeGoals(userId: string, cb: (goals: Goal[]) => void): () => void {
  if (isE2EMode) {
    return e2eGoalsSubscribe(userId, cb);
  }
  const q = query(collection(db, 'goals'), where('userId', '==', userId));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map(mapGoal));
  });
}

export async function getUserGoals(userId: string): Promise<Goal[]> {
  if (isE2EMode) {
    return e2eGetGoals(userId);
  }
  const q = query(collection(db, 'goals'), where('userId', '==', userId));
  const snap = await getDocs(q);
  return snap.docs.map(mapGoal);
}
