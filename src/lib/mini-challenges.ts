import { type SleepEntry, NAMES } from '@/lib/sleep';

// ════════════════════════════════════════════════════════════════
// Mini Challenges — short 2-3 day challenges that appear mid-week
// + 1v1 Challenges — user-created head-to-head duels
// ════════════════════════════════════════════════════════════════

export interface MiniChallengeDef {
  id: string;
  icon: string;
  name: string;
  description: string;
  type: 'team' | 'individual';
  xp: number;
  durationDays: number;
  check: (data: SleepEntry[], name: string, start: string, end: string) => MiniChallengeStatus;
}

export interface MiniChallengeStatus {
  completed: boolean;
  progress: number;
  target: number;
}

// ── 1v1 Challenge types ──
export interface DuelType {
  id: string;
  icon: string;
  name: string;
  description: string; // {opponent} placeholder
  durationDays: number;
  xp: number;
  score: (data: SleepEntry[], name: string, start: string, end: string) => number;
}

export interface ActiveDuel {
  typeId: string;
  opponents: string[];  // one or more opponents
  startDate: string;
  endDate: string;
  createdBy: string;
}

// ── Mini challenge pool ──
export const MINI_CHALLENGE_POOL: MiniChallengeDef[] = [
  {
    id: 'mini_team_log_3',
    icon: '⚡',
    name: 'Sprint de echipa',
    description: 'Toti 3 logheaza in urmatoarele 3 zile',
    type: 'team',
    xp: 40,
    durationDays: 3,
    check: (data, _name, start, end) => {
      let passing = 0;
      for (const n of NAMES) {
        const entries = data.filter(e => e.name === n && e.date >= start && e.date <= end);
        const days = new Set(entries.map(e => e.date)).size;
        if (days >= 3) passing++;
      }
      return { completed: passing >= NAMES.length, progress: passing, target: NAMES.length };
    },
  },
  {
    id: 'mini_team_avg_85',
    icon: '🚀',
    name: 'Echipa de elita',
    description: 'Media echipei >= 85 SS in urmatoarele 3 zile',
    type: 'team',
    xp: 50,
    durationDays: 3,
    check: (data, _name, start, end) => {
      const entries = data.filter(e => e.date >= start && e.date <= end);
      if (!entries.length) return { completed: false, progress: 0, target: 85 };
      const avg = Math.round(entries.reduce((s, e) => s + e.ss, 0) / entries.length);
      return { completed: avg >= 85, progress: avg, target: 85 };
    },
  },
  {
    id: 'mini_all_above_80',
    icon: '💪',
    name: 'Nimeni sub 80',
    description: 'Toata echipa cu SS >= 80 in urmatoarele 2 zile',
    type: 'team',
    xp: 35,
    durationDays: 2,
    check: (data, _name, start, end) => {
      let passing = 0;
      for (const n of NAMES) {
        const entries = data.filter(e => e.name === n && e.date >= start && e.date <= end);
        if (!entries.length) continue;
        const allAbove = entries.every(e => e.ss >= 80);
        if (allAbove) passing++;
      }
      return { completed: passing >= NAMES.length, progress: passing, target: NAMES.length };
    },
  },
  {
    id: 'mini_rhr_low',
    icon: '🧘',
    name: 'Zen total',
    description: 'Media RHR a echipei sub 58 in urmatoarele 3 zile',
    type: 'team',
    xp: 40,
    durationDays: 3,
    check: (data, _name, start, end) => {
      const entries = data.filter(e => e.date >= start && e.date <= end);
      if (!entries.length) return { completed: false, progress: 0, target: 1 };
      const avg = Math.round(entries.reduce((s, e) => s + e.rhr, 0) / entries.length);
      return { completed: avg < 58, progress: avg < 58 ? 1 : 0, target: 1 };
    },
  },
  {
    id: 'mini_someone_90',
    icon: '✨',
    name: 'Stea in echipa',
    description: 'Cel putin un membru cu SS >= 90 in urmatoarele 2 zile',
    type: 'team',
    xp: 30,
    durationDays: 2,
    check: (data, _name, start, end) => {
      const entries = data.filter(e => e.date >= start && e.date <= end && e.ss >= 90);
      const uniqueNames = new Set(entries.map(e => e.name)).size;
      return { completed: uniqueNames >= 1, progress: Math.min(1, uniqueNames), target: 1 };
    },
  },
  {
    id: 'mini_team_improve',
    icon: '📈',
    name: 'Toti in progres',
    description: 'Fiecare membru creste SS-ul fata de ziua anterioara',
    type: 'team',
    xp: 45,
    durationDays: 2,
    check: (data, _name, start, end) => {
      let passing = 0;
      for (const n of NAMES) {
        const entries = data.filter(e => e.name === n && e.date >= start && e.date <= end).sort((a, b) => a.date.localeCompare(b.date));
        if (entries.length < 2) continue;
        if (entries[entries.length - 1].ss > entries[0].ss) passing++;
      }
      return { completed: passing >= NAMES.length, progress: passing, target: NAMES.length };
    },
  },
];

