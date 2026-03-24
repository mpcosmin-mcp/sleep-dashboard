import { type SleepEntry } from '@/lib/sleep';

// ════════════════════════════════════════════════════════════════
// Monthly Goal Module — personal SS targets (D-11 through D-15)
// ════════════════════════════════════════════════════════════════

export type GoalStatusLabel = 'ahead' | 'on-track' | 'behind';

export interface GoalStatus {
  target: number;
  currentAvg: number;
  projected: number;
  daysLogged: number;
  daysRemaining: number;
  status: GoalStatusLabel;
}

// ── Helpers ──
function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function goalKey(user: string, month: string): string {
  return `st_goal_${user}_${month}`;
}

function daysInMonth(month: string): number {
  const [y, m] = month.split('-').map(Number);
  return new Date(y, m, 0).getDate();
}

function dayOfMonth(): number {
  return new Date().getDate();
}

// ── Goal CRUD ──
export function getGoal(user: string, month?: string): number | null {
  const m = month ?? currentMonth();
  try {
    const val = localStorage.getItem(goalKey(user, m));
    if (val === null) return null;
    const n = parseFloat(val);
    return isNaN(n) ? null : n;
  } catch { return null; }
}

export function saveGoal(user: string, target: number, month?: string): void {
  const m = month ?? currentMonth();
  try { localStorage.setItem(goalKey(user, m), String(target)); } catch {}
}

export function clearGoal(user: string, month?: string): void {
  const m = month ?? currentMonth();
  try { localStorage.removeItem(goalKey(user, m)); } catch {}
}

// ── Goal Status Computation ──
export function goalStatus(data: SleepEntry[], user: string, month?: string): GoalStatus | null {
  const m = month ?? currentMonth();
  const target = getGoal(user, m);
  if (target === null) return null;

  // Filter entries for this user in this month
  const entries = data.filter(e => e.name === user && e.date.startsWith(m));
  const daysLogged = entries.length;
  const totalDays = daysInMonth(m);
  const today = dayOfMonth();
  const daysRemaining = Math.max(0, totalDays - today);

  const currentAvg = daysLogged > 0
    ? entries.reduce((sum, e) => sum + e.ss, 0) / daysLogged
    : 0;

  // Projection: simple — use current average (with enough data, trend stays flat)
  const projected = currentAvg;

  // Status thresholds: ahead if >= target + 2, behind if < target - 2
  let status: GoalStatusLabel;
  if (currentAvg >= target + 2) {
    status = 'ahead';
  } else if (currentAvg < target - 2) {
    status = 'behind';
  } else {
    status = 'on-track';
  }

  return { target, currentAvg, projected, daysLogged, daysRemaining, status };
}

// ── Last Month Average (for default goal suggestion per D-11) ──
export function getLastMonthAvg(data: SleepEntry[], user: string): number {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  const lastMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  const entries = data.filter(e => e.name === user && e.date.startsWith(lastMonth));
  if (!entries.length) return 80;
  return entries.reduce((sum, e) => sum + e.ss, 0) / entries.length;
}
