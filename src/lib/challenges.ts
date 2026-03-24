import { type SleepEntry, NAMES } from '@/lib/sleep';

// ════════════════════════════════════════════════════════════════
// Weekly Challenge Engine — replaces static BonusSection (D-04)
// All users see the same challenge each week (seeded by week number)
// ════════════════════════════════════════════════════════════════

export type ChallengeType = 'individual' | 'team';

export interface ChallengeDef {
  id: string;
  icon: string;
  name: string;        // Romanian
  description: string;  // Romanian
  type: ChallengeType;
  xp: number;          // flat XP reward per D-06
  check: (data: SleepEntry[], name: string, weekStart: string, weekEnd: string) => ChallengeStatus;
}

export interface ChallengeStatus {
  completed: boolean;
  progress: number;
  target: number;
}

// ── Helper: filter entries for a given person within a date range ──
function entriesInRange(data: SleepEntry[], name: string, start: string, end: string): SleepEntry[] {
  return data.filter(e => e.name === name && e.date >= start && e.date <= end);
}

function allEntriesInRange(data: SleepEntry[], start: string, end: string): SleepEntry[] {
  return data.filter(e => e.date >= start && e.date <= end);
}

// ── Helper: get previous week's date range ──
function prevWeekRange(weekStart: string): { start: string; end: string } {
  const d = new Date(weekStart + 'T12:00:00');
  d.setDate(d.getDate() - 7);
  const start = d.toISOString().split('T')[0];
  d.setDate(d.getDate() + 6);
  const end = d.toISOString().split('T')[0];
  return { start, end };
}

// ── Challenge Pool (D-05) ──
export const CHALLENGE_POOL: ChallengeDef[] = [
  {
    id: 'log_daily',
    icon: '📅',
    name: 'Logheaza in fiecare zi',
    description: 'Logheaza somnul in toate cele 7 zile ale saptamanii',
    type: 'individual',
    xp: 75,
    check: (data, name, start, end) => {
      const entries = entriesInRange(data, name, start, end);
      const uniqueDays = new Set(entries.map(e => e.date)).size;
      return { completed: uniqueDays >= 7, progress: uniqueDays, target: 7 };
    },
  },
  {
    id: 'beat_average',
    icon: '📈',
    name: 'Depaseste media ta',
    description: 'Media SS saptamanala mai mare decat saptamana trecuta',
    type: 'individual',
    xp: 50,
    check: (data, name, start, end) => {
      const entries = entriesInRange(data, name, start, end);
      if (!entries.length) return { completed: false, progress: 0, target: 1 };
      const avg = entries.reduce((s, e) => s + e.ss, 0) / entries.length;
      const prev = prevWeekRange(start);
      const prevEntries = entriesInRange(data, name, prev.start, prev.end);
      if (!prevEntries.length) return { completed: true, progress: 1, target: 1 };
      const prevAvg = prevEntries.reduce((s, e) => s + e.ss, 0) / prevEntries.length;
      return { completed: avg > prevAvg, progress: avg > prevAvg ? 1 : 0, target: 1 };
    },
  },
  {
    id: 'team_80',
    icon: '🤝',
    name: 'Echipa la 80+',
    description: 'Toti membrii echipei cu media SS >= 80 saptamana asta',
    type: 'team',
    xp: 100,
    check: (data, _name, start, end) => {
      let completed = true;
      let passing = 0;
      for (const n of NAMES) {
        const entries = entriesInRange(data, n, start, end);
        if (!entries.length) { completed = false; continue; }
        const avg = entries.reduce((s, e) => s + e.ss, 0) / entries.length;
        if (avg >= 80) passing++; else completed = false;
      }
      return { completed, progress: passing, target: NAMES.length };
    },
  },
  {
    id: 'team_all_log',
    icon: '👥',
    name: 'Toti logheaza 5 zile',
    description: 'Fiecare membru logheaza cel putin 5 zile saptamana asta',
    type: 'team',
    xp: 75,
    check: (data, _name, start, end) => {
      let completed = true;
      let passing = 0;
      for (const n of NAMES) {
        const entries = entriesInRange(data, n, start, end);
        const days = new Set(entries.map(e => e.date)).size;
        if (days >= 5) passing++; else completed = false;
      }
      return { completed, progress: passing, target: NAMES.length };
    },
  },
  {
    id: 'ss_90_once',
    icon: '🌟',
    name: 'O noapte de vis',
    description: 'Cel putin o intrare cu SS >= 90 saptamana asta',
    type: 'individual',
    xp: 50,
    check: (data, name, start, end) => {
      const entries = entriesInRange(data, name, start, end);
      const count = entries.filter(e => e.ss >= 90).length;
      return { completed: count >= 1, progress: Math.min(count, 1), target: 1 };
    },
  },
  {
    id: 'improve_rhr',
    icon: '❤️',
    name: 'RHR mai bun',
    description: 'Media RHR saptamanala mai mica decat saptamana trecuta',
    type: 'individual',
    xp: 50,
    check: (data, name, start, end) => {
      const entries = entriesInRange(data, name, start, end);
      if (!entries.length) return { completed: false, progress: 0, target: 1 };
      const avg = entries.reduce((s, e) => s + e.rhr, 0) / entries.length;
      const prev = prevWeekRange(start);
      const prevEntries = entriesInRange(data, name, prev.start, prev.end);
      if (!prevEntries.length) return { completed: true, progress: 1, target: 1 };
      const prevAvg = prevEntries.reduce((s, e) => s + e.rhr, 0) / prevEntries.length;
      return { completed: avg < prevAvg, progress: avg < prevAvg ? 1 : 0, target: 1 };
    },
  },
  {
    id: 'consistency',
    icon: '🎯',
    name: 'Stabilitate',
    description: 'Toate intrarile SS intr-un interval de 10 puncte saptamana asta',
    type: 'individual',
    xp: 75,
    check: (data, name, start, end) => {
      const entries = entriesInRange(data, name, start, end);
      if (entries.length < 2) return { completed: entries.length === 1, progress: entries.length, target: 2 };
      const scores = entries.map(e => e.ss);
      const range = Math.max(...scores) - Math.min(...scores);
      return { completed: range <= 10, progress: range <= 10 ? 1 : 0, target: 1 };
    },
  },
  {
    id: 'streak_builder',
    icon: '🔥',
    name: 'Constructor de streak',
    description: 'Mentine sau extinde streak-ul pe toata saptamana',
    type: 'individual',
    xp: 50,
    check: (data, name, start, end) => {
      // Check if user logged every day of the week so far (up to today or end of week)
      const entries = entriesInRange(data, name, start, end);
      const uniqueDays = new Set(entries.map(e => e.date)).size;
      const today = new Date().toISOString().split('T')[0];
      const effectiveEnd = end < today ? end : today;
      // Count expected days from start to effectiveEnd
      const startD = new Date(start + 'T12:00:00');
      const endD = new Date(effectiveEnd + 'T12:00:00');
      const expectedDays = Math.max(1, Math.round((endD.getTime() - startD.getTime()) / 86400000) + 1);
      return { completed: uniqueDays >= expectedDays && uniqueDays >= 7, progress: uniqueDays, target: 7 };
    },
  },
];

