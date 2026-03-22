import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { NAMES, personColor, fmtDate, todayStr } from '@/lib/sleep';
import { Avi } from '@/components/shared/Avi';
import {
  HABIT_POOL, type HabitConfig, type HabitLog,
  loadConfig, saveConfig, loadLog, saveLog,
  toggleHabit, completedCount, calcStreak, calcMonthPct, getHabit,
} from '@/lib/habits';

export function HabitPage({ user, pickUser, logout }: {
  user: string | null; pickUser: (n: string) => void; logout: () => void;
}) {
  const [config, setConfig] = useState<HabitConfig>({ selectedIds: [] });
  const [log, setLog] = useState<HabitLog>({ entries: [] });
  const [showSetup, setShowSetup] = useState(false);
  const [setupIds, setSetupIds] = useState<string[]>([]);

  useEffect(() => {
    if (!user) return;
    const c = loadConfig(user);
    const l = loadLog(user);
    setConfig(c);
    setLog(l);
    if (!c.selectedIds.length) setShowSetup(true);
  }, [user]);

  const today = todayStr();
  const color = user ? personColor(user) : '#888';
  const ids = config.selectedIds;
  const doneCount = completedCount(log, today);
  const totalCount = ids.length;
  const pct = totalCount ? Math.round((doneCount / totalCount) * 100) : 0;
  const streak = calcStreak(log, ids, today);
  const now = new Date();
  const monthPct = calcMonthPct(log, ids, now.getFullYear(), now.getMonth() + 1);
  const allDone = totalCount > 0 && doneCount === totalCount;

  const isChecked = useCallback((habitId: string) => {
    const day = log.entries.find(e => e.date === today);
    return day?.completed.includes(habitId) ?? false;
  }, [log, today]);

  const handleToggle = (habitId: string) => {
    if (!user) return;
    const next = toggleHabit(log, today, habitId);
    setLog(next);
    saveLog(user, next);
  };

  const openSetup = () => {
    setSetupIds([...ids]);
    setShowSetup(true);
  };
  const toggleSetupId = (id: string) => {
    setSetupIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };
  const saveSetup = () => {
    if (!user) return;
    const next = { selectedIds: setupIds };
    setConfig(next);
    saveConfig(user, next);
    setShowSetup(false);
  };

  // ── No user ──
  if (!user) {
    return (
      <div className="max-w-md mx-auto mt-6 lg:mt-16 text-center">
        <div className="text-4xl mb-3">🔥</div>
        <h2 className="text-2xl font-bold tracking-tight mb-1">Alege profilul</h2>
        <p className="text-muted-foreground text-sm mb-6">Selectează-ți contul pentru a vedea obiceiurile.</p>
        <div className="flex flex-col gap-2">
          {NAMES.map(n => (
            <button key={n} onClick={() => pickUser(n)}
              className="flex items-center gap-3 px-4 py-3 rounded-lg border bg-card hover:bg-accent transition-all text-left group">
              <Avi name={n} size="md" />
              <span className="font-semibold text-sm group-hover:translate-x-1 transition-transform">{n}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── Main view ──
  return (
    <div className="max-w-md mx-auto mt-4 lg:mt-12">
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">1% Better</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{fmtDate(today)}</p>
        </div>
        <button onClick={openSetup}
          className="text-muted-foreground hover:text-foreground transition-colors text-lg mt-1"
          title="Configurează obiceiuri">
          ⚙️
        </button>
      </div>

      {/* Stats row */}
      {totalCount > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-5">
          <Card className="shadow-sm">
            <CardContent className="py-3 px-3 text-center">
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Streak</div>
              <div className="text-2xl font-bold font-mono" style={{ color }}>
                🔥 {streak}
              </div>
              <div className="text-[10px] text-muted-foreground">{streak === 1 ? 'zi' : 'zile'}</div>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardContent className="py-3 px-3 text-center">
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Azi</div>
              <div className="text-2xl font-bold font-mono" style={{ color }}>
                {doneCount}/{totalCount}
              </div>
              <div className="w-full h-1.5 rounded-full bg-muted mt-1.5 overflow-hidden">
                <div className="h-full rounded-full transition-all duration-300" style={{ width: `${pct}%`, background: color }} />
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardContent className="py-3 px-3 text-center">
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Luna</div>
              <div className="text-2xl font-bold font-mono" style={{ color }}>
                {monthPct}%
              </div>
              <div className="text-[10px] text-muted-foreground">completare</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Checklist */}
      {totalCount > 0 ? (
        <Card className="shadow-sm mb-4">
          <CardContent className="py-4 px-4">
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
              Obiceiuri de azi
            </div>
            <div className="space-y-1">
              {ids.map(id => {
                const h = getHabit(id);
                if (!h) return null;
                const done = isChecked(id);
                return (
                  <button key={id} onClick={() => handleToggle(id)}
                    className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg hover:bg-muted/50 transition-all text-left">
                    <div
                      className="w-5 h-5 rounded flex items-center justify-center shrink-0 border-2 transition-all text-xs font-bold"
                      style={done
                        ? { background: color, borderColor: color, color: '#fff' }
                        : { borderColor: color + '40' }
                      }
                    >
                      {done && '✓'}
                    </div>
                    <span className={`text-sm transition-all ${done ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                      {h.emoji} {h.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-sm mb-4">
          <CardContent className="py-8 px-4 text-center">
            <div className="text-3xl mb-2">🎯</div>
            <p className="text-sm text-muted-foreground mb-3">
              Alege obiceiurile pe care vrei să le trackuiești zilnic.
            </p>
            <Button onClick={openSetup}>Alege obiceiuri</Button>
          </CardContent>
        </Card>
      )}

      {/* All done banner */}
      {allDone && (
        <div className="rounded-lg p-4 text-center mb-4 transition-all" style={{ background: color + '15' }}>
          <div className="text-2xl mb-1">🎉</div>
          <p className="text-sm font-semibold" style={{ color }}>
            Toate obiceiurile bifate! Continuă streak-ul!
          </p>
        </div>
      )}

      <button onClick={logout} className="text-xs text-muted-foreground hover:text-foreground transition-colors block mx-auto">
        Schimbă utilizatorul
      </button>

      {/* Setup dialog */}
      <Dialog open={showSetup} onOpenChange={setShowSetup}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Alege obiceiuri</DialogTitle>
            <DialogDescription>Selectează ce vrei să trackuiești zilnic.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            {(['sleep', 'general'] as const).map(cat => (
              <div key={cat}>
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                  {cat === 'sleep' ? '🌙 Somn' : '⚡ General'}
                </div>
                <div className="space-y-1">
                  {HABIT_POOL.filter(h => h.category === cat).map(h => {
                    const selected = setupIds.includes(h.id);
                    return (
                      <button key={h.id} onClick={() => toggleSetupId(h.id)}
                        className="flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-muted/50 transition-all text-left">
                        <div
                          className="w-4 h-4 rounded flex items-center justify-center shrink-0 border-2 transition-all text-[10px] font-bold"
                          style={selected
                            ? { background: color, borderColor: color, color: '#fff' }
                            : { borderColor: color + '40' }
                          }
                        >
                          {selected && '✓'}
                        </div>
                        <span className="text-sm">{h.emoji} {h.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <Button className="w-full mt-2" onClick={saveSetup} disabled={!setupIds.length}>
            Salvează ({setupIds.length} {setupIds.length === 1 ? 'obicei' : 'obiceiuri'})
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
