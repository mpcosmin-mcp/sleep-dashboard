import { type SleepEntry, NAMES } from '@/lib/sleep';
import { getWeekNumber, getWeekStart } from '@/lib/challenges';

// ════════════════════════════════════════════════════════════════
// Weekly Winner Trophies — funny, unique trophies for best sleeper
// ════════════════════════════════════════════════════════════════

export interface Trophy {
  emoji: string;
  title: string;
}

export interface WeeklyWin {
  weekKey: string;      // "2026-W13"
  weekStart: string;    // "2026-03-23"
  winner: string;       // full name
  avgSS: number;
  trophy: Trophy;
}

// 20 rotating trophies — deterministic by week number
const TROPHY_POOL: Trophy[] = [
  { emoji: '🧸', title: 'Ursuletul Somnoros' },
  { emoji: '🦉', title: 'Bufnita de Aur' },
  { emoji: '🌙', title: 'Stapanul Noptii' },
  { emoji: '👑', title: 'Regele Pernei' },
  { emoji: '🐑', title: 'Numaratorul de Oi' },
  { emoji: '🧙', title: 'Vrajitorul Melatoninei' },
  { emoji: '🐻', title: 'Hibernatorul Suprem' },
  { emoji: '🌟', title: 'Steaua Somnului' },
  { emoji: '🏔️', title: 'Varful Odihnei' },
  { emoji: '🎭', title: 'Visatorul de Elita' },
  { emoji: '🧊', title: 'Rece ca Gheata' },
  { emoji: '🎵', title: 'Simfonia Noptii' },
  { emoji: '🐉', title: 'Dragonul Adormit' },
  { emoji: '🍯', title: 'Mierea Somnului' },
  { emoji: '🦊', title: 'Vulpea Odihnitoare' },
  { emoji: '🏰', title: 'Castelul Viselor' },
  { emoji: '🎪', title: 'Acrobatul Noptii' },
  { emoji: '🔮', title: 'Ghicitorul REM' },
  { emoji: '🐨', title: 'Koala de Platina' },
  { emoji: '⚡', title: 'Fulgerul Odihnit' },
];

/** Get trophy for a given week number */
function trophyForWeek(weekNum: number): Trophy {
  return TROPHY_POOL[weekNum % TROPHY_POOL.length];
}

/** Compute all weekly winners from data (only completed weeks) */
export function computeWeeklyWinners(data: SleepEntry[]): WeeklyWin[] {
  if (!data.length) return [];

  // Group entries by ISO week
  const weekMap = new Map<string, Map<string, number[]>>();

  for (const entry of data) {
    const d = new Date(entry.date + 'T12:00:00');
    const weekNum = getWeekNumber(d);
    const weekStart = getWeekStart(d);
    const weekKey = `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;

    if (!weekMap.has(weekKey)) weekMap.set(weekKey, new Map());
    const personMap = weekMap.get(weekKey)!;
    if (!personMap.has(entry.name)) personMap.set(entry.name, []);
    personMap.get(entry.name)!.push(entry.ss);
  }

  // Current week key — don't award trophies for incomplete week
  const now = new Date();
  const currentWeekKey = `${now.getFullYear()}-W${String(getWeekNumber(now)).padStart(2, '0')}`;

  const wins: WeeklyWin[] = [];

  for (const [weekKey, personMap] of weekMap) {
    if (weekKey === currentWeekKey) continue; // skip current week

    // Find person with highest avg SS
    let bestName = '';
    let bestAvg = 0;

    for (const [name, scores] of personMap) {
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      if (avg > bestAvg || (avg === bestAvg && name < bestName)) {
        bestAvg = avg;
        bestName = name;
      }
    }

    if (bestName) {
      // Extract week number from key for trophy selection
      const weekNum = parseInt(weekKey.split('-W')[1], 10);
      // Get week start date from data entries in this week
      const firstEntry = data.find(e => {
        const d = new Date(e.date + 'T12:00:00');
        const wk = getWeekNumber(d);
        return wk === weekNum && d.getFullYear() === parseInt(weekKey.split('-')[0]);
      });
      const ws = firstEntry ? getWeekStart(new Date(firstEntry.date + 'T12:00:00')) : weekKey;

      wins.push({
        weekKey,
        weekStart: ws,
        winner: bestName,
        avgSS: Math.round(bestAvg * 10) / 10,
        trophy: trophyForWeek(weekNum),
      });
    }
  }

  return wins.sort((a, b) => a.weekKey.localeCompare(b.weekKey));
}

/** Get trophies won by a specific person */
export function getTrophiesFor(name: string, data: SleepEntry[]): WeeklyWin[] {
  return computeWeeklyWinners(data).filter(w => w.winner === name);
}

/** Get the most recent weekly winner (last completed week) */
export function getLatestWinner(data: SleepEntry[]): WeeklyWin | null {
  const wins = computeWeeklyWinners(data);
  return wins.length > 0 ? wins[wins.length - 1] : null;
}

/** Get trophy counts per person (for leaderboard display) */
export function getTrophyCounts(data: SleepEntry[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const n of NAMES) counts[n] = 0;
  for (const w of computeWeeklyWinners(data)) {
    counts[w.winner] = (counts[w.winner] || 0) + 1;
  }
  return counts;
}
