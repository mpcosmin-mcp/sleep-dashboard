import { useMemo } from 'react';
import { type SleepEntry, ssColor, fmtDate, personColor } from '@/lib/sleep';
import { Section } from './Section';

/* ── Helpers ── */
function localDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

interface CalDay { date: string; day: number; logged: boolean; ss: number; isCurrentMonth: boolean; isToday: boolean; }

function get7Days(data: SleepEntry[], name: string) {
  const today = new Date();
  const dayNames = ['Du', 'Lu', 'Ma', 'Mi', 'Jo', 'Vi', 'Sâ'];
  const personDates = new Map(data.filter(d => d.name === name).map(e => [e.date, e]));
  const days: { date: string; logged: boolean; ss: number; label: string }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today); d.setDate(d.getDate() - i);
    const sd = new Date(d); sd.setDate(sd.getDate() - 1);
    const ds = sd.toISOString().split('T')[0];
    const entry = personDates.get(ds);
    days.push({ date: ds, logged: !!entry, ss: entry?.ss || 0, label: dayNames[d.getDay()] });
  }
  return days;
}

function getCalendarMonth(data: SleepEntry[], name: string): { weeks: CalDay[][]; monthLabel: string; stats: { logged: number; avg: number; best: number } } {
  const personEntries = data.filter(d => d.name === name);
  const calMap = new Map<string, SleepEntry>();
  for (const e of personEntries) {
    const parts = e.date.split('-').map(Number);
    const wake = new Date(parts[0], parts[1] - 1, parts[2] + 1);
    calMap.set(localDateStr(wake), e);
  }

  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const moNames = ['Ianuarie','Februarie','Martie','Aprilie','Mai','Iunie','Iulie','August','Septembrie','Octombrie','Noiembrie','Decembrie'];
  const todayStr2 = localDateStr(today);

  const firstDay = new Date(year, month, 1);
  const startDow = (firstDay.getDay() + 6) % 7;
  const lastDay = new Date(year, month + 1, 0).getDate();

  const weeks: CalDay[][] = [];
  let week: CalDay[] = [];
  let logged = 0, ssSum = 0, best = 0;

  for (let i = 0; i < startDow; i++) {
    const d = new Date(year, month, 1 - startDow + i);
    const ds = localDateStr(d);
    const entry = calMap.get(ds);
    week.push({ date: ds, day: d.getDate(), logged: !!entry, ss: entry?.ss || 0, isCurrentMonth: false, isToday: false });
  }

  for (let day = 1; day <= lastDay; day++) {
    const d = new Date(year, month, day);
    const ds = localDateStr(d);
    const entry = calMap.get(ds);
    const calDay: CalDay = { date: ds, day, logged: !!entry, ss: entry?.ss || 0, isCurrentMonth: true, isToday: ds === todayStr2 };
    if (entry) { logged++; ssSum += entry.ss; best = Math.max(best, entry.ss); }
    week.push(calDay);
    if (week.length === 7) { weeks.push(week); week = []; }
  }

  let trailDay = 1;
  while (week.length > 0 && week.length < 7) {
    const d = new Date(year, month + 1, trailDay);
    const ds = localDateStr(d);
    const entry = calMap.get(ds);
    week.push({ date: ds, day: trailDay, logged: !!entry, ss: entry?.ss || 0, isCurrentMonth: false, isToday: false });
    trailDay++;
  }
  if (week.length) weeks.push(week);

  return { weeks, monthLabel: `${moNames[month]} ${year}`, stats: { logged, avg: logged ? Math.round(ssSum / logged) : 0, best } };
}

interface MonthSummary { month: number; year: number; label: string; entries: number; avgSS: number; bestSS: number; days: { date: string; ss: number }[]; }

