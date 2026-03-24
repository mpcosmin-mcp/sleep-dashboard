---
phase: 02-badges-and-goals
plan: 02
subsystem: ui
tags: [badges, gamification, confetti, toast, dashboard, react, css-animation]

# Dependency graph
requires:
  - phase: 02-01
    provides: "badges.ts with BADGE_DEFS, checkBadges, getEarnedBadgeIds, saveEarnedBadge; XPBreakdown interface with badgeXP field"
provides:
  - "BadgeSection component: 4-column grid of 17 badges with earned/locked visual states"
  - "Badge tooltip popups: name, category, progress bar (locked) or +25 XP (earned)"
  - "Confetti-enhanced badge unlock toasts with 4500ms duration and sequential queuing"
  - "CSS confetti-fall animation with prefers-reduced-motion support"
  - "XPBreakdown badge XP line showing earned badge count and XP"
  - "Badge unlock detection in App.tsx useEffect on data/user change"
affects: [02-03, phase-03]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "CSS custom property animation: --dx/--rot vars on .confetti-particle for per-particle randomness"
    - "Toast extension: optional confetti+duration opts on showToast without breaking existing callers"
    - "Badge unlock detection: useEffect diff pattern comparing localStorage earned set vs computed earned set"

key-files:
  created:
    - src/components/dashboard/BadgeSection.tsx
  modified:
    - src/components/shared/Toast.tsx
    - src/App.tsx
    - src/components/dashboard/XPBreakdown.tsx
    - src/components/pages/DashboardPage.tsx
    - src/index.css

key-decisions:
  - "TooltipProvider placed inside Section content rather than wrapping whole component — avoids nesting conflicts with App-level TooltipProvider"
  - "Confetti particles use inline random CSS vars (--dx, --rot) computed at render time — avoids JS animation loop"
  - "showToast opts parameter is optional — all existing callers (showToast('msg')) still work unchanged"
  - "earnedIds from localStorage (not live check) drives visual earned state — consistent with App.tsx detection logic"

patterns-established:
  - "Badge grid pattern: grid-cols-4 gap-2 with isEarned toggle for ring-2 ring-primary vs bg-muted/30"
  - "Locked badge: opacity-40 grayscale filter classes on emoji span"

requirements-completed:
  - BADGE-05
  - BADGE-06

# Metrics
duration: 10min
completed: 2026-03-24
---

# Phase 02 Plan 02: Badge UI and Unlock Celebration Summary

**4-column badge collection grid replacing BonusSection, with CSS confetti toasts (4500ms) on new badge unlock and badge XP line in XPBreakdown**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-03-24T03:05:00Z
- **Completed:** 2026-03-24T03:08:41Z
- **Tasks:** 1/2 (Task 2 is human-verify checkpoint — awaiting user approval)
- **Files modified:** 6

## Accomplishments
- BadgeSection replaces BonusSection: 4-col grid of all 17 badges, earned badges show ring + color, locked show opacity-40 grayscale
- Tooltip on each badge: name, category label (Romanian), progress bar with XP_COLOR fill for locked, "Deblocat! +25 XP" for earned
- Confetti system: CSS @keyframes confetti-fall with per-particle --dx/--rot custom properties, 12 particles, prefers-reduced-motion hides all particles
- Toast extended: optional `confetti` prop and `duration` opt on showToast — backward compatible
- Badge unlock detection: useEffect in App.tsx diffs localStorage earned set vs live computed set, queues sequential toasts at 1200ms intervals
- XPBreakdown: badge XP line renders when `breakdown.badgeXP > 0`

## Task Commits

1. **Task 1: Create BadgeSection, confetti CSS, extend Toast and XPBreakdown, wire badge unlock detection** - `c431148` (feat)

## Files Created/Modified
- `src/components/dashboard/BadgeSection.tsx` - 4-col badge grid with tooltips, created new
- `src/components/shared/Toast.tsx` - Extended with confetti prop and ConfettiParticles sub-component
- `src/App.tsx` - showToast extended with opts, badge unlock detection useEffect added
- `src/components/dashboard/XPBreakdown.tsx` - Badge XP line added between kudosXP and spent rows
- `src/components/pages/DashboardPage.tsx` - Import changed from BonusSection to BadgeSection
- `src/index.css` - @keyframes confetti-fall, .confetti-particle, prefers-reduced-motion rule added

## Decisions Made
- `TooltipProvider` nested inside `BadgeSection` with `delayDuration={0}` — tooltips open immediately on tap (mobile UX)
- Confetti container positioned at `bottom: 60px` (above the toast at `bottom: 20px`) so particles appear to burst from toast area
- Used `Array.from({ length: 12 })` with per-render random dx/rot — no state needed, fresh randomness each unlock

## Deviations from Plan

### Pre-existing Build Failures (out of scope)

The worktree required a `git fetch` from the local main repo to get Plan 01 output before execution could start. After merging, `npm run build` (which runs `tsc -b`) shows pre-existing TypeScript errors in files not touched by this plan:
- `src/components/dashboard/Leaderboard.tsx` — unused vars, NAMES not imported
- `src/components/dashboard/Tracker.tsx` — ringColor not in CSSProperties
- `src/components/pages/ChartsPage.tsx` — HTMLElement vs HTMLCanvasElement
- `src/components/shared/ProgressHub.tsx` — duplicate property
- `src/components/ui/slider.tsx` — missing @radix-ui/react-slider types

These errors pre-date Plan 02-02. `npx tsc --noEmit` passes (which validates plan 02-02 code is type-correct). Build errors are tracked as deferred items.

Plan 02-02 files executed exactly as written.

## Issues Encountered
- Worktree was at old commit (53ce697) before Plan 01 output was merged. Fixed by fetching from local main repo (`git fetch C:/AI_Projects/SleepTracker main`) before starting implementation.

## Self-Check: PASSED
- BadgeSection.tsx: FOUND
- Toast.tsx: FOUND
- Commit c431148: FOUND

## Next Phase Readiness
- BadgeSection is wired and functional — awaiting human visual verification (Task 2 checkpoint)
- Once approved, Plan 02-03 (Goals UI) can proceed
- BonusSection.tsx left in place (not deleted) per plan instruction

---
*Phase: 02-badges-and-goals*
*Completed: 2026-03-24*
