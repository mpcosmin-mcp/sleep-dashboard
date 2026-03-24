# Architecture Research

**Domain:** Social gamified sleep tracker (React SPA, Google Sheets backend)
**Researched:** 2026-03-23
**Confidence:** HIGH (based on direct codebase analysis + established React patterns)

## Current Architecture (As-Is)

```
+---------------------------------------------------------------+
|                         App.tsx (Shell)                         |
|  State: page, data[], user, dark, hidden, toast, jump*         |
|  Data fetch: JSONP -> Google Sheets Apps Script                |
+---------------------------------------------------------------+
       |           |            |           |           |
  InputPage   DashboardPage  ChartsPage  HistoryPage  HabitPage
               (750 lines)
               - Hero card
               - Tracker (7d/30d/12mo)
               - Leaderboard
               - XP breakdown
               - Bonuses
               - Kudos system
               - Snapshot mode
               - Trend calc
               - Calendar grid
               - Year overview
+---------------------------------------------------------------+
|                     lib/sleep.ts (360 lines)                   |
|  Data types, fetch, XP calc, streak calc, colors, tiers,      |
|  aggregate, insights, JSONP transport                          |
+---------------------------------------------------------------+
|  lib/ai.ts    |  lib/habits.ts    |  lib/hide.tsx              |
|  Claude proxy |  localStorage     |  Privacy masking           |
+---------------------------------------------------------------+
|                   localStorage (kudos, repairs, habits)        |
+---------------------------------------------------------------+
```

### Key Problems in Current Architecture

1. **DashboardPage is a god component (750 lines)** -- renders hero card, tracker, leaderboard, XP breakdown, bonuses, kudos, and snapshot mode all in one file. Contains 200+ lines of helper functions (calendar grid, year overview, XP breakdown) mixed with UI.

2. **XP/streak logic is duplicated** -- `calcXP` in `sleep.ts` and `calcXPBreakdown` in `DashboardPage.tsx` compute the same thing with slightly different structures. A change to XP rules requires edits in two places.

3. **No computation caching** -- `calcXP`, `loggingStreak`, `aggregate` are called per-render for every user on every interaction. With 3 users this is fine. With badges and goals added, the computation tree grows.

4. **setState during render** -- the jump logic in DashboardPage (lines 216-224) calls `setSelDate`, `setView`, etc. inside the render body, which is a React anti-pattern that causes extra re-renders.

5. **Kudos logic lives in DashboardPage** -- `getKudos`, `saveKudos`, `getKudosFor`, `getTotalKudos` are defined as plain functions at the top of DashboardPage, not in a shared module. They scan `localStorage.length` on every call.

6. **API key in client bundle** -- `VITE_ANTHROPIC_KEY` is an env var that gets bundled into the client JS. The Cloudflare Worker proxy mitigates this somewhat, but the key is still exposed in source.

7. **No error boundaries** -- any component crash takes down the entire app.

## Recommended Architecture (To-Be)

```
+---------------------------------------------------------------+
|                      App.tsx (Shell)                            |
|  Owns: page routing, global state providers, error boundary    |
+---------------------------------------------------------------+
|                      Providers Layer                            |
|  +-------------+  +-----------+  +----------+  +----------+   |
|  | DataProvider |  | UserCtx   |  | ThemeCtx  |  | HideCtx  |  |
|  | (fetch,cache)|  | (picker,  |  | (dark/   |  | (privacy)|  |
|  |             |  |  logout)  |  |  light)  |  |          |   |
|  +-------------+  +-----------+  +----------+  +----------+   |
+---------------------------------------------------------------+
|                      Pages Layer                                |
|  +--------+ +----------+ +-------+ +--------+ +--------+      |
|  | Input  | | Dashboard| | Charts| | History| | Habits |      |
|  +--------+ +----------+ +-------+ +--------+ +--------+      |
|                  |                                              |
|      +-----------+-----------+----------+                      |
|      |           |           |          |                      |
|   HeroCard   Tracker   Leaderboard   Sections                 |
|              (7d/30d/   (cards +     (XP, Bonuses,            |
|               12mo)      kudos)       Goals, Badges)           |
+---------------------------------------------------------------+
|                    Domain Logic Layer                           |
|  +----------+ +--------+ +--------+ +-------+ +--------+      |
|  | gamify.ts| | goals.ts| |badges.ts| |kudos.ts| | ai.ts |    |
|  | XP,streak| | targets | |unlocks | |social | | weekly |     |
|  | tiers    | | progress| |criteria| |cheers | | report |     |
|  +----------+ +--------+ +--------+ +-------+ +--------+      |
|  +-----------------------------------------------------------+ |
|  |                    sleep.ts (data only)                    | |
|  |  Types, fetch, colors, formatting -- NO game logic        | |
|  +-----------------------------------------------------------+ |
+---------------------------------------------------------------+
|                    Storage Layer                                |
|  +------------------+  +------------------+                    |
|  | Google Sheets    |  | localStorage     |                    |
|  | (sleep entries)  |  | (kudos, repairs, |                    |
|  |                  |  |  habits, goals,  |                    |
|  |                  |  |  badges, AI cache)|                   |
|  +------------------+  +------------------+                    |
+---------------------------------------------------------------+
```

