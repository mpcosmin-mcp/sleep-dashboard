import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  type SleepEntry, type AggEntry, ssColor, rhrColor, hrvColor, ssBg, rhrBg, hrvBg,
  getTier, fmtDate, todayStr, aggregate, personColor, NAMES, generateInsights,
  loggingStreak, calcXP, xpLevel, xpProgress, XP_PER_LEVEL, saveRepair, STREAK_REPAIR_COST,
  XP_COLOR, STREAK_COLOR, levelTitle, levelTier,
} from '@/lib/sleep';
import { V } from '@/lib/hide';
import { Avi } from '@/components/shared/Avi';

type DashView = 'daily' | 'weekly' | 'monthly';

/* ── Expandable section ── */
function Section({ title, icon, badge, children, defaultOpen = false }: {
  title: string; icon: string; badge?: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card className="mb-3 shadow-sm overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/30 transition-colors">
        <div className="flex items-center gap-2">
          <span className="text-base">{icon}</span>
          <span className="font-bold text-sm">{title}</span>
          {badge}
        </div>
        <span className="text-[10px] text-muted-foreground select-none">{open ? '▲' : '▼'}</span>
      </button>
      {open && <div className="px-4 pb-3 border-t">{children}</div>}
    </Card>
  );
}

/* ── Kudos system ── */
const KUDOS_REACTIONS = ['👏', '🔥', '💪', '🚀', '😴', '🏆'];
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
function getTotalKudos(to: string): number {
  let c = 0;
  try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k?.startsWith('st_kudos_') && k.endsWith(`_${to}`)) c++; } } catch {}
  return c;
}

/* ── Helpers ── */
function calcXPBreakdown(data: SleepEntry[], name: string) {
  const entries = data.filter(d => d.name === name);
  const base = entries.length * 10;
  let bonusSS = 0;
  for (const e of entries) { if (e.ss >= 90) bonusSS += 10; else if (e.ss >= 80) bonusSS += 5; }
  const dates = [...new Set(entries.map(e => e.date))].sort();
  let maxC = 0, curC = 1;
  for (let i = 1; i < dates.length; i++) {
    const diff = Math.round((new Date(dates[i] + 'T12:00:00').getTime() - new Date(dates[i-1] + 'T12:00:00').getTime()) / 86400000);
    if (diff === 1) curC++; else { maxC = Math.max(maxC, curC); curC = 1; }
  }
  // Streak bonuses based on CURRENT active streak
  const sr2 = loggingStreak(data, name);
  const streakBonus = sr2.days >= 30 ? 200 : sr2.days >= 7 ? 50 : 0;
  // Good sleep within current streak
  const streakE = [...entries].sort((a, b) => b.date.localeCompare(a.date)).slice(0, sr2.days);
  let gsRun = 0;
  for (const e of streakE) { if (e.ss >= 75) gsRun++; else break; }
  const goodSleepBonus = gsRun >= 30 ? 500 : gsRun >= 7 ? 50 : 0;
  let kudosXP = 0;
  try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k?.startsWith('st_kudos_') && k.endsWith(`_${name}`)) kudosXP += 5; } } catch {}
  let spent = 0;
  try { spent = parseInt(localStorage.getItem(`st_xp_spent_${name}`) || '0'); } catch {}
  return { base, bonusSS, streakBonus, goodSleepBonus, kudosXP, spent, total: Math.max(0, base + bonusSS + streakBonus + goodSleepBonus + kudosXP - spent) };
}

/* ── 7-day simple dots ── */
function get7Days(data: SleepEntry[], name: string) {
  const today = new Date();
  const dayNames = ['Du', 'Lu', 'Ma', 'Mi', 'Jo', 'Vi', 'Sâ'];
  const personDates = new Map(data.filter(d => d.name === name).map(e => [e.date, e]));
  const days: { date: string; logged: boolean; ss: number; label: string }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today); d.setDate(d.getDate() - i);
    const sd = new Date(d); sd.setDate(sd.getDate() - 1);
    const ds = sd.toISOString().split('T')[0];
    const entry = personDates.get(ds);
    days.push({ date: ds, logged: !!entry, ss: entry?.ss || 0, label: dayNames[d.getDay()] });
  }
  return days;
}

