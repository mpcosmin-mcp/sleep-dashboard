import { type SleepEntry } from '@/lib/sleep';
import { XP_COLOR } from '@/lib/sleep';
import { type GameState } from '@/hooks/useGameState';
import { Section } from './Section';

export function ChallengeSection({ gameState }: { gameState: GameState; data: SleepEntry[]; user: string }) {
  const ch = gameState.challenge;

  if (!ch) {
    return (
      <Section title="Provocarea saptamanii" icon="🏆">
        <div className="pt-2 text-[11px] text-muted-foreground">Nicio provocare activa.</div>
      </Section>
    );
  }

  const { def, status } = ch;
  const pct = status.target > 0 ? (status.progress / status.target) * 100 : 0;

  return (
    <Section title="Provocarea saptamanii" icon={def.icon}>
      <div className="pt-2">
        <div className={`p-2.5 rounded-lg ${status.completed ? 'bg-green-50 dark:bg-green-950/20' : 'bg-muted/30'}`}>
          {/* Challenge name + type badge */}
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[11px] font-medium flex-1">{def.name}</span>
            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${
              def.type === 'team' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400'
            }`}>
              {def.type === 'team' ? 'Echipa' : 'Individual'}
            </span>
          </div>
          <div className="text-[9px] text-muted-foreground mb-2">{def.description}</div>

          {/* Progress bar */}
          {!status.completed && (
            <div className="flex items-center gap-1.5 mb-1.5">
              <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: XP_COLOR }} />
              </div>
              <span className="text-[9px] font-mono text-muted-foreground shrink-0">{status.progress}/{status.target}</span>
            </div>
          )}

          {/* XP reward + completed flair */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              {status.completed && <span className="text-sm">🏆</span>}
              {status.completed && <span className="text-[10px] font-bold text-green-600">Completat!</span>}
            </div>
            <span className={`text-[10px] font-bold shrink-0 ${status.completed ? 'text-green-600' : ''}`}
                  style={{ color: status.completed ? undefined : XP_COLOR }}>
              {status.completed ? '✓ ' : ''}+{def.xp} XP
            </span>
          </div>
        </div>
      </div>
    </Section>
  );
}
