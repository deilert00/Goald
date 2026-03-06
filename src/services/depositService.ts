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

export interface Deposit {
  id: string;
  goalId: string;
  userId: string;
  amount: number;
  date: Timestamp;
}

export async function addDeposit(
  goalId: string,
  userId: string,
  amount: number
): Promise<string> {
  const ref = await addDoc(collection(db, 'deposits'), {
    goalId,
    userId,
    amount,
    date: serverTimestamp(),
  });
  return ref.id;
}

export function subscribeDeposits(
  goalId: string,
  cb: (deposits: Deposit[]) => void
): () => void {
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
  const q = query(collection(db, 'deposits'), where('goalId', '==', goalId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Deposit, 'id'>) }));
}
