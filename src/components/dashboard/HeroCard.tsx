import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import {
  type SleepEntry, type AggEntry, ssColor, rhrColor, hrvColor, rhrBg, hrvBg,
  fmtDate, personColor, XP_PER_LEVEL, XP_COLOR, STREAK_COLOR, levelTitle, levelTier,
} from '@/lib/sleep';
import { saveGoal, clearGoal, getLastMonthAvg, goalStatus as computeGoalStatus } from '@/lib/goals';
import { type GoalStatus } from '@/lib/goals';
import { V } from '@/lib/hide';
import { Avi } from '@/components/shared/Avi';
import { type GameState } from '@/hooks/useGameState';

export type DashView = 'daily' | 'weekly' | 'monthly';

/* ── Trend helpers ── */
function TrendArrow({ value, inverted }: { value: number; inverted?: boolean }) {
  if (value === 0) return <span className="text-muted-foreground text-[10px]">&rarr;</span>;
  const good = inverted ? value < 0 : value > 0;
  return <span className="text-[10px] font-bold" style={{ color: good ? '#16a34a' : '#dc2626' }}>{value > 0 ? '\u2191' : '\u2193'}{Math.abs(value)}</span>;
}

export function calcTrend(data: SleepEntry[], name: string) {
  const e = data.filter(d => d.name === name).sort((a, b) => a.date.localeCompare(b.date));
  if (e.length < 4) return { ss: 0, rhr: 0, hrv: 0 };
  const h = Math.floor(e.length / 2);
  const avg = (a: SleepEntry[], k: 'ss' | 'rhr') => a.reduce((s, x) => s + x[k], 0) / a.length;
  const avgH = (a: SleepEntry[]) => { const f = a.filter(x => x.hrv != null); return f.length ? f.reduce((s, x) => s + (x.hrv || 0), 0) / f.length : 0; };
  return { ss: Math.round(avg(e.slice(h), 'ss') - avg(e.slice(0, h), 'ss')), rhr: Math.round(avg(e.slice(h), 'rhr') - avg(e.slice(0, h), 'rhr')), hrv: Math.round(avgH(e.slice(h)) - avgH(e.slice(0, h))) };
}

/* ── Goal Status Color ── */
const GOAL_COLORS: Record<string, string> = {
  ahead: '#16a34a',
  'on-track': 'hsl(28 55% 40%)',
  behind: '#dc2626',
};
const GOAL_LABELS: Record<string, string> = {
  ahead: 'Inaintea planului',
  'on-track': 'Pe drumul cel bun',
  behind: 'In urma',
};

