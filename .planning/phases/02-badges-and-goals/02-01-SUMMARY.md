---
phase: 02-badges-and-goals
plan: 01
subsystem: gamification
tags: [challenges, goals, kudos, xp, localStorage, vitest]

# Dependency graph
requires:
  - phase: 01-foundation-refactor
    provides: gamify.ts XPBreakdown, useGameState hook, BonusSection pattern
provides:
  - challenges.ts with 8-challenge pool, deterministic weekly selection, completion detection
  - goals.ts with localStorage CRUD and ahead/on-track/behind status computation
  - Extended kudos.ts with comment support and getTotalKudosGiven
  - XPBreakdown.challengeXP integrated into total XP
  - GameState extended with challenge and goal fields
affects: [02-02, 02-03, leaderboard, dashboard, xp-breakdown]

# Tech tracking
tech-stack:
  added: []
  patterns: [weekly-challenge-rotation, goal-status-computation, localStorage-comment-keys]

key-files:
  created:
    - src/lib/challenges.ts
    - src/lib/goals.ts
    - src/lib/__tests__/challenges.test.ts
    - src/lib/__tests__/goals.test.ts
  modified:
    - src/lib/gamify.ts
    - src/lib/kudos.ts
    - src/hooks/useGameState.ts

key-decisions:
  - "Challenge pool uses weekNumber % pool.length for deterministic rotation — all users see same challenge"
  - "Kudos comments stored in separate localStorage keys (st_kudos_comment_*) to avoid breaking existing emoji storage"
  - "getTotalKudos excludes st_kudos_comment_ keys to prevent double-counting"

patterns-established:
  - "Challenge check functions: (data, name, weekStart, weekEnd) => ChallengeStatus"
  - "Goal localStorage keys: st_goal_{user}_{YYYY-MM}"
  - "Challenge completion persistence: st_challenge_completed_{user}_{weekNumber}"

requirements-completed: [BADGE-01, BADGE-02, BADGE-07, KUDOS-01, GOAL-01]

# Metrics
duration: 3min
completed: 2026-03-24
---

# Phase 02 Plan 01: Logic Layer Summary

**Weekly challenge engine with 8-challenge pool, monthly goal tracking, kudos comments, and XP integration into GameState**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-24T05:08:34Z
- **Completed:** 2026-03-24T05:11:46Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Challenge engine with 8 challenges (6 individual + 2 team), deterministic weekly rotation, and completion detection
- Goal module with localStorage-backed CRUD and ahead/on-track/behind status computation
- Kudos system extended with optional text comments alongside emoji reactions
- challengeXP integrated into XPBreakdown total and GameState extended with challenge + goal fields
- 27 unit tests covering all challenge checks, goal CRUD, and goal status computation

## Task Commits

Each task was committed atomically:

1. **Task 1: Challenge engine + goals module + kudos extension** - `11ffb4e` (feat)
2. **Task 2: XP integration and GameState extension** - `7903893` (feat)

## Files Created/Modified
- `src/lib/challenges.ts` - Challenge definitions, weekly selection, completion detection, XP calculation
- `src/lib/goals.ts` - Goal CRUD (save/get/clear), status computation, last month avg
- `src/lib/kudos.ts` - Extended with comment support, getTotalKudosGiven, comment-aware getKudosFor
- `src/lib/gamify.ts` - Added challengeXP to XPBreakdown interface and total calculation
- `src/hooks/useGameState.ts` - Extended GameState with challenge and goal fields
- `src/lib/__tests__/challenges.test.ts` - 15 tests for challenge engine
- `src/lib/__tests__/goals.test.ts` - 12 tests for goal module

## Decisions Made
- Challenge pool uses `weekNumber % CHALLENGE_POOL.length` for deterministic rotation so all users see the same challenge each week (D-04)
- Kudos comments stored in separate localStorage keys (`st_kudos_comment_${date}_${from}_${to}`) to avoid breaking existing emoji-only storage pattern
- getTotalKudos updated to exclude `st_kudos_comment_` prefixed keys from count to prevent inflation
- Goal status thresholds: ahead >= target + 2, behind < target - 2, on-track otherwise

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] getTotalKudos double-counting prevention**
- **Found during:** Task 1 (kudos extension)
- **Issue:** Adding `st_kudos_comment_*` keys would cause `getTotalKudos` to count comment keys as kudos entries since they also start with `st_kudos_`
- **Fix:** Added `!k.startsWith('st_kudos_comment_')` check in getTotalKudos
- **Files modified:** src/lib/kudos.ts
- **Verification:** Existing kudos counting unaffected, comment keys excluded
- **Committed in:** 11ffb4e (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Essential fix to prevent XP inflation from comment keys. No scope creep.

## Issues Encountered
None

## Known Stubs
None - all modules are fully functional with real data flow.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All logic modules ready for UI consumption in Plan 02 (leaderboard expansion) and Plan 03 (challenge/goal UI)
- GameState hook provides challenge and goal data to all dashboard consumers
- XPBreakdown display (Plan 02/03) can show challengeXP line item

## Self-Check: PASSED

All 7 created/modified files verified on disk. Both task commits (11ffb4e, 7903893) verified in git log.

---
*Phase: 02-badges-and-goals*
*Completed: 2026-03-24*
