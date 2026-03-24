import React, { useState } from 'react';
import { type SleepEntry, NAMES, ssColor } from '@/lib/sleep';
import { XP_COLOR } from '@/lib/sleep';
import { type GameState } from '@/hooks/useGameState';
import { getWeekStart, getWeekEnd } from '@/lib/challenges';
import {
  getActiveMiniChallenge, checkMiniChallenge,
  getActiveDuels, createDuel, dismissDuel, getDuelResult,
  DUEL_TYPES, type ActiveDuel, type DuelParticipant,
} from '@/lib/mini-challenges';
import { Avi } from '@/components/shared';

/* ── Helper: short first name ── */
function shortName(name: string) { return name.split(' ')[0]; }

function daysLeft(endDate: string): number {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const end = new Date(endDate + 'T12:00:00');
  return Math.max(0, Math.ceil((end.getTime() - today.getTime()) / 86400000));
}

function formatDate(d: string) {
  return new Date(d + 'T12:00:00').toLocaleDateString('ro-RO', { day: 'numeric', month: 'short' });
}

// ══════════════════════════════════════════════════════════════════
// Weekly challenge detail generators
// ══════════════════════════════════════════════════════════════════

function getDetailRows(challengeId: string, data: SleepEntry[], user: string) {
  const weekStart = getWeekStart();
  const weekEnd = getWeekEnd(weekStart);
  const today = new Date().toISOString().split('T')[0];

  switch (challengeId) {
    case 'log_daily':
    case 'streak_builder': {
      const entries = data.filter(e => e.name === user && e.date >= weekStart && e.date <= weekEnd);
      const loggedDates = [...new Set(entries.map(e => e.date))].sort();
      const allDays = getDaysInRange(weekStart, weekEnd <= today ? weekEnd : today);
      return {
        type: 'calendar' as const,
        rows: allDays.map(d => ({
          date: d,
          dayName: new Date(d + 'T12:00:00').toLocaleDateString('ro-RO', { weekday: 'short' }),
          logged: loggedDates.includes(d),
          ss: entries.find(e => e.date === d)?.ss ?? null,
        })),
      };
    }

    case 'beat_average': {
      const entries = data.filter(e => e.name === user && e.date >= weekStart && e.date <= weekEnd);
      const avg = entries.length ? entries.reduce((s, e) => s + e.ss, 0) / entries.length : 0;
      const prevStart = new Date(weekStart + 'T12:00:00'); prevStart.setDate(prevStart.getDate() - 7);
      const ps = prevStart.toISOString().split('T')[0];
      const pe = new Date(weekStart + 'T12:00:00'); pe.setDate(pe.getDate() - 1);
      const pes = pe.toISOString().split('T')[0];
      const prevEntries = data.filter(e => e.name === user && e.date >= ps && e.date <= pes);
      const prevAvg = prevEntries.length ? prevEntries.reduce((s, e) => s + e.ss, 0) / prevEntries.length : 0;
      return {
        type: 'comparison' as const,
        thisWeek: { avg: Math.round(avg * 10) / 10, count: entries.length },
        lastWeek: { avg: Math.round(prevAvg * 10) / 10, count: prevEntries.length },
      };
    }

    case 'team_80': {
      return {
        type: 'team_avg' as const,
        members: NAMES.map(n => {
          const entries = data.filter(e => e.name === n && e.date >= weekStart && e.date <= weekEnd);
          const avg = entries.length ? entries.reduce((s, e) => s + e.ss, 0) / entries.length : 0;
          return { name: n, avg: Math.round(avg * 10) / 10, count: entries.length, target: 80, passing: avg >= 80 && entries.length > 0 };
        }),
      };
    }

    case 'team_all_log': {
      return {
        type: 'team_days' as const,
        members: NAMES.map(n => {
          const entries = data.filter(e => e.name === n && e.date >= weekStart && e.date <= weekEnd);
          const days = new Set(entries.map(e => e.date)).size;
          return { name: n, days, target: 5, passing: days >= 5 };
        }),
      };
    }

    case 'ss_90_once': {
      const entries = data.filter(e => e.name === user && e.date >= weekStart && e.date <= weekEnd);
      const sorted = [...entries].sort((a, b) => b.ss - a.ss);
      return {
        type: 'entries_list' as const,
        entries: sorted.slice(0, 7).map(e => ({
          date: e.date,
          dayName: new Date(e.date + 'T12:00:00').toLocaleDateString('ro-RO', { weekday: 'short' }),
          ss: e.ss,
          hit: e.ss >= 90,
        })),
        targetSS: 90,
      };
    }

    case 'improve_rhr': {
      const entries = data.filter(e => e.name === user && e.date >= weekStart && e.date <= weekEnd);
      const avg = entries.length ? entries.reduce((s, e) => s + e.rhr, 0) / entries.length : 0;
      const prevStart = new Date(weekStart + 'T12:00:00'); prevStart.setDate(prevStart.getDate() - 7);
      const ps = prevStart.toISOString().split('T')[0];
      const pe = new Date(weekStart + 'T12:00:00'); pe.setDate(pe.getDate() - 1);
      const pes = pe.toISOString().split('T')[0];
      const prevEntries = data.filter(e => e.name === user && e.date >= ps && e.date <= pes);
      const prevAvg = prevEntries.length ? prevEntries.reduce((s, e) => s + e.rhr, 0) / prevEntries.length : 0;
      return {
        type: 'comparison_rhr' as const,
        thisWeek: { avg: Math.round(avg * 10) / 10, count: entries.length },
        lastWeek: { avg: Math.round(prevAvg * 10) / 10, count: prevEntries.length },
      };
    }

    case 'consistency': {
      const entries = data.filter(e => e.name === user && e.date >= weekStart && e.date <= weekEnd);
      const scores = entries.map(e => e.ss);
      const range = scores.length >= 2 ? Math.max(...scores) - Math.min(...scores) : 0;
      return {
        type: 'consistency' as const,
        entries: entries.sort((a, b) => a.date.localeCompare(b.date)).map(e => ({
          date: e.date,
          dayName: new Date(e.date + 'T12:00:00').toLocaleDateString('ro-RO', { weekday: 'short' }),
          ss: e.ss,
        })),
        range,
        targetRange: 10,
      };
    }

    default:
      return { type: 'none' as const };
  }
}

