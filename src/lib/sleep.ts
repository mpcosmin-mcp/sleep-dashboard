export interface SleepEntry {
  date: string;
  name: string;
  ss: number;
  rhr: number;
  hrv: number | null;
}

export interface AggEntry extends SleepEntry {
  entries?: number;
}

export const API = 'https://script.google.com/macros/s/AKfycbwNbyFuoNJV6XPAWbwANg1DOuW9rBshHlBrm3cLPcDeZORwu2L2k8N6VoHYNKdoyKhYtg/exec';
export const NAMES = ['Clara-Ileana Cirpatorea', 'Petrica Cosmin Moga', 'Cornel-Gabriel Meleru'];
export const PALETTE = ['#c9547a', '#3a82b0', '#2a8c6e'];

/* Per-person color map — keeps avatars & charts consistent */
const PERSON_COLOR: Record<string, string> = {
  'Clara-Ileana Cirpatorea': '#c9547a',   // rose — feminine
  'Petrica Cosmin Moga':     '#3a82b0',   // ocean blue
  'Cornel-Gabriel Meleru':   '#2a8c6e',   // teal green
};

// Sleep Score: blue (best) → green → amber → red
const SS = { top: '#2563eb', good: '#16a34a', ok: '#ca8a04', poor: '#ea580c', bad: '#dc2626' };
// RHR: lower is better — blue (calm) → green → amber → red
const RHR = { elite: '#2563eb', good: '#16a34a', ok: '#ca8a04', poor: '#ea580c', bad: '#dc2626' };
// HRV: nervous system — purple-blue spectrum (personal, varies)
const HRV = { high: '#7c3aed', good: '#2563eb', ok: '#ca8a04', low: '#ea580c', bad: '#dc2626', dim: '#a09585' };
// XP & Streak: Duolingo golden
export const XP_COLOR = '#f59e0b';
export const STREAK_COLOR = '#f97316';
export const XP_PER_LEVEL = 100;
export function xpLevel(xp: number) { return Math.floor(xp / XP_PER_LEVEL) + 1; }
export function xpProgress(xp: number) { return xp % XP_PER_LEVEL; } // 0-99