// ── ISO week number ──
export function getWeekNumber(d?: Date): number {
  const date = d ? new Date(d.getTime()) : new Date();
  date.setHours(0, 0, 0, 0);
  // Thursday in current week decides the year
  date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
  const jan4 = new Date(date.getFullYear(), 0, 4);
  return 1 + Math.round(((date.getTime() - jan4.getTime()) / 86400000 - 3 + ((jan4.getDay() + 6) % 7)) / 7);
}

// ── Get Monday of ISO week ──
function getWeekStart(d?: Date): string {
  const date = d ? new Date(d.getTime()) : new Date();
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Monday
  const monday = new Date(date);
  monday.setDate(diff);
  return monday.toISOString().split('T')[0];
}

function getWeekEnd(weekStart: string): string {
  const d = new Date(weekStart + 'T12:00:00');
  d.setDate(d.getDate() + 6);
  return d.toISOString().split('T')[0];
}

// ── Deterministic weekly selection (D-04) ──
export function getWeeklyChallenge(weekNumber: number): ChallengeDef {
  return CHALLENGE_POOL[weekNumber % CHALLENGE_POOL.length];
}

// ── Check current week's challenge ──
export function checkChallenge(challenge: ChallengeDef, data: SleepEntry[], name: string): ChallengeStatus {
  const weekStart = getWeekStart();
  const weekEnd = getWeekEnd(weekStart);
  return challenge.check(data, name, weekStart, weekEnd);
}

// ── Challenge XP for current week (D-07) ──
export function getChallengeXP(data: SleepEntry[], name: string): number {
  const weekNum = getWeekNumber();
  const challenge = getWeeklyChallenge(weekNum);
  const status = checkChallenge(challenge, data, name);
  return status.completed ? challenge.xp : 0;
}

// ── Challenge completion persistence ──
export function isChallengeCompleted(user: string, weekNumber: number): boolean {
  try { return localStorage.getItem(`st_challenge_completed_${user}_${weekNumber}`) === '1'; } catch { return false; }
}

export function markChallengeCompleted(user: string, weekNumber: number): void {
  try { localStorage.setItem(`st_challenge_completed_${user}_${weekNumber}`, '1'); } catch {}
}
