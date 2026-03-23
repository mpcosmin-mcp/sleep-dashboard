import { useMemo } from 'react';
import { type SleepEntry } from '@/lib/sleep';
import { calcXP, loggingStreak, xpLevel, xpProgress, type StreakResult } from '@/lib/sleep';

export interface XPBreakdownResult {
  base: number;
  bonusSS: number;
  streakBonus: number;
  goodSleepBonus: number;
  kudosXP: number;
  spent: number;
  total: number;
}

export interface GameState {
  xp: number;
  level: number;
  progress: number;
  streak: StreakResult;
  breakdown: XPBreakdownResult;
}

function calcXPBreakdown(data: SleepEntry[], name: string): XPBreakdownResult {
  const entries = data.filter(d => d.name === name);
  const base = entries.length * 10;
  let bonusSS = 0;
  for (const e of entries) { if (e.ss >= 90) bonusSS += 10; else if (e.ss >= 80) bonusSS += 5; }
  const sr2 = loggingStreak(data, name);
  const streakBonus = sr2.days >= 30 ? 200 : sr2.days >= 7 ? 50 : 0;
  const streakE = [...entries].sort((a, b) => b.date.localeCompare(a.date)).slice(0, sr2.days);
  let gsRun = 0;
  for (const e of streakE) { if (e.ss >= 75) gsRun++; else break; }
  const goodSleepBonus = gsRun >= 30 ? 500 : gsRun >= 7 ? 50 : 0;
  let kudosXP = 0;
  try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k?.startsWith('st_kudos_') && k.endsWith(`_${name}`)) kudosXP += 5; } } catch {}
  let spent = 0;
  try { spent = parseInt(localStorage.getItem(`st_xp_spent_${name}`) || '0'); } catch {}
  return { base, bonusSS, streakBonus, goodSleepBonus, kudosXP, spent, total: Math.max(0, base + bonusSS + streakBonus + goodSleepBonus + kudosXP - spent) };
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