function getYearOverview(data: SleepEntry[], name: string): MonthSummary[] {
  const entries = data.filter(d => d.name === name);
  const moNames = ['Ian','Feb','Mar','Apr','Mai','Iun','Iul','Aug','Sep','Oct','Nov','Dec'];
  const months: MonthSummary[] = [];
  const now = new Date();

  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const prefix = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const monthEntries = entries.filter(e => e.date.startsWith(prefix));
    const days = monthEntries.map(e => ({ date: e.date, ss: e.ss }));
    const avgSS = monthEntries.length ? Math.round(monthEntries.reduce((s, e) => s + e.ss, 0) / monthEntries.length) : 0;
    const bestSS = monthEntries.length ? Math.max(...monthEntries.map(e => e.ss)) : 0;
    months.push({
      month: d.getMonth(), year: d.getFullYear(),
      label: `${moNames[d.getMonth()]} ${d.getFullYear() !== now.getFullYear() ? d.getFullYear() : ''}`.trim(),
      entries: monthEntries.length, avgSS, bestSS, days,
    });
  }
  return months;
}

export function Tracker({ data, user, trackerRange, onTrackerRangeChange, onDateSelect, snapshotMode }: {
  data: SleepEntry[]; user: string; trackerRange: '7' | '30' | 'all'; onTrackerRangeChange: (r: '7' | '30' | 'all') => void; onDateSelect: (date: string) => void; snapshotMode: boolean;
}) {
  const c = personColor(user);
  const week7 = useMemo(() => get7Days(data, user), [data, user]);
  const calMonth = useMemo(() => getCalendarMonth(data, user), [data, user]);
  const yearOverview = useMemo(() => getYearOverview(data, user), [data, user]);

  return (
    <Section title={trackerRange === '7' ? 'Ultimele 7 zile' : trackerRange === '30' ? calMonth.monthLabel : 'Ultimele 12 luni'} icon="📅" defaultOpen={!snapshotMode}
            badge={
              <div className="flex gap-0.5">
                {(['7', '30', 'all'] as const).map(r => (
                  <button key={r} onClick={e => { e.stopPropagation(); onTrackerRangeChange(r); }}
                    className={`text-[9px] px-1.5 py-0.5 rounded-full transition-colors ${trackerRange === r ? 'bg-primary text-primary-foreground font-bold' : 'text-muted-foreground hover:bg-muted'}`}>
                    {r === '7' ? '7z' : r === '30' ? 'Lună' : 'An'}
                  </button>
                ))}
              </div>
            }>

      {/* 7 DAY: simple dots */}
      {trackerRange === '7' && (
        <div className="pt-2">
          <div className="flex items-center justify-between gap-1">
            {week7.map((day, i) => {
              const isToday = i === 6;
              const dotColor = day.logged ? ssColor(day.ss) : isToday ? '#94a3b8' : '#e2e8f0';
              return (
                <div key={i} className={`flex flex-col items-center gap-1 ${day.logged ? 'cursor-pointer' : ''}`}
                 title={day.logged ? `${fmtDate(day.date)} — SS ${day.ss} (click)` : `${fmtDate(day.date)} — nelogat`}
                 onClick={() => { if (day.logged) { onDateSelect(day.date); } }}>
                  <div className="text-[9px] text-muted-foreground font-medium">{day.label}</div>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isToday && !day.logged ? 'animate-pulse' : ''}`}
                       style={{ background: dotColor + (day.logged ? '20' : ''), border: isToday ? `2px solid ${c}` : '2px solid transparent' }}>
                    {day.logged ? (
                      <span className="text-[9px] font-bold" style={{ color: dotColor }}>{day.ss}</span>
                    ) : (
                      <span className="text-[10px]" style={{ color: '#cbd5e1' }}>·</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {(() => {
            const logged = week7.filter(d => d.logged);
            if (!logged.length) return null;
            const avg = Math.round(logged.reduce((s, d) => s + d.ss, 0) / logged.length);
            return (
              <div className="flex items-center gap-3 mt-2 pt-2 border-t text-[10px] text-muted-foreground">
                <span>{logged.length}/7 zile</span>
                <span>Media: <strong style={{ color: ssColor(avg) }}>{avg}</strong></span>
                <span>Best: <strong style={{ color: ssColor(Math.max(...logged.map(d => d.ss))) }}>{Math.max(...logged.map(d => d.ss))}</strong></span>
              </div>
            );
          })()}
        </div>
      )}

      {/* 30 DAY: Calendar grid */}
      {trackerRange === '30' && (
        <div className="pt-2">
          <div className="grid grid-cols-7 gap-0.5 mb-1">
            {['Lu', 'Ma', 'Mi', 'Jo', 'Vi', 'Sâ', 'Du'].map(d => (
              <div key={d} className="text-[9px] font-bold text-muted-foreground text-center">{d}</div>
            ))}
          </div>
          {calMonth.weeks.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7 gap-px mb-px">
              {week.map((day, di) => {
                const dotColor = day.logged ? ssColor(day.ss) : '#f1f5f9';
                return (
                  <div key={di}
                    className={`h-9 rounded flex flex-col items-center justify-center ${day.isToday ? 'ring-1.5' : ''} ${!day.isCurrentMonth ? 'opacity-25' : ''} ${day.isCurrentMonth ? 'cursor-pointer hover:scale-105 transition-transform' : ''}`}
                    style={{
                      background: day.logged ? dotColor + '18' : undefined,
                      ringColor: day.isToday ? c : undefined,
                    }}
                    onClick={() => {
                      if (day.isCurrentMonth) {
                        const parts = day.date.split('-').map(Number);
                        const sheet = new Date(parts[0], parts[1] - 1, parts[2] - 1);
                        const sheetStr = localDateStr(sheet);
                        onDateSelect(sheetStr);
                        window.scrollTo(0, 0);
                      }
                    }}
                    title={day.logged ? `${day.day} — SS ${day.ss} (click pt detalii)` : `${day.day}`}>
                    <span className="text-[7px] text-muted-foreground leading-none">{day.day}</span>
                    {day.logged ? (
                      <span className="text-[9px] font-bold leading-none" style={{ color: dotColor }}>{day.ss}</span>
                    ) : (
                      <span className="text-[7px] text-muted-foreground/20">·</span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
          {calMonth.stats.logged > 0 && (
            <div className="flex items-center gap-3 mt-1.5 pt-1.5 border-t text-[10px] text-muted-foreground">
              <span>{calMonth.stats.logged} zile logate</span>
              <span>Media: <strong style={{ color: ssColor(calMonth.stats.avg) }}>{calMonth.stats.avg}</strong></span>
              <span>Best: <strong style={{ color: ssColor(calMonth.stats.best) }}>{calMonth.stats.best}</strong></span>
            </div>
          )}
        </div>
      )}

      {/* ALL TIME: 12-month heatmap */}
      {trackerRange === 'all' && (
        <div className="pt-2 grid grid-cols-4 sm:grid-cols-6 gap-1.5">
          {yearOverview.map((mo, i) => {
            const color = mo.entries > 0 ? ssColor(mo.avgSS) : '#e2e8f0';
            return (
              <div key={i} className="rounded-md p-1.5 text-center cursor-default"
                   style={{ background: mo.entries > 0 ? color + '12' : '#f8fafc', border: `1px solid ${mo.entries > 0 ? color + '20' : '#f1f5f9'}` }}
                   title={mo.entries > 0 ? `${mo.label}: ${mo.entries} zile, media ${mo.avgSS}, best ${mo.bestSS}` : `${mo.label}: fără date`}>
                <div className="text-[8px] font-bold text-muted-foreground">{mo.label}</div>
                {mo.entries > 0 ? (
                  <>
                    <div className="font-mono text-sm font-bold leading-tight" style={{ color }}>{mo.avgSS}</div>
                    <div className="text-[7px] text-muted-foreground">{mo.entries}z</div>
                  </>
                ) : (
                  <div className="text-[8px] text-muted-foreground/30 py-0.5">—</div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Section>
  );
}
