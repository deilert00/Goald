import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';

export interface UserStats {
  currentStreak: number;
  lastDepositMonth: string;
  badges: string[];
  totalDeposits: number;
}

export function useStreak(userId: string | null) {
  const [stats, setStats] = useState<UserStats>({
    currentStreak: 0,
    lastDepositMonth: '',
    badges: [],
    totalDeposits: 0,
  });

  useEffect(() => {
    if (!userId) return;
    const unsub = onSnapshot(doc(db, 'userStats', userId), (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        setStats({
          currentStreak: d.currentStreak ?? 0,
          lastDepositMonth: d.lastDepositMonth ?? '',
          badges: d.badges ?? [],
          totalDeposits: d.totalDeposits ?? 0,
        });
      }
    });
    return unsub;
  }, [userId]);

  return stats;
}
