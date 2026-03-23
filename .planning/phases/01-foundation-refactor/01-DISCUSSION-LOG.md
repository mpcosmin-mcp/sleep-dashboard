# Phase 1: Foundation Refactor - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-23
**Phase:** 01-foundation-refactor
**Areas discussed:** Decomposition strategy, Visual changes, Module extraction

---

## Decomposition Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| One component per section | HeroCard, Tracker, Leaderboard, XPBreakdown, Bonuses, SnapshotView — each their own file | ✓ |
| Grouped by feature | GamificationPanel, TeamPanel, TrackerPanel — fewer files, bigger components | |
| You decide | Claude picks based on code | |

**User's choice:** One component per section
**Notes:** Clean separation, each section gets its own file

| Option | Description | Selected |
|--------|-------------|----------|
| src/components/dashboard/ | New directory for dashboard-specific components | |
| src/components/pages/ alongside | Keep everything in pages/ folder | |
| You decide | Claude picks best location | ✓ |

**User's choice:** You decide

| Option | Description | Selected |
|--------|-------------|----------|
| Into the component that uses them | get7Days with Tracker, calcTrend with HeroCard | |
| Into lib/ modules | Pure data functions to lib/ — components stay visual-only | |
| You decide | Claude determines based on reuse patterns | ✓ |

**User's choice:** You decide

---

## Visual Changes

| Option | Description | Selected |
|--------|-------------|----------|
| Pixel-identical | Pure code restructure — app looks exactly the same | ✓ |
| Fix obvious issues | Fix dark mode bugs and spacing during refactor | |
| You decide | Fix bugs if encountered, don't seek them out | |

**User's choice:** Pixel-identical
**Notes:** No visual changes — pure code restructure. Visual polish in Phase 4.

---

## Module Extraction

| Option | Description | Selected |
|--------|-------------|----------|
| By domain concern | gamify.ts, colors.ts, api.ts — sleep.ts becomes just types + exports | |
| Keep sleep.ts, extract gamify only | Only pull out duplicated XP/streak logic | |
| You decide | Claude determines the split | ✓ |

**User's choice:** You decide (for sleep.ts splitting)

| Option | Description | Selected |
|--------|-------------|----------|
| Preserve as-is | Don't touch bonus logic — Phase 2 replaces it | |
| Restructure for badges | Extract bonus definitions into data-driven format | ✓ |
| You decide | Claude decides based on effort | |

**User's choice:** Restructure for badges
**Notes:** Extract bonus definitions as structured data, not inline JSX. Phase 2 extends this into full badge system.

---

## Claude's Discretion

- File location for dashboard section components
- Helper function placement (component-local vs lib/)
- sleep.ts splitting granularity
- Hook design for memoization
- Which unused deps to remove

## Deferred Ideas

None — discussion stayed within phase scope.
