import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { isE2EMode } from '../config/runtime';
import { e2eStreakSubscribe } from '../services/e2eStore';

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
    if (isE2EMode) {
      return e2eStreakSubscribe((next) => setStats(next));
    }
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
