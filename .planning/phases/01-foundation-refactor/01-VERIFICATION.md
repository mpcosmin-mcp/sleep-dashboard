---
phase: 01-foundation-refactor
verified: 2026-03-24T08:00:00Z
status: gaps_found
score: 9/11 must-haves verified
gaps:
  - truth: "XP values are identical whether computed via the old calcXP path or the new calcXPBreakdown — a single gamify.ts module is the sole source of truth for XP logic"
    status: failed
    reason: "useGameState.ts defines a local calcXPBreakdown function (lines 23-37) that duplicates XP logic with the old inline localStorage kudos scan, bypassing gamify.ts and getTotalKudos from kudos.ts. Two independent XP computation paths exist."
    artifacts:
      - path: "src/hooks/useGameState.ts"
        issue: "Local calcXPBreakdown function (lines 23-37) reimplements XP logic with inline localStorage scan for kudos instead of importing calcXPBreakdown from gamify.ts"
    missing:
      - "Remove local calcXPBreakdown from useGameState.ts"
      - "Import calcXPBreakdown from '@/lib/gamify' in useGameState.ts"
      - "The local function uses inline kudos localStorage scan; gamify.ts uses getTotalKudos() from kudos.ts — these will produce different totals if kudos keys differ in format"
  - truth: "Kudos read/write logic is in lib/kudos.ts, not inline in DashboardPage"
    status: partial
    reason: "DashboardPage itself no longer has inline kudos logic (confirmed), but Leaderboard.tsx and SnapshotView.tsx each duplicate the full set of kudos helpers (kudosKey, getKudos, saveKudos, getKudosFor) inline instead of importing from kudos.ts."
    artifacts:
      - path: "src/components/dashboard/Leaderboard.tsx"
        issue: "Lines 13-22 define kudosKey, getKudos, saveKudos, getKudosFor as local functions instead of importing from '@/lib/kudos'"
      - path: "src/components/dashboard/SnapshotView.tsx"
        issue: "Lines 7-18 define kudosKey, getKudos, saveKudos, getKudosFor as local functions instead of importing from '@/lib/kudos'"
    missing:
      - "Replace inline kudos helpers in Leaderboard.tsx with imports from '@/lib/kudos'"
      - "Replace inline kudos helpers in SnapshotView.tsx with imports from '@/lib/kudos'"
      - "Add KUDOS_REACTIONS import from kudos.ts if used (currently neither file uses the emoji array from kudos.ts)"
human_verification:
  - test: "Navigate from Charts page to Dashboard via click-to-snapshot"
    expected: "Dashboard shows snapshot view for clicked date with no render loops or console errors"
    why_human: "Cannot verify runtime behavior, animation smoothness, or absence of React warnings without running the app"
  - test: "Trigger a component crash (e.g., pass bad data)"
    expected: "ErrorBoundary shows fallback UI with reload button instead of white screen"
    why_human: "Cannot verify ErrorBoundary renders correctly without runtime crash"
---

# Phase 01: Foundation Refactor Verification Report

**Phase Goal:** Eliminate architectural debt — extract gamification logic, decompose mega-components, fix active defects, and remove dead code so all subsequent phases build on a clean, typed, modular codebase.
**Verified:** 2026-03-24T08:00:00Z
**Status:** gaps_found
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | XP values are identical via calcXP and calcXPBreakdown — gamify.ts is sole source of truth | FAILED | useGameState.ts defines a local calcXPBreakdown with old inline localStorage kudos scan (lines 23-37), bypassing gamify.ts |
| 2 | Kudos read/write logic is in lib/kudos.ts, not inline in DashboardPage | PARTIAL | DashboardPage is clean, but Leaderboard.tsx and SnapshotView.tsx duplicate all 4 kudos helpers inline |
| 3 | ProgressHub imports from gamify.ts, not sleep.ts, for XP/streak/level functions | VERIFIED | Line 3: `import { calcXP, loggingStreak, xpLevel, xpProgress, XP_PER_LEVEL, XP_COLOR, STREAK_COLOR } from '@/lib/gamify'` |
| 4 | Navigating from Charts to Dashboard does not cause render loops | VERIFIED (automated) | useEffect wraps jump logic in DashboardPage.tsx lines 21-32 with proper deps |
| 5 | Anthropic API key does not appear anywhere in client JS bundle | VERIFIED | `grep -r "VITE_ANTHROPIC_KEY" src/` returns nothing; worker uses `env.ANTHROPIC_KEY` |
| 6 | App recovers gracefully from component crash via ErrorBoundary | VERIFIED (automated) | ErrorBoundary class component exists with getDerivedStateFromError; App.tsx wraps at lines 90/187 |
| 7 | DashboardPage renders same UI but source file is under 150 lines | VERIFIED | `wc -l` = 100 lines; imports all 7 section components |
| 8 | Expensive computations are memoized with useMemo | VERIFIED | useGameState uses useMemo; Tracker wraps get7Days/getCalendarMonth/getYearOverview in useMemo; Leaderboard memoizes board building |
| 9 | Each dashboard section is in its own file under src/components/dashboard/ | VERIFIED | 7 files: BonusSection, HeroCard, Leaderboard, Section, SnapshotView, Tracker, XPBreakdown |
| 10 | Core modules have no `any` types | VERIFIED | sleep.ts: zero `any` matches; ChartsPage.tsx: zero `any` matches; RawSheetRow and AggAccumulator interfaces present |
| 11 | Unused shadcn/ui components and Radix deps are removed | VERIFIED | `ls src/components/ui/` = 7 files (badge, button, card, dialog, table, tabs, tooltip); removed Radix packages confirmed absent from package.json |

