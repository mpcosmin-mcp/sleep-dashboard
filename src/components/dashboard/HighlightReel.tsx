import { useMemo } from 'react';
import { type SleepEntry, NAMES, ssColor, personColor } from '@/lib/sleep';
import { Section } from './Section';

/* ── Weekly superlatives card (D-09, D-10) ── */

export function HighlightReel({ data }: { data: SleepEntry[] }) {
  const highlights = useMemo(() => {
    // Current week (Monday to today)
    const now = new Date();
    const dow = now.getDay() || 7; // 1=Mon..7=Sun
    const mon = new Date(now);
    mon.setDate(mon.getDate() - dow + 1);
    const monStr = mon.toISOString().split('T')[0];
    const weekData = data.filter(d => d.date >= monStr);

    if (weekData.length < 2) return [];

    // Previous week range
    const prevMon = new Date(mon);
    prevMon.setDate(prevMon.getDate() - 7);
    const prevMonStr = prevMon.toISOString().split('T')[0];
    const prevSun = new Date(prevMon);
    prevSun.setDate(prevSun.getDate() + 6);
    const prevSunStr = prevSun.toISOString().split('T')[0];
    const prevWeekData = data.filter(d => d.date >= prevMonStr && d.date <= prevSunStr);

    const result: { icon: string; label: string; name: string; value: string; color: string }[] = [];

    // 1. Best sleep — highest single SS this week
    const bestEntry = weekData.reduce((best, e) => e.ss > best.ss ? e : best, weekData[0]);
    if (bestEntry) {
      result.push({ icon: '💤', label: 'Cel mai bun somn', name: bestEntry.name, value: `SS ${bestEntry.ss}`, color: ssColor(bestEntry.ss) });
    }

    // 2. Most consistent — smallest SS std dev (min 3 entries)
    let bestConsistent: { name: string; stdDev: number } | null = null;
    for (const n of NAMES) {
      const entries = weekData.filter(d => d.name === n);
      if (entries.length < 3) continue;
      const avg = entries.reduce((s, e) => s + e.ss, 0) / entries.length;
      const variance = entries.reduce((s, e) => s + (e.ss - avg) ** 2, 0) / entries.length;
      const stdDev = Math.round(Math.sqrt(variance) * 10) / 10;
      if (!bestConsistent || stdDev < bestConsistent.stdDev) {
        bestConsistent = { name: n, stdDev };
      }
    }
    if (bestConsistent) {
      result.push({ icon: '🎯', label: 'Cel mai consistent', name: bestConsistent.name, value: `+/-${bestConsistent.stdDev}`, color: personColor(bestConsistent.name) });
    }

    // 3. Biggest improvement — week avg vs previous week avg
    let bestImprovement: { name: string; improvement: number } | null = null;
    for (const n of NAMES) {
      const currEntries = weekData.filter(d => d.name === n);
      const prevEntries = prevWeekData.filter(d => d.name === n);
      if (!currEntries.length || !prevEntries.length) continue;
      const currAvg = currEntries.reduce((s, e) => s + e.ss, 0) / currEntries.length;
      const prevAvg = prevEntries.reduce((s, e) => s + e.ss, 0) / prevEntries.length;
      const improvement = Math.round(currAvg - prevAvg);
      if (improvement > 0 && (!bestImprovement || improvement > bestImprovement.improvement)) {
        bestImprovement = { name: n, improvement };
      }
    }
    if (bestImprovement) {
      result.push({ icon: '📈', label: 'Cea mai mare imbunatatire', name: bestImprovement.name, value: `+${bestImprovement.improvement}`, color: '#16a34a' });
    }

    // 4. Most active — most entries logged this week
    let bestActive: { name: string; count: number } | null = null;
    for (const n of NAMES) {
      const count = weekData.filter(d => d.name === n).length;
      if (count > 0 && (!bestActive || count > bestActive.count)) {
        bestActive = { name: n, count };
      }
    }
    if (bestActive) {
      result.push({ icon: '📊', label: 'Cel mai activ', name: bestActive.name, value: `${bestActive.count} zile`, color: personColor(bestActive.name) });
    }

    return result;
  }, [data]);

  if (!highlights.length) return null;

  return (
    <Section title="Repere saptamanale" icon="🌟" defaultOpen={true}>
      <div className="grid grid-cols-2 gap-2 pt-2">
        {highlights.map(h => (
          <div key={h.label} className="flex items-center gap-1.5 p-1.5 rounded-lg bg-muted/30">
            <span className="text-sm">{h.icon}</span>
            <div className="min-w-0">
              <div className="text-[8px] text-muted-foreground">{h.label}</div>
              <div className="text-[10px] font-bold truncate" style={{ color: h.color }}>
                {h.name.split(' ')[0]} <span className="font-mono">{h.value}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}
