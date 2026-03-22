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

const MC = { elite: '#1a8c5e', good: '#2a96a8', ok: '#c49020', poor: '#d06830', bad: '#c43a3a', dim: '#a09585' };

export function ssColor(ss: number) {
  if (ss >= 90) return MC.elite; if (ss >= 80) return MC.good;
  if (ss >= 65) return MC.ok; if (ss >= 50) return MC.poor; return MC.bad;
}
export function rhrColor(rhr: number) {
  if (rhr < 50) return MC.elite; if (rhr < 55) return MC.good;
  if (rhr < 60) return MC.ok; if (rhr < 70) return MC.poor; return MC.bad;
}
export function hrvColor(hrv: number | null) {
  if (hrv == null) return MC.dim;
  if (hrv > 65) return MC.elite; if (hrv > 50) return MC.good;
  if (hrv > 35) return MC.ok; if (hrv > 20) return MC.poor; return MC.bad;
}

export function getTier(ss: number) {
  if (ss >= 90) return { label: 'Excelent', color: MC.elite };
  if (ss >= 80) return { label: 'Foarte bine', color: MC.good };
  if (ss >= 65) return { label: 'Bine', color: MC.ok };
  if (ss >= 50) return { label: 'Mediu', color: MC.poor };
  return { label: 'Slab', color: MC.bad };
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

export function jsonp(url: string): Promise<any> {
  return new Promise((res, rej) => {
    const cb = 'cb_' + Date.now() + Math.floor(Math.random() * 1000);
    const s = document.createElement('script');
    s.src = url + '&callback=' + cb;
    (window as any)[cb] = (d: any) => { delete (window as any)[cb]; document.body.removeChild(s); res(d); };
    s.onerror = () => { delete (window as any)[cb]; document.body.removeChild(s); rej(new Error('Net')); };
    document.body.appendChild(s);
  });
}

export async function fetchAllData(): Promise<SleepEntry[]> {
  const json = await jsonp(API + '?v=' + Date.now());
  return (json.data || []).map((r: any) => ({
    date: String(r.date || '').trim(), name: String(r.name || '').trim(),
    ss: parseFloat(r.sleep_score) || 0, rhr: parseFloat(r.rhr) || 0,
    hrv: r.hrv !== '' && r.hrv != null ? parseFloat(r.hrv) : null,
  })).filter((r: SleepEntry) => r.date && r.name);
}

export async function submitEntry(entry: Record<string, any>) {
  const params = new URLSearchParams({ action: 'write', ...entry });
  await jsonp(`${API}?${params}`);
}

/* ── Streak with freeze (Duolingo-style, max 3 gap days) ── */
// Gap costs: 1 day = free (if SS>=75) or 50 XP, 2 days = 100 XP, 3 days = 300 XP
// 4+ days gap = streak lost
const GAP_XP_COST = [0, 50, 100, 300]; // index = gap days

export interface StreakResult {
  days: number;
  freezesDays: number;       // how many gap days were frozen
  freeFreeze: boolean;       // first gap was saved by SS >= 75
  xpSpent: number;           // total XP spent on freezes
}

function dateStr(d: Date): string { return d.toISOString().split('T')[0]; }
function prevDay(d: Date): Date { const n = new Date(d); n.setDate(n.getDate() - 1); return n; }

export function loggingStreak(data: SleepEntry[], name: string): StreakResult {
  const personEntries = data.filter(d => d.name === name);
  const dateMap = new Map(personEntries.map(e => [e.date, e]));
  const empty: StreakResult = { days: 0, freezesDays: 0, freeFreeze: false, xpSpent: 0 };
  if (!dateMap.size) return empty;

  // Build sorted list of dates this person logged
  const loggedDates = [...new Set(personEntries.map(e => e.date))].sort().reverse();

  // Start from most recent logged date
  let streak = 0;
  let freezesDays = 0;
  let freeFreeze = false;
  let xpSpent = 0;
  let usedFreeFreeze = false;

  // Check that most recent entry is today or yesterday (otherwise streak is 0)
  const today = dateStr(new Date());
  const yesterday = dateStr(prevDay(new Date()));
  if (loggedDates[0] !== today && loggedDates[0] !== yesterday) return empty;

  for (let i = 0; i < loggedDates.length; i++) {
    streak++;

    // Check gap to next (older) date
    if (i + 1 < loggedDates.length) {
      const curr = new Date(loggedDates[i] + 'T12:00:00');
      const next = new Date(loggedDates[i + 1] + 'T12:00:00');
      const gapDays = Math.round((curr.getTime() - next.getTime()) / 86400000) - 1;

      if (gapDays === 0) continue; // consecutive, no gap
      if (gapDays > 3) break; // too big, streak over

      // Try free freeze first (1 gap day, SS >= 75 on day after gap)
      const entryAfterGap = dateMap.get(loggedDates[i]);
      if (gapDays === 1 && !usedFreeFreeze && entryAfterGap && entryAfterGap.ss >= 75) {
        freeFreeze = true;
        usedFreeFreeze = true;
        freezesDays += 1;
        streak += 1;
        continue;
      }

      // XP freeze
      let cost = 0;
      for (let g = 0; g < gapDays; g++) {
        cost += GAP_XP_COST[Math.min(g + 1, GAP_XP_COST.length - 1)];
      }
      const availableXP = calcXP(data, name) - xpSpent;
      if (availableXP >= cost) {
        xpSpent += cost;
        freezesDays += gapDays;
        streak += gapDays;
      } else {
        break; // can't afford
      }
    }
  }

  return { days: streak, freezesDays, freeFreeze, xpSpent };
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

  // Streak milestones (based on consecutive days, simplified)
  const dates = [...new Set(entries.map(e => e.date))].sort();
  let maxConsec = 0;
  let curConsec = 1;
  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1] + 'T12:00:00');
    const curr = new Date(dates[i] + 'T12:00:00');
    const diffDays = Math.round((curr.getTime() - prev.getTime()) / 86400000);
    if (diffDays === 1) { curConsec++; }
    else { maxConsec = Math.max(maxConsec, curConsec); curConsec = 1; }
  }
  maxConsec = Math.max(maxConsec, curConsec);
  if (maxConsec >= 30) xp += 200;
  else if (maxConsec >= 7) xp += 50;

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

export function aggregate(data: SleepEntry[]): AggEntry[] {
  const grp: Record<string, any> = {};
  data.forEach(e => {
    if (!grp[e.name]) grp[e.name] = { name: e.name, n: 0, ss: 0, rhr: 0, hrv: 0, hrvN: 0 };
    grp[e.name].n++; grp[e.name].ss += e.ss; grp[e.name].rhr += e.rhr;
    if (e.hrv !== null) { grp[e.name].hrv += e.hrv; grp[e.name].hrvN++; }
  });
  return Object.values(grp).map((g: any) => ({
    name: g.name, date: '', ss: Math.round(g.ss / g.n), rhr: Math.round(g.rhr / g.n),
    hrv: g.hrvN > 0 ? Math.round(g.hrv / g.hrvN) : null, entries: g.n,
  })).sort((a, b) => b.ss - a.ss);
}
