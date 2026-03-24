import { type SleepEntry, NAMES } from '@/lib/sleep';
import { loggingStreak } from '@/lib/gamify';
import { getTotalKudos, getTotalKudosGiven, getMonthlyKudosReceived } from '@/lib/kudos';

export interface BadgeDef {
  id: string;
  category: 'consistency' | 'quality' | 'social' | 'fun';
  icon: string;
  name: string;
  xp: 25;
  check: (data: SleepEntry[], name: string) => BadgeStatus;
}

export interface BadgeStatus {
  earned: boolean;
  progress: number;
  target: number;
  hint: string;
}

// ── Consistency Badges ──────────────────────────────────────────────────────

function checkFirstLog(data: SleepEntry[], name: string): BadgeStatus {
  const count = data.filter(d => d.name === name).length;
  return {
    earned: count >= 1,
    progress: Math.min(count, 1),
    target: 1,
    hint: 'Logheaza prima noapte',
  };
}

function checkWeekWarrior(data: SleepEntry[], name: string): BadgeStatus {
  const streak = loggingStreak(data, name);
  return {
    earned: streak.days >= 7,
    progress: Math.min(streak.days, 7),
    target: 7,
    hint: 'Logheaza 7 zile consecutiv',
  };
}

function checkMonthMaster(data: SleepEntry[], name: string): BadgeStatus {
  const streak = loggingStreak(data, name);
  return {
    earned: streak.days >= 30,
    progress: Math.min(streak.days, 30),
    target: 30,
    hint: 'Logheaza 30 zile consecutiv',
  };
}

function checkQuarterLegend(data: SleepEntry[], name: string): BadgeStatus {
  const streak = loggingStreak(data, name);
  return {
    earned: streak.days >= 90,
    progress: Math.min(streak.days, 90),
    target: 90,
    hint: 'Logheaza 90 zile consecutiv',
  };
}

// ── Quality Badges ───────────────────────────────────────────────────────────

function checkSweetDreams(data: SleepEntry[], name: string): BadgeStatus {
  const entries = data.filter(d => d.name === name);
  const has90 = entries.some(e => e.ss >= 90);
  return {
    earned: has90,
    progress: has90 ? 1 : 0,
    target: 1,
    hint: 'Obtine SS >= 90 intr-o zi',
  };
}

function checkDreamWeek(data: SleepEntry[], name: string): BadgeStatus {
  const entries = data.filter(d => d.name === name).sort((a, b) => a.date.localeCompare(b.date));
  let maxRun = 0;
  let run = 0;
  for (const e of entries) {
    if (e.ss >= 85) {
      run++;
      maxRun = Math.max(maxRun, run);
    } else {
      run = 0;
    }
  }
  return {
    earned: maxRun >= 7,
    progress: Math.min(maxRun, 7),
    target: 7,
    hint: '7 zile consecutive cu SS >= 85',
  };
}

function checkPersonalBestSS(data: SleepEntry[], name: string): BadgeStatus {
  const count = data.filter(d => d.name === name).length;
  const earned = count >= 10;
  return {
    earned,
    progress: earned ? 1 : Math.min(count, 9),
    target: 10,
    hint: 'Logheaza 10+ nopti pentru record',
  };
}

function checkPersonalBestRHR(data: SleepEntry[], name: string): BadgeStatus {
  const count = data.filter(d => d.name === name).length;
  const earned = count >= 10;
  return {
    earned,
    progress: earned ? 1 : Math.min(count, 9),
    target: 10,
    hint: 'Logheaza 10+ nopti pentru record',
  };
}

function checkPersonalBestHRV(data: SleepEntry[], name: string): BadgeStatus {
  const entries = data.filter(d => d.name === name && d.hrv !== null);
  const count = entries.length;
  const earned = count >= 10;
  return {
    earned,
    progress: earned ? 1 : Math.min(count, 9),
    target: 10,
    hint: 'Logheaza 10+ nopti cu HRV',
  };
}

// ── Social Badges ────────────────────────────────────────────────────────────

function checkFirstKudosGiven(_data: SleepEntry[], name: string): BadgeStatus {
  const given = getTotalKudosGiven(name);
  return {
    earned: given >= 1,
    progress: Math.min(given, 1),
    target: 1,
    hint: 'Da primul kudos echipei',
  };
}