## Component Responsibilities

| Component | Responsibility | Inputs | Outputs |
|-----------|----------------|--------|---------|
| **App.tsx** | Page routing, provider composition, error boundary | -- | Renders active page |
| **DataProvider** | Fetch data, cache, expose via context | Google Sheets API | `data[]`, `loading`, `refresh()` |
| **DashboardPage** | Compose dashboard sections, manage view tabs | `data[]`, `user` | Renders sub-components |
| **HeroCard** | Personal stats summary (SS, RHR, HRV, level, streak) | `user`, `data[]` | Visual card |
| **Tracker** | 7-day dots, 30-day calendar, 12-month heatmap | `user`, `data[]`, `range` | Visual tracker with click navigation |
| **Leaderboard** | Ranked user cards with kudos | `data[]`, `view`, `user` | Ranked list with interaction |
| **GoalCard** | Show/set personal sleep score targets, track progress | `user`, `data[]`, goals from localStorage | Goal UI + progress bars |
| **BadgeGrid** | Display earned/locked achievement badges | `user`, `data[]`, `kudos` | Badge grid with unlock animations |
| **AIReport** | Weekly AI analysis display + trigger | `data[]`, cached report | Analysis cards |
| **KudosButton** | Reusable like/reaction button | `from`, `to`, `date` | Click handler, count display |

## Recommended Project Structure

```
src/
+-- components/
|   +-- pages/
|   |   +-- DashboardPage.tsx    # Composes sections, owns view state
|   |   +-- InputPage.tsx        # Data entry (unchanged)
|   |   +-- ChartsPage.tsx       # Time series (unchanged)
|   |   +-- HistoryPage.tsx      # Data table (unchanged)
|   |   +-- HabitPage.tsx        # Habit tracking (unchanged)
|   +-- dashboard/
|   |   +-- HeroCard.tsx         # Personal stats hero
|   |   +-- Tracker.tsx          # 7d/30d/12mo calendar views
|   |   +-- Leaderboard.tsx      # Ranked cards + kudos
|   |   +-- XPBreakdown.tsx      # XP detail section
|   |   +-- BonusSection.tsx     # Bonus progress cards
|   |   +-- SnapshotView.tsx     # Day snapshot from Charts jump
|   |   +-- GoalCard.tsx         # NEW: sleep goal target + progress
|   |   +-- BadgeGrid.tsx        # NEW: achievement badges
|   |   +-- AIReport.tsx         # NEW: weekly analysis display
|   +-- shared/
|   |   +-- ProgressHub.tsx      # Persistent XP ring + streak dots
|   |   +-- Avi.tsx              # Avatar component
|   |   +-- KudosButton.tsx      # Extracted reusable kudos/like
|   |   +-- ErrorBoundary.tsx    # NEW: graceful crash handling
|   |   +-- Toast.tsx            # Toast notifications
|   +-- ui/                      # shadcn primitives (pruned)
+-- lib/
|   +-- sleep.ts                 # Data types, fetch, colors, formatting ONLY
|   +-- gamify.ts                # NEW: XP calc, streak, tiers, levels (extracted from sleep.ts + DashboardPage)
|   +-- kudos.ts                 # NEW: kudos read/write/count (extracted from DashboardPage)
|   +-- goals.ts                 # NEW: goal CRUD, progress calculation
|   +-- badges.ts                # NEW: badge definitions, unlock criteria, earned check
|   +-- ai.ts                    # AI analysis (enhanced for weekly batch + caching)
|   +-- habits.ts                # Habit tracking (unchanged)
|   +-- hide.tsx                 # Privacy masking (unchanged)
|   +-- utils.ts                 # Tailwind merge utility
+-- hooks/
|   +-- useData.ts               # NEW: data fetching + caching hook
|   +-- useGameState.ts          # NEW: memoized XP, streak, level for a user
|   +-- useGoals.ts              # NEW: goal state management
|   +-- useBadges.ts             # NEW: badge unlock state
```