/* ── 30-day calendar grid (7 cols, Mon-Sun) ── */
interface CalDay { date: string; day: number; logged: boolean; ss: number; isCurrentMonth: boolean; isToday: boolean; }

// Local date string (no UTC shift)
function localDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getCalendarMonth(data: SleepEntry[], name: string): { weeks: CalDay[][]; monthLabel: string; stats: { logged: number; avg: number; best: number } } {
  // Sheet date 21 = sleep night 21→22 = logged on 22 = show on calendar day 22
  const personEntries = data.filter(d => d.name === name);
  // Build map: calendarDate (sheet+1) → entry
  const calMap = new Map<string, SleepEntry>();
  for (const e of personEntries) {
    const parts = e.date.split('-').map(Number);
    const wake = new Date(parts[0], parts[1] - 1, parts[2] + 1);
    calMap.set(localDateStr(wake), e);
  }

  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const moNames = ['Ianuarie','Februarie','Martie','Aprilie','Mai','Iunie','Iulie','August','Septembrie','Octombrie','Noiembrie','Decembrie'];
  const todayStr2 = localDateStr(today);

  const firstDay = new Date(year, month, 1);
  const startDow = (firstDay.getDay() + 6) % 7; // Mon=0
  const lastDay = new Date(year, month + 1, 0).getDate();

  const weeks: CalDay[][] = [];
  let week: CalDay[] = [];
  let logged = 0, ssSum = 0, best = 0;

  // Leading days
  for (let i = 0; i < startDow; i++) {
    const d = new Date(year, month, 1 - startDow + i);
    const ds = localDateStr(d);
    const entry = calMap.get(ds);
    week.push({ date: ds, day: d.getDate(), logged: !!entry, ss: entry?.ss || 0, isCurrentMonth: false, isToday: false });
  }

  // Month days
  for (let day = 1; day <= lastDay; day++) {
    const d = new Date(year, month, day);
    const ds = localDateStr(d);
    const entry = calMap.get(ds);
    const calDay: CalDay = { date: ds, day, logged: !!entry, ss: entry?.ss || 0, isCurrentMonth: true, isToday: ds === todayStr2 };
    if (entry) { logged++; ssSum += entry.ss; best = Math.max(best, entry.ss); }
    week.push(calDay);
    if (week.length === 7) { weeks.push(week); week = []; }
  }

  // Trailing days
  let trailDay = 1;
  while (week.length > 0 && week.length < 7) {
    const d = new Date(year, month + 1, trailDay);
    const ds = localDateStr(d);
    const entry = calMap.get(ds);
    week.push({ date: ds, day: trailDay, logged: !!entry, ss: entry?.ss || 0, isCurrentMonth: false, isToday: false });
    trailDay++;
  }
  if (week.length) weeks.push(week);

  return { weeks, monthLabel: `${moNames[month]} ${year}`, stats: { logged, avg: logged ? Math.round(ssSum / logged) : 0, best } };
}

/* ── 12-month heatmap overview ── */
interface MonthSummary { month: number; year: number; label: string; entries: number; avgSS: number; bestSS: number; days: { date: string; ss: number }[]; }

function getYearOverview(data: SleepEntry[], name: string): MonthSummary[] {
  const entries = data.filter(d => d.name === name);
  const moNames = ['Ian','Feb','Mar','Apr','Mai','Iun','Iul','Aug','Sep','Oct','Nov','Dec'];
  const months: MonthSummary[] = [];
  const now = new Date();

  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const prefix = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const monthEntries = entries.filter(e => e.date.startsWith(prefix));
    const days = monthEntries.map(e => ({ date: e.date, ss: e.ss }));
    const avgSS = monthEntries.length ? Math.round(monthEntries.reduce((s, e) => s + e.ss, 0) / monthEntries.length) : 0;
    const bestSS = monthEntries.length ? Math.max(...monthEntries.map(e => e.ss)) : 0;
    months.push({
      month: d.getMonth(), year: d.getFullYear(),
      label: `${moNames[d.getMonth()]} ${d.getFullYear() !== now.getFullYear() ? d.getFullYear() : ''}`.trim(),
      entries: monthEntries.length, avgSS, bestSS, days,
    });
  }
  return months;
}

