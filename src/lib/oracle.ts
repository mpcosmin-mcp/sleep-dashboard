import { type SleepEntry } from '@/lib/sleep';

// ════════════════════════════════════════════════════════════════
// Sleep Oracle — mysterious daily predictions, unlock with data
// ════════════════════════════════════════════════════════════════

export interface OraclePrediction {
  level: 'locked' | 'basic' | 'pattern' | 'specific';
  text: string;
  subtext?: string;
}

const DAYS_RO = ['Duminica', 'Luni', 'Marti', 'Miercuri', 'Joi', 'Vineri', 'Sambata'];

// ── Generic pool (7-14 days) ──
const BASIC_POOL = [
  'Somnul de diseara va fi... interesant.',
  'Stelele spun ca ai nevoie de o perna in plus.',
  'Oracolul simte ca esti pe un drum bun.',
  'Diseara, corpul tau va lua o decizie importanta.',
  'Un somn bun te asteapta. Sau nu. Depinde de tine.',
  'Melatonina ta e pe drum. Ai rabdare.',
  'Vise ciudate la orizont. Enjoy the ride.',
  'Oracolul vede un RHR mai mic in viitorul tau.',
  'Cineva din echipa va dormi mai bine decat tine. Sau nu.',
  'Perna ta iti simte lipsa. Du-te la culcare.',
  'Oracolul a consultat oile. Numara-le si tu diseara.',
  'Noaptea vine cu raspunsuri. Dar doar daca dormi.',
];

// ── Day-of-week analysis helpers ──
function bestWorstDay(entries: SleepEntry[]): { best: number; worst: number; bestAvg: number; worstAvg: number } {
  const byDay: Record<number, number[]> = {};
  for (const e of entries) {
    const dow = new Date(e.date + 'T12:00:00').getDay();
    if (!byDay[dow]) byDay[dow] = [];
    byDay[dow].push(e.ss);
  }
  let best = 0, worst = 0, bestAvg = 0, worstAvg = Infinity;
  for (const [d, scores] of Object.entries(byDay)) {
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    if (avg > bestAvg) { bestAvg = avg; best = +d; }
    if (avg < worstAvg) { worstAvg = avg; worst = +d; }
  }
  return { best, worst, bestAvg: Math.round(bestAvg), worstAvg: Math.round(worstAvg) };
}

function recentTrend(entries: SleepEntry[]): 'up' | 'down' | 'stable' {
  if (entries.length < 6) return 'stable';
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  const h = Math.floor(sorted.length / 2);
  const first = sorted.slice(0, h).reduce((s, e) => s + e.ss, 0) / h;
  const second = sorted.slice(h).reduce((s, e) => s + e.ss, 0) / (sorted.length - h);
  if (second - first > 3) return 'up';
  if (first - second > 3) return 'down';
  return 'stable';
}

function avgRHR(entries: SleepEntry[]): number {
  const valid = entries.filter(e => e.rhr > 0);
  return valid.length ? Math.round(valid.reduce((s, e) => s + e.rhr, 0) / valid.length) : 0;
}

// ── Deterministic daily picker ──
function dayHash(): number {
  const d = new Date();
  return d.getDate() + d.getMonth() * 31 + d.getFullYear() * 366;
}

