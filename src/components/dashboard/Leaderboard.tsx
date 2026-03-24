import { useState, useMemo } from 'react';
import {
  type SleepEntry, type AggEntry, NAMES, ssColor, rhrColor, hrvColor, rhrBg, hrvBg,
  personColor, XP_COLOR, STREAK_COLOR, levelTier,
} from '@/lib/sleep';
import { calcXP, loggingStreak, xpLevel } from '@/lib/gamify';
import { getKudos, saveKudos, getKudosFor } from '@/lib/kudos';
import { goalStatus, type GoalStatus } from '@/lib/goals';
import { getWeeklyChallenge, checkChallenge, getWeekNumber } from '@/lib/challenges';
import { V } from '@/lib/hide';
import { Avi } from '@/components/shared/Avi';
import { Section } from './Section';
import { type DashView } from './HeroCard';

type SortMetric = 'ss' | 'streak' | 'xp' | 'trend';
const SORT_LABELS: Record<SortMetric, string> = { ss: 'SS', streak: 'Streak', xp: 'XP', trend: 'Trend' };

export function Leaderboard({ data, filtered, sorted, user, view, activeDate, subText }: {
  data: SleepEntry[]; filtered: SleepEntry[]; sorted: AggEntry[]; user: string; view: DashView; activeDate: string; subText: string;
}) {
  const [cheerRefresh, setCheerRefresh] = useState(0);
  const [sortBy, setSortBy] = useState<SortMetric>('ss');
  const [commentFor, setCommentFor] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const me = user;

  const leaderboard = useMemo(() => {
    const entries = NAMES.map(n => {
      const pAgg = sorted.find(p => p.name === n);
      const pXP = calcXP(data, n);
      const pSr = loggingStreak(data, n);
      const pGoal = goalStatus(data, n);
      const weekNum = getWeekNumber();
      const challengeDef = getWeeklyChallenge(weekNum);
      const challengeComplete = checkChallenge(challengeDef, data, n).completed;
      // Compute trend (SS improvement: recent half avg - older half avg)
      const personData = data.filter(d => d.name === n).sort((a, b) => a.date.localeCompare(b.date));
      const h = Math.floor(personData.length / 2);
      const trendVal = personData.length >= 4
        ? Math.round(personData.slice(h).reduce((s, x) => s + x.ss, 0) / (personData.length - h) - personData.slice(0, h).reduce((s, x) => s + x.ss, 0) / h)
        : 0;
      return { name: n, xp: pXP, level: xpLevel(pXP), ss: pAgg?.ss ?? 0, streak: pSr.days, entries: pAgg?.entries ?? 0, goal: pGoal, challengeComplete, trend: trendVal };
    });
    return entries.sort((a, b) => {
      if (sortBy === 'ss') return b.ss - a.ss;
      if (sortBy === 'streak') return b.streak - a.streak;
      if (sortBy === 'xp') return b.xp - a.xp;
      if (sortBy === 'trend') return b.trend - a.trend;
      return b.ss - a.ss;
    });
  }, [data, sorted, sortBy]);

  const handleCheer = (to: string, emoji: string) => { if (!me) return; saveKudos(me, to, activeDate, emoji); setCheerRefresh(c => c + 1); };

  const handleCommentSave = (to: string) => {
    if (!me || !commentText.trim()) { setCommentFor(null); setCommentText(''); return; }
    saveKudos(me, to, activeDate, '👍', commentText.trim().slice(0, 40));
    setCommentFor(null);
    setCommentText('');
    setCheerRefresh(c => c + 1);
  };

  return (
    <Section title="Leaderboard" icon="🏆" defaultOpen={true}
            badge={<span className="text-[9px] text-muted-foreground">{subText}</span>}>
      {/* Sort chips */}
      <div className="flex gap-1 flex-wrap pt-2 pb-1">
        {(['ss', 'streak', 'xp', 'trend'] as const).map(metric => (
          <button key={metric} onClick={() => setSortBy(metric)}
            className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full transition-colors ${sortBy === metric ? 'bg-primary text-primary-foreground' : 'bg-muted/50 text-muted-foreground hover:bg-muted'}`}>
            {SORT_LABELS[metric]}
          </button>
        ))}
      </div>
      <div className="space-y-2">
        {leaderboard.map((p, i) => {
          const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉';
          const isMe = p.name === me;
          const pc = personColor(p.name);
          const entry = view === 'daily' && p.ss > 0 ? filtered.find(e => e.name === p.name) : null;
          const likes = view === 'daily' ? getKudosFor(p.name, activeDate) : [];
          return (
            <div key={p.name} className={`p-2.5 rounded-lg transition-colors ${isMe ? 'bg-muted/60 ring-1 ring-primary/10' : 'hover:bg-muted/30'}`}>
              {/* Row 1: Medal + Avatar + Name + SS + Like */}
              <div className="flex items-center gap-2">
                <span className="text-sm w-5 text-center shrink-0">{medal}</span>
                <Avi name={p.name} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold truncate" style={{ color: pc }}>{p.name.split(' ')[0]} {p.name.split(' ').pop()}</span>
                    {p.challengeComplete && <span className="text-[8px]" title="Provocarea saptamanii completata">🏆</span>}
                    <span className="text-[8px] font-bold px-1 py-0.5 rounded inline-flex items-center gap-0.5 shrink-0" style={{ color: levelTier(p.level).color, background: levelTier(p.level).color + '15' }}>
                      {levelTier(p.level).icon} Lv{p.level}
                    </span>
                    {p.streak > 0 && <span className="text-[8px] font-bold shrink-0" style={{ color: STREAK_COLOR }}>⚡{p.streak}d</span>}
                  </div>
                  <div className="text-[9px] text-muted-foreground">
                    <span style={{ color: levelTier(p.level).color }}>{levelTier(p.level).name}</span>
                    <span className="mx-1">·</span>
                    <span style={{ color: XP_COLOR }}>{p.xp} XP</span>
                    {p.trend !== 0 && (
                      <>
                        <span className="mx-1">·</span>
                        <span style={{ color: p.trend > 0 ? '#16a34a' : '#dc2626' }}>{p.trend > 0 ? '↑' : '↓'}{Math.abs(p.trend)}</span>
                      </>
                    )}
                  </div>
                  {/* Goal status */}
                  {p.goal && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="text-[8px] font-bold px-1 py-0.5 rounded"
                        style={{
                          color: p.goal.status === 'ahead' ? '#16a34a' : p.goal.status === 'behind' ? '#dc2626' : 'hsl(28 55% 40%)',
                          background: (p.goal.status === 'ahead' ? '#16a34a' : p.goal.status === 'behind' ? '#dc2626' : '#8B5E3C') + '15',
                        }}>
                        {p.goal.status === 'ahead' ? 'Inaintea planului' : p.goal.status === 'behind' ? 'In urma' : 'Pe drumul cel bun'}
                      </span>
                      <span className="text-[8px] text-muted-foreground">SS {p.goal.target}</span>
                    </div>
                  )}
                </div>
                <div className="font-mono text-xl font-bold shrink-0" style={{ color: p.ss > 0 ? ssColor(p.ss) : '#e2e8f0' }}>
                  {p.ss > 0 ? <V>{p.ss}</V> : '—'}
                </div>
                {/* Like — daily view only */}
                {view === 'daily' && (() => {
                  if (isMe || p.ss === 0) return <div className="w-7 shrink-0" />;
                  const myLike = me ? getKudos(me, p.name, activeDate) : null;
                  const handleToggle = (e: React.MouseEvent) => {
                    e.stopPropagation();
                    if (myLike) {
                      try { localStorage.removeItem(`st_kudos_${activeDate}_${me}_${p.name}`); } catch {}
                      setCheerRefresh(c => c + 1);
                    } else {
                      handleCheer(p.name, '👍');
                      setCommentFor(p.name);
                      setCommentText('');
                    }
                  };
                  return (
                    <button onClick={handleToggle} className="w-7 shrink-0 flex items-center justify-center gap-0.5 hover:scale-110 active:scale-125 transition-all" title={myLike ? 'Unlike' : 'Like'}>
                      <span className={`text-sm ${myLike ? '' : 'grayscale opacity-25'}`}>👍</span>
                      {likes.length > 0 && <span className={`text-[9px] font-bold ${myLike ? '' : 'text-muted-foreground'}`} style={myLike ? { color: '#2563eb' } : undefined}>{likes.length}</span>}
                    </button>
                  );
                })()}
              </div>
              {/* Row 2: RHR + HRV pills — daily view only */}
              {entry && (
                <div className="flex items-center gap-2 mt-1.5 ml-9 pl-1">
                  <div className="flex items-center gap-1 px-1.5 py-0.5 rounded" style={{ background: rhrBg(entry.rhr) }}>
                    <span className="text-[7px] text-muted-foreground">RHR</span>
                    <span className="font-mono text-[10px] font-bold" style={{ color: rhrColor(entry.rhr) }}>{entry.rhr}</span>
                  </div>
                  {entry.hrv != null && (
                    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded" style={{ background: hrvBg(entry.hrv) }}>
                      <span className="text-[7px] text-muted-foreground">HRV</span>
                      <span className="font-mono text-[10px] font-bold" style={{ color: hrvColor(entry.hrv) }}>{entry.hrv}</span>
                    </div>
                  )}
                </div>
              )}
              {/* Kudos comments — daily view only */}
              {view === 'daily' && likes.length > 0 && (
                <div className="ml-9 pl-1 mt-1">
                  {likes.map(like => like.comment ? (
                    <div key={like.from} className="text-[8px] text-muted-foreground flex items-center gap-1">
                      <span className="text-[7px]">💬</span>
                      <span className="italic truncate max-w-[120px]">{like.comment}</span>
                      <span className="text-[7px]">— {like.from.split(' ')[0]}</span>
                    </div>
                  ) : null)}
                </div>
              )}
              {/* Comment input — appears after giving kudos */}
              {commentFor === p.name && view === 'daily' && (
                <div className="ml-9 pl-1 mt-1">
                  <input type="text" placeholder="Adauga un comentariu..." maxLength={40} value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleCommentSave(p.name); }}
                    onBlur={() => handleCommentSave(p.name)}
                    autoFocus
                    className="text-[9px] w-full max-w-[180px] bg-muted/30 border rounded px-1.5 py-0.5 outline-none focus:ring-1 focus:ring-primary/30" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Section>
  );
}