function getDaysInRange(start: string, end: string): string[] {
  const days: string[] = [];
  const d = new Date(start + 'T12:00:00');
  const endD = new Date(end + 'T12:00:00');
  while (d <= endD) { days.push(d.toISOString().split('T')[0]); d.setDate(d.getDate() + 1); }
  return days;
}

// ══════════════════════════════════════════════════════════════════
// Detail sub-components
// ══════════════════════════════════════════════════════════════════

function CalendarDetail({ rows }: { rows: { date: string; dayName: string; logged: boolean; ss: number | null }[] }) {
  return (
    <div className="flex gap-1.5 mt-2">
      {rows.map(r => (
        <div key={r.date} className="flex-1 text-center">
          <div className="text-[8px] text-muted-foreground uppercase mb-0.5">{r.dayName}</div>
          <div className={`h-7 rounded-md flex items-center justify-center text-[10px] font-bold ${
            r.logged ? 'text-white' : 'bg-muted/50 text-muted-foreground/40'
          }`} style={r.logged && r.ss !== null ? { background: ssColor(r.ss) } : undefined}>
            {r.logged && r.ss !== null ? r.ss : '—'}
          </div>
        </div>
      ))}
    </div>
  );
}

function ComparisonDetail({ thisWeek, lastWeek, metric, lowerBetter }: {
  thisWeek: { avg: number; count: number }; lastWeek: { avg: number; count: number }; metric: string; lowerBetter?: boolean;
}) {
  const improved = lowerBetter ? thisWeek.avg < lastWeek.avg : thisWeek.avg > lastWeek.avg;
  const diff = Math.round((thisWeek.avg - lastWeek.avg) * 10) / 10;
  const arrow = diff > 0 ? '↑' : diff < 0 ? '↓' : '→';
  return (
    <div className="mt-2 flex items-center gap-3">
      <div className="flex-1 rounded-lg bg-muted/40 px-3 py-2 text-center">
        <div className="text-[8px] text-muted-foreground uppercase">Sapt. trecuta</div>
        <div className="text-base font-bold font-mono" style={{ color: lastWeek.count ? (lowerBetter ? ssColor(100 - lastWeek.avg) : ssColor(lastWeek.avg)) : undefined }}>
          {lastWeek.count ? lastWeek.avg : '—'}
        </div>
        <div className="text-[8px] text-muted-foreground">{lastWeek.count} {lastWeek.count === 1 ? 'zi' : 'zile'}</div>
      </div>
      <div className="flex flex-col items-center">
        <span className={`text-lg font-bold ${improved ? 'text-green-500' : 'text-red-400'}`}>{arrow}</span>
        <span className={`text-[9px] font-mono font-bold ${improved ? 'text-green-600' : 'text-red-500'}`}>
          {diff > 0 ? '+' : ''}{diff} {metric}
        </span>
      </div>
      <div className="flex-1 rounded-lg bg-muted/40 px-3 py-2 text-center ring-1 ring-border">
        <div className="text-[8px] text-muted-foreground uppercase">Sapt. asta</div>
        <div className="text-base font-bold font-mono" style={{ color: thisWeek.count ? (lowerBetter ? ssColor(100 - thisWeek.avg) : ssColor(thisWeek.avg)) : undefined }}>
          {thisWeek.count ? thisWeek.avg : '—'}
        </div>
        <div className="text-[8px] text-muted-foreground">{thisWeek.count} {thisWeek.count === 1 ? 'zi' : 'zile'}</div>
      </div>
    </div>
  );
}

