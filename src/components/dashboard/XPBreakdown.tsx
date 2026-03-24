import { type GameState } from '@/hooks/useGameState';
import { XP_PER_LEVEL, XP_COLOR, levelTier, levelTitle } from '@/lib/sleep';
import { Section } from './Section';

export function XPBreakdown({ gameState }: { gameState: GameState }) {
  const { xp, level, progress, breakdown } = gameState;
  const tier = levelTier(level);
  const nextTier = levelTier(level + 1);
  const xpToNext = XP_PER_LEVEL - (xp % XP_PER_LEVEL);
  const pct = (progress / XP_PER_LEVEL) * 100;

  return (
    <Section title={`${xp} XP`} icon="✨"
            badge={<span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ color: XP_COLOR, background: XP_COLOR + '15' }}>Lvl {level}</span>}>
      <div className="pt-2">
        {/* Level progress — prominent loading bar */}
        <div className="rounded-lg p-3 mb-3" style={{ background: XP_COLOR + '08' }}>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <span className="text-sm">{tier.icon}</span>
              <span className="text-[11px] font-bold" style={{ color: tier.color }}>Level {level}</span>
              <span className="text-[9px] text-muted-foreground">· {levelTitle(level)}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-sm">{nextTier.icon}</span>
              <span className="text-[10px] font-bold" style={{ color: nextTier.color }}>Lv {level + 1}</span>
            </div>
          </div>
          <div className="h-4 rounded-full bg-muted overflow-hidden relative">
            <div className="h-full rounded-full transition-all duration-700 relative"
                 style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${tier.color}, ${XP_COLOR})` }}>
            </div>
            <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold"
                  style={{ color: pct > 50 ? 'white' : XP_COLOR, mixBlendMode: pct > 50 ? 'normal' : undefined }}>
              {progress} / {XP_PER_LEVEL} XP
            </span>
          </div>
          <div className="text-[9px] text-muted-foreground text-center mt-1">
            Inca <span className="font-bold font-mono" style={{ color: XP_COLOR }}>{xpToNext} XP</span> pana la Level {level + 1}
          </div>
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
          {breakdown.challengeXP > 0 && <div className="flex justify-between text-[11px]">
            <span className="text-muted-foreground">🏆 Provocarea saptamanii</span>
            <span className="font-mono font-bold">+{breakdown.challengeXP}</span>
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