**Score:** 9/11 truths verified (2 failed/partial)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/lib/gamify.ts` | Unified XP calculation, streak, levels, tiers | VERIFIED | 213 lines; exports calcXP, calcXPBreakdown, loggingStreak, xpLevel, xpProgress, levelTier, levelTitle, XP_COLOR, STREAK_COLOR, saveRepair, STREAK_REPAIR_COST, XPBreakdown |
| `src/lib/kudos.ts` | Kudos localStorage read/write/count | VERIFIED | 27 lines; exports KUDOS_REACTIONS, kudosKey, getKudos, saveKudos, getKudosFor, getTotalKudos |
| `src/lib/sleep.ts` | Data types, fetch, colors ONLY — no game logic | VERIFIED | 183 lines; re-exports gamification symbols from gamify.ts; contains RawSheetRow and AggAccumulator interfaces |
| `src/components/shared/ErrorBoundary.tsx` | React Error Boundary with fallback UI | VERIFIED | Class component with getDerivedStateFromError and componentDidCatch |
| `src/lib/ai.ts` | AI proxy call without client-side API key | VERIFIED | No VITE_ANTHROPIC_KEY or X-API-Key header |
| `worker/proxy.js` | Cloudflare Worker with server-side key and origin auth | VERIFIED | Uses env.ANTHROPIC_KEY; allowedOrigins array; no wildcard CORS |
| `src/components/pages/DashboardPage.tsx` | Thin orchestrator under 150 lines | VERIFIED | 100 lines; composes all 7 section components |
| `src/hooks/useGameState.ts` | Memoized XP, streak, level, breakdown | STUB | Has local calcXPBreakdown (lines 23-37) that duplicates gamify.ts logic with old inline localStorage kudos scan; imports from sleep.ts re-exports not gamify.ts directly |
| `src/components/dashboard/HeroCard.tsx` | Personal stats hero card | VERIFIED | Exports HeroCard and DashView type; includes TrendArrow and calcTrend |
| `src/components/dashboard/Tracker.tsx` | 7-day dots, 30-day calendar, 12-month heatmap | VERIFIED | get7Days, getCalendarMonth, getYearOverview wrapped in useMemo |
| `src/components/dashboard/Leaderboard.tsx` | Ranked user cards with kudos interaction | PARTIAL | Exists with useMemo leaderboard building; but has 4 inline kudos helper functions instead of importing from kudos.ts |
| `src/components/dashboard/XPBreakdown.tsx` | XP detail section with progress bar | VERIFIED | Exists and renders gameState.breakdown |
| `src/components/dashboard/BonusSection.tsx` | Data-driven bonus progress cards | VERIFIED | BONUS_DEFS array exported; goodSleepRun memoized |
| `src/components/dashboard/SnapshotView.tsx` | Day snapshot from Charts jump | PARTIAL | Exists and renders snapshot; but has 4 inline kudos helper functions instead of importing from kudos.ts |
| `src/components/dashboard/Section.tsx` | Reusable expandable section wrapper | VERIFIED | 12-line component with defaultOpen prop |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/lib/gamify.ts` | `src/lib/sleep.ts` | imports SleepEntry type and NAMES | WIRED | Line 1: `import { type SleepEntry, NAMES } from '@/lib/sleep'` |
| `src/lib/gamify.ts` | `src/lib/kudos.ts` | imports getTotalKudos for XP calculation | WIRED | Line 2: `import { getTotalKudos } from '@/lib/kudos'` |
| `src/components/shared/ProgressHub.tsx` | `src/lib/gamify.ts` | imports calcXP, loggingStreak, xpLevel, xpProgress | WIRED | Line 3: direct import from `@/lib/gamify` |
| `src/App.tsx` | `src/components/shared/ErrorBoundary.tsx` | wraps page content | WIRED | Lines 5 (import) and 90/187 (JSX tags) |
| `src/lib/ai.ts` | `worker/proxy.js` | POST without X-API-Key header | WIRED | fetch(proxyUrl) with only Content-Type header |
| `src/components/pages/DashboardPage.tsx` | `src/components/dashboard/HeroCard.tsx` | renders `<HeroCard>` | WIRED | Lines 4 (import) and 76 (JSX) |
| `src/components/pages/DashboardPage.tsx` | `src/hooks/useGameState.ts` | calls useGameState hook | WIRED | Lines 3 (import) and 56 (call) |
| `src/hooks/useGameState.ts` | `src/lib/gamify.ts` | imports and memoizes calcXP, loggingStreak, calcXPBreakdown | NOT_WIRED | Imports from `@/lib/sleep` (re-exports) not `@/lib/gamify` directly; has its own local calcXPBreakdown duplicating gamify.ts logic |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `src/components/pages/DashboardPage.tsx` | `data: SleepEntry[]` | Prop from App.tsx which fetches from Google Sheets | Yes — prop-driven | FLOWING |
| `src/hooks/useGameState.ts` | `xp`, `streak`, `level`, `breakdown` | calcXP, loggingStreak (via sleep.ts re-exports), local calcXPBreakdown | Partial — breakdown uses local duplicate not canonical gamify.ts version | HOLLOW (duplicate source) |
| `src/components/dashboard/Leaderboard.tsx` | `leaderboard` array | useMemo over data prop + calcXP/loggingStreak from sleep.ts | Yes — data flows from props | FLOWING |
| `src/components/dashboard/Tracker.tsx` | `week7`, `calMonth`, `yearOverview` | useMemo over data and user props | Yes — all three data structures memoized from real data | FLOWING |
| `src/components/dashboard/BonusSection.tsx` | `bonuses` | BONUS_DEFS + useMemo goodSleepRun from data prop | Yes | FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| gamify.ts exports calcXP as thin wrapper | `grep -A2 "function calcXP" src/lib/gamify.ts` | `return calcXPBreakdown(data, name).total;` | PASS |
| DashboardPage is under 150 lines | `wc -l src/components/pages/DashboardPage.tsx` | 100 lines | PASS |
| sleep.ts re-exports gamification symbols | `grep "export {" src/lib/sleep.ts` | re-exports calcXP, loggingStreak, etc. from gamify | PASS |
| No wildcard CORS in worker | `grep "Allow-Origin.*\*" worker/proxy.js` | no match | PASS |
| No client-side API key | `grep -r "VITE_ANTHROPIC_KEY" src/` | no match | PASS |
| UI directory has exactly 7 files | `ls src/components/ui/ \| wc -l` | 7 | PASS |
| useGameState imports from gamify.ts | `grep "from.*gamify" src/hooks/useGameState.ts` | no match — imports from sleep.ts | FAIL |
| kudos.ts is sole kudos source | `grep "function getKudos" src/components/dashboard/*.tsx` | matches in Leaderboard.tsx and SnapshotView.tsx | FAIL |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| ARCH-01 | 01-03 | DashboardPage is thin orchestrator (~100 lines) | SATISFIED | DashboardPage.tsx is exactly 100 lines composing 7 section components |
| ARCH-02 | 01-01 | XP calculation in single source of truth (gamify.ts) | BLOCKED | gamify.ts has canonical calcXPBreakdown, but useGameState.ts has a local duplicate bypassing it |
| ARCH-03 | 01-02 | setState-during-render anti-pattern replaced with useEffect | SATISFIED | DashboardPage.tsx lines 21-32 use useEffect for jump logic |
| ARCH-04 | 01-02 | Anthropic API key removed from client bundle | SATISFIED | No VITE_ANTHROPIC_KEY anywhere in src/; worker uses env.ANTHROPIC_KEY |
| ARCH-05 | 01-02 | React Error Boundary wraps app | SATISFIED | ErrorBoundary class component created and wired in App.tsx |
| ARCH-06 | 01-04 | `any` types replaced in core modules | SATISFIED | sleep.ts and ChartsPage.tsx both have zero `any` types; RawSheetRow and AggAccumulator interfaces present |
| ARCH-07 | 01-03 | Expensive computations memoized with useMemo | SATISFIED | useGameState, Tracker, Leaderboard all use useMemo correctly |
| ARCH-08 | 01-04 | Unused shadcn/ui components and npm dependencies removed | SATISFIED | 7 UI files remain; unused Radix packages removed from package.json |

