import { useState, useEffect } from 'react';
import { type SleepEntry, saveRepair, STREAK_REPAIR_COST, XP_COLOR } from '@/lib/sleep';
import { useGameState } from '@/hooks/useGameState';
import { getWeekNumber } from '@/lib/challenges';
import { HeroCard, type DashView } from '@/components/dashboard/HeroCard';
import { SnapshotView } from '@/components/dashboard/SnapshotView';
import { Tracker } from '@/components/dashboard/Tracker';
import { TodayLeaderboard, PeriodLeaderboard } from '@/components/dashboard/Leaderboard';
import { ChallengeSection } from '@/components/dashboard/ChallengeSection';
import { BonusPopup } from '@/components/dashboard/BonusSection';
import { HighlightReel } from '@/components/dashboard/HighlightReel';

export function DashboardPage({ data, user, jumpDate, jumpUser, clearJump, onBack, showToast }: {
  data: SleepEntry[]; user: string | null; jumpDate?: string | null; jumpUser?: string; clearJump?: () => void; onBack?: () => void;
  showToast: (msg: string, opts?: { confetti?: boolean; duration?: number }) => void;
}) {
  const [selDate, setSelDate] = useState('');
  const [, setCheerRefresh] = useState(0);
  const [trackerRange, setTrackerRange] = useState<'7' | '30' | 'all'>('7');
  const [snapshotMode, setSnapshotMode] = useState(false);
  const [snapshotUser, setSnapshotUser] = useState<string | undefined>(undefined);

  // Handle jump from other pages (e.g. Charts)
  useEffect(() => {
    if (jumpDate && jumpDate !== selDate) {
      setSelDate(jumpDate);
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

  // HeroCard still needs daily data for the SS score display
  const filtered = data.filter(d => d.date === activeDate);
  const sorted = [...filtered].sort((a, b) => b.ss - a.ss);

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
  if (snapshotMode) {
    return <SnapshotView data={data} filtered={filtered} activeDate={activeDate} user={me} snapshotUser={snapshotUser} onClose={() => setSnapshotMode(false)} onBack={onBack} />;
  }

  const handleRepair = () => {
    if (!gameState.streak.needsRepair || !gameState.streak.repairDate || STREAK_REPAIR_COST > gameState.xp) return;
    saveRepair(me, gameState.streak.repairDate);
    setCheerRefresh(c => c + 1);
  };

  const handleDateSelect = (date: string) => { setSelDate(date); setTrackerRange('7'); };

  // Dummy view/onViewChange — HeroCard still expects them but tabs moved to Leaderboard
  const dummyView: DashView = 'daily';
  const noop = () => {};

  return (
    <div>
      <HeroCard user={me} data={data} gameState={gameState} myData={myData} view={dummyView} onViewChange={noop}
                activeDate={activeDate} dates={dates} onDateChange={setSelDate} subText="" />

      <Tracker data={data} user={me} trackerRange={trackerRange} onTrackerRangeChange={setTrackerRange}
               onDateSelect={handleDateSelect} snapshotMode={snapshotMode} />

      {/* Desktop: side-by-side leaderboards. Mobile: stacked */}
      <div className="lg:grid lg:grid-cols-2 lg:gap-3">
        <TodayLeaderboard data={data} user={me} />
        <PeriodLeaderboard data={data} user={me} />
      </div>

      <HighlightReel data={data} />

      {/* Streak repair alert */}
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

      {/* Weekly challenge — detailed breakdown at bottom */}
      <ChallengeSection gameState={gameState} data={data} user={me} />

      {/* Bonusuri popup button */}
      <BonusPopup gameState={gameState} data={data} user={me} />
    </div>
  );
}
