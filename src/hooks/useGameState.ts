import { useMemo } from 'react';
import { type SleepEntry } from '@/lib/sleep';
import { calcXP, calcXPBreakdown, loggingStreak, xpLevel, xpProgress, type XPBreakdown, type StreakResult } from '@/lib/gamify';

export interface GameState {
  xp: number;
  level: number;
  progress: number;
  streak: StreakResult;
  breakdown: XPBreakdown;
}

export function useGameState(data: SleepEntry[], user: string): GameState {
  return useMemo(() => {
    const xp = calcXP(data, user);
    const streak = loggingStreak(data, user);
    const level = xpLevel(xp);
    const progress = xpProgress(xp);
    const breakdown = calcXPBreakdown(data, user);
    return { xp, level, progress, streak, breakdown };
  }, [data, user]);
}