/* ── GoalSetDialog ── */
function GoalSetDialog({ user, data, currentTarget, onSave, onClear }: {
  user: string; data: SleepEntry[]; currentTarget: number | null;
  onSave: (target: number) => void; onClear: () => void;
}) {
  const defaultVal = currentTarget ?? Math.round(getLastMonthAvg(data, user));
  const [value, setValue] = useState(defaultVal);
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (o) setValue(currentTarget ?? Math.round(getLastMonthAvg(data, user))); }}>
      <DialogTrigger asChild>
        <button className="w-full text-left min-h-[44px] flex items-center rounded-md hover:bg-muted/30 transition-colors -mx-1 px-1">
          {currentTarget === null ? (
            <span className="text-[11px] font-medium" style={{ color: 'hsl(28 55% 40%)' }}>Seteaza un obiectiv lunar &rarr;</span>
          ) : (
            <span className="text-[11px] text-muted-foreground">Modifica obiectivul &rarr;</span>
          )}
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-xs">
        <DialogHeader>
          <DialogTitle className="text-sm font-bold">Obiectiv lunar Sleep Score</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="text-center">
            <span className="text-xl font-bold" style={{ color: 'hsl(28 55% 40%)' }}>{value}</span>
          </div>
          <Slider min={60} max={95} step={1} value={[value]} onValueChange={([v]) => setValue(v)} />
          <div className="text-[11px] text-muted-foreground text-center">
            Media luna trecuta: {Math.round(getLastMonthAvg(data, user))}
          </div>
          <div className="flex gap-2">
            <button onClick={() => { onSave(value); setOpen(false); }}
              className="flex-1 py-2 rounded-md text-xs font-bold text-white transition-colors"
              style={{ background: 'hsl(28 55% 40%)' }}>
              Seteaza obiectiv
            </button>
            {currentTarget !== null && (
              <button onClick={() => { onClear(); setOpen(false); }}
                className="py-2 px-3 rounded-md text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors">
                Sterge
              </button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ── GoalTracker ── */
function GoalTracker({ user, data, onGoalChange }: {
  user: string; data: SleepEntry[]; onGoalChange: () => void;
}) {
  const gs = computeGoalStatus(data, user);

  if (!gs) {
    return (
      <div className="border-t mt-2 pt-2">
        <GoalSetDialog user={user} data={data} currentTarget={null}
          onSave={(t) => { saveGoal(user, t); onGoalChange(); }}
          onClear={() => { clearGoal(user); onGoalChange(); }} />
      </div>
    );
  }

  const color = GOAL_COLORS[gs.status];
  const pct = gs.target > 0 ? Math.min(100, (gs.currentAvg / gs.target) * 100) : 0;

  return (
    <div className="border-t mt-2 pt-2">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-medium">Obiectiv: SS {gs.target}</span>
          <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full" style={{ color, background: color + '15' }}>
            {GOAL_LABELS[gs.status]}
          </span>
        </div>
        <div className="text-right">
          <span className="font-mono text-xs font-bold" style={{ color }}>{Math.round(gs.currentAvg)}</span>
          <span className="text-[9px] text-muted-foreground ml-1">proiectat: {Math.round(gs.projected)}</span>
        </div>
      </div>
      {/* Progress bar */}
      <div className="h-2 rounded-full bg-muted overflow-hidden mb-1">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
      <GoalSetDialog user={user} data={data} currentTarget={gs.target}
        onSave={(t) => { saveGoal(user, t); onGoalChange(); }}
        onClear={() => { clearGoal(user); onGoalChange(); }} />
    </div>
  );
}

export function HeroCard({ user, data, gameState, myData, view, onViewChange, activeDate, dates, onDateChange, subText }: {
  user: string; data: SleepEntry[]; gameState: GameState; myData: AggEntry | undefined; view: DashView; onViewChange: (v: DashView) => void; activeDate: string; dates: string[]; onDateChange: (d: string) => void; subText: string;
}) {
  const { xp, level, progress, streak: sr } = gameState;
  const c = personColor(user);
  const trend = calcTrend(data, user);
  const [goalRefresh, setGoalRefresh] = useState(0);

  if (!myData) {
    return (
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
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
              {sr.days > 0 && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md" style={{ color: STREAK_COLOR, background: STREAK_COLOR + '12' }}>{'\u26A1'}{sr.days}d</span>}
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md" style={{ color: XP_COLOR, background: XP_COLOR + '12' }}>{xp} XP</span>
            </div>
            <div className="text-[9px] font-bold" style={{ color: levelTier(level).color }}>{levelTier(level).name} {'\u00B7'} {levelTitle(level)}</div>
          </div>
          <div className="text-right shrink-0">
            <div className="font-mono text-3xl font-bold" style={{ color: ssColor(myData.ss) }}><V>{myData.ss}</V></div>
            <div className="text-[9px] text-muted-foreground">/100</div>
          </div>
        </div>
        {/* Row 2: Key stats */}
        {(() => {
          const correctLogs = data.filter(d => d.name === user && d.ss >= 75).length;
          const totalLogs = data.filter(d => d.name === user).length;
          const xpPct = (progress / XP_PER_LEVEL) * 100;
          const xpToNext = XP_PER_LEVEL - (xp % XP_PER_LEVEL);
          return (
            <>
              <div className="grid grid-cols-3 gap-1.5 lg:gap-2.5 mb-1.5">
                <div className="rounded-md p-1.5 text-center" style={{ background: rhrBg(myData.rhr) }}>
                  <div className="text-[7px] font-bold uppercase" style={{ color: rhrColor(myData.rhr), opacity: 0.7 }}>RHR</div>
                  <div className="font-mono text-xs font-bold" style={{ color: rhrColor(myData.rhr) }}><V>{myData.rhr}</V></div>
                  <TrendArrow value={trend.rhr} inverted />
                </div>
                <div className="rounded-md p-1.5 text-center" style={{ background: hrvBg(myData.hrv) }}>
                  <div className="text-[7px] font-bold uppercase" style={{ color: hrvColor(myData.hrv), opacity: 0.7 }}>HRV</div>
                  <div className="font-mono text-xs font-bold" style={{ color: hrvColor(myData.hrv) }}>{myData.hrv ?? '\u2014'}</div>
                  <TrendArrow value={trend.hrv} />
                </div>
                <div className="rounded-md p-1.5 text-center" style={{ background: sr.days > 0 ? STREAK_COLOR + '10' : 'var(--muted)' }}>
                  <div className="text-[7px] font-bold uppercase" style={{ color: sr.days > 0 ? STREAK_COLOR : undefined, opacity: 0.7 }}>Streak</div>
                  <div className="font-mono text-xs font-bold" style={{ color: sr.days > 0 ? STREAK_COLOR : undefined }}>{sr.days > 0 ? sr.days : '0'}d</div>
                  {sr.autoSaved > 0 && <div className="text-[7px] text-green-600">+{sr.autoSaved} saved</div>}
                </div>
              </div>
              {/* XP level progress + correct logs */}
              <div className="rounded-md p-2" style={{ background: XP_COLOR + '08' }}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-bold" style={{ color: XP_COLOR }}>Lv{level} → Lv{level + 1}</span>
                    <span className="text-[8px] text-muted-foreground">({xpToNext} XP ramas)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[8px] text-muted-foreground">Somn bun:</span>
                    <span className="font-mono text-[10px] font-bold" style={{ color: '#16a34a' }}>{correctLogs}</span>
                    <span className="text-[8px] text-muted-foreground">/ {totalLogs}</span>
                  </div>
                </div>
                <div className="h-2.5 rounded-full bg-muted overflow-hidden relative">
                  <div className="h-full rounded-full transition-all duration-500"
                       style={{ width: `${xpPct}%`, background: `linear-gradient(90deg, ${XP_COLOR}, ${XP_COLOR}cc)` }} />
                  {xpPct > 20 && (
                    <span className="absolute inset-0 flex items-center justify-center text-[7px] font-bold text-white">
                      {progress}/{XP_PER_LEVEL}
                    </span>
                  )}
                </div>
              </div>
            </>
          );
        })()}
        {/* Goal tracker row */}
        <GoalTracker key={goalRefresh} user={user} data={data} onGoalChange={() => setGoalRefresh(k => k + 1)} />
      </CardContent>
    </Card>
  );
}
