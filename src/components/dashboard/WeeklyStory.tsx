import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { type SleepEntry } from '@/lib/sleep';
import { getWeeklyStory } from '@/lib/weekly-story';

export function WeeklyStory({ data }: { data: SleepEntry[] }) {
  const story = getWeeklyStory(data);
  const [expanded, setExpanded] = useState(true);

  if (!story.text) return null;

  return (
    <Card className="shadow-sm overflow-hidden">
      <div className="h-1" style={{ background: 'linear-gradient(90deg, hsl(28 55% 40%), hsl(32 45% 52%), hsl(38 50% 60%))' }} />
      <CardContent className="py-0 px-0">
        <button onClick={() => setExpanded(!expanded)}
          className="w-full text-left px-4 py-3 flex items-center gap-2.5 hover:bg-muted/30 transition-colors">
          <span className="text-base">📖</span>
          <span className="text-[11px] font-bold flex-1">Povestea Saptamanii</span>
          <span className="text-[10px] text-muted-foreground">{expanded ? '▴' : '▾'}</span>
        </button>
        {expanded && (
          <div className="px-4 pb-3 -mt-1">
            <p className="text-[12px] leading-relaxed text-foreground/90">
              {story.text}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
