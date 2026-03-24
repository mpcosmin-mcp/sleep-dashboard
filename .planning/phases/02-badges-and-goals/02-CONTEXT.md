# Phase 2: Badges and Goals - Context

**Gathered:** 2026-03-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Achievement badge system with unlock celebrations and personal sleep score targets. Users earn badges across four categories (consistency, quality, social, fun), see them in a collection grid, get celebratory notifications on unlock, and can set/track monthly SS goals. Existing gamification (XP, streaks, leaderboard, kudos) continues to work with badges and goals integrated.

</domain>

<decisions>
## Implementation Decisions

### Badge Presentation
- **D-01:** BonusSection is replaced by a full Badge Collection section in the dashboard — BONUS_DEFS evolves into badge definitions
- **D-02:** Compact grid layout — small circular/square badge icons, 4 per row. Earned badges are colorful, locked are greyed out
- **D-03:** Tapping a badge shows name + progress in a tooltip or small popup
- **D-04:** Section header shows earned count (e.g., "Badges (4/16 earned)")

### Badge XP Integration
- **D-05:** Badge XP appears as a new line in the existing XP breakdown ("Badge XP +75")
- **D-06:** Flat 25 XP per badge regardless of difficulty — 16 badges = 400 XP max (~4 extra levels)
- **D-07:** Badge XP integrates into gamify.ts via calcXPBreakdown, not as a parallel system

### Unlock Celebrations
- **D-08:** Toast notification with badge icon, name, and "+25 XP" text, plus CSS confetti particle burst — no npm dependency for confetti
- **D-09:** Toast disappears after 4-5 seconds, confetti uses CSS keyframe animations
- **D-10:** Badge checks run on data load and after entry submit — compare against localStorage list of earned badges (st_badges_{user}) to detect new unlocks
- **D-11:** Multiple simultaneous unlocks are queued as sequential toasts

### Goal Setting & Tracking
- **D-12:** Goal tracker lives inside HeroCard — shows monthly SS target, current average, and on-track/behind status
- **D-13:** Tapping the goal area opens a popover/dialog with a slider (60-95 range), default suggestion based on last month's average
- **D-14:** Goal stored in localStorage as st_goal_{user}_{month}
- **D-15:** When no goal is set, HeroCard shows a subtle "Set a monthly target ->" prompt

### Claude's Discretion
- Badge progress hints for locked badges (progress bar, hint text, or hidden)
- Goal status visual design (color-coded progress bar + text, emoji indicators, or hybrid)
- Exact badge icon/emoji choices per badge
- Confetti particle animation details (colors, particle count, spread)
- Badge popup/tooltip design details
- How badge definitions are structured in code (extending BONUS_DEFS or new module)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Gamification Rules
- `GAMIFICATION.md` — XP earning/spending rules, streak rules, kudos rules, color system — badge XP must integrate with these rules

### Requirements
- `.planning/REQUIREMENTS.md` §Achievement Badges — BADGE-01 through BADGE-07 badge requirements with category definitions
- `.planning/REQUIREMENTS.md` §Sleep Goals — GOAL-01, GOAL-02 goal requirements

### Source Files (integration points)
- `src/lib/gamify.ts` — XP calculation (calcXPBreakdown), streak logic — badge XP adds here
- `src/components/dashboard/BonusSection.tsx` — Current bonus section with BONUS_DEFS array — replaced by badge collection
- `src/components/dashboard/HeroCard.tsx` — Hero card where goal tracker is added
- `src/components/dashboard/XPBreakdown.tsx` — XP breakdown display where badge XP line is added
- `src/lib/kudos.ts` — Kudos system (getTotalKudos) — needed for social badge checks
- `src/hooks/useGameState.ts` — Game state hook — may need badge state integration

### Phase 1 Context
- `.planning/phases/01-foundation-refactor/01-CONTEXT.md` — Phase 1 decisions, especially D-05 (data-driven BonusSection for Phase 2 extensibility)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `BonusSection.tsx` + `BONUS_DEFS` array: Data-driven bonus definitions with progress tracking — designed in Phase 1 specifically for Phase 2 badge extensibility
- `Section` component: Expandable card wrapper used by all dashboard sections
- `Toast.tsx`: Existing toast notification component — extend for badge celebrations
- `gamify.ts`: XP calculation with breakdown — add badgeXP field to XPBreakdown interface
- `kudos.ts`: getTotalKudos function — needed for social badge condition checks
- shadcn `Popover` component available for goal-setting UI
- shadcn `Slider` component available for target selection

### Established Patterns
- localStorage with `st_` prefix for all client state
- Props-down from App.tsx, no state library
- Color functions (ssColor, rhrColor, hrvColor) for metric-semantic coloring
- CSS keyframe animations already defined in index.css (fadeUp, fadeIn, slideIn, pulse-soft)
- Data-driven rendering pattern (BONUS_DEFS → badge definitions)

### Integration Points
- `App.tsx` passes data/user to DashboardPage → HeroCard, BonusSection — badge/goal state flows through same path
- `calcXPBreakdown` in gamify.ts — add badgeXP to the breakdown interface and total calculation
- `useGameState` hook — may need to include badge state for dashboard consumption
- Toast system in App.tsx (showToast callback) — extend for celebratory badge toasts with confetti

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-badges-and-goals*
*Context gathered: 2026-03-24*