/** Generate today's oracle prediction for a user */
export function getOraclePrediction(data: SleepEntry[], user: string): OraclePrediction {
  const entries = data.filter(d => d.name === user).sort((a, b) => a.date.localeCompare(b.date));
  const count = entries.length;
  const hash = dayHash();

  // ── Locked: 0-6 days ──
  if (count < 7) {
    const remaining = 7 - count;
    return {
      level: 'locked',
      text: 'Oracolul se trezeste dupa 7 zile de date...',
      subtext: `Inca ${remaining} ${remaining === 1 ? 'zi' : 'zile'} pana se deblocheaza.`,
    };
  }

  // ── Basic: 7-13 days ──
  if (count < 14) {
    return {
      level: 'basic',
      text: BASIC_POOL[hash % BASIC_POOL.length],
      subtext: `Inca ${14 - count} zile pana la predictii personalizate.`,
    };
  }

  // ── Pattern: 14-29 days ──
  if (count < 30) {
    const { best, worst, bestAvg, worstAvg } = bestWorstDay(entries);
    const today = new Date().getDay();
    const trend = recentTrend(entries);

    const patterns = [
      `${DAYS_RO[worst]} e ziua ta slaba (SS ~${worstAvg}). ${today === worst ? 'Azi e ziua aia. Fii atent!' : 'Pregateste-te cand vine.'}`,
      `${DAYS_RO[best]} e ziua ta de glorie (SS ~${bestAvg}). ${today === best ? 'Azi ar trebui sa fie o noapte buna!' : 'Asteapta-o cu nerabdare.'}`,
      trend === 'up' ? 'Oracolul vede un trend ascendent. Continua asa!' : trend === 'down' ? 'Trend descendent. Oracolul recomanda o schimbare de rutina.' : 'Somnul tau e stabil. Bine, dar poti mai mult.',
      `Media ta e ${Math.round(entries.reduce((s, e) => s + e.ss, 0) / count)}. ${Math.round(entries.reduce((s, e) => s + e.ss, 0) / count) >= 80 ? 'Oracolul aproba.' : 'Oracolul ridica o spranceana.'}`,
    ];

    return {
      level: 'pattern',
      text: patterns[hash % patterns.length],
      subtext: `Inca ${30 - count} zile pana la predictii specifice.`,
    };
  }

  // ── Specific: 30+ days ──
  const { best, worst, bestAvg, worstAvg } = bestWorstDay(entries);
  const today = new Date().getDay();
  const trend = recentTrend(entries);
  const rhr = avgRHR(entries);
  const last7 = entries.slice(-7);
  const last7Avg = Math.round(last7.reduce((s, e) => s + e.ss, 0) / last7.length);
  const overallAvg = Math.round(entries.reduce((s, e) => s + e.ss, 0) / count);

  const specifics = [
    today === worst
      ? `⚠️ ${DAYS_RO[worst]} e statistic cea mai slaba zi a ta (SS ~${worstAvg}). Culca-te mai devreme diseara.`
      : today === best
        ? `🌟 ${DAYS_RO[best]} e ziua ta de top (SS ~${bestAvg}). Tonight's gonna be good.`
        : `Cel mai bun somn: ${DAYS_RO[best]} (SS ~${bestAvg}). Cel mai slab: ${DAYS_RO[worst]} (SS ~${worstAvg}).`,
    rhr > 0 && rhr < 60
      ? `RHR-ul tau mediu e ${rhr}. Inima ta e fericita. Pastreaz-o asa.`
      : rhr >= 60
        ? `RHR-ul tau mediu e ${rhr}. Oracolul sugereaza mai putin ecran seara.`
        : 'Datele tale inca se cristalizeaza...',
    last7Avg > overallAvg + 3
      ? `Ultima saptamana (SS ${last7Avg}) e peste media ta (${overallAvg}). Esti in forma!`
      : last7Avg < overallAvg - 3
        ? `Ultima saptamana (SS ${last7Avg}) e sub media ta (${overallAvg}). Timp de recalibrare.`
        : `Ultima saptamana (SS ${last7Avg}) e pe media. Consistent, dar poti mai mult.`,
    trend === 'up'
      ? '📈 Trend ascendent pe termen lung. Ceva ce faci functioneaza. Nu te opri.'
      : trend === 'down'
        ? '📉 Trend descendent. Oracolul recomanda: opreste-te, respira, analizeaza-ti rutina de seara.'
        : '➡️ Platou. Somnul tau e stabil. Pentru urmatorul nivel, incearca ceva nou.',
    `Ai ${count} nopti in baza de date. Oracolul te cunoaste mai bine decat crezi.`,
  ];

  return {
    level: 'specific',
    text: specifics[hash % specifics.length],
  };
}
