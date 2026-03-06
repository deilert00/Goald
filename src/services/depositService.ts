import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  QuerySnapshot,
} from 'firebase/firestore';
import { db } from './firebase';
import { isE2EMode } from '../config/runtime';
import {
  e2eAddDeposit,
  e2eDepositsSubscribe,
  e2eGetDeposits,
} from './e2eStore';

export interface Deposit {
  id: string;
  goalId: string;
  userId: string;
  amount: number;
  date: Timestamp;
  note?: string;
}

export async function addDeposit(
  goalId: string,
  userId: string,
  amount: number,
  note?: string
): Promise<string> {
  if (isE2EMode) {
    return e2eAddDeposit(goalId, userId, amount, note);
  }
  const ref = await addDoc(collection(db, 'deposits'), {
    goalId,
    userId,
    amount,
    ...(note ? { note: note.trim() } : {}),
    date: serverTimestamp(),
  });
  return ref.id;
}

export function subscribeDeposits(
  goalId: string,
  cb: (deposits: Deposit[]) => void
): () => void {
  if (isE2EMode) {
    return e2eDepositsSubscribe(goalId, cb);
  }
  const q = query(collection(db, 'deposits'), where('goalId', '==', goalId));
  return onSnapshot(q, (snap: QuerySnapshot) => {
    const deposits = snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<Deposit, 'id'>),
    }));
    cb(deposits);
  });
}

export async function getGoalDeposits(goalId: string): Promise<Deposit[]> {
  if (isE2EMode) {
    return e2eGetDeposits(goalId);
  }
  const q = query(collection(db, 'deposits'), where('goalId', '==', goalId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Deposit, 'id'>) }));
}
