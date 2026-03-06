/**
 * Visual theme types for goal animations
 */

export type ThemeType = 'tree' | 'house' | 'rocket' | 'island' | 'car';

export interface Theme {
  id: ThemeType;
  name: string;
  emoji: string;
  description: string;
  stages: number; // Total number of animation stages (0-10)
  isPremium?: boolean; // For future monetization
}

/**
 * Available visual themes for goal visualization
 * Each theme has 11 stages (0%, 10%, 20%, ..., 100%)
 */
export const THEMES: Record<ThemeType, Theme> = {
  tree: {
    id: 'tree',
    name: 'Growing Tree',
    emoji: '🌳',
    description: 'Watch your savings grow like a mighty tree',
    stages: 10,
    isPremium: false,
  },
  house: {
    id: 'house',
    name: 'Building House',
    emoji: '🏠',
    description: 'Build your dream home brick by brick',
    stages: 10,
    isPremium: false,
  },
  rocket: {
    id: 'rocket',
    name: 'Launching Rocket',
    emoji: '🚀',
    description: 'Launch your financial goals to the moon',
    stages: 10,
    isPremium: false,
  },
  island: {
    id: 'island',
    name: 'Island Paradise',
    emoji: '🏝️',
    description: 'Create your own paradise island',
    stages: 10,
    isPremium: true,
  },
  car: {
    id: 'car',
    name: 'Dream Car',
    emoji: '🏎️',
    description: 'Build your dream car from scratch',
    stages: 10,
    isPremium: true,
  },
};

/**
 * Calculate which animation stage to display based on progress percentage
 * @param progressPercent - Progress from 0 to 100
 * @returns Stage number from 0 to 10
 */
export function calculateProgressStage(progressPercent: number): number {
  // Clamp progress between 0 and 100
  const clamped = Math.max(0, Math.min(100, progressPercent));
  
  // Map to 0-10 scale (11 stages total)
  const stage = Math.floor((clamped / 100) * 10);
  
  return Math.min(stage, 10); // Ensure we don't exceed stage 10
}

/**
 * Get theme by ID
 */
export function getTheme(themeId: ThemeType): Theme {
  return THEMES[themeId];
}

/**
 * Get all available free themes
 */
export function getFreeThemes(): Theme[] {
  return Object.values(THEMES).filter(theme => !theme.isPremium);
}

/**
 * Get all premium themes
 */
export function getPremiumThemes(): Theme[] {
  return Object.values(THEMES).filter(theme => theme.isPremium);
}
