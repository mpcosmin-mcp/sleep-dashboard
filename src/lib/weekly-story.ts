import { type SleepEntry, NAMES, aggregate } from '@/lib/sleep';
import { getWeekNumber, getWeekStart, getWeekEnd } from '@/lib/challenges';
import { getLatestWinner } from '@/lib/trophies';
import { isAIConfigured } from '@/lib/ai';

// ════════════════════════════════════════════════════════════════
// Weekly Team Story — AI-generated recap, cached per week
// ════════════════════════════════════════════════════════════════

export interface WeeklyStory {
  weekKey: string;
  text: string;
  source: 'ai' | 'local';
}

function cacheKey(weekKey: string): string {
  return `st_story_${weekKey}`;
}

/** Get the previous week's key */
function lastWeekKey(): string {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return `${d.getFullYear()}-W${String(getWeekNumber(d)).padStart(2, '0')}`;
}

/** Get last week's data */
function lastWeekData(data: SleepEntry[]): SleepEntry[] {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  const ws = getWeekStart(d);
  const we = getWeekEnd(ws);
  return data.filter(e => e.date >= ws && e.date <= we);
}

/** Try loading cached story */
export function getCachedStory(): WeeklyStory | null {
  const weekKey = lastWeekKey();
  try {
    const cached = localStorage.getItem(cacheKey(weekKey));
    if (cached) return JSON.parse(cached) as WeeklyStory;
  } catch {}
  return null;
}

/** Generate local fallback story (no AI needed) */
function generateLocalStory(data: SleepEntry[]): string {
  const weekData = lastWeekData(data);
  if (!weekData.length) return 'Saptamana trecuta a fost linistita. Nimeni n-a logat date. Oracolul e dezamagit.';

  const agg = aggregate(weekData);
  const winner = getLatestWinner(data);
  const teamAvg = Math.round(agg.reduce((s, a) => s + a.ss, 0) / agg.length);
  const best = agg[0];
  const worst = agg[agg.length - 1];

  const parts: string[] = [];

  // Opening
  if (teamAvg >= 85) parts.push(`Ce saptamana! Echipa a dormit cu o medie de ${teamAvg} — aproape perfect.`);
  else if (teamAvg >= 75) parts.push(`Saptamana trecuta a fost solida — media echipei: ${teamAvg}.`);
  else if (teamAvg >= 65) parts.push(`Saptamana a fost... mediocra. Media echipei: ${teamAvg}. Se poate mai bine.`);
  else parts.push(`Oof. Media echipei: ${teamAvg}. Netflix a castigat si saptamana asta.`);

  // Winner
  if (winner) {
    parts.push(`${winner.winner.split(' ')[0]} a luat trofeul ${winner.trophy.emoji} "${winner.trophy.title}" cu SS ${winner.avgSS}.`);
  }

  // Gap between best and worst
  if (agg.length >= 2 && best.ss - worst.ss > 15) {
    parts.push(`${best.name.split(' ')[0]} (SS ${best.ss}) l-a lasat pe ${worst.name.split(' ')[0]} (SS ${worst.ss}) in urma cu ${best.ss - worst.ss} puncte.`);
  } else if (agg.length >= 2 && best.ss - worst.ss <= 5) {
    parts.push(`Interesant — toti au dormit aproape la fel. Diferenta maxima: doar ${best.ss - worst.ss} puncte.`);
  }

  // Per-person color
  for (const p of agg) {
    const fn = p.name.split(' ')[0];
    if (p.ss >= 90) parts.push(`${fn} a fost in forma de zile mari.`);
    else if (p.ss < 60) parts.push(`${fn} a avut o saptamana grea la capitolul somn.`);
  }

  // Closing
  const closings = [
    'Saptamana noua, sanse noi. Hai la culcare!',
    'Sa vedem ce aduce saptamana asta. Oracolul e optimist.',
    'Pernele va asteapta. Nu le dezamagiti.',
    'Concluzie: dormiti mai mult, stresati-va mai putin.',
  ];
  const hash = new Date().getDate() + new Date().getMonth() * 31;
  parts.push(closings[hash % closings.length]);

  return parts.join(' ');
}

/** Generate AI story via proxy */
async function generateAIStory(data: SleepEntry[]): Promise<string | null> {
  const proxyUrl = import.meta.env.VITE_AI_PROXY_URL;
  if (!proxyUrl) return null;

  const weekData = lastWeekData(data);
  if (!weekData.length) return null;

  const winner = getLatestWinner(data);
  const agg = aggregate(weekData);

  const perPerson = NAMES.map(name => {
    const entries = weekData.filter(d => d.name === name);
    const avg = entries.length ? Math.round(entries.reduce((s, e) => s + e.ss, 0) / entries.length) : 0;
    return { name: name.split(' ')[0], avgSS: avg, days: entries.length };
  });

  const prompt = `Ești naratorul amuzant al unei echipe de 3 prieteni care isi urmaresc somnul. Scrie un mini-recap de saptamana in romana, maxim 4 propozitii, ton prietenos si amuzant. Include pe toti.

Date saptamana trecuta:
${perPerson.map(p => `- ${p.name}: SS mediu ${p.avgSS}, ${p.days} zile logate`).join('\n')}
${winner ? `Campionul saptamanii: ${winner.winner.split(' ')[0]} (${winner.trophy.emoji} "${winner.trophy.title}")` : ''}

Reguli:
- Maxim 4 propozitii scurte
- Ton de povestitor amuzant, nu formal
- Mentioneaza fiecare persoana cel putin o data
- Foloseste datele reale (scoruri, zile)
- Nu folosi bullet points, scrie narativ
- Raspunde DOAR cu textul, nimic altceva`;

  try {
    const resp = await fetch(proxyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!resp.ok) return null;
    const json = await resp.json();
    return json.content?.[0]?.text || null;
  } catch {
    return null;
  }
}

/** Get or generate weekly story (cached) */
export function getWeeklyStory(data: SleepEntry[]): WeeklyStory {
  const weekKey = lastWeekKey();

  // Check cache first
  const cached = getCachedStory();
  if (cached && cached.weekKey === weekKey) return cached;

  // Generate local story (instant, no AI needed)
  const text = generateLocalStory(data);
  const story: WeeklyStory = { weekKey, text, source: 'local' };

  // Cache it
  try { localStorage.setItem(cacheKey(weekKey), JSON.stringify(story)); } catch {}

  return story;
}
