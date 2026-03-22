import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  type SleepEntry, type AggEntry, ssColor, rhrColor, hrvColor,
  getTier, fmtDate, todayStr, aggregate, personColor, NAMES, generateInsights, loggingStreak,
} from '@/lib/sleep';
import { V } from '@/lib/hide';
import { MVal } from '@/components/shared/MVal';
import { Avi } from '@/components/shared/Avi';

type DashView = 'daily' | 'weekly' | 'monthly';

/* ── Kudos system (Strava-style, localStorage) ── */
const KUDOS_REACTIONS = ['👏', '🔥', '💪', '🚀', '😴', '🏆'];

function kudosKey(from: string, to: string, date: string) {
  return `st_kudos_${date}_${from}_${to}`;
}
function getKudos(from: string, to: string, date: string): string | null {
  try { return localStorage.getItem(kudosKey(from, to, date)); } catch { return null; }
}
function saveKudos(from: string, to: string, date: string, emoji: string) {
  try { localStorage.setItem(kudosKey(from, to, date), emoji); } catch {}
}
function getKudosFor(to: string, date: string): { from: string; emoji: string }[] {
  const result: { from: string; emoji: string }[] = [];
  for (const n of NAMES) {
    const k = getKudos(n, to, date);
    if (k) result.push({ from: n, emoji: k });
  }
  return result;
}

function getTotalKudos(to: string): number {
  let count = 0;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('st_kudos_') && key.endsWith(`_${to}`)) count++;
    }
  } catch {}
  return count;
}

