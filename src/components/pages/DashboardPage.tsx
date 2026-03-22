import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  type SleepEntry, type AggEntry, ssColor, rhrColor, hrvColor,
  getTier, getInsight, fmtDate, todayStr, aggregate,
} from '@/lib/sleep';
import { V } from '@/lib/hide';
import { MVal } from '@/components/shared/MVal';
import { Avi } from '@/components/shared/Avi';

type DashView = 'daily' | 'weekly' | 'monthly';

export function DashboardPage({ data }: { data: SleepEntry[] }) {
  const [view, setView] = useState<DashView>('daily');
  const [selDate, setSelDate] = useState('');

  const dates = [...new Set(data.map(d => d.date))].sort();
  const activeDate = selDate || dates[dates.length - 1] || '';

  let filtered: SleepEntry[] = [];
  let subText = '';

  if (view === 'daily') {
    filtered = data.filter(d => d.date === activeDate);
    subText = fmtDate(activeDate);
  } else if (view === 'weekly') {
    const now = new Date();
    const dow = now.getDay() || 7;
    const mon = new Date(now); mon.setDate(mon.getDate() - dow + 1);
    const monStr = mon.toISOString().split('T')[0];
    filtered = data.filter(d => d.date >= monStr);
    subText = 'Săptămâna curentă';
  } else {
    const prefix = todayStr().substring(0, 7);
    filtered = data.filter(d => d.date.startsWith(prefix));
    const mo = ['Ianuarie','Februarie','Martie','Aprilie','Mai','Iunie','Iulie','August','Septembrie','Octombrie','Noiembrie','Decembrie'];
    subText = mo[parseInt(prefix.split('-')[1]) - 1];
  }

  const sorted: AggEntry[] = view === 'daily'
    ? [...filtered].sort((a, b) => b.ss - a.ss)
    : aggregate(filtered);

  const avgSS = sorted.length ? Math.round(sorted.reduce((s, p) => s + p.ss, 0) / sorted.length) : 0;
  const avgRHR = sorted.length ? Math.round(sorted.reduce((s, p) => s + p.rhr, 0) / sorted.length) : 0;
  const hrvP = sorted.filter(p => p.hrv !== null);
  const avgHRV = hrvP.length ? Math.round(hrvP.reduce((s, p) => s + (p.hrv || 0), 0) / hrvP.length) : null;

  if (!data.length) return <div className="text-center text-muted-foreground py-20 text-sm">Nicio înregistrare încă.</div>;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{subText}</p>
      </div>

      <div className="flex items-center gap-2 mb-5 flex-wrap">
        <Tabs value={view} onValueChange={v => setView(v as DashView)}>
          <TabsList className="h-8">
            <TabsTrigger value="daily" className="text-xs px-3 h-7">Zi</TabsTrigger>
            <TabsTrigger value="weekly" className="text-xs px-3 h-7">Săptămână</TabsTrigger>
            <TabsTrigger value="monthly" className="text-xs px-3 h-7">Lună</TabsTrigger>
          </TabsList>
        </Tabs>
        {view === 'daily' && (
          <select value={activeDate} onChange={e => setSelDate(e.target.value)}
            className="text-xs font-semibold bg-card border rounded-md px-2 py-1.5 outline-none focus:ring-1 ring-primary/30">
            {dates.map(d => <option key={d} value={d}>{fmtDate(d)}</option>)}
          </select>
        )}
      </div>

      {/* Insight */}
      {sorted.length > 0 && (
        <Card className="mb-5 border-primary/15 shadow-sm">
          <CardContent className="py-3.5 px-4 flex items-start gap-3">
            <span className="text-xl mt-0.5">🦉</span>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-primary mb-0.5">Insight</div>
              <p className="text-sm leading-relaxed">{getInsight(avgSS)}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        <Card><CardContent className="py-3.5 px-4">
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Sleep Score</div>
          <div className="font-mono text-2xl font-bold mt-1" style={{ color: ssColor(avgSS) }}>{avgSS}</div>
          <div className="text-[10px] text-muted-foreground mt-0.5">Medie /100</div>
        </CardContent></Card>
        <Card><CardContent className="py-3.5 px-4">
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">RHR</div>
          <div className="font-mono text-2xl font-bold mt-1" style={{ color: rhrColor(avgRHR) }}>{avgRHR}</div>
          <div className="text-[10px] text-muted-foreground mt-0.5">BPM resting</div>
        </CardContent></Card>
        {avgHRV !== null && (
          <Card><CardContent className="py-3.5 px-4">
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">HRV</div>
            <div className="font-mono text-2xl font-bold mt-1" style={{ color: hrvColor(avgHRV) }}>{avgHRV}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">ms mediu</div>
          </CardContent></Card>
        )}
      </div>

      {/* Leaderboard */}
      <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Leaderboard</div>
      <Card className="mb-6 overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-10 text-[10px]">#</TableHead>
              <TableHead className="text-[10px]">Nume</TableHead>
              <TableHead className="text-[10px] text-right">Sleep</TableHead>
              <TableHead className="text-[10px] text-right">RHR</TableHead>
              <TableHead className="text-[10px] text-right">HRV</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((p, i) => {
              const tier = getTier(p.ss);
              const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`;
              return (
                <TableRow key={p.name + i}>
                  <TableCell className="font-mono text-xs font-bold text-muted-foreground">{medal}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avi name={p.name} />
                      <div>
                        <div className="text-sm font-semibold">{p.name}</div>
                        {p.entries && <div className="text-[10px] text-muted-foreground">{p.entries} zile</div>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="outline" className="font-mono text-xs font-bold border-0 px-2"
                           style={{ color: tier.color, background: tier.color + '12' }}>
                      <V>{p.ss}</V>
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs font-medium" style={{ color: rhrColor(p.rhr) }}>
                    <V>{p.rhr}</V>
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs font-medium" style={{ color: hrvColor(p.hrv) }}>
                    {p.hrv != null ? <V>{p.hrv}</V> : '—'}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      {/* Profile cards */}
      <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Profiluri</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {sorted.map((p, i) => {
          const tier = getTier(p.ss);
          return (
            <Card key={p.name + i} className={`shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${p.ss >= 90 ? 'ring-1 ring-[#1a8c5e]/20' : ''}`}
                  style={{ animationDelay: `${i * 50}ms` }}>
              <CardContent className="py-4 px-4">
                <div className="flex justify-between items-start mb-3">
                  <Avi name={p.name} size="md" />
                  <MVal value={p.ss} color={ssColor(p.ss)} unit="/100" big />
                </div>
                <div className="font-bold text-sm mb-0.5">{p.name}</div>
                <div className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: tier.color }}>
                  {tier.label}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-muted rounded-md p-2 text-center">
                    <div className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">RHR</div>
                    <MVal value={p.rhr} color={rhrColor(p.rhr)} unit="bpm" />
                  </div>
                  <div className="bg-muted rounded-md p-2 text-center">
                    <div className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">HRV</div>
                    <MVal value={p.hrv ?? '—'} color={hrvColor(p.hrv)} unit={p.hrv ? 'ms' : ''} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
