import { useState, useMemo } from 'react';
import {
  type SleepEntry, type AggEntry, NAMES, ssColor, rhrColor, hrvColor, rhrBg, hrvBg,
  personColor, XP_COLOR, STREAK_COLOR, levelTier, fmtDate, aggregate, todayStr,
} from '@/lib/sleep';
import { calcXP, loggingStreak, xpLevel } from '@/lib/gamify';
import { getKudos, saveKudos, getKudosFor } from '@/lib/kudos';
import { goalStatus } from '@/lib/goals';
import { getWeeklyChallenge, checkChallenge, getWeekNumber } from '@/lib/challenges';
import { getLatestWinner, getTrophyCounts } from '@/lib/trophies';
import { V } from '@/lib/hide';
import { Avi } from '@/components/shared/Avi';
import { Section } from './Section';

type SortMetric = 'ss' | 'rhr' | 'streak';
const SORT_LABELS: Record<SortMetric, string> = { ss: 'Score', rhr: 'RHR', streak: 'Streak' };

/* ── Shared row renderer ── */
function LeaderRow({ p, i, isMe, filtered, showDaily, activeDate, me, onCheer, cheerRefresh, trophyEmoji }: {
  p: { name: string; xp: number; level: number; ss: number; streak: number; entries: number; goal: ReturnType<typeof goalStatus>; challengeComplete: boolean; trend: number };
  i: number; isMe: boolean; filtered: SleepEntry[]; showDaily: boolean; activeDate: string; me: string;
  onCheer: (to: string) => void; cheerRefresh: number; trophyEmoji?: string;
}) {
  const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉';
  const pc = personColor(p.name);
  const entry = showDaily && p.ss > 0 ? filtered.find(e => e.name === p.name) : null;
  const likes = showDaily ? getKudosFor(p.name, activeDate) : [];

  return (
    <div className={`p-2.5 rounded-lg transition-colors ${isMe ? 'bg-muted/60 ring-1 ring-primary/10' : 'hover:bg-muted/30'}`}>
      <div className="flex items-center gap-2">
        <span className="text-sm w-5 text-center shrink-0">{medal}</span>
        <Avi name={p.name} size="sm" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold truncate" style={{ color: pc }}>{p.name.split(' ')[0]} {p.name.split(' ').pop()}</span>
            {trophyEmoji && <span className="text-xs" title="Campionul saptamanii trecute">{trophyEmoji}</span>}
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
        {/* Like — daily only */}
        {showDaily && (() => {
          if (isMe || p.ss === 0) return <div className="w-7 shrink-0" />;
          const myLike = me ? getKudos(me, p.name, activeDate) : null;
          return (
            <button onClick={(e) => { e.stopPropagation(); onCheer(p.name); }}
              className="w-7 shrink-0 flex items-center justify-center gap-0.5 hover:scale-110 active:scale-125 transition-all"
              title={myLike ? 'Unlike' : 'Love'}>
              <span className={`text-sm ${myLike ? '' : 'grayscale opacity-25'}`}>❤️</span>
              {likes.length > 0 && <span className={`text-[9px] font-bold ${myLike ? '' : 'text-muted-foreground'}`} style={myLike ? { color: '#2563eb' } : undefined}>{likes.length}</span>}
            </button>
          );
        })()}
      </div>
      {/* RHR + HRV pills */}
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
      {/* Kudos comments */}
      {showDaily && likes.length > 0 && (
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
    </div>
  );
}

/* ── Helper: build leaderboard entries ── */
function buildEntries(data: SleepEntry[], sorted: AggEntry[], sortBy: SortMetric) {
  const entries = NAMES.map(n => {
    const pAgg = sorted.find(p => p.name === n);
    const pXP = calcXP(data, n);
    const pSr = loggingStreak(data, n);
    const pGoal = goalStatus(data, n);
    const weekNum = getWeekNumber();
    const challengeDef = getWeeklyChallenge(weekNum);
    const challengeComplete = checkChallenge(challengeDef, data, n).completed;
    const personData = data.filter(d => d.name === n).sort((a, b) => a.date.localeCompare(b.date));
    const h = Math.floor(personData.length / 2);
    const trendVal = personData.length >= 4
      ? Math.round(personData.slice(h).reduce((s, x) => s + x.ss, 0) / (personData.length - h) - personData.slice(0, h).reduce((s, x) => s + x.ss, 0) / h)
      : 0;
    return { name: n, xp: pXP, level: xpLevel(pXP), ss: pAgg?.ss ?? 0, rhr: pAgg?.rhr ?? 999, streak: pSr.days, entries: pAgg?.entries ?? 0, goal: pGoal, challengeComplete, trend: trendVal };
  });
  return entries.sort((a, b) => {
    if (sortBy === 'ss') return b.ss - a.ss;
    if (sortBy === 'rhr') return a.rhr - b.rhr; // lower RHR is better
    if (sortBy === 'streak') return b.streak - a.streak;
    return b.ss - a.ss;
  });
}

/* ══════════════════════════════════════════════════════
   TODAY'S LEADERBOARD
   ══════════════════════════════════════════════════════ */
export function TodayLeaderboard({ data, user, activeDate: activeDateProp }: { data: SleepEntry[]; user: string; activeDate?: string }) {
  const [cheerRefresh, setCheerRefresh] = useState(0);
  const me = user;

  const dates = useMemo(() => [...new Set(data.map(d => d.date))].sort(), [data]);
  const activeDate = activeDateProp || dates[dates.length - 1] || '';
  const filtered = useMemo(() => data.filter(d => d.date === activeDate), [data, activeDate]);
  const sorted = useMemo(() => [...filtered].sort((a, b) => b.ss - a.ss), [filtered]);
  const leaderboard = useMemo(() => buildEntries(data, sorted, 'ss'), [data, sorted]);

  const handleCheer = (to: string) => {
    if (!me) return;
    const existing = getKudos(me, to, activeDate);
    if (existing) {
      try { localStorage.removeItem(`st_kudos_${activeDate}_${me}_${to}`); } catch {}
    } else {
      saveKudos(me, to, activeDate, '❤️');
    }
    setCheerRefresh(c => c + 1);
  };

  return (
    <Section title={activeDateProp ? fmtDate(activeDate) : 'Azi'} icon="📊" defaultOpen={true}
            badge={activeDateProp ? undefined : <span className="text-[9px] text-muted-foreground">{fmtDate(activeDate)}</span>}>
      <div className="pt-2 space-y-2">
        {leaderboard.map((p, i) => (
          <LeaderRow key={p.name} p={p} i={i} isMe={p.name === me} filtered={filtered}
            showDaily={true} activeDate={activeDate} me={me}
            onCheer={handleCheer} cheerRefresh={cheerRefresh} />
        ))}
      </div>
    </Section>
  );
}

/* ══════════════════════════════════════════════════════
   PERIOD LEADERBOARD (7 zile / Luna)
   ══════════════════════════════════════════════════════ */
type PeriodTab = 'weekly' | 'monthly';

export function PeriodLeaderboard({ data, user }: { data: SleepEntry[]; user: string }) {
  const [period, setPeriod] = useState<PeriodTab>('weekly');
  const [sortBy, setSortBy] = useState<SortMetric>('ss');
  const me = user;
  const latestWinner = useMemo(() => getLatestWinner(data), [data]);
  const trophyCounts = useMemo(() => getTrophyCounts(data), [data]);

  const { filtered, subText } = useMemo(() => {
    if (period === 'weekly') {
      const now = new Date(); const dow = now.getDay() || 7;
      const mon = new Date(now); mon.setDate(mon.getDate() - dow + 1);
      return { filtered: data.filter(d => d.date >= mon.toISOString().split('T')[0]), subText: 'Săptămâna curentă' };
    } else {
      const prefix = todayStr().substring(0, 7);
      const f = data.filter(d => d.date.startsWith(prefix));
      const mo = ['Ianuarie','Februarie','Martie','Aprilie','Mai','Iunie','Iulie','August','Septembrie','Octombrie','Noiembrie','Decembrie'];
      return { filtered: f, subText: mo[parseInt(prefix.split('-')[1]) - 1] };
    }
  }, [data, period]);

  const sorted = useMemo(() => aggregate(filtered), [filtered]);
  const leaderboard = useMemo(() => buildEntries(data, sorted, sortBy), [data, sorted, sortBy]);

  return (
    <Section title="Clasament" icon="🏆" defaultOpen={true}
            badge={<span className="text-[9px] text-muted-foreground">{subText}</span>}>
      <div className="pt-2 pb-1 space-y-1.5">
        {/* Weekly champion banner */}
        {latestWinner && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg mb-1"
            style={{ background: personColor(latestWinner.winner) + '10', border: `1px solid ${personColor(latestWinner.winner)}25` }}>
            <span className="text-lg">{latestWinner.trophy.emoji}</span>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-bold" style={{ color: personColor(latestWinner.winner) }}>
                {latestWinner.winner.split(' ')[0]} — {latestWinner.trophy.title}
              </div>
              <div className="text-[8px] text-muted-foreground">
                Campionul saptamanii · SS {latestWinner.avgSS}
              </div>
            </div>
            {/* Trophy count badges */}
            <div className="flex gap-1.5 shrink-0">
              {NAMES.map(n => {
                const count = trophyCounts[n] || 0;
                if (!count) return null;
                return (
                  <span key={n} className="text-[8px] font-bold px-1 py-0.5 rounded"
                    style={{ color: personColor(n), background: personColor(n) + '15' }}>
                    {n.split(' ')[0].charAt(0)}{n.split(' ').pop()?.charAt(0)} {count}🏆
                  </span>
                );
              })}
            </div>
          </div>
        )}
        {/* Period tabs */}
        <div className="flex items-center gap-1.5">
          {([['weekly', '7 zile'], ['monthly', 'Luna']] as const).map(([v, label]) => (
            <button key={v} onClick={() => setPeriod(v)}
              className={`text-[9px] font-bold px-2 py-1 rounded-md transition-colors ${period === v ? 'bg-primary text-primary-foreground' : 'bg-muted/50 text-muted-foreground hover:bg-muted'}`}>
              {label}
            </button>
          ))}
          <span className="text-[9px] text-muted-foreground ml-auto">{subText}</span>
        </div>
        {/* Sort chips */}
        <div className="flex gap-1 flex-wrap">
          <span className="text-[8px] text-muted-foreground self-center mr-0.5">Sort:</span>
          {(['ss', 'rhr', 'streak'] as const).map(metric => (
            <button key={metric} onClick={() => setSortBy(metric)}
              className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full transition-colors ${sortBy === metric ? 'bg-primary text-primary-foreground' : 'bg-muted/50 text-muted-foreground hover:bg-muted'}`}>
              {SORT_LABELS[metric]}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        {leaderboard.map((p, i) => (
          <LeaderRow key={p.name} p={p} i={i} isMe={p.name === me} filtered={[]}
            showDaily={false} activeDate="" me={me}
            onCheer={() => {}} cheerRefresh={0}
            trophyEmoji={period === 'weekly' && latestWinner?.winner === p.name ? latestWinner.trophy.emoji : undefined} />
        ))}
      </div>
    </Section>
  );
}

/* ── Legacy export for backward compat ── */
export { TodayLeaderboard as Leaderboard };
