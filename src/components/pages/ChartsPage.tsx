import { useState, useEffect, useRef } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { type SleepEntry, personColor } from '@/lib/sleep';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

// ════════════════════════════════════════════
// CHARTS PAGE
// ════════════════════════════════════════════

export function ChartsPage({ data, dark }: { data: SleepEntry[]; dark: boolean }) {
  const [userFilter, setUserFilter] = useState('');
  const chartsRef = useRef<Record<string, any>>({});
  const containerRef = useRef<HTMLDivElement>(null);

  const allNames = [...new Set(data.map(d => d.name))];
  const sourceData = userFilter ? data.filter(d => d.name === userFilter) : data;
  const dates = [...new Set(sourceData.map(d => d.date))].sort();
  const names = userFilter ? [userFilter] : allNames;
  const labels = dates.map(d => d.slice(5).replace('-', '/'));

  useEffect(() => {
    // Destroy previous
    Object.values(chartsRef.current).forEach((c: any) => c.destroy?.());
    chartsRef.current = {};

    if (!dates.length) return;

    const mkGrad = (ctx: any, hex: string) => {
      const g = ctx.createLinearGradient(0, 0, 0, 240);
      g.addColorStop(0, hex + '40'); g.addColorStop(1, hex + '00');
      return g;
    };

    const mkDS = (key: string, canvasId: string) => {
      const ctx = document.getElementById(canvasId)?.getContext?.('2d');
      if (!ctx) return [];
      return names.map((n) => {
        const color = personColor(n);
        return {
          label: n.split(' ')[0],
          data: dates.map(d => {
            const e = sourceData.find(r => r.date === d && r.name === n);
            return e ? (key === 'hrv' ? e.hrv : (e as any)[key]) : null;
          }),
          borderColor: color, backgroundColor: mkGrad(ctx, color),
          tension: 0.4, fill: true, borderWidth: 2,
          pointRadius: 0, pointHitRadius: 12, pointHoverRadius: 4,
          pointHoverBackgroundColor: '#fff', pointHoverBorderColor: color, pointHoverBorderWidth: 2,
          spanGaps: true,
        };
      });
    };

    const opts = (min?: number, max?: number) => {
      const labelClr = dark ? '#8a7e72' : '#8a7e72';
      const tickClr = dark ? '#5a5048' : '#b0a898';
      const gridClr = dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)';
      const ttBg = dark ? '#1e1914' : '#fffdf8';
      const ttTitle = dark ? '#e8ddd0' : '#2a241e';
      const ttBody = dark ? '#a89888' : '#5a5048';
      const ttBorder = dark ? '#352e26' : '#e8e0d6';
      return {
        responsive: true, maintainAspectRatio: false,
        interaction: { mode: 'index' as const, intersect: false },
        animation: { duration: 600 },
        plugins: {
          legend: { labels: { color: labelClr, font: { family: 'Geist Mono', size: 10, weight: '600' }, usePointStyle: true, padding: 14, pointStyleWidth: 7 } },
          tooltip: { backgroundColor: ttBg, titleColor: ttTitle, bodyColor: ttBody, borderColor: ttBorder, borderWidth: 1, padding: 8, cornerRadius: 6, titleFont: { size: 11 }, bodyFont: { size: 11 } },
        },
        scales: {
          x: { ticks: { color: tickClr, font: { family: 'Geist Mono', size: 9 } }, grid: { color: gridClr, drawBorder: false } },
          y: { ticks: { color: tickClr, font: { family: 'Geist Mono', size: 9 } }, grid: { color: gridClr, borderDash: [3, 3], drawBorder: false }, ...(min !== undefined ? { min } : {}), ...(max !== undefined ? { max } : {}) },
        },
      };
    };

    chartsRef.current.ss = new Chart(document.getElementById('ch-ss'), { type: 'line', data: { labels, datasets: mkDS('ss', 'ch-ss') }, options: opts(0, 100) });
    chartsRef.current.rhr = new Chart(document.getElementById('ch-rhr'), { type: 'line', data: { labels, datasets: mkDS('rhr', 'ch-rhr') }, options: opts() });
    chartsRef.current.hrv = new Chart(document.getElementById('ch-hrv'), { type: 'line', data: { labels, datasets: mkDS('hrv', 'ch-hrv') }, options: opts() });

    return () => { Object.values(chartsRef.current).forEach((c: any) => c.destroy?.()); };
  }, [data, userFilter, dark, dates.join(','), names.join(',')]);

  if (!data.length) return <div className="text-center text-muted-foreground py-20 text-sm">Insuficiente date.</div>;

  return (
    <div ref={containerRef}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Evoluție</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Trenduri pe metrici</p>
      </div>

      <div className="flex items-center gap-2 mb-5 flex-wrap">
        <Tabs value={userFilter} onValueChange={v => setUserFilter(v)}>
          <TabsList className="h-8">
            <TabsTrigger value="" className="text-xs px-3 h-7">Toți</TabsTrigger>
            {allNames.map(n => (
              <TabsTrigger key={n} value={n} className="text-xs px-3 h-7">{n.split(' ')[0]}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <Card className="mb-4 shadow-sm">
        <CardContent className="py-4 px-4">
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Sleep Score</div>
          <div style={{ height: 240 }}><canvas id="ch-ss"></canvas></div>
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Card className="shadow-sm"><CardContent className="py-4 px-4">
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">RHR (BPM)</div>
          <div style={{ height: 170 }}><canvas id="ch-rhr"></canvas></div>
        </CardContent></Card>
        <Card className="shadow-sm"><CardContent className="py-4 px-4">
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">HRV (ms)</div>
          <div style={{ height: 170 }}><canvas id="ch-hrv"></canvas></div>
        </CardContent></Card>
      </div>
    </div>
  );
}
