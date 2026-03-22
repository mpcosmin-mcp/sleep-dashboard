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
