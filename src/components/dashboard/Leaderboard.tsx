import { useState, useMemo } from 'react';
import {
  type SleepEntry, type AggEntry, ssColor, rhrColor, hrvColor, rhrBg, hrvBg,
  personColor, NAMES, calcXP, loggingStreak, xpLevel,
  XP_COLOR, STREAK_COLOR, levelTier,
} from '@/lib/sleep';
import { V } from '@/lib/hide';
import { Avi } from '@/components/shared/Avi';
import { Section } from './Section';
import { type DashView } from './HeroCard';

/* ── Kudos helpers (localStorage) ── */
function kudosKey(from: string, to: string, date: string) { return `st_kudos_${date}_${from}_${to}`; }
function getKudos(from: string, to: string, date: string): string | null {
  try { return localStorage.getItem(kudosKey(from, to, date)); } catch { return null; }
}
function saveKudos(from: string, to: string, date: string, emoji: string) {
  try { localStorage.setItem(kudosKey(from, to, date), emoji); } catch {}
}
function getKudosFor(to: string, date: string): { from: string; emoji: string }[] {
  const result: { from: string; emoji: string }[] = [];
  for (const n of NAMES) { const k = getKudos(n, to, date); if (k) result.push({ from: n, emoji: k }); }
  return result;
}

export function Leaderboard({ data, filtered, sorted, user, view, activeDate, subText }: {
  data: SleepEntry[]; filtered: SleepEntry[]; sorted: AggEntry[]; user: string; view: DashView; activeDate: string; subText: string;
}) {
  const [cheerRefresh, setCheerRefresh] = useState(0);
  const me = user;

  const leaderboard = useMemo(() => NAMES.map(n => {
    const pAgg = sorted.find(p => p.name === n);
    const pXP = calcXP(data, n);
    const pSr = loggingStreak(data, n);
    return { name: n, xp: pXP, level: xpLevel(pXP), ss: pAgg?.ss ?? 0, streak: pSr.days, entries: pAgg?.entries ?? 0 };
  }).sort((a, b) => b.ss - a.ss), [data, sorted]);

  const handleCheer = (to: string, emoji: string) => { if (!me) return; saveKudos(me, to, activeDate, emoji); setCheerRefresh(c => c + 1); };

  return (
    <Section title="Leaderboard" icon="🏆" defaultOpen={true}
            badge={<span className="text-[9px] text-muted-foreground">{subText}</span>}>
      <div className="pt-2 space-y-2">
        {leaderboard.map((p, i) => {
          const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉';
          const isMe = p.name === me;
          const pc = personColor(p.name);
          const entry = view === 'daily' && p.ss > 0 ? filtered.find(e => e.name === p.name) : null;
          return (
            <div key={p.name} className={`p-2.5 rounded-lg transition-colors ${isMe ? 'bg-muted/60 ring-1 ring-primary/10' : 'hover:bg-muted/30'}`}>
              {/* Row 1: Medal + Avatar + Name + SS + Like */}
              <div className="flex items-center gap-2">
                <span className="text-sm w-5 text-center shrink-0">{medal}</span>
                <Avi name={p.name} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold truncate" style={{ color: pc }}>{p.name.split(' ')[0]} {p.name.split(' ').pop()}</span>
                    <span className="text-[8px] font-bold px-1 py-0.5 rounded inline-flex items-center gap-0.5 shrink-0" style={{ color: levelTier(p.level).color, background: levelTier(p.level).color + '15' }}>
                      {levelTier(p.level).icon} Lv{p.level}
                    </span>
                    {p.streak > 0 && <span className="text-[8px] font-bold shrink-0" style={{ color: STREAK_COLOR }}>⚡{p.streak}d</span>}
                  </div>
                  <div className="text-[9px] text-muted-foreground">
                    <span style={{ color: levelTier(p.level).color }}>{levelTier(p.level).name}</span>
                    <span className="mx-1">·</span>
                    <span style={{ color: XP_COLOR }}>{p.xp} XP</span>
                  </div>
                </div>
                <div className="font-mono text-xl font-bold shrink-0" style={{ color: p.ss > 0 ? ssColor(p.ss) : '#e2e8f0' }}>
                  {p.ss > 0 ? <V>{p.ss}</V> : '—'}
                </div>
                {/* Like — daily view only */}
                {view === 'daily' && (() => {
                  if (isMe || p.ss === 0) return <div className="w-7 shrink-0" />;
                  const likes = getKudosFor(p.name, activeDate);
                  const likeCount = likes.length;
                  const myLike = me ? getKudos(me, p.name, activeDate) : null;
                  const handleToggle = (e: React.MouseEvent) => {
                    e.stopPropagation();
                    if (myLike) { try { localStorage.removeItem(`st_kudos_${activeDate}_${me}_${p.name}`); } catch {} }
                    else { handleCheer(p.name, '👍'); }
                    setCheerRefresh(c => c + 1);
                  };
                  return (
                    <button onClick={handleToggle} className="w-7 shrink-0 flex items-center justify-center gap-0.5 hover:scale-110 active:scale-125 transition-all" title={myLike ? 'Unlike' : 'Like'}>
                      <span className={`text-sm ${myLike ? '' : 'grayscale opacity-25'}`}>👍</span>
                      {likeCount > 0 && <span className={`text-[9px] font-bold ${myLike ? '' : 'text-muted-foreground'}`} style={myLike ? { color: '#2563eb' } : undefined}>{likeCount}</span>}
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
            </div>
          );
        })}
      </div>
    </Section>
  );
}