function checkCheerleader(_data: SleepEntry[], name: string): BadgeStatus {
  const given = getTotalKudosGiven(name);
  return {
    earned: given >= 30,
    progress: Math.min(given, 30),
    target: 30,
    hint: 'Da 30 kudos-uri',
  };
}

function checkFanFavorite(_data: SleepEntry[], name: string): BadgeStatus {
  const received = getTotalKudos(name);
  return {
    earned: received >= 50,
    progress: Math.min(received, 50),
    target: 50,
    hint: 'Primeste 50 kudos-uri',
  };
}

function checkTeamMVP(_data: SleepEntry[], name: string): BadgeStatus {
  const now = new Date();
  const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const myMonthly = getMonthlyKudosReceived(name, yearMonth);
  const earned = NAMES.every(n => n === name || getMonthlyKudosReceived(n, yearMonth) <= myMonthly) && myMonthly > 0;
  return {
    earned,
    progress: earned ? 1 : 0,
    target: 1,
    hint: 'Fii cel mai apreciat luna aceasta',
  };
}

// ── Fun Badges ───────────────────────────────────────────────────────────────

function checkNightOwl(data: SleepEntry[], name: string): BadgeStatus {
  const entries = data.filter(d => d.name === name).sort((a, b) => a.date.localeCompare(b.date));
  let maxLowInWindow = 0;
  for (let i = 0; i < entries.length; i++) {
    const windowStart = new Date(entries[i].date + 'T12:00:00');
    const windowEnd = new Date(windowStart);
    windowEnd.setDate(windowEnd.getDate() + 6);
    let lowCount = 0;
    for (const e of entries) {
      const d = new Date(e.date + 'T12:00:00');
      if (d >= windowStart && d <= windowEnd && e.ss < 60) lowCount++;
    }
    maxLowInWindow = Math.max(maxLowInWindow, lowCount);
  }
  return {
    earned: maxLowInWindow >= 3,
    progress: Math.min(maxLowInWindow, 3),
    target: 3,
    hint: 'SS < 60 de 3 ori intr-o saptamana',
  };
}

function checkComebackKid(data: SleepEntry[], name: string): BadgeStatus {
  const entries = data.filter(d => d.name === name).sort((a, b) => a.date.localeCompare(b.date));
  if (entries.length < 14) {
    return { earned: false, progress: 0, target: 1, hint: 'Imbunatateste SS cu 15+ puncte saptamanal' };
  }
  let earned = false;
  for (let i = 7; i < entries.length; i++) {
    const week2 = entries.slice(i - 7, i);
    const week1 = entries.slice(Math.max(0, i - 14), i - 7);
    if (week1.length === 0) continue;
    const avg1 = week1.reduce((s, e) => s + e.ss, 0) / week1.length;
    const avg2 = week2.reduce((s, e) => s + e.ss, 0) / week2.length;
    if (avg2 - avg1 >= 15) { earned = true; break; }
  }
  return { earned, progress: earned ? 1 : 0, target: 1, hint: 'Imbunatateste SS cu 15+ puncte saptamanal' };
}

function checkWeekendWarrior(data: SleepEntry[], name: string): BadgeStatus {
  const entries = data.filter(d => d.name === name).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 30);
  const weekend = entries.filter(e => {
    const day = new Date(e.date + 'T12:00:00').getDay();
    return day === 0 || day === 6;
  });
  const weekday = entries.filter(e => {
    const day = new Date(e.date + 'T12:00:00').getDay();
    return day >= 1 && day <= 5;
  });
  if (weekend.length < 4 || weekday.length === 0) {
    return { earned: false, progress: 0, target: 1, hint: 'Doarme mai bine in weekend' };
  }
  const avgWeekend = weekend.reduce((s, e) => s + e.ss, 0) / weekend.length;
  const avgWeekday = weekday.reduce((s, e) => s + e.ss, 0) / weekday.length;
  const earned = avgWeekend > avgWeekday;
  return { earned, progress: earned ? 1 : 0, target: 1, hint: 'Doarme mai bine in weekend' };
}

