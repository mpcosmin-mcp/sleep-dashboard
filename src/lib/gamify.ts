import { type SleepEntry } from '@/lib/sleep';
import { getTotalKudos } from '@/lib/kudos';

// XP & Streak: Duolingo golden
export const XP_COLOR = '#f59e0b';
export const STREAK_COLOR = '#f97316';
export const XP_PER_LEVEL = 100;
export function xpLevel(xp: number) { return Math.floor(xp / XP_PER_LEVEL) + 1; }
export function xpProgress(xp: number) { return xp % XP_PER_LEVEL; } // 0-99

// Level titles — fun + professional, up to 100
const LEVEL_TITLES: Record<number, string> = {
  1: 'Somnoros',
  2: 'Incepator',
  3: 'Pui de somn',
  4: 'Dormitor',
  5: 'Nocturn',
  6: 'Visator',
  7: 'Mot de noapte',
  8: 'Regulat',
  9: 'Disciplinat',
  10: 'Ritmic',
  11: 'Consistent',
  12: 'Insomniac vindecat',
  13: 'Sleep Hacker',
  14: 'Zen Master',
  15: 'Night Owl Pro',
  16: 'Circadian Boss',
  17: 'Deep Sleeper',
  18: 'REM Rider',
  19: 'Sleep Scientist',
  20: 'Melatonin King',
  25: 'Dream Architect',
  30: 'Pillow Professor',
  35: 'Duvet Commander',
  40: 'Sleep Sensei',
  45: 'Mattress Maestro',
  50: 'Legendary Sleeper',
  60: 'Sandman',
  70: 'Morpheus',
  80: 'Sleep Deity',
  90: 'Oniric Oracle',
  100: 'Grand Master',
};

// Tiers — every 5 levels
interface LevelTier { name: string; color: string; icon: string; }
const LEVEL_TIERS: { minLevel: number; tier: LevelTier }[] = [
  { minLevel: 1,  tier: { name: 'Bronze',    color: '#cd7f32', icon: '🥉' } },
  { minLevel: 5,  tier: { name: 'Silver',    color: '#94a3b8', icon: '🥈' } },
  { minLevel: 10, tier: { name: 'Gold',      color: '#f59e0b', icon: '🥇' } },
  { minLevel: 15, tier: { name: 'Platinum',  color: '#06b6d4', icon: '💠' } },
  { minLevel: 20, tier: { name: 'Diamond',   color: '#8b5cf6', icon: '💎' } },
  { minLevel: 30, tier: { name: 'Master',    color: '#ec4899', icon: '👑' } },
  { minLevel: 40, tier: { name: 'Grandmaster', color: '#dc2626', icon: '🔥' } },
  { minLevel: 50, tier: { name: 'Legend',    color: '#059669', icon: '🌟' } },
  { minLevel: 75, tier: { name: 'Mythic',    color: '#7c3aed', icon: '⚡' } },
  { minLevel: 100, tier: { name: 'Transcendent', color: '#f59e0b', icon: '✨' } },
];

export function levelTier(level: number): LevelTier {
  for (let i = LEVEL_TIERS.length - 1; i >= 0; i--) {
    if (level >= LEVEL_TIERS[i].minLevel) return LEVEL_TIERS[i].tier;
  }
  return LEVEL_TIERS[0].tier;
}

export function levelTitle(level: number): string {
  const keys = Object.keys(LEVEL_TITLES).map(Number).sort((a, b) => b - a);
  for (const k of keys) {
    if (level >= k) return LEVEL_TITLES[k];
  }
  return 'Somnoros';
}

/* ── Streak — SIMPLE & PASSIVE ── */
// Rules:
// 1. Consecutive logged days = streak grows
// 2. Miss 1 day + come back with SS >= 75 -> AUTO SAFE, streak continues
// 3. Miss 1 day + come back with SS < 75 -> pay 50 XP or streak resets to 0
// 4. Miss 2+ days in a row -> streak lost, no option to repair
// XP always stays intact regardless of streak resets.
export const STREAK_REPAIR_COST = 50;

export interface StreakResult {
  days: number;           // total streak including auto-saved gaps
  autoSaved: number;      // gaps auto-saved by good sleep (SS >= 75)
  needsRepair: boolean;   // true = 1-day gap with SS < 75, waiting for user decision
  repairDate?: string;    // date where the gap is (for localStorage key)
  xpSpentOnRepairs: number; // total XP spent on past repairs
}

function dateStr(d: Date): string { return d.toISOString().split('T')[0]; }
function prevDay(d: Date): Date { const n = new Date(d); n.setDate(n.getDate() - 1); return n; }

