import { useState, useMemo } from 'react';
import { type SleepEntry } from '@/lib/sleep';
import { XP_COLOR } from '@/lib/sleep';
import { type GameState } from '@/hooks/useGameState';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export interface BonusDef {
  icon: string;
  name: string;
  reward: number;
  getProgress: (streak: number, goodSleepRun: number) => { achieved: boolean; progress: number; target: number };
}

export const BONUS_DEFS: BonusDef[] = [
  { icon: '⚡', name: '7 zile logate la rând', reward: 50, getProgress: (s) => ({ achieved: s >= 7, progress: Math.min(s, 7), target: 7 }) },
  { icon: '⚡', name: '30 zile logate la rând', reward: 200, getProgress: (s) => ({ achieved: s >= 30, progress: Math.min(s, 30), target: 30 }) },
  { icon: '💎', name: '7 zile somn bun (SS peste 75)', reward: 50, getProgress: (_, g) => ({ achieved: g >= 7, progress: Math.min(g, 7), target: 7 }) },
  { icon: '💎', name: '30 zile somn bun (SS peste 75)', reward: 500, getProgress: (_, g) => ({ achieved: g >= 30, progress: Math.min(g, 30), target: 30 }) },
];

export function BonusPopup({ gameState, data, user }: { gameState: GameState; data: SleepEntry[]; user: string }) {
  const [open, setOpen] = useState(false);
  const curStreak = gameState.streak.days;

  const goodSleepRun = useMemo(() => {
    const myStreakEntries = data.filter(d => d.name === user).sort((a, b) => b.date.localeCompare(a.date)).slice(0, curStreak);
    let gsRun = 0;
    for (const e of myStreakEntries) { if (e.ss >= 75) gsRun++; else break; }
    return gsRun;
  }, [data, user, curStreak]);

  const bonuses = BONUS_DEFS.map(def => ({ ...def, ...def.getProgress(curStreak, goodSleepRun) }));
  const achieved = bonuses.filter(b => b.achieved).length;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="w-full mb-3 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-muted/40 hover:bg-muted/60 border border-border/50 transition-colors">
          <span className="text-sm">💎</span>
          <span className="text-[11px] font-bold">Bonusuri</span>
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ color: XP_COLOR, background: XP_COLOR + '15' }}>
            {achieved}/{bonuses.length}
          </span>
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm font-bold flex items-center gap-2">
            <span>💎</span> Bonusuri active
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-2.5 py-2">
          {bonuses.map((b, i) => (
            <div key={i} className={`flex items-center gap-2.5 p-2.5 rounded-lg ${b.achieved ? 'bg-green-50 dark:bg-green-950/20' : 'bg-muted/30'}`}>
              <span className="text-base">{b.achieved ? '✅' : b.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-medium">{b.name}</div>
                {!b.achieved && (
                  <div className="flex items-center gap-1.5 mt-1">
                    <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${(b.progress / b.target) * 100}%`, background: XP_COLOR }} />
                    </div>
                    <span className="text-[9px] font-mono text-muted-foreground shrink-0">{b.progress}/{b.target}</span>
                  </div>
                )}
              </div>
              <span className={`text-[10px] font-bold shrink-0 ${b.achieved ? 'text-green-600' : ''}`} style={{ color: b.achieved ? undefined : XP_COLOR }}>
                {b.achieved ? '✓ ' : ''}+{b.reward} XP
              </span>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Keep old export name for backward compat
export { BonusPopup as BonusSection };