function TeamAvgDetail({ members }: { members: { name: string; avg: number; count: number; target: number; passing: boolean }[] }) {
  return (
    <div className="mt-2 space-y-1.5">
      {members.map(m => (
        <div key={m.name} className="flex items-center gap-2">
          <Avi name={m.name} size="sm" />
          <span className="text-[10px] font-medium flex-1 truncate">{shortName(m.name)}</span>
          <div className="w-20 h-2.5 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{
              width: `${m.count ? Math.min(100, (m.avg / 100) * 100) : 0}%`,
              background: m.passing ? '#16a34a' : m.count ? ssColor(m.avg) : '#a09585',
            }} />
          </div>
          <span className="text-[10px] font-bold font-mono w-8 text-right" style={{ color: m.count ? ssColor(m.avg) : '#a09585' }}>
            {m.count ? m.avg : '—'}
          </span>
          <span className="text-[10px]">{m.passing ? '✅' : m.count ? '❌' : '⏳'}</span>
        </div>
      ))}
    </div>
  );
}

function TeamDaysDetail({ members }: { members: { name: string; days: number; target: number; passing: boolean }[] }) {
  return (
    <div className="mt-2 space-y-1.5">
      {members.map(m => (
        <div key={m.name} className="flex items-center gap-2">
          <Avi name={m.name} size="sm" />
          <span className="text-[10px] font-medium flex-1 truncate">{shortName(m.name)}</span>
          <div className="flex gap-0.5">
            {Array.from({ length: m.target }, (_, i) => (
              <div key={i} className={`w-3.5 h-3.5 rounded-sm ${i < m.days ? 'bg-green-500' : 'bg-muted'}`} />
            ))}
          </div>
          <span className="text-[10px] font-bold font-mono w-8 text-right">{m.days}/{m.target}</span>
          <span className="text-[10px]">{m.passing ? '✅' : '⏳'}</span>
        </div>
      ))}
    </div>
  );
}

