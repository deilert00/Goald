export type BadgeId =
  | 'first_deposit'
  | 'halfway'
  | 'completed'
  | 'streak_3'
  | 'streak_6'
  | 'multi_goal';

export interface Badge {
  id: BadgeId;
  title: string;
  description: string;
  emoji: string;
}

export const ALL_BADGES: Badge[] = [
  {
    id: 'first_deposit',
    title: 'First Step',
    description: 'Made your first deposit',
    emoji: '🌱',
  },
  {
    id: 'halfway',
    title: 'Halfway There',
    description: 'Reached 50% of a goal',
    emoji: '🌳',
  },
  {
    id: 'completed',
    title: 'Goal Crusher',
    description: 'Completed a goal',
    emoji: '🏆',
  },
  {
    id: 'streak_3',
    title: '3-Month Streak',
    description: 'Deposited 3 months in a row',
    emoji: '🔥',
  },
  {
    id: 'streak_6',
    title: '6-Month Streak',
    description: 'Deposited 6 months in a row',
    emoji: '⚡',
  },
  {
    id: 'multi_goal',
    title: 'Goal Collector',
    description: 'Created 3 or more goals',
    emoji: '🎯',
  },
];

export function computeEarnedBadges(params: {
  totalDeposits: number;
  currentStreak: number;
  goalCount: number;
  hasHalfway: boolean;
  hasCompleted: boolean;
  existingBadges: BadgeId[];
}): BadgeId[] {
  const { totalDeposits, currentStreak, goalCount, hasHalfway, hasCompleted, existingBadges } =
    params;
  const earned = new Set<BadgeId>(existingBadges);

  if (totalDeposits >= 1) earned.add('first_deposit');
  if (hasHalfway) earned.add('halfway');
  if (hasCompleted) earned.add('completed');
  if (currentStreak >= 3) earned.add('streak_3');
  if (currentStreak >= 6) earned.add('streak_6');
  if (goalCount >= 3) earned.add('multi_goal');

  return Array.from(earned);
}