function TrendArrow({ value, inverted }: { value: number; inverted?: boolean }) {
  if (value === 0) return <span className="text-muted-foreground text-[10px]">→</span>;
  const good = inverted ? value < 0 : value > 0;
  return <span className="text-[10px] font-bold" style={{ color: good ? '#16a34a' : '#dc2626' }}>{value > 0 ? '↑' : '↓'}{Math.abs(value)}</span>;
}

function calcTrend(data: SleepEntry[], name: string) {
  const e = data.filter(d => d.name === name).sort((a, b) => a.date.localeCompare(b.date));
  if (e.length < 4) return { ss: 0, rhr: 0, hrv: 0 };
  const h = Math.floor(e.length / 2);
  const avg = (a: SleepEntry[], k: 'ss' | 'rhr') => a.reduce((s, x) => s + x[k], 0) / a.length;
  const avgH = (a: SleepEntry[]) => { const f = a.filter(x => x.hrv != null); return f.length ? f.reduce((s, x) => s + (x.hrv || 0), 0) / f.length : 0; };
  return { ss: Math.round(avg(e.slice(h), 'ss') - avg(e.slice(0, h), 'ss')), rhr: Math.round(avg(e.slice(h), 'rhr') - avg(e.slice(0, h), 'rhr')), hrv: Math.round(avgH(e.slice(h)) - avgH(e.slice(0, h))) };
}

