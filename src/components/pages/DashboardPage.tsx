import { useState, useEffect } from 'react';
import { type SleepEntry, fmtDate, todayStr, aggregate, saveRepair, STREAK_REPAIR_COST, XP_COLOR } from '@/lib/sleep';
import { useGameState } from '@/hooks/useGameState';
import { getWeekNumber } from '@/lib/challenges';
import { HeroCard, type DashView } from '@/components/dashboard/HeroCard';
import { SnapshotView } from '@/components/dashboard/SnapshotView';
import { Tracker } from '@/components/dashboard/Tracker';
import { Leaderboard } from '@/components/dashboard/Leaderboard';
import { XPBreakdown } from '@/components/dashboard/XPBreakdown';
import { ChallengeSection } from '@/components/dashboard/ChallengeSection';
import { HighlightReel } from '@/components/dashboard/HighlightReel';

export function DashboardPage({ data, user, jumpDate, jumpUser, clearJump, onBack, showToast }: {
  data: SleepEntry[]; user: string | null; jumpDate?: string | null; jumpUser?: string; clearJump?: () => void; onBack?: () => void;
  showToast: (msg: string, opts?: { confetti?: boolean; duration?: number }) => void;
}) {
  const [view, setView] = useState<DashView>('daily');
  const [selDate, setSelDate] = useState('');
  const [, setCheerRefresh] = useState(0);
  const [trackerRange, setTrackerRange] = useState<'7' | '30' | 'all'>('7');
  const [snapshotMode, setSnapshotMode] = useState(false);
  const [snapshotUser, setSnapshotUser] = useState<string | undefined>(undefined);

  // Handle jump from other pages (e.g. Charts) — useEffect to avoid setState during render
  useEffect(() => {
    if (jumpDate && jumpDate !== selDate) {
      setSelDate(jumpDate);
      setView('daily');
      setTrackerRange('7');
      setSnapshotMode(true);
      setSnapshotUser(jumpUser);
      if (clearJump) clearJump();
      window.scrollTo(0, 0);
    }
  }, [jumpDate, jumpUser, clearJump]);

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

  const sorted = view === 'daily' ? [...filtered].sort((a, b) => b.ss - a.ss) : aggregate(filtered);
  const gameState = useGameState(data, me);
  const myData = sorted.find(p => p.name === me);

  // Challenge completion celebration — once per week
  useEffect(() => {
    if (!gameState.challenge?.status.completed || !me) return;
    const weekKey = `st_challenge_celebrated_${me}_${getWeekNumber()}`;
    try {
      if (localStorage.getItem(weekKey)) return;
      localStorage.setItem(weekKey, '1');
      showToast(`\uD83C\uDFC6 ${gameState.challenge.def.name} — completat! +${gameState.challenge.def.xp} XP`, { confetti: true, duration: 4500 });
    } catch {}
  }, [gameState.challenge?.status.completed, me, showToast]);

  if (!data.length) return <div className="text-center text-muted-foreground py-20 text-sm">Nicio înregistrare.</div>;

  // Snapshot mode
  if (snapshotMode && view === 'daily') {
    return <SnapshotView data={data} filtered={filtered} activeDate={activeDate} user={me} snapshotUser={snapshotUser} onClose={() => setSnapshotMode(false)} onBack={onBack} />;
  }

  const handleRepair = () => {
    if (!gameState.streak.needsRepair || !gameState.streak.repairDate || STREAK_REPAIR_COST > gameState.xp) return;
    saveRepair(me, gameState.streak.repairDate);
    setCheerRefresh(c => c + 1);
  };

  const handleDateSelect = (date: string) => { setView('daily'); setSelDate(date); setTrackerRange('7'); };

  return (
    <div>
      <HeroCard user={me} data={data} gameState={gameState} myData={myData} view={view} onViewChange={setView}
                activeDate={activeDate} dates={dates} onDateChange={setSelDate} subText={subText} />

      <Tracker data={data} user={me} trackerRange={trackerRange} onTrackerRangeChange={setTrackerRange}
               onDateSelect={handleDateSelect} snapshotMode={snapshotMode} />

      <HighlightReel data={data} />
      <Leaderboard data={data} filtered={filtered} sorted={sorted} user={me} view={view} activeDate={activeDate} subText={subText} />

      {/* Streak repair alert — only when needed */}
      {gameState.streak.needsRepair && (
        <div className="flex items-center gap-2 px-3 py-2 mb-3 rounded-lg bg-amber-50 border border-amber-200">
          <span className="text-[10px] text-amber-700">⚠️ Somnul e sub 75 — streak în pericol</span>
          <button onClick={handleRepair} disabled={STREAK_REPAIR_COST > gameState.xp}
            className="text-[9px] font-bold px-2 py-0.5 rounded transition-all disabled:opacity-40 ml-auto"
            style={{ background: XP_COLOR, color: 'white' }}>
            Salvează ({STREAK_REPAIR_COST} XP)
          </button>
        </div>
      )}

      <XPBreakdown gameState={gameState} />
      <ChallengeSection gameState={gameState} data={data} user={me} />
    </div>
  );
}
