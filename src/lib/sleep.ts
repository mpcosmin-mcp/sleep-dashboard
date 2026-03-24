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
// Re-export gamification logic from dedicated modules for backward compatibility
export { calcXP, calcXPBreakdown, loggingStreak, xpLevel, xpProgress, XP_PER_LEVEL, XP_COLOR, STREAK_COLOR, levelTier, levelTitle, saveRepair, STREAK_REPAIR_COST } from './gamify';
export type { XPBreakdown, StreakResult } from './gamify';

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
  return Object.values(grp).map((g: AggAccumulator) => ({
    name: g.name, date: '', ss: Math.round(g.ss / g.n), rhr: Math.round(g.rhr / g.n),
    hrv: g.hrvN > 0 ? Math.round(g.hrv / g.hrvN) : null, entries: g.n,
  })).sort((a, b) => b.ss - a.ss);
}
