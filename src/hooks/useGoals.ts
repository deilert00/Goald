import { useState, useEffect } from 'react';
import { Goal, subscribeGoals } from '../services/goalService';

export function useGoals(userId: string | null) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setGoals([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = subscribeGoals(userId, (g) => {
      setGoals(g);
      setLoading(false);
    });
    return unsub;
  }, [userId]);

  return { goals, loading };
}