/* ═══════════════════════════════════════════ */
export function DashboardPage({ data, user, jumpDate, jumpUser, clearJump, onBack }: { data: SleepEntry[]; user: string | null; jumpDate?: string | null; jumpUser?: string; clearJump?: () => void; onBack?: () => void }) {
  const [view, setView] = useState<DashView>('daily');
  const [selDate, setSelDate] = useState('');
  const [cheerRefresh, setCheerRefresh] = useState(0);
  const [trackerRange, setTrackerRange] = useState<'7' | '30' | 'all'>('7');

  const [snapshotMode, setSnapshotMode] = useState(false);
  const [snapshotUser, setSnapshotUser] = useState<string | undefined>(undefined);

  // Handle jump from other pages (e.g. Charts)
  if (jumpDate && jumpDate !== selDate) {
    setSelDate(jumpDate);
    setView('daily');
    setTrackerRange('7');
    setSnapshotMode(true);
    setSnapshotUser(jumpUser);
    if (clearJump) clearJump();
    window.scrollTo(0, 0);
  }

  const me = user || '';
  const dates = [...new Set(data.map(d => d.date))].sort();
  const activeDate = selDate || dates[dates.length - 1] || '';

  let filtered: SleepEntry[] = [];
  let subText = '';
  if (view === 'daily') {
    filtered = data.filter(d => d.date === activeDate);
    subText = fmtDate(activeDate);
  } else if (view === 'weekly') {
    const now = new Date(); const dow = now.getDay() || 7;
    const mon = new Date(now); mon.setDate(mon.getDate() - dow + 1);
    filtered = data.filter(d => d.date >= mon.toISOString().split('T')[0]);
    subText = 'Săptămâna curentă';
  } else {
    const prefix = todayStr().substring(0, 7);
    filtered = data.filter(d => d.date.startsWith(prefix));
    const mo = ['Ianuarie','Februarie','Martie','Aprilie','Mai','Iunie','Iulie','August','Septembrie','Octombrie','Noiembrie','Decembrie'];
    subText = mo[parseInt(prefix.split('-')[1]) - 1];
  }

  const sorted: AggEntry[] = view === 'daily' ? [...filtered].sort((a, b) => b.ss - a.ss) : aggregate(filtered);
  const handleCheer = (to: string, emoji: string) => { if (!me) return; saveKudos(me, to, activeDate, emoji); setCheerRefresh(c => c + 1); };

  if (!data.length) return <div className="text-center text-muted-foreground py-20 text-sm">Nicio înregistrare.</div>;

  // Personal data
  const myData = sorted.find(p => p.name === me);
  const xp = calcXP(data, me);
  const level = xpLevel(xp);
  const progress = xpProgress(xp);
  const sr = loggingStreak(data, me);
  const breakdown = calcXPBreakdown(data, me);
  const week7 = get7Days(data, me);
  const calMonth = getCalendarMonth(data, me);
  const yearOverview = getYearOverview(data, me);
  const trend = calcTrend(data, me);
  const insights = generateInsights(data, filtered);
  const tier = myData ? getTier(myData.ss) : getTier(0);
  const c = personColor(me);

  // Leaderboard — based on current view filter (Zi/7zile/Lună)
  const leaderboard = NAMES.map(n => {
    const pAgg = sorted.find(p => p.name === n);
    const pXP = calcXP(data, n);
    const pSr = loggingStreak(data, n);
    return { name: n, xp: pXP, level: xpLevel(pXP), ss: pAgg?.ss ?? 0, streak: pSr.days, entries: pAgg?.entries ?? 0 };
  }).sort((a, b) => b.ss - a.ss);

  const handleRepair = () => {
    if (!sr.needsRepair || !sr.repairDate || STREAK_REPAIR_COST > xp) return;
    saveRepair(me, sr.repairDate);
    setCheerRefresh(c => c + 1);
  };

  return (
    <div>
      {/* ═══ UNIFIED HEADER — name + all stats in one block ═══ */}
      {!snapshotMode && myData ? (
        <Card className="mb-3 shadow-sm" style={{ borderTop: `3px solid ${c}` }}>
          <CardContent className="py-3 px-4">
            {/* Row 1: Name + tier + SS */}
            <div className="flex items-center gap-2.5 mb-2">
              <Avi name={me} size="md" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-bold text-base truncate">{me.split(' ')[0]}</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md inline-flex items-center gap-0.5" style={{ color: levelTier(level).color, background: levelTier(level).color + '15' }}>
                    <span className="text-xs">{levelTier(level).icon}</span> Lv{level}
                  </span>
                  {sr.days > 0 && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md" style={{ color: STREAK_COLOR, background: STREAK_COLOR + '12' }}>⚡{sr.days}d</span>}
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md" style={{ color: XP_COLOR, background: XP_COLOR + '12' }}>{xp} XP</span>
                </div>
                <div className="text-[9px] font-bold" style={{ color: levelTier(level).color }}>{levelTier(level).name} · {levelTitle(level)}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="font-mono text-3xl font-bold" style={{ color: ssColor(myData.ss) }}><V>{myData.ss}</V></div>
                <div className="text-[9px] text-muted-foreground">/100</div>
              </div>
            </div>
            {/* Row 2: Compact metrics */}
            <div className="grid grid-cols-4 gap-1.5">
              <div className="rounded-md p-1.5 text-center" style={{ background: rhrBg(myData.rhr) }}>
                <div className="text-[7px] font-bold uppercase" style={{ color: rhrColor(myData.rhr), opacity: 0.7 }}>RHR</div>
                <div className="font-mono text-xs font-bold" style={{ color: rhrColor(myData.rhr) }}><V>{myData.rhr}</V></div>
                <TrendArrow value={trend.rhr} inverted />
              </div>
              <div className="rounded-md p-1.5 text-center" style={{ background: hrvBg(myData.hrv) }}>
                <div className="text-[7px] font-bold uppercase" style={{ color: hrvColor(myData.hrv), opacity: 0.7 }}>HRV</div>
                <div className="font-mono text-xs font-bold" style={{ color: hrvColor(myData.hrv) }}>{myData.hrv ?? '—'}</div>
                <TrendArrow value={trend.hrv} />
              </div>
              <div className="rounded-md p-1.5 text-center" style={{ background: XP_COLOR + '10' }}>
                <div className="text-[7px] font-bold uppercase" style={{ color: XP_COLOR, opacity: 0.7 }}>Nivel</div>
                <div className="font-mono text-xs font-bold" style={{ color: XP_COLOR }}>{progress}/{XP_PER_LEVEL}</div>
                <div className="h-1 rounded-full bg-muted overflow-hidden mt-0.5">
                  <div className="h-full rounded-full" style={{ width: `${progress}%`, background: XP_COLOR }} />
                </div>
              </div>
              <div className="rounded-md p-1.5 text-center" style={{ background: sr.days > 0 ? STREAK_COLOR + '10' : 'var(--muted)' }}>
                <div className="text-[7px] font-bold uppercase" style={{ color: sr.days > 0 ? STREAK_COLOR : undefined, opacity: 0.7 }}>Streak</div>
                <div className="font-mono text-xs font-bold" style={{ color: sr.days > 0 ? STREAK_COLOR : undefined }}>{sr.days > 0 ? sr.days : '0'}d</div>
                {sr.autoSaved > 0 && <div className="text-[7px] text-green-600">+{sr.autoSaved} saved</div>}
              </div>
            </div>
            {/* Row 3: View tabs + date picker */}
            <div className="flex items-center gap-2 mt-2 pt-2 border-t">
              <Tabs value={view} onValueChange={v => setView(v as DashView)}>
                <TabsList className="h-7">
                  <TabsTrigger value="daily" className="text-[10px] px-2.5 h-6">Zi</TabsTrigger>
                  <TabsTrigger value="weekly" className="text-[10px] px-2.5 h-6">7 zile</TabsTrigger>
                  <TabsTrigger value="monthly" className="text-[10px] px-2.5 h-6">Lună</TabsTrigger>
                </TabsList>
              </Tabs>
              {view === 'daily' && (
                <select value={activeDate} onChange={e => setSelDate(e.target.value)}
                  className="text-[10px] font-semibold bg-transparent border rounded px-1.5 py-1 outline-none">
                  {dates.map(d => <option key={d} value={d}>{fmtDate(d)}</option>)}
                </select>
              )}
              <span className="text-[10px] text-muted-foreground ml-auto">{subText}</span>
            </div>
          </CardContent>
        </Card>
      ) : !snapshotMode ? (
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <Tabs value={view} onValueChange={v => setView(v as DashView)}>
            <TabsList className="h-8">
              <TabsTrigger value="daily" className="text-xs px-3 h-7">Zi</TabsTrigger>
              <TabsTrigger value="weekly" className="text-xs px-3 h-7">7 zile</TabsTrigger>
              <TabsTrigger value="monthly" className="text-xs px-3 h-7">Lună</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      ) : null}

      {/* ═══ DAY SNAPSHOT — full-screen when coming from Charts ═══ */}
      {snapshotMode && view === 'daily' && (
        <div>
          {/* Back button */}
          <button onClick={() => { setSnapshotMode(false); if (onBack) onBack(); }}
            className="flex items-center gap-1.5 mb-3 text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors">
            <span>←</span> Înapoi la Evoluție
          </button>

          <Card className="shadow-sm border-primary/20">
            <CardContent className="py-4 px-4">
              <div className="text-center mb-3">
                <div className="text-lg font-bold">📊 {fmtDate(activeDate)}</div>
                <div className="text-[10px] text-muted-foreground">
                  {snapshotUser ? `${snapshotUser.split(' ')[0]}` : 'Toată echipa'}
                </div>
              </div>
              <div className="space-y-2.5">
                {filtered
                  .filter(e => !snapshotUser || e.name === snapshotUser)
                  .sort((a, b) => b.ss - a.ss)
                  .map((entry, i) => {
                    const pc = personColor(entry.name);
                    const entryTier = getTier(entry.ss);
                    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉';
                    return (
                      <div key={entry.name} className="flex items-center gap-2.5 p-2.5 rounded-lg" style={{ background: pc + '08', borderLeft: `3px solid ${pc}` }}>
                        <span className="text-sm w-5 text-center">{medal}</span>
                        <Avi name={entry.name} size="sm" />
                        <div className="flex-1 min-w-0">
                          <div className="text-[12px] font-bold" style={{ color: pc }}>{entry.name}</div>
                          <div className="text-[9px]" style={{ color: entryTier.color }}>{entryTier.label}</div>
                        </div>
                        <div className="flex gap-3 shrink-0">
                          <div className="text-center">
                            <div className="text-[7px] text-muted-foreground">SS</div>
                            <div className="font-mono text-lg font-bold" style={{ color: ssColor(entry.ss) }}>{entry.ss}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-[7px] text-muted-foreground">RHR</div>
                            <div className="font-mono text-sm font-bold" style={{ color: rhrColor(entry.rhr) }}>{entry.rhr}</div>
                          </div>
                          {entry.hrv != null && (
                            <div className="text-center">
                              <div className="text-[7px] text-muted-foreground">HRV</div>
                              <div className="font-mono text-sm font-bold" style={{ color: hrvColor(entry.hrv) }}>{entry.hrv}</div>
                            </div>
                          )}
                        </div>
                        {/* Like in snapshot */}
                        {entry.name !== me && (() => {
                          const myLike = me ? getKudos(me, entry.name, activeDate) : null;
                          const likes = getKudosFor(entry.name, activeDate);
                          return (
                            <button onClick={() => {
                              if (myLike) { try { localStorage.removeItem(`st_kudos_${activeDate}_${me}_${entry.name}`); } catch {} }
                              else { handleCheer(entry.name, '👍'); }
                              setCheerRefresh(c => c + 1);
                            }} className="shrink-0 flex items-center gap-0.5 hover:scale-110 transition-all">
                              <span className={`text-base ${myLike ? '' : 'grayscale opacity-25'}`}>👍</span>
                              {likes.length > 0 && <span className={`text-[10px] font-bold ${myLike ? '' : 'text-muted-foreground'}`} style={myLike ? { color: '#2563eb' } : undefined}>{likes.length}</span>}
                            </button>
                          );
                        })()}
                      </div>
                    );
                  })}
                {filtered.filter(e => !snapshotUser || e.name === snapshotUser).length === 0 && (
                  <div className="text-xs text-muted-foreground text-center py-4">Nicio înregistrare în această zi{snapshotUser ? ` pentru ${snapshotUser.split(' ')[0]}` : ''}</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ═══ Normal dashboard sections — hidden in snapshot mode ═══ */}
      {!snapshotMode && <>

      {/* ═══ TRACKER (7d / 30d calendar / 12mo heatmap) ═══ */}
      <Section title={trackerRange === '7' ? 'Ultimele 7 zile' : trackerRange === '30' ? calMonth.monthLabel : 'Ultimele 12 luni'} icon="📅" defaultOpen={!snapshotMode}
              badge={
                <div className="flex gap-0.5">
                  {(['7', '30', 'all'] as const).map(r => (
                    <button key={r} onClick={e => { e.stopPropagation(); setTrackerRange(r); }}
                      className={`text-[9px] px-1.5 py-0.5 rounded-full transition-colors ${trackerRange === r ? 'bg-primary text-primary-foreground font-bold' : 'text-muted-foreground hover:bg-muted'}`}>
                      {r === '7' ? '7z' : r === '30' ? 'Lună' : 'An'}
                    </button>
                  ))}
                </div>
              }>

        {/* ── 7 DAY: simple dots ── */}
        {trackerRange === '7' && (
          <div className="pt-2">
            <div className="flex items-center justify-between gap-1">
              {week7.map((day, i) => {
                const isToday = i === 6;
                const dotColor = day.logged ? ssColor(day.ss) : isToday ? '#94a3b8' : '#e2e8f0';
                return (
                  <div key={i} className={`flex flex-col items-center gap-1 ${day.logged ? 'cursor-pointer' : ''}`}
                   title={day.logged ? `${fmtDate(day.date)} — SS ${day.ss} (click)` : `${fmtDate(day.date)} — nelogat`}
                   onClick={() => { if (day.logged) { setView('daily'); setSelDate(day.date); } }}>
                    <div className="text-[9px] text-muted-foreground font-medium">{day.label}</div>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isToday && !day.logged ? 'animate-pulse' : ''}`}
                         style={{ background: dotColor + (day.logged ? '20' : ''), border: isToday ? `2px solid ${c}` : '2px solid transparent' }}>
                      {day.logged ? (
                        <span className="text-[9px] font-bold" style={{ color: dotColor }}>{day.ss}</span>
                      ) : (
                        <span className="text-[10px]" style={{ color: '#cbd5e1' }}>·</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {(() => {
              const logged = week7.filter(d => d.logged);
              if (!logged.length) return null;
              const avg = Math.round(logged.reduce((s, d) => s + d.ss, 0) / logged.length);
              return (
                <div className="flex items-center gap-3 mt-2 pt-2 border-t text-[10px] text-muted-foreground">
                  <span>{logged.length}/7 zile</span>
                  <span>Media: <strong style={{ color: ssColor(avg) }}>{avg}</strong></span>
                  <span>Best: <strong style={{ color: ssColor(Math.max(...logged.map(d => d.ss))) }}>{Math.max(...logged.map(d => d.ss))}</strong></span>
                </div>
              );
            })()}
          </div>
        )}

        {/* ── 30 DAY: Calendar grid ── */}
        {trackerRange === '30' && (
          <div className="pt-2">
            {/* Header row */}
            <div className="grid grid-cols-7 gap-0.5 mb-1">
              {['Lu', 'Ma', 'Mi', 'Jo', 'Vi', 'Sâ', 'Du'].map(d => (
                <div key={d} className="text-[9px] font-bold text-muted-foreground text-center">{d}</div>
              ))}
            </div>
            {/* Calendar weeks — compact cells */}
            {calMonth.weeks.map((week, wi) => (
              <div key={wi} className="grid grid-cols-7 gap-px mb-px">
                {week.map((day, di) => {
                  const dotColor = day.logged ? ssColor(day.ss) : '#f1f5f9';
                  return (
                    <div key={di}
                      className={`h-9 rounded flex flex-col items-center justify-center ${day.isToday ? 'ring-1.5' : ''} ${!day.isCurrentMonth ? 'opacity-25' : ''} ${day.isCurrentMonth ? 'cursor-pointer hover:scale-105 transition-transform' : ''}`}
                      style={{
                        background: day.logged ? dotColor + '18' : undefined,
                        ringColor: day.isToday ? c : undefined,
                      }}
                      onClick={() => {
                        if (day.isCurrentMonth) {
                          // Calendar date = sheet date + 1, so sheet date = calendar - 1
                          const parts = day.date.split('-').map(Number);
                          const sheet = new Date(parts[0], parts[1] - 1, parts[2] - 1);
                          const sheetStr = localDateStr(sheet);
                          setView('daily'); setSelDate(sheetStr); setTrackerRange('7');
                          window.scrollTo(0, 0);
                        }
                      }}
                      title={day.logged ? `${day.day} — SS ${day.ss} (click pt detalii)` : `${day.day}`}>
                      <span className="text-[7px] text-muted-foreground leading-none">{day.day}</span>
                      {day.logged ? (
                        <span className="text-[9px] font-bold leading-none" style={{ color: dotColor }}>{day.ss}</span>
                      ) : (
                        <span className="text-[7px] text-muted-foreground/20">·</span>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
            {/* Stats */}
            {calMonth.stats.logged > 0 && (
              <div className="flex items-center gap-3 mt-1.5 pt-1.5 border-t text-[10px] text-muted-foreground">
                <span>{calMonth.stats.logged} zile logate</span>
                <span>Media: <strong style={{ color: ssColor(calMonth.stats.avg) }}>{calMonth.stats.avg}</strong></span>
                <span>Best: <strong style={{ color: ssColor(calMonth.stats.best) }}>{calMonth.stats.best}</strong></span>
              </div>
            )}
          </div>
        )}

        {/* ── ALL TIME: 12-month heatmap ── */}
        {trackerRange === 'all' && (
          <div className="pt-2 grid grid-cols-4 sm:grid-cols-6 gap-1.5">
            {yearOverview.map((mo, i) => {
              const color = mo.entries > 0 ? ssColor(mo.avgSS) : '#e2e8f0';
              return (
                <div key={i} className="rounded-md p-1.5 text-center cursor-default"
                     style={{ background: mo.entries > 0 ? color + '12' : '#f8fafc', border: `1px solid ${mo.entries > 0 ? color + '20' : '#f1f5f9'}` }}
                     title={mo.entries > 0 ? `${mo.label}: ${mo.entries} zile, media ${mo.avgSS}, best ${mo.bestSS}` : `${mo.label}: fără date`}>
                  <div className="text-[8px] font-bold text-muted-foreground">{mo.label}</div>
                  {mo.entries > 0 ? (
                    <>
                      <div className="font-mono text-sm font-bold leading-tight" style={{ color }}>{mo.avgSS}</div>
                      <div className="text-[7px] text-muted-foreground">{mo.entries}z</div>
                    </>
                  ) : (
                    <div className="text-[8px] text-muted-foreground/30 py-0.5">—</div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Section>

      {/* ═══ LEADERBOARD ═══ */}
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

      {/* Streak repair alert — only when needed */}
      {sr.needsRepair && (
        <div className="flex items-center gap-2 px-3 py-2 mb-3 rounded-lg bg-amber-50 border border-amber-200">
          <span className="text-[10px] text-amber-700">⚠️ Somnul e sub 75 — streak în pericol</span>
          <button onClick={handleRepair} disabled={STREAK_REPAIR_COST > xp}
            className="text-[9px] font-bold px-2 py-0.5 rounded transition-all disabled:opacity-40 ml-auto"
            style={{ background: XP_COLOR, color: 'white' }}>
            Salvează ({STREAK_REPAIR_COST} XP)
          </button>
        </div>
      )}

      {/* ═══ XP & LEVEL (expandable) ═══ */}
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

      {/* ═══ BONUSURI (expandable) ═══ */}
      <Section title="Bonusuri" icon="💎">
        <div className="pt-2 space-y-2">
          {(() => {
            // Bonuses based on CURRENT active streak only
            const curStreak = sr.days;
            // Good sleep run within current streak
            const myStreakEntries = data.filter(d => d.name === me).sort((a, b) => b.date.localeCompare(a.date)).slice(0, curStreak);
            let gsRun2 = 0;
            for (const e of myStreakEntries) { if (e.ss >= 75) gsRun2++; else break; }

            const bonuses = [
              { icon: '⚡', name: '7 zile logate la rând', reward: 50, achieved: curStreak >= 7, progress: Math.min(curStreak, 7), target: 7 },
              { icon: '⚡', name: '30 zile logate la rând', reward: 200, achieved: curStreak >= 30, progress: Math.min(curStreak, 30), target: 30 },
              { icon: '💎', name: '7 zile somn bun (somn peste 75)', reward: 50, achieved: gsRun2 >= 7, progress: Math.min(gsRun2, 7), target: 7 },
              { icon: '💎', name: '30 zile somn bun (somn peste 75)', reward: 500, achieved: gsRun2 >= 30, progress: Math.min(gsRun2, 30), target: 30 },
            ];

            return bonuses.map((b, i) => (
              <div key={i} className={`flex items-center gap-2.5 p-2 rounded-lg ${b.achieved ? 'bg-green-50' : 'bg-muted/30'}`}>
                <span className="text-base">{b.achieved ? '✅' : b.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-medium">{b.name}</div>
                  {!b.achieved && (
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${(b.progress / b.target) * 100}%`, background: XP_COLOR }} />
                      </div>
                      <span className="text-[9px] text-muted-foreground shrink-0">{b.progress}/{b.target}</span>
                    </div>
                  )}
                </div>
                <span className={`text-[10px] font-bold shrink-0 ${b.achieved ? 'text-green-600' : ''}`} style={{ color: b.achieved ? undefined : XP_COLOR }}>
                  {b.achieved ? '✓' : ''} +{b.reward} XP
                </span>
              </div>
            ));
          })()}
        </div>
      </Section>

      {/* Old leaderboard + echipa sections moved up */}
      </>}
    </div>
  );
}