**Orphaned requirements check:** No requirements mapped to Phase 1 in REQUIREMENTS.md are absent from plan frontmatter.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/hooks/useGameState.ts` | 23-37 | Local `calcXPBreakdown` function duplicating gamify.ts logic with old inline localStorage scan | Blocker | Violates ARCH-02 single source of truth; XP breakdown values will differ from gamify.ts when kudos localStorage key format diverges |
| `src/components/dashboard/Leaderboard.tsx` | 13-22 | Inline kudos helpers (kudosKey, getKudos, saveKudos, getKudosFor) duplicating kudos.ts | Warning | Kudos logic not consolidated in kudos.ts as intended; future bug fixes in kudos.ts won't reach Leaderboard |
| `src/components/dashboard/SnapshotView.tsx` | 7-18 | Inline kudos helpers (kudosKey, getKudos, saveKudos, getKudosFor) duplicating kudos.ts | Warning | Same as Leaderboard.tsx — divergence risk from kudos.ts |

### Human Verification Required

#### 1. Charts-to-Dashboard Navigation

**Test:** Open the app, go to the Charts page, click on a data point to jump to a specific date in Dashboard
**Expected:** Dashboard shows the snapshot view for that date, no console errors, no infinite re-renders
**Why human:** Cannot verify runtime React render behavior or absence of React warnings without a running browser instance

#### 2. Error Boundary Fallback

**Test:** Simulate a component crash (e.g., temporarily pass null where a component expects an object)
**Expected:** ErrorBoundary fallback UI appears with the error message and a "Reload app" button
**Why human:** Cannot trigger runtime component crashes programmatically in this environment

### Gaps Summary

Two gaps block full goal achievement for ARCH-02:

**Gap 1 — Duplicate XP computation in useGameState.ts (Blocker)**

The plan required `useGameState.ts` to import `calcXPBreakdown` from `gamify.ts`. Instead, the file contains a hand-rolled local `calcXPBreakdown` (lines 23-37) that uses the old inline `for`-loop localStorage kudos scan. This creates two independent XP computation paths: `gamify.ts` uses `getTotalKudos()` from `kudos.ts`; `useGameState.ts` uses a raw localStorage scan. The XP breakdown displayed in the UI (via `XPBreakdown` component) comes from `useGameState.ts`, not from `gamify.ts`'s canonical implementation, directly violating ARCH-02.

This was noted in the 01-03 SUMMARY as an intentional temporary workaround ("Used sleep.ts re-exports instead of gamify.ts/kudos.ts — parallel execution: those modules not yet in this branch"), but the merge did not consolidate the import.

**Gap 2 — Kudos helpers duplicated in Leaderboard and SnapshotView (Warning)**

Both `Leaderboard.tsx` and `SnapshotView.tsx` contain full inline copies of `kudosKey`, `getKudos`, `saveKudos`, and `getKudosFor`. The plan required these to import from `kudos.ts`. The 01-03 SUMMARY documented this as intentional: "Kudos localStorage helpers duplicated in SnapshotView and Leaderboard (will consolidate when kudos.ts merges)." The merge has occurred but consolidation was not done.

These two gaps share a root cause: the 01-03 plan ran in a parallel worktree before gamify.ts and kudos.ts existed, and the merge did not clean up the temporary duplicates.

---

_Verified: 2026-03-24T08:00:00Z_
_Verifier: Claude (gsd-verifier)_
