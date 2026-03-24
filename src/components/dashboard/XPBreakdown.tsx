import { type GameState } from '@/hooks/useGameState';
import { XP_PER_LEVEL, XP_COLOR } from '@/lib/sleep';
import { Section } from './Section';

export function XPBreakdown({ gameState }: { gameState: GameState }) {
  const { xp, level, progress, breakdown } = gameState;

  return (
    <Section title={`${xp} XP`} icon="✨"
            badge={<span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ color: XP_COLOR, background: XP_COLOR + '15' }}>Lvl {level}</span>}>
      <div className="pt-2">
        {/* Progress bar */}
        <div className="flex items-center justify-between text-[10px] mb-1">
          <span className="font-bold" style={{ color: XP_COLOR }}>Level {level}</span>
          <span className="text-muted-foreground">{progress}/{XP_PER_LEVEL} → Level {level + 1}</span>
        </div>
        <div className="h-2.5 rounded-full bg-muted overflow-hidden mb-3">
          <div className="h-full rounded-full transition-all duration-500"
               style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${XP_COLOR}, ${XP_COLOR}dd)` }} />
        </div>
        {/* Breakdown — human friendly */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-[11px]">
            <span className="text-muted-foreground">😴 Ai logat {Math.round(breakdown.base / 10)} nopți</span>
            <span className="font-mono font-bold">+{breakdown.base}</span>
          </div>
          {breakdown.bonusSS > 0 && <div className="flex justify-between text-[11px]">
            <span className="text-muted-foreground">🌟 Ai dormit bine de {Math.round(breakdown.bonusSS / 5)} ori</span>
            <span className="font-mono font-bold">+{breakdown.bonusSS}</span>
          </div>}
          {breakdown.streakBonus > 0 && <div className="flex justify-between text-[11px]">
            <span className="text-muted-foreground">⚡ Recompensă streak logare</span>
            <span className="font-mono font-bold">+{breakdown.streakBonus}</span>
          </div>}
          {breakdown.goodSleepBonus > 0 && <div className="flex justify-between text-[11px]">
            <span className="text-muted-foreground">💎 Somn bun consecutiv (somn peste 75)</span>
            <span className="font-mono font-bold">+{breakdown.goodSleepBonus}</span>
          </div>}
          {breakdown.kudosXP > 0 && <div className="flex justify-between text-[11px]">
            <span className="text-muted-foreground">👏 Echipa ți-a dat {Math.round(breakdown.kudosXP / 5)} kudos</span>
            <span className="font-mono font-bold">+{breakdown.kudosXP}</span>
          </div>}
          {breakdown.badgeXP > 0 && <div className="flex justify-between text-[11px]">
            <span className="text-muted-foreground">🏅 Insigne ({breakdown.badgeXP / 25} castigate)</span>
            <span className="font-mono font-bold">+{breakdown.badgeXP}</span>
          </div>}
          {breakdown.spent > 0 && <div className="flex justify-between text-[11px]">
            <span className="text-muted-foreground">🔧 Ai reparat streak-ul</span>
            <span className="font-mono font-bold text-red-500">−{breakdown.spent}</span>
          </div>}
          <div className="flex justify-between text-[11px] border-t pt-1.5 font-bold">
            <span>Total</span>
            <span className="font-mono" style={{ color: XP_COLOR }}>{breakdown.total} XP</span>
          </div>
        </div>
      </div>
    </Section>
  );
}