function EntriesListDetail({ entries }: { entries: { date: string; dayName: string; ss: number; hit: boolean }[] }) {
  return (
    <div className="mt-2 space-y-1">
      {entries.map(e => (
        <div key={e.date} className={`flex items-center gap-2 px-2 py-1 rounded-md ${e.hit ? 'bg-green-50 dark:bg-green-950/20 ring-1 ring-green-200 dark:ring-green-800/30' : ''}`}>
          <span className="text-[9px] text-muted-foreground uppercase w-6">{e.dayName}</span>
          <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${e.ss}%`, background: ssColor(e.ss) }} />
          </div>
          <span className="text-[10px] font-bold font-mono" style={{ color: ssColor(e.ss) }}>{e.ss}</span>
          {e.hit && <span className="text-[10px]">🌟</span>}
        </div>
      ))}
      {entries.length === 0 && <div className="text-[10px] text-muted-foreground text-center py-1">Nicio intrare inca</div>}
    </div>
  );
}

function ConsistencyDetail({ entries, range, targetRange }: {
  entries: { date: string; dayName: string; ss: number }[]; range: number; targetRange: number;
}) {
  return (
    <div className="mt-2">
      <div className="flex gap-1.5 mb-1.5">
        {entries.map(e => (
          <div key={e.date} className="flex-1 text-center">
            <div className="text-[8px] text-muted-foreground uppercase mb-0.5">{e.dayName}</div>
            <div className="h-7 rounded-md flex items-center justify-center text-[10px] font-bold text-white" style={{ background: ssColor(e.ss) }}>
              {e.ss}
            </div>
          </div>
        ))}
      </div>
      {entries.length >= 2 && (
        <div className="flex items-center justify-center gap-1.5 text-[9px]">
          <span className="text-muted-foreground">Interval:</span>
          <span className={`font-bold font-mono ${range <= targetRange ? 'text-green-600' : 'text-red-500'}`}>{range} puncte</span>
          <span className="text-muted-foreground">(max {targetRange})</span>
          <span>{range <= targetRange ? '✅' : '❌'}</span>
        </div>
      )}
    </div>
  );
}

function DetailView({ detail }: { detail: ReturnType<typeof getDetailRows> }) {
  switch (detail.type) {
    case 'calendar': return <CalendarDetail rows={detail.rows} />;
    case 'comparison': return <ComparisonDetail thisWeek={detail.thisWeek} lastWeek={detail.lastWeek} metric="SS" />;
    case 'comparison_rhr': return <ComparisonDetail thisWeek={detail.thisWeek} lastWeek={detail.lastWeek} metric="RHR" lowerBetter />;
    case 'team_avg': return <TeamAvgDetail members={detail.members} />;
    case 'team_days': return <TeamDaysDetail members={detail.members} />;
    case 'entries_list': return <EntriesListDetail entries={detail.entries} />;
    case 'consistency': return <ConsistencyDetail entries={detail.entries} range={detail.range} targetRange={detail.targetRange} />;
    default: return null;
  }
}

// ══════════════════════════════════════════════════════════════════
// Progress bar component (reused across challenge types)
// ══════════════════════════════════════════════════════════════════

function ProgressBar({ pct, progress, target, completed, color }: {
  pct: number; progress: number; target: number; completed: boolean; color: string;
}) {
  if (completed) {
    return (
      <div className="flex items-center gap-2">
        <div className="h-3 rounded-full bg-green-200 dark:bg-green-800/30 overflow-hidden flex-1">
          <div className="h-full rounded-full bg-green-500" style={{ width: '100%' }} />
        </div>
        <span className="text-[10px] font-bold text-green-600 flex items-center gap-1">🏆 Completat!</span>
      </div>
    );
  }
  return (
    <div>
      <div className="h-3 rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700 relative"
             style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}, ${color}cc)` }}>
          {pct > 15 && (
            <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-white">
              {progress}/{target}
            </span>
          )}
        </div>
      </div>
      {pct <= 15 && (
        <div className="text-[9px] font-mono text-muted-foreground mt-0.5 text-right">{progress}/{target}</div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// 1v1 Duel Card
// ══════════════════════════════════════════════════════════════════

function scoreDisplay(p: DuelParticipant) {
  return Math.abs(p.score) < 900 ? Math.round(Math.abs(p.score) * 10) / 10 : '—';
}

function DuelCard({ duel, data, user, onDismiss }: {
  duel: ActiveDuel; data: SleepEntry[]; user: string; onDismiss: () => void;
}) {
  const result = getDuelResult(duel, data);
  const { duelType, participants, winnerName, finished } = result;
  const remaining = daysLeft(duel.endDate);
  const iWon = winnerName === user;
  const iLost = finished && winnerName !== null && winnerName !== user;
  const isTie = finished && winnerName === null;
  const label = participants.length === 2 ? 'Duel 1v1' : `Provocare ${participants.length} jucatori`;
  const isChallenged = duel.createdBy !== user;
  const challengerName = shortName(duel.createdBy);

  return (
    <div className={`rounded-xl overflow-hidden shadow-sm ${
      finished ? (iWon ? 'bg-green-50 dark:bg-green-950/20 ring-1 ring-green-200 dark:ring-green-800/30'
                       : iLost ? 'bg-red-50 dark:bg-red-950/20 ring-1 ring-red-200 dark:ring-red-800/30'
                       : 'bg-amber-50 dark:bg-amber-950/20 ring-1 ring-amber-200 dark:ring-amber-800/30')
              : 'bg-card ring-1 ring-border'
    }`}>
      <div className="h-1" style={{ background: '#ef4444' }} />
      <div className="px-4 py-3">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">{duelType.icon}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</span>
              <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400">
                {finished ? 'Terminat' : `${remaining} ${remaining === 1 ? 'zi' : 'zile'} ramase`}
              </span>
            </div>
            <div className="text-[10px] text-muted-foreground">
              {duelType.name} — {formatDate(duel.startDate)} → {formatDate(duel.endDate)}
              {isChallenged && <span className="ml-1.5 font-bold text-red-500">⚔️ {challengerName} te-a provocat!</span>}
            </div>
          </div>
          <span className="text-sm font-bold font-mono shrink-0" style={{ color: '#ef4444' }}>+{duelType.xp} XP</span>
        </div>

        {/* Participants ranked */}
        <div className={`mt-1 ${participants.length === 2 ? 'flex items-center gap-3' : 'space-y-1.5'}`}>
          {participants.length === 2 ? (
            /* Classic VS layout for 1v1 */
            <>
              {participants.map((p, i) => {
                const display = scoreDisplay(p);
                const isWinner = finished && p.rank === 1 && winnerName !== null;
                return (
                  <React.Fragment key={p.name}>
                    {i === 1 && <div className="text-sm font-bold text-muted-foreground">VS</div>}
                    <div className={`flex-1 text-center rounded-lg px-2 py-2 ${isWinner ? 'ring-2 ring-green-400 bg-green-50 dark:bg-green-950/20' : 'bg-muted/40'}`}>
                      <div className="flex justify-center"><Avi name={p.name} size="sm" /></div>
                      <div className="text-[10px] font-medium mt-1">{shortName(p.name)}</div>
                      <div className="text-lg font-bold font-mono" style={{ color: typeof display === 'number' ? ssColor(display) : undefined }}>{display}</div>
                    </div>
                  </React.Fragment>
                );
              })}
            </>
          ) : (
            /* Ranked list for 3+ participants */
            participants.map(p => {
              const display = scoreDisplay(p);
              const isWinner = finished && p.rank === 1 && winnerName !== null;
              const isMe = p.name === user;
              return (
                <div key={p.name} className={`flex items-center gap-2 px-2 py-1.5 rounded-lg ${
                  isWinner ? 'ring-2 ring-green-400 bg-green-50 dark:bg-green-950/20' : isMe ? 'bg-muted/60' : 'bg-muted/30'
                }`}>
                  <span className="text-[10px] font-bold font-mono w-4 text-muted-foreground">#{p.rank}</span>
                  <Avi name={p.name} size="sm" />
                  <span className={`text-[10px] flex-1 truncate ${isMe ? 'font-bold' : 'font-medium'}`}>{shortName(p.name)}</span>
                  <div className="w-16 h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{
                      width: `${typeof display === 'number' ? Math.min(100, display) : 0}%`,
                      background: typeof display === 'number' ? ssColor(display) : '#a09585',
                    }} />
                  </div>
                  <span className="text-[11px] font-bold font-mono w-8 text-right" style={{ color: typeof display === 'number' ? ssColor(display) : undefined }}>
                    {display}
                  </span>
                  {isWinner && <span className="text-xs">🏆</span>}
                </div>
              );
            })
          )}
        </div>

        {finished && (
          <div className="mt-2 text-center">
            <span className={`text-xs font-bold ${iWon ? 'text-green-600' : iLost ? 'text-red-500' : 'text-amber-600'}`}>
              {iWon ? `🏆 Ai castigat! +${duelType.xp} XP` : isTie ? '🤝 Egalitate!' : `😤 ${shortName(winnerName!)} a castigat!`}
            </span>
            <button onClick={onDismiss}
              className="ml-3 text-[9px] text-muted-foreground underline hover:text-foreground transition-colors">
              Sterge
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// Create Duel UI
// ══════════════════════════════════════════════════════════════════

function CreateDuelSection({ user, onCreated }: { user: string; onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [selOpponents, setSelOpponents] = useState<string[]>([]);
  const [selType, setSelType] = useState('');
  const others = NAMES.filter(n => n !== user);

  const toggleOpponent = (name: string) => {
    setSelOpponents(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]);
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className="w-full mt-2 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all hover:scale-[1.01] active:scale-[0.99]"
        style={{ background: '#ef444418', color: '#ef4444', border: '1px dashed #ef444440' }}>
        ⚔️ Lanseaza o provocare
      </button>
    );
  }

  const [saving, setSaving] = useState(false);
  const handleCreate = async () => {
    if (!selOpponents.length || !selType || saving) return;
    setSaving(true);
    try {
      await createDuel(user, selType, selOpponents);
      setOpen(false);
      setSelOpponents([]);
      setSelType('');
      onCreated();
    } catch { /* toast? */ }
    setSaving(false);
  };

  const label = selOpponents.length === 0 ? '' : selOpponents.length === 1 ? 'Duel 1v1' : `Provocare ${selOpponents.length + 1} jucatori`;

  return (
    <div className="mt-2 rounded-xl bg-card ring-1 ring-border overflow-hidden">
      <div className="h-1" style={{ background: '#ef4444' }} />
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">⚔️ Provocare noua</span>
          <button onClick={() => setOpen(false)} className="text-[10px] text-muted-foreground hover:text-foreground">✕</button>
        </div>

        {/* Pick opponents — multi select */}
        <div className="text-[9px] font-bold uppercase text-muted-foreground mb-1">
          Alege adversarii <span className="font-normal">(unul sau mai multi)</span>
        </div>
        <div className="flex gap-2 mb-3">
          {others.map(o => {
            const selected = selOpponents.includes(o);
            return (
              <button key={o} onClick={() => toggleOpponent(o)}
                className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-lg transition-all ${
                  selected ? 'ring-2 ring-red-400 bg-red-50 dark:bg-red-950/20' : 'bg-muted/40 hover:bg-muted/60'
                }`}>
                <Avi name={o} size="sm" />
                <span className="text-[9px] font-medium">{shortName(o)}</span>
                {selected && <span className="text-[8px] text-red-500 font-bold">✓</span>}
              </button>
            );
          })}
        </div>

        {label && <div className="text-[9px] text-muted-foreground mb-2 text-center font-medium">{label}</div>}

        {/* Pick challenge type */}
        <div className="text-[9px] font-bold uppercase text-muted-foreground mb-1">Alege provocarea</div>
        <div className="space-y-1 mb-3">
          {DUEL_TYPES.map(dt => (
            <button key={dt.id} onClick={() => setSelType(dt.id)}
              className={`w-full text-left px-3 py-1.5 rounded-lg text-[10px] transition-all flex items-center gap-2 ${
                selType === dt.id ? 'ring-2 ring-red-400 bg-red-50 dark:bg-red-950/20' : 'bg-muted/40 hover:bg-muted/60'
              }`}>
              <span>{dt.icon}</span>
              <span className="font-bold flex-1">{dt.name}</span>
              <span className="text-muted-foreground">{dt.durationDays} zile</span>
              <span className="font-mono font-bold" style={{ color: '#ef4444' }}>+{dt.xp} XP</span>
            </button>
          ))}
        </div>

        <button onClick={handleCreate} disabled={!selOpponents.length || !selType || saving}
          className="w-full py-2 rounded-lg text-xs font-bold text-white transition-all disabled:opacity-30 hover:scale-[1.01] active:scale-[0.99]"
          style={{ background: '#ef4444' }}>
          {saving ? 'Se trimite...' : selOpponents.length > 1 ? 'Lanseaza provocarea!' : 'Lanseaza duelul!'}
        </button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// Mini Challenge Card
// ══════════════════════════════════════════════════════════════════

function MiniChallengeCard({ data, user }: { data: SleepEntry[]; user: string }) {
  const mini = getActiveMiniChallenge();
  if (!mini) return null;

  const { def, startDate, endDate } = mini;
  const status = checkMiniChallenge(def, data, user, startDate, endDate);
  const pct = status.target > 0 ? Math.min(100, (status.progress / status.target) * 100) : 0;
  const remaining = daysLeft(endDate);

  // Build team detail for mini challenges
  const teamDetail = def.type === 'team' ? NAMES.map(n => {
    const entries = data.filter(e => e.name === n && e.date >= startDate && e.date <= endDate);
    const days = new Set(entries.map(e => e.date)).size;
    const avg = entries.length ? Math.round(entries.reduce((s, e) => s + e.ss, 0) / entries.length * 10) / 10 : 0;
    return { name: n, days, avg, count: entries.length };
  }) : null;

  return (
    <div className={`rounded-xl overflow-hidden shadow-sm ${status.completed ? 'bg-green-50 dark:bg-green-950/20 ring-1 ring-green-200 dark:ring-green-800/30' : 'bg-card ring-1 ring-border'}`}>
      <div className="h-1" style={{ background: status.completed ? '#16a34a' : '#8b5cf6' }} />
      <div className="px-4 py-3">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg">{def.icon}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Mini provocare</span>
              <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400">
                {status.completed ? 'Completat' : `${remaining} ${remaining === 1 ? 'zi' : 'zile'} ramase`}
              </span>
            </div>
          </div>
          <span className={`text-sm font-bold font-mono shrink-0 ${status.completed ? 'text-green-600' : ''}`}
                style={{ color: status.completed ? undefined : '#8b5cf6' }}>
            +{def.xp} XP
          </span>
        </div>

        <div className="text-sm font-bold mb-0.5">{def.name}</div>
        <div className="text-[10px] text-muted-foreground mb-2">{def.description} ({formatDate(startDate)} → {formatDate(endDate)})</div>

        <ProgressBar pct={pct} progress={status.progress} target={status.target} completed={status.completed} color="#8b5cf6" />

        {/* Team detail */}
        {teamDetail && (
          <div className="mt-2 pt-2 border-t border-border/50 space-y-1.5">
            {teamDetail.map(m => (
              <div key={m.name} className="flex items-center gap-2">
                <Avi name={m.name} size="sm" />
                <span className="text-[10px] font-medium flex-1 truncate">{shortName(m.name)}</span>
                <span className="text-[10px] font-mono text-muted-foreground">{m.days} {m.days === 1 ? 'zi' : 'zile'}</span>
                {m.count > 0 && <span className="text-[10px] font-bold font-mono" style={{ color: ssColor(m.avg) }}>{m.avg} SS</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// Main ChallengeSection — assembles weekly + mini + duel
// ══════════════════════════════════════════════════════════════════

export function ChallengeSection({ gameState, data, user }: { gameState: GameState; data: SleepEntry[]; user: string }) {
  const [, setRefresh] = useState(0);
  const ch = gameState.challenge;
  const duels = user ? getActiveDuels(user) : [];

  const handleDismiss = (duel: ActiveDuel) => { if (user) { dismissDuel(user, duel); setRefresh(c => c + 1); } };
  const handleCreated = () => setRefresh(c => c + 1);

  // Nothing to show
  if (!ch && !duels.length) return null;

  return (
    <div className="mt-4 lg:grid lg:grid-cols-2 lg:gap-4 lg:items-start space-y-3 lg:space-y-0">
      {/* Left: Weekly challenge */}
      <div>
        {ch && (() => {
          const { def, status } = ch;
          const pct = status.target > 0 ? Math.min(100, (status.progress / status.target) * 100) : 0;
          const detail = getDetailRows(def.id, data, user);

          return (
            <div className={`rounded-xl overflow-hidden shadow-sm ${status.completed ? 'bg-green-50 dark:bg-green-950/20 ring-1 ring-green-200 dark:ring-green-800/30' : 'bg-card ring-1 ring-border'}`}>
              <div className="h-1" style={{ background: status.completed ? '#16a34a' : XP_COLOR }} />
              <div className="px-4 py-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{def.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Provocarea saptamanii</span>
                      <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${
                        def.type === 'team' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400'
                      }`}>
                        {def.type === 'team' ? 'Echipa' : 'Individual'}
                      </span>
                    </div>
                  </div>
                  <span className={`text-sm font-bold font-mono shrink-0 ${status.completed ? 'text-green-600' : ''}`}
                        style={{ color: status.completed ? undefined : XP_COLOR }}>
                    +{def.xp} XP
                  </span>
                </div>
                <div className="text-sm font-bold mb-0.5">{def.name}</div>
                <div className="text-[10px] text-muted-foreground mb-2">{def.description}</div>
                <ProgressBar pct={pct} progress={status.progress} target={status.target} completed={status.completed} color={XP_COLOR} />
                {detail.type !== 'none' && (
                  <div className="mt-2 pt-2 border-t border-border/50">
                    <div className="text-[9px] font-bold uppercase tracking-wide text-muted-foreground mb-0.5">Detalii</div>
                    <DetailView detail={detail} />
                  </div>
                )}
              </div>
            </div>
          );
        })()}
      </div>

      {/* Right: Mini challenge + Duels */}
      <div className="space-y-3">
        <MiniChallengeCard data={data} user={user} />
        {duels.map(duel => (
          <DuelCard key={`${duel.createdBy}_${duel.typeId}_${duel.startDate}`}
                    duel={duel} data={data} user={user}
                    onDismiss={() => handleDismiss(duel)} />
        ))}
        {user && <CreateDuelSection user={user} onCreated={handleCreated} />}
      </div>
    </div>
  );
}
