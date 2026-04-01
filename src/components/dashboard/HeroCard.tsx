import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import {
  type SleepEntry, type AggEntry, ssColor, personColor, XP_PER_LEVEL, XP_COLOR, STREAK_COLOR, levelTitle, levelTier,
} from '@/lib/sleep';
import { saveWeeklyGoal, clearWeeklyGoal, getWeeklyGoal, weeklyGoalStatus, getLastMonthAvg } from '@/lib/goals';
import { getTrophiesFor, type WeeklyWin } from '@/lib/trophies';
import { V } from '@/lib/hide';
import { Avi } from '@/components/shared/Avi';
import { type GameState } from '@/hooks/useGameState';

export type DashView = 'daily' | 'weekly' | 'monthly';

/* ── Trend helpers (kept for external use) ── */
export function calcTrend(data: SleepEntry[], name: string) {
  const e = data.filter(d => d.name === name).sort((a, b) => a.date.localeCompare(b.date));
  if (e.length < 4) return { ss: 0, rhr: 0, hrv: 0 };
  const h = Math.floor(e.length / 2);
  const avg = (a: SleepEntry[], k: 'ss' | 'rhr') => a.reduce((s, x) => s + x[k], 0) / a.length;
  const avgH = (a: SleepEntry[]) => { const f = a.filter(x => x.hrv != null); return f.length ? f.reduce((s, x) => s + (x.hrv || 0), 0) / f.length : 0; };
  return { ss: Math.round(avg(e.slice(h), 'ss') - avg(e.slice(0, h), 'ss')), rhr: Math.round(avg(e.slice(h), 'rhr') - avg(e.slice(0, h), 'rhr')), hrv: Math.round(avgH(e.slice(h)) - avgH(e.slice(0, h))) };
}

/* ── Goal Bubble ── */
function GoalBubble({ user, data, onGoalChange }: { user: string; data: SleepEntry[]; onGoalChange: () => void }) {
  const gs = weeklyGoalStatus(data, user);
  const currentTarget = getWeeklyGoal(user);
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(currentTarget ?? Math.round(getLastMonthAvg(data, user)));

  const size = 44;
  const fillPct = gs ? gs.fill : 0;
  const fillColor = gs ? gs.color : '#94a3b8';
  const hasGoal = currentTarget !== null;

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (o) setValue(currentTarget ?? Math.round(getLastMonthAvg(data, user))); }}>
      <DialogTrigger asChild>
        <button className="relative shrink-0 group" style={{ width: size, height: size }}
          title={hasGoal ? `Obiectiv: SS ${currentTarget}` : 'Seteaza obiectiv'}>
          {/* Background circle */}
          <div className="absolute inset-0 rounded-full border-2 overflow-hidden transition-colors"
            style={{ borderColor: hasGoal ? fillColor : '#d4d4d8' }}>
            {/* Fill from bottom */}
            <div className="absolute bottom-0 left-0 right-0 transition-all duration-700 ease-out rounded-b-full"
              style={{ height: `${fillPct}%`, background: fillColor + '40' }} />
          </div>
          {/* Center text */}
          <div className="absolute inset-0 flex items-center justify-center">
            {hasGoal ? (
              <span className="font-mono text-[11px] font-bold" style={{ color: fillColor }}>{currentTarget}</span>
            ) : (
              <span className="text-[10px] text-muted-foreground group-hover:text-foreground transition-colors">🎯</span>
            )}
          </div>
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-xs">
        <DialogHeader>
          <DialogTitle className="text-sm font-bold">Obiectiv saptamanal Sleep Score</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="text-center">
            <span className="text-xl font-bold" style={{ color: 'hsl(28 55% 40%)' }}>{value}</span>
          </div>
          <Slider min={60} max={95} step={1} value={[value]} onValueChange={([v]) => setValue(v)} />
          {gs && gs.daysLogged > 0 && (
            <div className="text-[11px] text-muted-foreground text-center">
              Media saptamana curenta: <span className="font-bold" style={{ color: gs.color }}>{Math.round(gs.currentAvg)}</span> ({gs.daysLogged} zile)
            </div>
          )}
          <div className="flex gap-2">
            <button onClick={() => { saveWeeklyGoal(user, value); onGoalChange(); setOpen(false); }}
              className="flex-1 py-2 rounded-md text-xs font-bold text-white transition-colors"
              style={{ background: 'hsl(28 55% 40%)' }}>
              Seteaza
            </button>
            {hasGoal && (
              <button onClick={() => { clearWeeklyGoal(user); onGoalChange(); setOpen(false); }}
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

/* ── Trophy Shelf ── */
function TrophyShelf({ trophies }: { trophies: WeeklyWin[] }) {
  const [expanded, setExpanded] = useState(false);

  if (!trophies.length) return null;

  const shown = expanded ? trophies : trophies.slice(-5);

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {trophies.length > 5 && !expanded && (
        <button onClick={() => setExpanded(true)}
          className="text-[9px] text-muted-foreground hover:text-foreground transition-colors">
          +{trophies.length - 5}
        </button>
      )}
      {shown.map((t, i) => (
        <span key={i} className="text-sm cursor-default hover:scale-125 transition-transform"
          title={`${t.trophy.title} — S${t.weekKey.split('-W')[1]} (SS ${t.avgSS})`}>
          {t.trophy.emoji}
        </span>
      ))}
      {expanded && trophies.length > 5 && (
        <button onClick={() => setExpanded(false)}
          className="text-[9px] text-muted-foreground hover:text-foreground transition-colors ml-0.5">
          ▴
        </button>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════
   HERO CARD — compact identity + goal + trophies
   ════════════════════════════════════════════ */
export function HeroCard({ user, data, gameState, myData, view, onViewChange, activeDate, dates, onDateChange, subText }: {
  user: string; data: SleepEntry[]; gameState: GameState; myData: AggEntry | undefined; view: DashView; onViewChange: (v: DashView) => void; activeDate: string; dates: string[]; onDateChange: (d: string) => void; subText: string;
}) {
  const { xp, level, progress, streak: sr } = gameState;
  const c = personColor(user);
  const [goalRefresh, setGoalRefresh] = useState(0);
  const trophies = getTrophiesFor(user, data);

  if (!myData) {
    return (
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
      </div>
    );
  }

  const xpPct = (progress / XP_PER_LEVEL) * 100;

  return (
    <Card className="mb-3 shadow-sm" style={{ borderTop: `3px solid ${c}` }}>
      <CardContent className="py-3 px-4">
        {/* Row 1: Avatar + identity + goal bubble */}
        <div className="flex items-center gap-2.5">
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
            {/* XP mini bar */}
            <div className="flex items-center gap-1.5 mt-1">
              <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${xpPct}%`, background: XP_COLOR }} />
              </div>
              <span className="text-[8px] text-muted-foreground font-mono">{progress}/{XP_PER_LEVEL}</span>
            </div>
          </div>
          {/* Goal Bubble */}
          <GoalBubble key={goalRefresh} user={user} data={data} onGoalChange={() => setGoalRefresh(k => k + 1)} />
        </div>

        {/* Row 2: Trophies (if any) */}
        {trophies.length > 0 && (
          <div className="mt-2 pt-2 border-t flex items-center gap-1.5">
            <span className="text-[9px] font-bold text-muted-foreground">🏆</span>
            <TrophyShelf trophies={trophies} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
