import { useMemo } from 'react';
import { type SleepEntry } from '@/lib/sleep';
import { calcXP, calcXPBreakdown, loggingStreak, xpLevel, xpProgress, type XPBreakdown, type StreakResult } from '@/lib/gamify';
import { getWeeklyChallenge, checkChallenge, getWeekNumber, type ChallengeDef, type ChallengeStatus } from '@/lib/challenges';
import { goalStatus, type GoalStatus } from '@/lib/goals';

export interface GameState {
  xp: number;
  level: number;
  progress: number;
  streak: StreakResult;
  breakdown: XPBreakdown;
  challenge: { def: ChallengeDef; status: ChallengeStatus } | null;
  goal: GoalStatus | null;
}

export function useGameState(data: SleepEntry[], user: string): GameState {
  return useMemo(() => {
    const xp = calcXP(data, user);
    const streak = loggingStreak(data, user);
    const level = xpLevel(xp);
    const progress = xpProgress(xp);
    const breakdown = calcXPBreakdown(data, user);

    // Weekly challenge state
    const weekNum = getWeekNumber();
    const challengeDef = getWeeklyChallenge(weekNum);
    const challengeStatus = checkChallenge(challengeDef, data, user);
    const challenge = { def: challengeDef, status: challengeStatus };

    // Monthly goal state
    const goal = goalStatus(data, user);

    return { xp, level, progress, streak, breakdown, challenge, goal };
  }, [data, user]);
}
