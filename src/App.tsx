import { useState, useEffect, useCallback } from 'react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { type SleepEntry, fetchAllData } from '@/lib/sleep';
import { HideCtx } from '@/lib/hide';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import { Toast } from '@/components/shared/Toast';
import { InputPage } from '@/components/pages/InputPage';
import { DashboardPage } from '@/components/pages/DashboardPage';
import { ChartsPage } from '@/components/pages/ChartsPage';
import { HistoryPage } from '@/components/pages/HistoryPage';
import { HabitPage } from '@/components/pages/HabitPage';
import { ProgressHub } from '@/components/shared/ProgressHub';

// ── Types ──
type Page = 'input' | 'dashboard' | 'charts' | 'history' | 'habits';

const NAV: { id: Page; label: string }[] = [
  { id: 'input', label: 'Log Data' },
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'charts', label: 'Evoluție' },
  { id: 'history', label: 'Arhivă' },
  { id: 'habits', label: '1% Better' },
];

const NAV_ICONS: Record<string, string> = {
  input: '✏️', dashboard: '📊', charts: '📈', history: '📋', habits: '🔥',
};

// ════════════════════════════════════════════
// APP
// ════════════════════════════════════════════
export default function App() {
  const [page, setPage] = useState<Page>('input');
  const [data, setData] = useState<SleepEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [jumpDate, setJumpDate] = useState<string | null>(null);
  const [jumpUser, setJumpUser] = useState<string | undefined>(undefined);

  // Navigate from any page to Dashboard daily view for a specific date
  const navigateToDashDate = useCallback((date: string, userFilter?: string) => {
    setJumpDate(date);
    setJumpUser(userFilter);
    setPage('dashboard');
  }, []);
  const [toast, setToast] = useState({ msg: '', show: false });
  const [dark, setDark] = useState(() => {
    try { return localStorage.getItem('st_dark') === '1'; } catch { return false; }
  });
  const [hidden, setHidden] = useState(false);
  const [user, setUser] = useState<string | null>(() => {
    try { return localStorage.getItem('st_user'); } catch { return null; }
  });

  // Dark mode
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    try { localStorage.setItem('st_dark', dark ? '1' : '0'); } catch {}
  }, [dark]);

  // Toast
  const showToast = useCallback((msg: string) => {
    setToast({ msg, show: true });
    setTimeout(() => setToast(t => ({ ...t, show: false })), 2500);
  }, []);

  // Load data
  const load = useCallback(async () => {
    try { const d = await fetchAllData(); setData(d); }
    catch { showToast('Eroare la încărcare'); }
    setLoading(false);
  }, [showToast]);

  useEffect(() => { load(); }, [load]);

  // User selection
  const pickUser = (n: string) => {
    try { localStorage.setItem('st_user', n); } catch {}
    setUser(n);
  };
  const logout = () => {
    try { localStorage.removeItem('st_user'); } catch {}
    setUser(null);
  };

  const brandGrad = dark
    ? 'linear-gradient(135deg, hsl(30 55% 50%), hsl(32 45% 60%))'
    : 'linear-gradient(135deg, hsl(28 55% 40%), hsl(32 45% 52%))';

  return (
    <ErrorBoundary>
    <HideCtx.Provider value={hidden}>
    <TooltipProvider>
      <div className="flex flex-col lg:flex-row min-h-screen">

        {/* ── Desktop Sidebar ── */}
        <aside className="hidden lg:flex w-56 shrink-0 border-r bg-card/60 flex-col p-4 gap-5 sticky top-0 h-screen">
          <button onClick={() => { logout(); setPage('input'); }} className="flex items-center gap-2.5 px-1 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm shadow-sm"
                 style={{ background: brandGrad, color: '#fff' }}>🦉</div>
            <div className="font-bold text-sm tracking-tight">Sleep Tracker</div>
          </button>
          <nav className="flex flex-col gap-0.5">
            {NAV.map(n => (
              <button key={n.id} onClick={() => setPage(n.id)}
                className={`text-left px-3 py-2 rounded-md text-[13px] font-semibold transition-all duration-150
                  ${page === n.id ? 'bg-primary/10 text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-accent'}`}>
                {n.label}
              </button>
            ))}
          </nav>
          <div className="mt-auto pt-3 border-t flex flex-col gap-2">
            <button onClick={() => setHidden(!hidden)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-accent transition-all">
              <span className="text-sm">{hidden ? '👁️' : '🙈'}</span>
              {hidden ? 'Arată date' : 'Ascunde date'}
            </button>
            <button onClick={() => setDark(!dark)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-accent transition-all">
              <span className="text-sm">{dark ? '☀️' : '🌙'}</span>
              {dark ? 'Light mode' : 'Dark mode'}
            </button>
            <div className="text-[10px] text-muted-foreground/60 leading-relaxed">
              Date sincronizate cu Google Sheets.
            </div>
          </div>
        </aside>

        {/* ── Mobile Header ── */}
        <header className="lg:hidden sticky top-0 z-30 bg-background/90 backdrop-blur-md border-b px-4 py-2.5">
          <div className="flex items-center justify-between">
            <button onClick={() => { logout(); setPage('input'); }} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs shadow-sm"
                   style={{ background: brandGrad, color: '#fff' }}>🦉</div>
              <span className="font-bold text-sm tracking-tight">Sleep Tracker</span>
            </button>
            <div className="flex items-center gap-0.5">
              <button onClick={() => setHidden(!hidden)} aria-label={hidden ? 'Arată date' : 'Ascunde date'}
                className="p-2 rounded-md hover:bg-accent focus-visible:ring-2 ring-primary/30 transition-colors text-sm">
                {hidden ? '👁️' : '🙈'}
              </button>
              <button onClick={() => setDark(!dark)} aria-label={dark ? 'Light mode' : 'Dark mode'}
                className="p-2 rounded-md hover:bg-accent focus-visible:ring-2 ring-primary/30 transition-colors text-sm">
                {dark ? '☀️' : '🌙'}
              </button>
            </div>
          </div>
        </header>

        {/* ── Main Content ── */}
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto pb-24 lg:pb-8 min-h-0">
          {loading ? (
            <div className="flex items-center justify-center h-64 text-muted-foreground text-sm gap-2">
              <div className="w-4 h-4 border-2 border-border border-t-primary rounded-full animate-spin" />
              Se încarcă...
            </div>
          ) : (
            <>
              {user && !loading && <div className="relative"><ProgressHub user={user} data={data} /></div>}
              {page === 'input' && <InputPage data={data} setData={setData} user={user} pickUser={pickUser} logout={logout} showToast={showToast} />}
              {page === 'dashboard' && <DashboardPage data={data} user={user} jumpDate={jumpDate} jumpUser={jumpUser} clearJump={() => { setJumpDate(null); setJumpUser(undefined); }} onBack={() => setPage('charts')} />}
              {page === 'charts' && <ChartsPage data={data} dark={dark} onDateClick={navigateToDashDate} />}
              {page === 'history' && <HistoryPage data={data} />}
              {page === 'habits' && <HabitPage user={user} pickUser={pickUser} logout={logout} />}
            </>
          )}
        </main>

        {/* ── Mobile Bottom Tab Bar ── */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-background/90 backdrop-blur-md border-t">
          <div className="flex justify-around items-center px-2"
               style={{ paddingBottom: 'env(safe-area-inset-bottom, 8px)' }}>
            {NAV.map(n => (
              <button key={n.id} onClick={() => setPage(n.id)}
                className={`flex flex-col items-center gap-0.5 py-2.5 px-4 rounded-xl transition-all
                  ${page === n.id ? 'text-primary' : 'text-muted-foreground'}`}>
                <span className="text-lg leading-none">{NAV_ICONS[n.id]}</span>
                <span className="text-[10px] font-bold">{n.label}</span>
              </button>
            ))}
          </div>
        </nav>

        <Toast msg={toast.msg} show={toast.show} />
      </div>
    </TooltipProvider>
    </HideCtx.Provider>
    </ErrorBoundary>
  );
}
