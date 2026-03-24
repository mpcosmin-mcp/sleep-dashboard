import { useState, useEffect, useRef } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { type SleepEntry, personColor, NAMES } from '@/lib/sleep';
import { Chart, type ActiveElement, type ChartEvent, type TooltipItem, registerables } from 'chart.js';

Chart.register(...registerables);

const MO = ['Ian','Feb','Mar','Apr','Mai','Iun','Iul','Aug','Sep','Oct','Nov','Dec'];

function miniLabels(dates: string[]) {
  return dates.map((d, i) => {
    const [, m, day] = d.split('-');
    const dayNum = parseInt(day);
    const monthIdx = parseInt(m) - 1;
    if (i === 0 || dates[i - 1].split('-')[1] !== m) return `${MO[monthIdx]} ${dayNum}`;
    return `${dayNum}`;
  });
}

function latestValue(data: SleepEntry[], name: string, key: 'ss' | 'rhr' | 'hrv'): string {
  const entries = data.filter(d => d.name === name).sort((a, b) => b.date.localeCompare(a.date));
  if (!entries.length) return '—';
  const v = key === 'hrv' ? entries[0].hrv : entries[0][key];
  return v != null ? String(v) : '—';
}

export function ChartsPage({ data, dark, onDateClick }: { data: SleepEntry[]; dark: boolean; onDateClick?: (date: string, userFilter?: string) => void }) {
  const [userFilter, setUserFilter] = useState('');
  const chartsRef = useRef<Record<string, Chart<'line'>>>({});

  const allNames = [...new Set(data.map(d => d.name))];
  const sourceData = userFilter ? data.filter(d => d.name === userFilter) : data;
  const dates = [...new Set(sourceData.map(d => d.date))].sort();
  const names = userFilter ? [userFilter] : allNames;
  const labels = miniLabels(dates);

  useEffect(() => {
    Object.values(chartsRef.current).forEach(c => c.destroy());
    chartsRef.current = {};
    if (!dates.length) return;

    const mkGrad = (ctx: CanvasRenderingContext2D, hex: string, h: number) => {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, hex + '30');
      g.addColorStop(0.7, hex + '08');
      g.addColorStop(1, hex + '00');
      return g;
    };

    // js-index-maps: O(1) lookups instead of O(n) per date×name
    const dataMap = new Map<string, SleepEntry>();
    for (const e of sourceData) dataMap.set(`${e.date}|${e.name}`, e);

    const mkDS = (key: string, canvasId: string, h: number) => {
      const ctx = document.getElementById(canvasId)?.getContext?.('2d');
      if (!ctx) return [];
      return names.map((n) => {
        const color = personColor(n);
        return {
          label: n.split(' ')[0],
          data: dates.map(d => {
            const e = dataMap.get(`${d}|${n}`);
            return e ? (key === 'hrv' ? e.hrv : e[key]) : null;
          }),
          borderColor: color,
          backgroundColor: mkGrad(ctx, color, h),
          tension: 0.35,
          fill: true,
          borderWidth: 2.5,
          pointRadius: 0,
          pointHitRadius: 16,
          pointHoverRadius: 5,
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: color,
          pointHoverBorderWidth: 2.5,
          spanGaps: true,
        };
      });
    };

    const tickClr = dark ? '#5a5048' : '#b0a898';
    const gridClr = dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)';
    const ttBg = dark ? '#1e1914' : '#fffdf8';
    const ttTitle = dark ? '#e8ddd0' : '#2a241e';
    const ttBody = dark ? '#a89888' : '#5a5048';
    const ttBorder = dark ? '#352e26' : '#e8e0d6';

    const opts = (h: number, min?: number, max?: number) => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index' as const, intersect: false },
      onClick: (_event: ChartEvent, elements: ActiveElement[]) => {
        if (elements.length > 0 && onDateClick) {
          const idx = elements[0].index;
          const clickedDate = dates[idx];
          if (clickedDate) onDateClick(clickedDate, userFilter || undefined);
        }
      },
      animation: { duration: 500, easing: 'easeOutQuart' as const },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: ttBg, titleColor: ttTitle, bodyColor: ttBody,
          borderColor: ttBorder, borderWidth: 1, padding: 10, cornerRadius: 8,
          titleFont: { size: 11, weight: '600' as const, family: 'Geist Mono' },
          bodyFont: { size: 11, family: 'Geist Mono' },
          displayColors: true, boxWidth: 8, boxHeight: 8, boxPadding: 4, usePointStyle: true,
          callbacks: {
            title: (items: TooltipItem<'line'>[]) => {
              if (!items.length) return '';
              const idx = items[0].dataIndex;
              return dates[idx] ? (() => {
                const [y, m, d] = dates[idx].split('-');
                return `${parseInt(d)} ${MO[parseInt(m) - 1]} ${y}`;
              })() : '';
            },
          },
        },
      },
      scales: {
        x: {
          border: { display: false },
          ticks: { color: tickClr, font: { family: 'Geist Mono', size: 9 }, maxTicksLimit: 10, maxRotation: 0, autoSkip: true, padding: 4 },
          grid: { display: false },
        },
        y: {
          border: { display: false },
          ticks: { color: tickClr, font: { family: 'Geist Mono', size: 9 }, padding: 8 },
          grid: { color: gridClr, drawBorder: false },
          ...(min !== undefined ? { min } : {}),
          ...(max !== undefined ? { max } : {}),
        },
      },
    });

    chartsRef.current.ss = new Chart(document.getElementById('ch-ss')!, { type: 'line', data: { labels, datasets: mkDS('ss', 'ch-ss', 260) }, options: opts(260, 0, 100) });
    chartsRef.current.rhr = new Chart(document.getElementById('ch-rhr')!, { type: 'line', data: { labels, datasets: mkDS('rhr', 'ch-rhr', 180) }, options: opts(180) });
    chartsRef.current.hrv = new Chart(document.getElementById('ch-hrv')!, { type: 'line', data: { labels, datasets: mkDS('hrv', 'ch-hrv', 180) }, options: opts(180) });

    return () => { Object.values(chartsRef.current).forEach(c => c.destroy()); };
  }, [data, userFilter, dark, dates.join(','), names.join(',')]);

  if (!data.length) return <div className="text-center text-muted-foreground py-20 text-sm">Insuficiente date.</div>;

  const chartSection = (id: string, title: string, unit: string, key: 'ss' | 'rhr' | 'hrv', h: number) => (
    <Card className="shadow-sm">
      <CardContent className="py-5 px-5">
        {/* Header with custom legend */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{title}</div>
            <div className="text-[10px] text-muted-foreground/60 mt-0.5">{unit}</div>
          </div>
          <div className="flex items-center gap-3">
            {names.map(n => {
              const c = personColor(n);
              const val = latestValue(data, n, key);
              return (
                <div key={n} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ background: c }} />
                  <span className="text-[10px] text-muted-foreground">{n.split(' ')[0]}</span>
                  <span className="text-xs font-bold font-mono" style={{ color: c }}>{val}</span>
                </div>
              );
            })}
          </div>
        </div>
        {/* Chart */}
        <div style={{ height: h }}><canvas id={id} className={onDateClick ? 'cursor-pointer' : ''}></canvas></div>
      </CardContent>
    </Card>
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Evoluție</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Trenduri pe metrici</p>
      </div>

      <div className="flex items-center gap-2 mb-5 flex-wrap">
        <Tabs value={userFilter} onValueChange={v => setUserFilter(v)}>
          <TabsList className="h-8">
            <TabsTrigger value="" className="text-xs px-3 h-7">Toți</TabsTrigger>
            {allNames.map(n => (
              <TabsTrigger key={n} value={n} className="text-xs px-3 h-7">
                <span className="w-1.5 h-1.5 rounded-full mr-1.5 inline-block" style={{ background: personColor(n) }} />
                {n.split(' ')[0]}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <div className="space-y-4">
        {chartSection('ch-ss', 'Sleep Score', 'Calitatea somnului · 0–100', 'ss', 260)}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {chartSection('ch-rhr', 'RHR', 'Resting heart rate · BPM', 'rhr', 180)}
          {chartSection('ch-hrv', 'HRV', 'Heart rate variability · ms', 'hrv', 180)}
        </div>
      </div>
    </div>
  );
}
