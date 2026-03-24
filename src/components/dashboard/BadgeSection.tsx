import { useMemo } from 'react';
import { type SleepEntry, XP_COLOR } from '@/lib/sleep';
import { BADGE_DEFS, getEarnedBadgeIds, checkBadges } from '@/lib/badges';
import { Section } from './Section';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';

export function BadgeSection({ data, user }: { data: SleepEntry[]; user: string }) {
  const badgeResults = useMemo(() => checkBadges(data, user), [data, user]);
  const earnedIds = useMemo(() => new Set(getEarnedBadgeIds(user)), [user]);
  const earnedCount = earnedIds.size;

  const sectionTitle = `Insigne (${earnedCount}/${BADGE_DEFS.length} castigate)`;

  return (
    <Section title={sectionTitle} icon="🏅">
      <TooltipProvider delayDuration={0}>
        <div className="grid grid-cols-4 gap-2 pt-2">
          {badgeResults.map(({ def, status }) => {
            const isEarned = earnedIds.has(def.id);
            return (
              <Tooltip key={def.id}>
                <TooltipTrigger asChild>
                  <button className={`flex flex-col items-center justify-center gap-0.5 p-2 rounded-lg min-h-[40px] cursor-pointer transition-colors
                    ${isEarned ? 'bg-green-50 dark:bg-green-950/20 ring-2 ring-primary' : 'bg-muted/30'}`}>
                    <span className={`text-xl ${!isEarned ? 'opacity-40 grayscale' : ''}`}>{def.icon}</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[180px]">
                  <div className="text-sm font-medium">{def.name}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {def.category === 'consistency' ? 'Consistenta' : def.category === 'quality' ? 'Calitate' : def.category === 'social' ? 'Social' : 'Fun'}
                  </div>
                  {isEarned ? (
                    <div className="text-[11px] font-bold mt-1" style={{ color: XP_COLOR }}>Deblocat! +25 XP</div>
                  ) : (
                    <>
                      <div className="flex items-center gap-1.5 mt-1">
                        <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${Math.min(100, (status.progress / status.target) * 100)}%`, background: XP_COLOR }} />
                        </div>
                        <span className="text-[9px] font-mono text-muted-foreground">{status.progress}/{status.target}</span>
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">{status.hint}</div>
                    </>
                  )}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </TooltipProvider>
    </Section>
  );
}
