import { useState, useEffect } from 'react';
import { Deposit, subscribeDeposits } from '../services/depositService';

export function useDeposits(goalId: string | null) {
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!goalId) {
      setDeposits([]);
      setLoading(false);
      return;
    }
    const unsub = subscribeDeposits(goalId, (d) => {
      setDeposits(d);
      setLoading(false);
    });
    return unsub;
  }, [goalId]);

  return { deposits, loading };
}
