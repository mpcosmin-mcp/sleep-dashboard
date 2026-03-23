---
phase: 01-foundation-refactor
plan: 01
subsystem: architecture
tags: [typescript, refactor, gamification, xp, kudos, module-extraction]

# Dependency graph
requires: []
provides:
  - "Unified gamify.ts module as single source of truth for XP/streak/level/tier logic"
  - "Isolated kudos.ts module for all kudos localStorage operations"
  - "XPBreakdown type for structured XP computation results"
  - "Backward-compatible re-exports from sleep.ts"
affects: [01-02, 01-03, 01-04]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Module extraction with re-exports for backward compatibility"
    - "Single source of truth: calcXPBreakdown as canonical XP computation, calcXP as thin wrapper"

key-files:
  created:
    - src/lib/gamify.ts
    - src/lib/kudos.ts
  modified:
    - src/lib/sleep.ts
    - src/components/pages/DashboardPage.tsx
    - src/components/shared/ProgressHub.tsx

key-decisions:
  - "calcXP wraps calcXPBreakdown rather than maintaining separate logic"
  - "sleep.ts re-exports gamification symbols for backward compatibility during transition"

patterns-established:
  - "Game logic module pattern: gamify.ts owns all XP/streak/level computation"
  - "Feature module extraction: move code, re-export from original location"

requirements-completed: [ARCH-02]

# Metrics
duration: 4min
completed: 2026-03-23
---

# Phase 01 Plan 01: Extract Gamification Modules Summary

**Unified XP/streak/level logic into gamify.ts with calcXPBreakdown as single source of truth, kudos operations into kudos.ts**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-23T18:24:42Z
- **Completed:** 2026-03-23T18:28:56Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Created gamify.ts as the single source of truth for all XP calculation, eliminating duplication between calcXP (sleep.ts) and calcXPBreakdown (DashboardPage.tsx)
- Extracted kudos localStorage operations into dedicated kudos.ts module
- Updated DashboardPage.tsx and ProgressHub.tsx to import directly from new modules
- Added backward-compatible re-exports in sleep.ts so InputPage, HistoryPage, and other consumers continue working

## Task Commits

Each task was committed atomically:

1. **Task 1: Create gamify.ts and kudos.ts modules** - `9ab9da3` (feat)
2. **Task 2: Update imports in sleep.ts, DashboardPage.tsx, and ProgressHub.tsx** - `c765a2e` (refactor)

## Files Created/Modified
- `src/lib/gamify.ts` - Unified XP calculation (calcXP, calcXPBreakdown), streak logic, levels, tiers, constants
- `src/lib/kudos.ts` - Kudos reactions, read/write/count functions for localStorage
- `src/lib/sleep.ts` - Removed 140+ lines of gamification code, added re-exports for backward compat
- `src/components/pages/DashboardPage.tsx` - Removed 45 lines of inline kudos/XP functions, imports from gamify + kudos
- `src/components/shared/ProgressHub.tsx` - Imports XP/streak functions from gamify.ts directly

## Decisions Made
- calcXP is implemented as `return calcXPBreakdown(data, name).total` -- single computation path
- calcXPBreakdown uses getTotalKudos() from kudos.ts instead of inline localStorage scanning
- sleep.ts re-exports all gamification symbols to avoid breaking InputPage, HistoryPage, and other files that were not targets of this plan

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- gamify.ts and kudos.ts are ready for import by dashboard sub-components (Plan 03)
- All existing consumers work via either direct imports or backward-compatible re-exports
- Pre-existing build errors (unused variables, resizable.tsx types) remain unchanged

## Self-Check: PASSED

---
*Phase: 01-foundation-refactor*
*Completed: 2026-03-23*
