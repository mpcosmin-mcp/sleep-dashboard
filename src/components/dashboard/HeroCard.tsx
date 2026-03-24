import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import {
  type SleepEntry, type AggEntry, ssColor, rhrColor, hrvColor, rhrBg, hrvBg,
  fmtDate, personColor, XP_PER_LEVEL, XP_COLOR, STREAK_COLOR, levelTitle, levelTier,
} from '@/lib/sleep';
import { V } from '@/lib/hide';
import { Avi } from '@/components/shared/Avi';
import { type GameState } from '@/hooks/useGameState';

export type DashView = 'daily' | 'weekly' | 'monthly';

/* ── Trend helpers ── */
function TrendArrow({ value, inverted }: { value: number; inverted?: boolean }) {
  if (value === 0) return <span className="text-muted-foreground text-[10px]">→</span>;
  const good = inverted ? value < 0 : value > 0;
  return <span className="text-[10px] font-bold" style={{ color: good ? '#16a34a' : '#dc2626' }}>{value > 0 ? '↑' : '↓'}{Math.abs(value)}</span>;
}

export function calcTrend(data: SleepEntry[], name: string) {
  const e = data.filter(d => d.name === name).sort((a, b) => a.date.localeCompare(b.date));
  if (e.length < 4) return { ss: 0, rhr: 0, hrv: 0 };
  const h = Math.floor(e.length / 2);
  const avg = (a: SleepEntry[], k: 'ss' | 'rhr') => a.reduce((s, x) => s + x[k], 0) / a.length;
  const avgH = (a: SleepEntry[]) => { const f = a.filter(x => x.hrv != null); return f.length ? f.reduce((s, x) => s + (x.hrv || 0), 0) / f.length : 0; };
  return { ss: Math.round(avg(e.slice(h), 'ss') - avg(e.slice(0, h), 'ss')), rhr: Math.round(avg(e.slice(h), 'rhr') - avg(e.slice(0, h), 'rhr')), hrv: Math.round(avgH(e.slice(h)) - avgH(e.slice(0, h))) };
}

export function HeroCard({ user, data, gameState, myData, view, onViewChange, activeDate, dates, onDateChange, subText }: {
  user: string; data: SleepEntry[]; gameState: GameState; myData: AggEntry | undefined; view: DashView; onViewChange: (v: DashView) => void; activeDate: string; dates: string[]; onDateChange: (d: string) => void; subText: string;
}) {
  const { xp, level, progress, streak: sr } = gameState;
  const c = personColor(user);
  const trend = calcTrend(data, user);

  if (!myData) {
    return (
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <Tabs value={view} onValueChange={v => onViewChange(v as DashView)}>
          <TabsList className="h-8">
            <TabsTrigger value="daily" className="text-xs px-3 h-7">Zi</TabsTrigger>
            <TabsTrigger value="weekly" className="text-xs px-3 h-7">7 zile</TabsTrigger>
            <TabsTrigger value="monthly" className="text-xs px-3 h-7">Lună</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    );
  }

  return (
    <Card className="mb-3 shadow-sm" style={{ borderTop: `3px solid ${c}` }}>
      <CardContent className="py-3 px-4">
        {/* Row 1: Name + tier + SS */}
        <div className="flex items-center gap-2.5 mb-2">
          <Avi name={user} size="md" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-base truncate">{user.split(' ')[0]}</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md inline-flex items-center gap-0.5" style={{ color: levelTier(level).color, background: levelTier(level).color + '15' }}>
                <span className="text-xs">{levelTier(level).icon}</span> Lv{level}
              </span>
              {sr.days > 0 && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md" style={{ color: STREAK_COLOR, background: STREAK_COLOR + '12' }}>⚡{sr.days}d</span>}
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md" style={{ color: XP_COLOR, background: XP_COLOR + '12' }}>{xp} XP</span>
            </div>
            <div className="text-[9px] font-bold" style={{ color: levelTier(level).color }}>{levelTier(level).name} · {levelTitle(level)}</div>
          </div>
          <div className="text-right shrink-0">
            <div className="font-mono text-3xl font-bold" style={{ color: ssColor(myData.ss) }}><V>{myData.ss}</V></div>
            <div className="text-[9px] text-muted-foreground">/100</div>
          </div>
        </div>
        {/* Row 2: Compact metrics */}
        <div className="grid grid-cols-4 gap-1.5">
          <div className="rounded-md p-1.5 text-center" style={{ background: rhrBg(myData.rhr) }}>
            <div className="text-[7px] font-bold uppercase" style={{ color: rhrColor(myData.rhr), opacity: 0.7 }}>RHR</div>
            <div className="font-mono text-xs font-bold" style={{ color: rhrColor(myData.rhr) }}><V>{myData.rhr}</V></div>
            <TrendArrow value={trend.rhr} inverted />
          </div>
          <div className="rounded-md p-1.5 text-center" style={{ background: hrvBg(myData.hrv) }}>
            <div className="text-[7px] font-bold uppercase" style={{ color: hrvColor(myData.hrv), opacity: 0.7 }}>HRV</div>
            <div className="font-mono text-xs font-bold" style={{ color: hrvColor(myData.hrv) }}>{myData.hrv ?? '—'}</div>
            <TrendArrow value={trend.hrv} />
          </div>
          <div className="rounded-md p-1.5 text-center" style={{ background: XP_COLOR + '10' }}>
            <div className="text-[7px] font-bold uppercase" style={{ color: XP_COLOR, opacity: 0.7 }}>Nivel</div>
            <div className="font-mono text-xs font-bold" style={{ color: XP_COLOR }}>{progress}/{XP_PER_LEVEL}</div>
            <div className="h-1 rounded-full bg-muted overflow-hidden mt-0.5">
              <div className="h-full rounded-full" style={{ width: `${progress}%`, background: XP_COLOR }} />
            </div>
          </div>
          <div className="rounded-md p-1.5 text-center" style={{ background: sr.days > 0 ? STREAK_COLOR + '10' : 'var(--muted)' }}>
            <div className="text-[7px] font-bold uppercase" style={{ color: sr.days > 0 ? STREAK_COLOR : undefined, opacity: 0.7 }}>Streak</div>
            <div className="font-mono text-xs font-bold" style={{ color: sr.days > 0 ? STREAK_COLOR : undefined }}>{sr.days > 0 ? sr.days : '0'}d</div>
            {sr.autoSaved > 0 && <div className="text-[7px] text-green-600">+{sr.autoSaved} saved</div>}
          </div>
        </div>
        {/* Row 3: View tabs + date picker */}
        <div className="flex items-center gap-2 mt-2 pt-2 border-t">
          <Tabs value={view} onValueChange={v => onViewChange(v as DashView)}>
            <TabsList className="h-7">
              <TabsTrigger value="daily" className="text-[10px] px-2.5 h-6">Zi</TabsTrigger>
              <TabsTrigger value="weekly" className="text-[10px] px-2.5 h-6">7 zile</TabsTrigger>
              <TabsTrigger value="monthly" className="text-[10px] px-2.5 h-6">Lună</TabsTrigger>
            </TabsList>
          </Tabs>
          {view === 'daily' && (
            <select value={activeDate} onChange={e => onDateChange(e.target.value)}
              className="text-[10px] font-semibold bg-transparent border rounded px-1.5 py-1 outline-none">
              {dates.map(d => <option key={d} value={d}>{fmtDate(d)}</option>)}
            </select>
          )}
          <span className="text-[10px] text-muted-foreground ml-auto">{subText}</span>
        </div>
      </CardContent>
    </Card>
  );
}
