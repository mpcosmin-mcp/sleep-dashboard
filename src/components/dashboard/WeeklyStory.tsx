import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { type SleepEntry } from '@/lib/sleep';
import { getWeeklyStory, getCachedStory, type WeeklyStory as WeeklyStoryType } from '@/lib/weekly-story';

export function WeeklyStory({ data }: { data: SleepEntry[] }) {
  const [story, setStory] = useState<WeeklyStoryType | null>(getCachedStory);
  const [loading, setLoading] = useState(!getCachedStory());
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    if (story) { setLoading(false); return; }
    let cancelled = false;
    getWeeklyStory(data).then(s => {
      if (!cancelled) { setStory(s); setLoading(false); }
    });
    return () => { cancelled = true; };
  }, [data]);

  if (loading) {
    return (
      <Card className="shadow-sm">
        <CardContent className="py-3 px-4">
          <div className="flex items-center gap-2 text-muted-foreground text-[11px]">
            <div className="w-3 h-3 border-2 border-border border-t-primary rounded-full animate-spin" />
            Se incarca povestea...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!story) return null;

  return (
    <Card className="shadow-sm overflow-hidden">
      <div className="h-1" style={{ background: 'linear-gradient(90deg, hsl(28 55% 40%), hsl(32 45% 52%), hsl(38 50% 60%))' }} />
      <CardContent className="py-0 px-0">
        <button onClick={() => setExpanded(!expanded)}
          className="w-full text-left px-4 py-3 flex items-center gap-2.5 hover:bg-muted/30 transition-colors">
          <span className="text-base">📖</span>
          <span className="text-[11px] font-bold flex-1">Povestea Saptamanii</span>
          {story.source === 'ai' && (
            <span className="text-[7px] font-bold px-1.5 py-0.5 rounded-full bg-violet-100 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400">AI</span>
          )}
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
