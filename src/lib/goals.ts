// ── Monthly Sleep Goals ─────────────────────────────────────────────────────
// Persists per-user monthly sleep score targets in localStorage.
// Key format: st_goal_{user-slug}_{yearMonth}  (e.g., st_goal_Petrica_2025-01)

import { type SleepEntry } from '@/lib/sleep';

function goalKey(user: string, yearMonth: string): string {
  return `st_goal_${user}_${yearMonth}`;
}

export function getGoal(user: string, yearMonth: string): number | null {
  try {
    const raw = localStorage.getItem(goalKey(user, yearMonth));
    if (raw === null) return null;
    const parsed = parseInt(raw, 10);
    return isNaN(parsed) ? null : parsed;
  } catch {
    return null;
  }
}

export function setGoal(user: string, yearMonth: string, target: number): void {
  try {
    localStorage.setItem(goalKey(user, yearMonth), String(target));
  } catch {}
}

export function clearGoal(user: string, yearMonth: string): void {
  try {
    localStorage.removeItem(goalKey(user, yearMonth));
  } catch {}
}

export type GoalStatus = 'ahead' | 'on-track' | 'behind' | 'no-data';

export function computeGoalStatus(entries: SleepEntry[], target: number): GoalStatus {
  if (entries.length === 0) return 'no-data';
  const avg = entries.reduce((s, e) => s + e.ss, 0) / entries.length;
  if (avg >= target + 3) return 'ahead';
  if (avg >= target - 3) return 'on-track';
  return 'behind';
}

// Current month string for localStorage key (YYYY-MM)
export function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

// Compute current month average SS for a user
export function currentMonthAvg(data: SleepEntry[], user: string): number | null {
  const prefix = currentMonth();
  const monthEntries = data.filter(d => d.name === user && d.date.startsWith(prefix));
  if (!monthEntries.length) return null;
  return Math.round(monthEntries.reduce((s, e) => s + e.ss, 0) / monthEntries.length);
}