### Structure Rationale

- **dashboard/**: DashboardPage's 750 lines become ~100 lines of composition. Each section is independently testable and modifiable.
- **lib/gamify.ts**: Single source of truth for XP, streaks, tiers. Both `calcXP` and `calcXPBreakdown` merge into one module. Changes to XP rules happen in one place.
- **lib/kudos.ts**: Kudos logic is used in DashboardPage, Leaderboard, SnapshotView, and ProgressHub. Extracting it eliminates duplication and makes kudos count caching possible.
- **hooks/useGameState.ts**: Wraps `calcXP` + `loggingStreak` + `xpLevel` + `xpProgress` behind `useMemo` so they only recompute when `data` or `user` changes, not on every render.

## Architectural Patterns

### Pattern 1: Extract-and-Compose for Dashboard Decomposition

**What:** Break the 750-line DashboardPage into a thin orchestrator that renders extracted sub-components.
**When to use:** Any component over ~200 lines that handles multiple distinct UI sections.
**Trade-offs:** More files to navigate, but each file is self-contained and independently modifiable.

**Example:**
```typescript
// DashboardPage.tsx (~100 lines after extraction)
export function DashboardPage({ data, user, ... }: Props) {
  const [view, setView] = useState<DashView>('daily');
  const gameState = useGameState(data, user);
  const filtered = useFilteredData(data, view);

  if (snapshotMode) return <SnapshotView ... />;

  return (
    <div>
      <HeroCard user={user} data={data} gameState={gameState} view={view} onViewChange={setView} />
      <Tracker user={user} data={data} />
      <Leaderboard data={filtered} user={user} view={view} />
      <Section title="XP"><XPBreakdown gameState={gameState} /></Section>
      <Section title="Bonuses"><BonusSection gameState={gameState} /></Section>
      <GoalCard user={user} data={data} />
      <BadgeGrid user={user} data={data} gameState={gameState} />
    </div>
  );
}
```

### Pattern 2: Computed State Hook with useMemo

**What:** Wrap expensive computations (XP, streak, leaderboard) in custom hooks that memoize results.
**When to use:** Any computation that depends on `data[]` and runs on every render.
**Trade-offs:** Slightly more code structure, but prevents redundant recalculations. Critical once badges and goals add more computations.

**Example:**
```typescript
// hooks/useGameState.ts
export function useGameState(data: SleepEntry[], user: string) {
  return useMemo(() => {
    const xp = calcXP(data, user);
    const streak = loggingStreak(data, user);
    const level = xpLevel(xp);
    const progress = xpProgress(xp);
    const breakdown = calcXPBreakdown(data, user);
    return { xp, streak, level, progress, breakdown };
  }, [data, user]);
}
```

### Pattern 3: localStorage Module Pattern for New Features

**What:** Each localStorage-backed feature (kudos, goals, badges, AI cache) gets its own module with typed read/write functions, following the existing `habits.ts` pattern.
**When to use:** All new features that persist state client-side.
**Trade-offs:** More modules, but prevents the "scan all localStorage keys" approach currently used for kudos (which gets slower as keys accumulate).

**Example:**
```typescript
// lib/kudos.ts (extracted from DashboardPage)
const PREFIX = 'st_kudos_';

export function getKudos(from: string, to: string, date: string): string | null { ... }
export function saveKudos(from: string, to: string, date: string, emoji: string): void { ... }
export function getKudosFor(to: string, date: string): KudosEntry[] { ... }
export function getTotalKudosReceived(to: string): number { ... }  // cached version
```

### Pattern 4: Weekly Batch AI with localStorage Cache

**What:** AI analysis runs once per week (Sunday), result is cached in localStorage with a TTL key. Display component reads cache first, only triggers API call if stale.
**When to use:** The weekly AI report feature.
**Trade-offs:** Report is stale Mon-Sat (by design -- this is a feature, not a bug, because weekly comparison is the goal).

**Example:**
```typescript
// lib/ai.ts (enhanced)
const CACHE_KEY = 'st_ai_report';
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

export function getCachedReport(): WeeklyReport | null {
  const raw = localStorage.getItem(CACHE_KEY);
  if (!raw) return null;
  const { report, timestamp } = JSON.parse(raw);
  if (Date.now() - timestamp > CACHE_TTL) return null;
  return report;
}

export async function generateWeeklyReport(data: SleepEntry[]): Promise<WeeklyReport> {
  const cached = getCachedReport();
  if (cached) return cached;
  const report = await callClaudeHaiku(data);
  localStorage.setItem(CACHE_KEY, JSON.stringify({ report, timestamp: Date.now() }));
  return report;
}
```

## Data Flow

### Current Data Flow (Sleep Entries)

```
Google Sheets (Apps Script)
    |  JSONP callback
    v
App.tsx (fetchAllData -> setData)
    |  props drilling
    v
DashboardPage / ChartsPage / HistoryPage
    |  inline computation
    v
calcXP, loggingStreak, aggregate (called per render, per user)
```

### Recommended Data Flow

```
Google Sheets (Apps Script)
    |  JSONP callback
    v
App.tsx (fetchAllData -> setData)
    |  props (data[] is small, ~500 entries max for 3 users over 2 years)
    v
Page Components
    |  custom hooks with useMemo
    v
useGameState(data, user)  -- memoized XP, streak, level
useGoals(user)            -- localStorage read, memoized
useBadges(data, user)     -- computed from gameState + kudos + goals
```

### Key Data Flows

1. **Sleep data flow:** Google Sheets -> JSONP -> `data[]` state in App -> props to pages -> memoized computations in hooks. One-directional, no state management library needed (dataset is small, prop drilling is fine for 5 pages).

2. **Gamification state flow:** `data[]` + localStorage -> `useGameState` hook -> XP, streak, level values -> consumed by HeroCard, Leaderboard, ProgressHub, BadgeGrid. The hook is the single computation point.

3. **Kudos flow:** User clicks like -> `kudos.ts` writes localStorage -> component re-renders via local state counter (existing `cheerRefresh` pattern). No server persistence needed since kudos are local social gestures.

4. **AI report flow:** User triggers or auto-trigger on Sunday -> check localStorage cache -> if stale, POST to Cloudflare Worker -> Claude Haiku -> cache result -> display. Manual re-trigger button for freshness.

5. **Goal flow:** User sets SS target via GoalCard -> `goals.ts` writes localStorage -> on data load, `useGoals` computes progress against target -> GoalCard shows progress bar.

6. **Badge flow:** `useBadges` hook reads `data[]`, `gameState`, `kudos` -> evaluates badge criteria -> returns `{ earned: Badge[], locked: Badge[] }` -> BadgeGrid renders with unlock state.

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 3 users (current) | Current approach works. Props drilling is fine. No caching needed beyond useMemo. |
| 10-20 users | Add pagination to leaderboard. Aggregate computations may need Web Worker if slow. Google Sheets API may hit rate limits -- add request debouncing. |
| 50+ users | Google Sheets becomes the bottleneck (row limits, read speed). Would require backend migration (out of scope per PROJECT.md). |

### Scaling Priorities

1. **First bottleneck (now):** Computation redundancy. `calcXP` calls `loggingStreak` internally, and both are called separately. Fix with `useGameState` memoization.
2. **Second bottleneck (future):** localStorage key scanning for kudos count. Fix with `kudos.ts` module that maintains a count cache key instead of scanning all keys.

## Anti-Patterns

### Anti-Pattern 1: setState During Render

**What people do:** Call `setState` conditionally in the render body (DashboardPage lines 216-224 jump logic).
**Why it's wrong:** Causes React to abort the current render, trigger a new one, and can lead to infinite loops in edge cases. React 18 strict mode double-renders expose this.
**Do this instead:** Use `useEffect` with the jump props as dependencies:
```typescript
useEffect(() => {
  if (jumpDate) {
    setSelDate(jumpDate);
    setView('daily');
    setSnapshotMode(true);
    setSnapshotUser(jumpUser);
    clearJump?.();
  }
}, [jumpDate, jumpUser, clearJump]);
```

### Anti-Pattern 2: Duplicated Business Logic

**What people do:** Implement `calcXP` in `sleep.ts` and `calcXPBreakdown` in `DashboardPage.tsx` with the same rules but different shapes.
**Why it's wrong:** Inevitably diverges. When XP rules change, one gets updated and the other doesn't, showing inconsistent numbers.
**Do this instead:** Single `calcXP` function in `gamify.ts` that returns the full breakdown. The total is just `breakdown.total`. One function, one truth.

### Anti-Pattern 3: Scanning All localStorage Keys

**What people do:** Iterate `localStorage.length` and check key prefixes to count kudos (DashboardPage lines 50-54, sleep.ts lines 351-355).
**Why it's wrong:** O(n) on total localStorage keys. Gets slower as kudos accumulate. Also fragile -- any key matching the prefix pattern gets counted.
**Do this instead:** Maintain a summary key (`st_kudos_count_{name}`) that gets incremented/decremented on kudos changes. Read one key instead of scanning all.

### Anti-Pattern 4: Embedding Helper Functions in Component Files

**What people do:** Define `calcXPBreakdown`, `get7Days`, `getCalendarMonth`, `getYearOverview`, `calcTrend` (200+ lines) at the top of DashboardPage.tsx.
**Why it's wrong:** Can't reuse these functions in other components (e.g., BadgeGrid needs streak data, GoalCard needs trend data). Also makes the file impossible to navigate.
**Do this instead:** Move pure computation functions to `lib/` modules. Components should import logic, not define it.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Google Sheets | JSONP via Apps Script web app | Read-only except InputPage writes. No auth -- public endpoint with app-specific URL. Cache-bust with `?v=Date.now()`. |
| Cloudflare Worker | POST with API key header | Proxies to Anthropic API. Key is in env vars (bundled into client -- security concern, but acceptable for a 3-person team tool). |
| Claude Haiku | Via Cloudflare Worker | Weekly batch. Keep prompt under 4K tokens by sending only last 30 days. Cache response for 7 days. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| App -> Pages | Props (data, user, callbacks) | Keep this. No state management library needed for 3-user tool. |
| Pages -> Dashboard sections | Props | Each section receives only what it needs. |
| Components -> Domain logic | Import functions from lib/ | Never inline business logic in components. |
| Domain logic -> Storage | Direct localStorage calls | Each module owns its own key prefix. |

## Build Order (Dependencies)

The refactoring and new features should be built in this order based on dependencies:

```
Phase 1: Foundation (no dependencies)
  1. Extract gamify.ts from sleep.ts + DashboardPage
  2. Extract kudos.ts from DashboardPage
  3. Create useGameState hook
  4. Add ErrorBoundary
  5. Fix setState-during-render anti-pattern
  6. Prune unused shadcn/ui components

Phase 2: Dashboard Decomposition (depends on Phase 1)
  7. Extract HeroCard from DashboardPage
  8. Extract Tracker from DashboardPage
  9. Extract Leaderboard from DashboardPage
  10. Extract XPBreakdown from DashboardPage
  11. Extract BonusSection from DashboardPage
  12. Extract SnapshotView from DashboardPage
  -> DashboardPage drops to ~100 lines

Phase 3: New Features (depends on Phase 2 for clean integration points)
  13. GoalCard + goals.ts (standalone, plugs into Dashboard)
  14. BadgeGrid + badges.ts (needs gamify.ts, kudos.ts, goals.ts)
  15. AIReport + enhanced ai.ts (standalone, plugs into Dashboard)

Phase 4: Polish
  16. English UI migration
  17. Mobile UX improvements (depends on decomposed components being in place)
  18. TypeScript strictness (replace `any` types)
```

**Why this order:**
- Phase 1 creates the clean module boundaries that Phase 2 extracts into.
- Phase 2 gives Phase 3 clean insertion points for new sections.
- Badges (Phase 3, step 14) depend on goals being built first because "goal achieved" is a badge category.
- Mobile UX improvements in Phase 4 are much easier when each section is a separate component you can rearrange, collapse, or lazy-load independently.

## Sources

- Direct codebase analysis of all source files in `src/`
- React documentation on `useMemo`, `useEffect`, and render-phase side effects
- Existing patterns in the codebase (habits.ts module pattern, ProgressHub hook usage)

---
*Architecture research for: Sleep Tracker restructuring*
*Researched: 2026-03-23*