function checkSteadyEddie(data: SleepEntry[], name: string): BadgeStatus {
  const entries = data.filter(d => d.name === name).sort((a, b) => a.date.localeCompare(b.date));
  let maxRun = 0;
  for (let i = 0; i <= entries.length - 7; i++) {
    const window = entries.slice(i, i + 7);
    const ssVals = window.map(e => e.ss);
    const range = Math.max(...ssVals) - Math.min(...ssVals);
    if (range <= 3) maxRun = Math.max(maxRun, 7);
  }
  // Also track partial run for progress
  if (maxRun === 0) {
    let run = 1;
    let bestPartial = entries.length > 0 ? 1 : 0;
    for (let i = 1; i < entries.length; i++) {
      const window = entries.slice(Math.max(0, i - run), i + 1);
      const ssVals = window.map(e => e.ss);
      const range = Math.max(...ssVals) - Math.min(...ssVals);
      if (range <= 3) { run++; bestPartial = Math.max(bestPartial, run); }
      else run = 1;
    }
    return { earned: false, progress: Math.min(bestPartial, 7), target: 7, hint: 'SS in interval de 3 puncte, 7 zile' };
  }
  return { earned: true, progress: 7, target: 7, hint: 'SS in interval de 3 puncte, 7 zile' };
}

// ── Badge definitions ────────────────────────────────────────────────────────

export const BADGE_DEFS: BadgeDef[] = [
  // Consistency
  { id: 'first_log',      category: 'consistency', icon: '📓', name: 'Prima inregistrare',      xp: 25, check: checkFirstLog },
  { id: 'week_warrior',   category: 'consistency', icon: '⚡', name: 'Razbonicul saptamanii',   xp: 25, check: checkWeekWarrior },
  { id: 'month_master',   category: 'consistency', icon: '🔥', name: 'Maestrul lunii',           xp: 25, check: checkMonthMaster },
  { id: 'quarter_legend', category: 'consistency', icon: '👑', name: 'Legenda trimestrului',     xp: 25, check: checkQuarterLegend },
  // Quality
  { id: 'sweet_dreams',     category: 'quality', icon: '💤', name: 'Visuri placute',         xp: 25, check: checkSweetDreams },
  { id: 'dream_week',       category: 'quality', icon: '✨', name: 'Saptamana visurilor',    xp: 25, check: checkDreamWeek },
  { id: 'personal_best_ss', category: 'quality', icon: '🏆', name: 'Record personal SS',     xp: 25, check: checkPersonalBestSS },
  { id: 'personal_best_rhr',category: 'quality', icon: '💪', name: 'Record personal RHR',    xp: 25, check: checkPersonalBestRHR },
  { id: 'personal_best_hrv',category: 'quality', icon: '🧬', name: 'Record personal HRV',    xp: 25, check: checkPersonalBestHRV },
  // Social
  { id: 'first_kudos_given', category: 'social', icon: '👏', name: 'Primul kudos',           xp: 25, check: checkFirstKudosGiven },
  { id: 'cheerleader',       category: 'social', icon: '📣', name: 'Animatorul echipei',      xp: 25, check: checkCheerleader },
  { id: 'fan_favorite',      category: 'social', icon: '❤️', name: 'Favoritul echipei',      xp: 25, check: checkFanFavorite },
  { id: 'team_mvp',          category: 'social', icon: '🌟', name: 'MVP-ul lunii',            xp: 25, check: checkTeamMVP },
  // Fun
  { id: 'night_owl',        category: 'fun', icon: '🦉', name: 'Bufnita noptii',             xp: 25, check: checkNightOwl },
  { id: 'comeback_kid',     category: 'fun', icon: '🚀', name: 'Revenirea',                  xp: 25, check: checkComebackKid },
  { id: 'weekend_warrior',  category: 'fun', icon: '🏖️', name: 'Guerrierul weekendului',    xp: 25, check: checkWeekendWarrior },
  { id: 'steady_eddie',     category: 'fun', icon: '🎯', name: 'Stabil ca stanca',           xp: 25, check: checkSteadyEddie },
];

// ── localStorage persistence ─────────────────────────────────────────────────

export function getEarnedBadgeIds(user: string): string[] {
  try {
    const raw = localStorage.getItem(`st_badges_${user}`);
    if (!raw) return [];
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}

export function saveEarnedBadge(user: string, id: string): void {
  try {
    const existing = getEarnedBadgeIds(user);
    if (!existing.includes(id)) {
      existing.push(id);
      localStorage.setItem(`st_badges_${user}`, JSON.stringify(existing));
    }
  } catch {}
}

export function checkBadges(data: SleepEntry[], name: string): { def: BadgeDef; status: BadgeStatus }[] {
  return BADGE_DEFS.map(def => ({ def, status: def.check(data, name) }));
}