export function DashboardPage({ data, user }: { data: SleepEntry[]; user: string | null }) {
  const [view, setView] = useState<DashView>('daily');
  const [selDate, setSelDate] = useState('');
  const [cheerRefresh, setCheerRefresh] = useState(0);

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

  const insights = generateInsights(data, filtered);

  const handleCheer = (to: string, emoji: string) => {
    if (!user) return;
    saveKudos(user, to, todayStr(), emoji);
    setCheerRefresh(c => c + 1);
  };

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

      {/* Smart Insights */}
      {insights.length > 0 && (
        <div className="space-y-2 mb-5">
          {insights.slice(0, 4).map((ins, i) => (
            <Card key={i} className={`shadow-sm ${ins.type === 'team' ? 'border-primary/15' : 'border-transparent'}`}>
              <CardContent className="py-3 px-4 flex items-start gap-3">
                <span className="text-lg mt-0.5">{ins.emoji}</span>
                <p className="text-sm leading-relaxed">{ins.text}</p>
              </CardContent>
            </Card>
          ))}
        </div>
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
                        <div className="flex items-center gap-1.5">
                          {p.entries && <span className="text-[10px] text-muted-foreground">{p.entries} zile</span>}
                          {(() => { const s = loggingStreak(data, p.name); return s > 0 ? (
                            <span className="text-[10px] text-muted-foreground">· 🔥 {s}d streak</span>
                          ) : null; })()}
                        </div>
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

      {/* Profile cards with Kudos */}
      <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Profiluri</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        {sorted.map((p, i) => {
          const tier = getTier(p.ss);
          const kudos = getKudosFor(p.name, todayStr());
          const myKudo = user ? getKudos(user, p.name, todayStr()) : null;
          const canKudo = user && user !== p.name && !myKudo;
          return (
            <Card key={p.name + i + cheerRefresh} className={`shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${p.ss >= 90 ? 'ring-1 ring-[#1a8c5e]/20' : ''}`}
                  style={{ animationDelay: `${i * 50}ms` }}>
              <CardContent className="py-4 px-4">
                <div className="flex justify-between items-start mb-3">
                  <Avi name={p.name} size="md" />
                  <MVal value={p.ss} color={ssColor(p.ss)} unit="/100" big />
                </div>
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <div className="font-bold text-sm">{p.name}</div>
                  {(() => { const s = loggingStreak(data, p.name); return s > 0 ? (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                      🔥 {s}d
                    </span>
                  ) : null; })()}
                  {(() => { const total = getTotalKudos(p.name); return total > 0 ? (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                      👏 {total}
                    </span>
                  ) : null; })()}
                </div>
                <div className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: tier.color }}>
                  {tier.label}
                </div>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="bg-muted rounded-md p-2 text-center">
                    <div className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">RHR</div>
                    <MVal value={p.rhr} color={rhrColor(p.rhr)} unit="bpm" />
                  </div>
                  <div className="bg-muted rounded-md p-2 text-center">
                    <div className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">HRV</div>
                    <MVal value={p.hrv ?? '—'} color={hrvColor(p.hrv)} unit={p.hrv ? 'ms' : ''} />
                  </div>
                </div>

                {/* Kudos section — Strava style */}
                <div className="border-t pt-2.5">
                  {kudos.length > 0 && (
                    <div className="flex items-center gap-1.5 mb-2">
                      <div className="flex -space-x-1">
                        {kudos.map((k, ki) => (
                          <div key={ki} className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] border-2 border-card"
                               style={{ background: personColor(k.from) + '20' }}
                               title={`${k.from.split(' ')[0]} a dat ${k.emoji}`}>
                            {k.emoji}
                          </div>
                        ))}
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        {kudos.map(k => k.from.split(' ')[0]).join(', ')} {kudos.length === 1 ? 'a dat' : 'au dat'} kudos
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    {canKudo ? (
                      <div className="flex gap-1">
                        {KUDOS_REACTIONS.map(e => (
                          <button key={e} onClick={() => handleCheer(p.name, e)}
                            className="w-8 h-8 rounded-full hover:bg-muted hover:scale-110 active:scale-95 transition-all text-base flex items-center justify-center"
                            title="Dă kudos!">
                            {e}
                          </button>
                        ))}
                      </div>
                    ) : myKudo ? (
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                        <span className="text-base">{myKudo}</span> Ai dat kudos!
                      </div>
                    ) : user === p.name ? (
                      <span className="text-[10px] text-muted-foreground">Kudos de la echipă apar aici</span>
                    ) : null}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Kudos for users not in current view */}
      {user && (() => {
        const visibleNames = new Set(sorted.map(p => p.name));
        const missing = NAMES.filter(n => !visibleNames.has(n) && n !== user);
        if (!missing.length) return null;
        return (
          <div className="mb-6">
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Trimite kudos</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {missing.map(name => {
                const c = personColor(name);
                const kudos = getKudosFor(name, todayStr());
                const myKudo = getKudos(user, name, todayStr());
                return (
                  <Card key={name} className="shadow-sm">
                    <CardContent className="py-3 px-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Avi name={name} size="md" />
                        <div className="font-bold text-sm">{name}</div>
                        {(() => { const total = getTotalKudos(name); return total > 0 ? (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                            👏 {total}
                          </span>
                        ) : null; })()}
                      </div>
                      {kudos.length > 0 && (
                        <div className="flex items-center gap-1.5 mb-2">
                          <div className="flex -space-x-1">
                            {kudos.map((k, ki) => (
                              <div key={ki} className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] border-2 border-card"
                                   style={{ background: personColor(k.from) + '20' }}
                                   title={`${k.from.split(' ')[0]} a dat ${k.emoji}`}>
                                {k.emoji}
                              </div>
                            ))}
                          </div>
                          <span className="text-[10px] text-muted-foreground">
                            {kudos.map(k => k.from.split(' ')[0]).join(', ')} {kudos.length === 1 ? 'a dat' : 'au dat'} kudos
                          </span>
                        </div>
                      )}
                      {!myKudo ? (
                        <div className="flex gap-1">
                          {KUDOS_REACTIONS.map(e => (
                            <button key={e} onClick={() => handleCheer(name, e)}
                              className="w-8 h-8 rounded-full hover:bg-muted hover:scale-110 active:scale-95 transition-all text-base flex items-center justify-center"
                              title="Dă kudos!">
                              {e}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                          <span className="text-base">{myKudo}</span> Ai dat kudos!
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })()}

    </div>
  );
}