// ── 1v1 Duel types ──
export const DUEL_TYPES: DuelType[] = [
  {
    id: 'duel_best_avg_ss',
    icon: '⚔️',
    name: 'Cel mai bun somn',
    description: 'Cine are media SS mai mare in {days} zile?',
    durationDays: 3,
    xp: 30,
    score: (data, name, start, end) => {
      const entries = data.filter(e => e.name === name && e.date >= start && e.date <= end);
      return entries.length ? entries.reduce((s, e) => s + e.ss, 0) / entries.length : 0;
    },
  },
  {
    id: 'duel_lowest_rhr',
    icon: '❤️‍🔥',
    name: 'Inima de campion',
    description: 'Cine are RHR-ul mai mic in {days} zile?',
    durationDays: 3,
    xp: 30,
    score: (data, name, start, end) => {
      const entries = data.filter(e => e.name === name && e.date >= start && e.date <= end);
      // Return negative so lower RHR = higher score
      return entries.length ? -(entries.reduce((s, e) => s + e.rhr, 0) / entries.length) : -999;
    },
  },
  {
    id: 'duel_best_single',
    icon: '🎯',
    name: 'Noaptea perfecta',
    description: 'Cine are cel mai mare SS intr-o singura noapte in {days} zile?',
    durationDays: 3,
    xp: 25,
    score: (data, name, start, end) => {
      const entries = data.filter(e => e.name === name && e.date >= start && e.date <= end);
      return entries.length ? Math.max(...entries.map(e => e.ss)) : 0;
    },
  },
  {
    id: 'duel_consistency',
    icon: '🎯',
    name: 'Cel mai stabil',
    description: 'Cine are cel mai mic interval SS in {days} zile? (mai stabil castiga)',
    durationDays: 3,
    xp: 25,
    score: (data, name, start, end) => {
      const entries = data.filter(e => e.name === name && e.date >= start && e.date <= end);
      if (entries.length < 2) return -999;
      const scores = entries.map(e => e.ss);
      // Negative range so smaller range = higher score
      return -(Math.max(...scores) - Math.min(...scores));
    },
  },
  {
    id: 'duel_most_logged',
    icon: '📅',
    name: 'Cel mai disciplinat',
    description: 'Cine logheaza mai multe zile in {days} zile?',
    durationDays: 3,
    xp: 20,
    score: (data, name, start, end) => {
      const entries = data.filter(e => e.name === name && e.date >= start && e.date <= end);
      return new Set(entries.map(e => e.date)).size;
    },
  },
];

