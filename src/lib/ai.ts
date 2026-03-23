import type { SleepEntry } from './sleep';

export interface PersonAnalysis {
  name: string;
  summary: string;
  patterns: string[];
  tips: string[];
  trend: 'up' | 'down' | 'stable';
  score_label: string;
}

export interface TeamAnalysis {
  people: PersonAnalysis[];
}

export async function analyzeTeam(data: SleepEntry[]): Promise<TeamAnalysis | null> {
  const proxyUrl = import.meta.env.VITE_AI_PROXY_URL;
  if (!proxyUrl) return null;

  const names = [...new Set(data.map(d => d.name))];
  const last30 = data.filter(d => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    return new Date(d.date) >= cutoff;
  });

  const perPerson = names.map(name => {
    const entries = last30.filter(d => d.name === name).sort((a, b) => a.date.localeCompare(b.date));
    return { name, entries: entries.map(e => ({ date: e.date, ss: e.ss, rhr: e.rhr, hrv: e.hrv })) };
  });

  const prompt = `Ești un coach de somn și wellbeing. Analizează datele de somn ale echipei și oferă insights personalizate în română.

Date somn (ultimele 30 zile):
${JSON.stringify(perPerson, null, 2)}

Răspunde cu EXACT acest format JSON (fără markdown, fără backticks, doar JSON valid):
{
  "people": [
    {
      "name": "Nume complet exact din date",
      "summary": "O propoziție scurtă cu starea generală",
      "patterns": ["pattern 1 observat", "pattern 2", "pattern 3"],
      "tips": ["tip actionabil 1", "tip actionabil 2"],
      "trend": "up sau down sau stable",
      "score_label": "Excelent sau Bine sau De îmbunătățit"
    }
  ]
}

Reguli:
- Analizează trenduri (se îmbunătățește/se deteriorează?)
- Observă corelații între RHR, HRV și Sleep Score
- Dă sfaturi concrete, nu generice
- Scrie natural în română
- Un entry per persoană din date`;

  try {
    const resp = await fetch(proxyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!resp.ok) return null;

    const json = await resp.json();
    const text = json.content?.[0]?.text;
    if (!text) return null;

    return JSON.parse(text) as TeamAnalysis;
  } catch {
    return null;
  }
}

export function isAIConfigured(): boolean {
  return !!import.meta.env.VITE_AI_PROXY_URL;
}