// Level titles — fun + professional, up to 100
const LEVEL_TITLES: Record<number, string> = {
  1: 'Somnoros',
  2: 'Începător',
  3: 'Pui de somn',
  4: 'Dormitor',
  5: 'Nocturn',
  6: 'Visător',
  7: 'Moț de noapte',
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
  100: 'Grand Master 💎',
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

export function ssColor(ss: number) {
  if (ss >= 90) return SS.top; if (ss >= 80) return SS.good;
  if (ss >= 65) return SS.ok; if (ss >= 50) return SS.poor; return SS.bad;
}
export function rhrColor(rhr: number) {
  if (rhr < 52) return RHR.elite; if (rhr < 58) return RHR.good;
  if (rhr < 65) return RHR.ok; if (rhr < 72) return RHR.poor; return RHR.bad;
}
export function hrvColor(hrv: number | null) {
  if (hrv == null) return HRV.dim;
  if (hrv > 65) return HRV.high; if (hrv > 50) return HRV.good;
  if (hrv > 35) return HRV.ok; if (hrv > 20) return HRV.low; return HRV.bad;
}

// Background tints for metric cells
export function ssBg(ss: number) { return ssColor(ss) + '12'; }
export function rhrBg(rhr: number) { return rhrColor(rhr) + '12'; }
export function hrvBg(hrv: number | null) { return hrvColor(hrv) + '12'; }

export function getTier(ss: number) {
  if (ss >= 90) return { label: 'Excelent', color: SS.top };
  if (ss >= 80) return { label: 'Foarte bine', color: SS.good };
  if (ss >= 65) return { label: 'Bine', color: SS.ok };
  if (ss >= 50) return { label: 'Mediu', color: SS.poor };
  return { label: 'Slab', color: SS.bad };
}

export function getInsight(avgSS: number) {
  if (avgSS >= 90) return 'Recuperare excelentă — zi ideală pentru deep work sau antrenament intens.';
  if (avgSS >= 80) return 'Nivel solid de readiness. Mențineți consistența orei de culcare.';
  if (avgSS >= 65) return 'Energie fluctuantă. Considerați un NSDR la prânz, fără cafea după 14:00.';
  return 'Sleep debt activ — doar task-uri esențiale, hidratare, culcare devreme.';
}

/* ── Smart Insight — one liner, funny, data-driven ── */
export interface Insight { emoji: string; text: string; type: 'team' | 'person'; }

export function generateInsights(data: SleepEntry[], filtered: SleepEntry[]): Insight[] {
  if (data.length < 2) return [];

  const agg = aggregate(filtered);
  if (!agg.length) return [];

  const teamAvgSS = Math.round(agg.reduce((s, a) => s + a.ss, 0) / agg.length);
  const best = agg[0];
  const worst = agg[agg.length - 1];
  const gap = agg.length >= 2 ? best.ss - worst.ss : 0;

  // Build pool of possible one-liners, pick one based on day
  const pool: Insight[] = [];

  // Team vibes
  if (teamAvgSS >= 90) pool.push({ emoji: '👑', text: 'Echipa doarme ca regii. Cine v-a învățat?', type: 'team' });
  if (teamAvgSS >= 80) pool.push({ emoji: '🎯', text: 'Solid! Încă 1% și sunteți pe podium.', type: 'team' });
  if (teamAvgSS >= 65 && teamAvgSS < 80) pool.push({ emoji: '📱', text: 'Mediocru. Pariez că telefonul e ultimul lucru pe care-l atingeți seara.', type: 'team' });
  if (teamAvgSS < 65) pool.push({ emoji: '🛋️', text: 'Netflix 1 — Echipa 0. Mergeți la culcare!', type: 'team' });
  if (gap >= 20) pool.push({ emoji: '😬', text: `${best.name.split(' ')[0]} doarme regește, ${worst.name.split(' ')[0]} doarme pe bani. Gap de ${gap} puncte.`, type: 'team' });
  if (gap <= 5 && agg.length >= 2) pool.push({ emoji: '🤜🤛', text: 'Toți dormiți la fel — asta-i bromance pe somn.', type: 'team' });

  // Per-person zingers
  for (const p of agg) {
    const fn = p.name.split(' ')[0];
    if (p.ss >= 95) pool.push({ emoji: '💎', text: `${fn} doarme ca un bebeluș bogat. SS ${p.ss}!`, type: 'person' });
    if (p.ss >= 85 && p.ss < 95) pool.push({ emoji: '😎', text: `${fn} e fresh. Probabil visează strategii de business.`, type: 'person' });
    if (p.ss < 50) pool.push({ emoji: '☕', text: `${fn}, ai dormit sau ai doar clipit? SS ${p.ss}... respect pentru curaj.`, type: 'person' });
    if (p.rhr < 55) pool.push({ emoji: '🫀', text: `${fn} are inima de atlet — RHR ${p.rhr}. Ești sigur că nu ești robot?`, type: 'person' });
    if (p.rhr > 70) pool.push({ emoji: '🍷', text: `${fn}, RHR ${p.rhr}? Fie e stres, fie a fost o seară interesantă.`, type: 'person' });
  }

  if (!pool.length) pool.push({ emoji: '🦉', text: 'Logați date ca să primești roast-uri personalizate.', type: 'team' });

  // Pick 1 based on today's date (deterministic but changes daily)
  const dayHash = new Date().getDate() + new Date().getMonth() * 31;
  return [pool[dayHash % pool.length]];
}

export function initials(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
}
export function avatarColor(name: string) {
  return PERSON_COLOR[name] ?? PALETTE[0];
}
export function personColor(name: string) {
  return PERSON_COLOR[name] ?? PALETTE[0];
}
export function fmtDate(d: string) {
  if (!d) return '';
  const [y, m, day] = d.split('-');
  const mo = ['Ian','Feb','Mar','Apr','Mai','Iun','Iul','Aug','Sep','Oct','Nov','Dec'];
  return `${parseInt(day)} ${mo[parseInt(m) - 1]} ${y}`;
}
export function todayStr() { return new Date().toISOString().split('T')[0]; }

export function jsonp(url: string): Promise<unknown> {
  return new Promise((res, rej) => {
    const cb = 'cb_' + Date.now() + Math.floor(Math.random() * 1000);
    const s = document.createElement('script');
    s.src = url + '&callback=' + cb;
    const w = window as unknown as Record<string, unknown>;
    w[cb] = (d: unknown) => { delete w[cb]; document.body.removeChild(s); res(d); };
    s.onerror = () => { delete w[cb]; document.body.removeChild(s); rej(new Error('Net')); };
    document.body.appendChild(s);
  });
}

interface RawSheetRow {
  date?: string;
  name?: string;
  sleep_score?: string | number;
  rhr?: string | number;
  hrv?: string | number | null | '';
}

export async function fetchAllData(): Promise<SleepEntry[]> {
  const json = await jsonp(API + '?v=' + Date.now()) as { data?: RawSheetRow[] };
  return (json.data || []).map((r: RawSheetRow) => ({
    date: String(r.date || '').trim().slice(0, 10),
    name: String(r.name || '').trim(),
    ss: parseFloat(String(r.sleep_score)) || 0,
    rhr: parseFloat(String(r.rhr)) || 0,
    hrv: r.hrv !== '' && r.hrv != null ? parseFloat(String(r.hrv)) : null,
  })).filter((r: SleepEntry) => r.date && r.name);
}

export async function submitEntry(entry: Record<string, string | number>) {
  const params = new URLSearchParams({ action: 'write', ...entry });
  await jsonp(`${API}?${params}`);
}

/* ── Streak — SIMPLE & PASSIVE ── */
// Rules:
// 1. Consecutive logged days = streak grows
// 2. Miss 1 day + come back with SS >= 75 → AUTO SAFE, streak continues
// 3. Miss 1 day + come back with SS < 75 → pay 50 XP or streak resets to 0
// 4. Miss 2+ days in a row → streak lost, no option to repair
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

  // Sleep date = night before. Log on 22nd → sheet date 21st.
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

      // 2+ day gap → streak lost, no option
      if (gapDays >= 2) break;

      // Exactly 1 day gap — check what happened
      // The entry AFTER the gap (= loggedDates[i], the more recent one) determines fate
      const entryAfterGap = dateMap.get(loggedDates[i]);
      const ssAfter = entryAfterGap?.ss ?? 0;

      // Was this gap already repaired by user paying XP?
      if (isRepaired(name, loggedDates[i])) {
        streak += 1;
        continue;
      }

      // SS >= 75 → auto saved, streak continues
      if (ssAfter >= 75) {
        streak += 1;
        autoSaved += 1;
        continue;
      }

      // SS < 75, not repaired → streak pauses here, show repair option
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
export function calcXP(data: SleepEntry[], name: string): number {
  const entries = data.filter(d => d.name === name);
  let xp = 0;

  // Base XP: +10 per logged day
  xp += entries.length * 10;

  // Bonus: +5 for SS >= 80, +10 for SS >= 90
  for (const e of entries) {
    if (e.ss >= 90) xp += 10;
    else if (e.ss >= 80) xp += 5;
  }

  // Streak bonuses — based on CURRENT active streak only (resets when streak is lost)
  const sr = loggingStreak(data, name);
  if (sr.days >= 30) xp += 200;
  else if (sr.days >= 7) xp += 50;

  // Good sleep bonus — count consecutive SS >= 75 within current streak only
  // Walk current streak entries and count good sleep run
  const streakEntries = entries.sort((a, b) => b.date.localeCompare(a.date)).slice(0, sr.days);
  let goodSleepRun = 0;
  for (const e of streakEntries) {
    if (e.ss >= 75) goodSleepRun++;
    else break; // stop at first bad sleep within streak
  }
  if (goodSleepRun >= 30) xp += 500;
  else if (goodSleepRun >= 7) xp += 50;

  // Kudos XP (+5 per kudos received) — read from localStorage
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('st_kudos_') && key.endsWith(`_${name}`)) xp += 5;
    }
  } catch {}

  // Deduct spent XP for streak freezes (track in localStorage)
  try {
    const spent = parseInt(localStorage.getItem(`st_xp_spent_${name}`) || '0');
    xp -= spent;
  } catch {}

  return Math.max(0, xp);
}

interface AggAccumulator {
  name: string;
  n: number;
  ss: number;
  rhr: number;
  hrv: number;
  hrvN: number;
}

export function aggregate(data: SleepEntry[]): AggEntry[] {
  const grp: Record<string, AggAccumulator> = {};
  data.forEach(e => {
    if (!grp[e.name]) grp[e.name] = { name: e.name, n: 0, ss: 0, rhr: 0, hrv: 0, hrvN: 0 };
    grp[e.name].n++; grp[e.name].ss += e.ss; grp[e.name].rhr += e.rhr;
    if (e.hrv !== null) { grp[e.name].hrv += e.hrv; grp[e.name].hrvN++; }
  });
  return Object.values(grp).map((g) => ({
    name: g.name, date: '', ss: Math.round(g.ss / g.n), rhr: Math.round(g.rhr / g.n),
    hrv: g.hrvN > 0 ? Math.round(g.hrv / g.hrvN) : null, entries: g.n,
  })).sort((a, b) => b.ss - a.ss);
}