// ── Mini challenge selection: appears Wed-Fri/Sat, seeded by date ──
export function getActiveMiniChallenge(): { def: MiniChallengeDef; startDate: string; endDate: string } | null {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat

  // Mini challenges active Wed(3) through Sat(6)
  if (dayOfWeek < 3 || dayOfWeek === 0) return null;

  // Start date is always this Wednesday
  const wed = new Date(today);
  wed.setDate(today.getDate() - (dayOfWeek - 3));
  const startDate = wed.toISOString().split('T')[0];

  // Seed by year+week so it's deterministic
  const yearDay = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
  const weekSeed = Math.floor(yearDay / 7);
  const def = MINI_CHALLENGE_POOL[weekSeed % MINI_CHALLENGE_POOL.length];

  const endD = new Date(startDate + 'T12:00:00');
  endD.setDate(endD.getDate() + def.durationDays - 1);
  const endDate = endD.toISOString().split('T')[0];

  return { def, startDate, endDate };
}

export function checkMiniChallenge(def: MiniChallengeDef, data: SleepEntry[], name: string, startDate: string, endDate: string): MiniChallengeStatus {
  return def.check(data, name, startDate, endDate);
}

// ── 1v1 Duel localStorage persistence ──
const DUEL_KEY = (user: string) => `st_duel_${user}`;

export function getActiveDuel(user: string): ActiveDuel | null {
  try {
    const raw = localStorage.getItem(DUEL_KEY(user));
    if (!raw) return null;
    const duel: ActiveDuel = JSON.parse(raw);
    // Migrate old format (single opponent string → array)
    if (!duel.opponents && (duel as any).opponent) { duel.opponents = [(duel as any).opponent]; }
    // Check if expired
    const today = new Date().toISOString().split('T')[0];
    if (duel.endDate < today) {
      // Keep it for one extra day so user can see result
      const endPlusOne = new Date(duel.endDate + 'T12:00:00');
      endPlusOne.setDate(endPlusOne.getDate() + 1);
      if (endPlusOne.toISOString().split('T')[0] < today) {
        localStorage.removeItem(DUEL_KEY(user));
        return null;
      }
    }
    return duel;
  } catch { return null; }
}

export function createDuel(user: string, typeId: string, opponents: string[]): ActiveDuel {
  const today = new Date().toISOString().split('T')[0];
  const duelType = DUEL_TYPES.find(d => d.id === typeId)!;
  const endD = new Date(today + 'T12:00:00');
  endD.setDate(endD.getDate() + duelType.durationDays - 1);
  const duel: ActiveDuel = {
    typeId,
    opponents,
    startDate: today,
    endDate: endD.toISOString().split('T')[0],
    createdBy: user,
  };
  try { localStorage.setItem(DUEL_KEY(user), JSON.stringify(duel)); } catch {}
  return duel;
}

export function removeDuel(user: string): void {
  try { localStorage.removeItem(DUEL_KEY(user)); } catch {}
}

export interface DuelParticipant {
  name: string;
  score: number;
  rank: number;
}

export function getDuelResult(duel: ActiveDuel, data: SleepEntry[]): {
  duelType: DuelType;
  participants: DuelParticipant[];
  winnerName: string | null; // null = tie
  finished: boolean;
} {
  const duelType = DUEL_TYPES.find(d => d.id === duel.typeId)!;
  const today = new Date().toISOString().split('T')[0];
  const finished = today > duel.endDate;
  const allNames = [duel.createdBy, ...duel.opponents];
  const scored = allNames.map(name => ({
    name,
    score: duelType.score(data, name, duel.startDate, duel.endDate),
    rank: 0,
  }));
  // Sort by score descending and assign ranks
  scored.sort((a, b) => b.score - a.score);
  scored.forEach((p, i) => { p.rank = i === 0 || p.score === scored[i - 1].score ? (i === 0 ? 1 : scored[i - 1].rank) : i + 1; });
  const topScore = scored[0].score;
  const winners = scored.filter(p => p.score === topScore);
  const winnerName = winners.length === 1 ? winners[0].name : null;
  return { duelType, participants: scored, winnerName, finished };
}

// ── Mini challenge XP ──
export function getMiniChallengeXP(data: SleepEntry[], name: string): number {
  const mini = getActiveMiniChallenge();
  if (!mini) return 0;
  const status = checkMiniChallenge(mini.def, data, name, mini.startDate, mini.endDate);
  return status.completed ? mini.def.xp : 0;
}