// Repairs stored in localStorage: { [date]: true } means user paid 50 XP to save this gap
function isRepaired(name: string, date: string): boolean {
  try { return localStorage.getItem(`st_repair_${name}_${date}`) === '1'; } catch { return false; }
}
export function saveRepair(name: string, date: string) {
  try {
    localStorage.setItem(`st_repair_${name}_${date}`, '1');
    const prev = parseInt(localStorage.getItem(`st_xp_spent_${name}`) || '0');
    localStorage.setItem(`st_xp_spent_${name}`, String(prev + STREAK_REPAIR_COST));
  } catch {}
}

export function loggingStreak(data: SleepEntry[], name: string): StreakResult {
  const personEntries = data.filter(d => d.name === name);
  const dateMap = new Map(personEntries.map(e => [e.date, e]));
  const empty: StreakResult = { days: 0, autoSaved: 0, needsRepair: false, xpSpentOnRepairs: 0 };
  if (!dateMap.size) return empty;

  const loggedDates = [...new Set(personEntries.map(e => e.date))].sort().reverse();

  // Sleep date = night before. Log on 22nd -> sheet date 21st.
  // "Active" = most recent date >= yesterday
  const twoDaysAgo = dateStr(prevDay(prevDay(new Date())));
  if (loggedDates[0] < twoDaysAgo) return empty;

  let streak = 0;
  let autoSaved = 0;
  let xpSpentOnRepairs = 0;

  // Count all past repairs XP
  try {
    xpSpentOnRepairs = parseInt(localStorage.getItem(`st_xp_spent_${name}`) || '0');
  } catch {}

  for (let i = 0; i < loggedDates.length; i++) {
    streak++;

    if (i + 1 < loggedDates.length) {
      const curr = new Date(loggedDates[i] + 'T12:00:00');
      const next = new Date(loggedDates[i + 1] + 'T12:00:00');
      const gapDays = Math.round((curr.getTime() - next.getTime()) / 86400000) - 1;

      if (gapDays === 0) continue; // consecutive

      // 2+ day gap -> streak lost, no option
      if (gapDays >= 2) break;

      // Exactly 1 day gap -- check what happened
      // The entry AFTER the gap (= loggedDates[i], the more recent one) determines fate
      const entryAfterGap = dateMap.get(loggedDates[i]);
      const ssAfter = entryAfterGap?.ss ?? 0;

      // Was this gap already repaired by user paying XP?
      if (isRepaired(name, loggedDates[i])) {
        streak += 1;
        continue;
      }

      // SS >= 75 -> auto saved, streak continues
      if (ssAfter >= 75) {
        streak += 1;
        autoSaved += 1;
        continue;
      }

      // SS < 75, not repaired -> streak pauses here, show repair option
      return {
        days: streak,
        autoSaved,
        needsRepair: true,
        repairDate: loggedDates[i],
        xpSpentOnRepairs,
      };
    }
  }

  return { days: streak, autoSaved, needsRepair: false, xpSpentOnRepairs };
}

/* ── XP System ── */
export interface XPBreakdown {
  base: number;
  bonusSS: number;
  streakBonus: number;
  goodSleepBonus: number;
  kudosXP: number;
  spent: number;
  total: number;
}

export function calcXPBreakdown(data: SleepEntry[], name: string): XPBreakdown {
  const entries = data.filter(d => d.name === name);
  const base = entries.length * 10;
  let bonusSS = 0;
  for (const e of entries) { if (e.ss >= 90) bonusSS += 10; else if (e.ss >= 80) bonusSS += 5; }

  // Streak bonuses based on CURRENT active streak
  const sr = loggingStreak(data, name);
  const streakBonus = sr.days >= 30 ? 200 : sr.days >= 7 ? 50 : 0;

  // Good sleep within current streak
  const streakE = [...entries].sort((a, b) => b.date.localeCompare(a.date)).slice(0, sr.days);
  let gsRun = 0;
  for (const e of streakE) { if (e.ss >= 75) gsRun++; else break; }
  const goodSleepBonus = gsRun >= 30 ? 500 : gsRun >= 7 ? 50 : 0;

  // Kudos XP — use getTotalKudos instead of inline localStorage scanning
  const kudosXP = getTotalKudos(name) * 5;

  let spent = 0;
  try { spent = parseInt(localStorage.getItem(`st_xp_spent_${name}`) || '0'); } catch {}

  return { base, bonusSS, streakBonus, goodSleepBonus, kudosXP, spent, total: Math.max(0, base + bonusSS + streakBonus + goodSleepBonus + kudosXP - spent) };
}

export function calcXP(data: SleepEntry[], name: string): number {
  return calcXPBreakdown(data, name).total;
}
