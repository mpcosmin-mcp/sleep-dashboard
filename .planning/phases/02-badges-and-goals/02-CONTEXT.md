# Phase 2: Social Competitions + Goals - Context

**Gathered:** 2026-03-24 (updated — pivot from badges to social competitions)
**Status:** Ready for planning

<domain>
## Phase Boundary

Social competition features and personal sleep score targets. Users engage through an expanded leaderboard (multi-metric, time-period rotation), weekly challenges (replacing static bonuses), enhanced reactions with optional comments, a weekly highlight reel, and personal monthly SS goals visible in the leaderboard. Existing gamification (XP, streaks, kudos) continues to work with new features integrated.

</domain>

<decisions>
## Implementation Decisions

### Leaderboard Expansion
- **D-01:** Leaderboard automatically rotates to the most relevant time period (weekly on weekdays, monthly near month-end) with manual override chips (This Week / This Month / All Time)
- **D-02:** Leaderboard supports multi-metric sorting via small toggle chips: SS, streak length, XP, improvement trend
- **D-03:** Streak competition design is Claude's discretion (race bars, milestone callouts, or hybrid)

### Weekly Challenges (BonusSection Evolution)
- **D-04:** BonusSection is replaced by a rotating weekly challenge system — random selection from a pool of ~8-10 challenges, seeded by week number so all users see the same challenge
- **D-05:** Challenge pool includes a mix of individual challenges ("log every day this week", "beat your weekly SS average") and team challenges ("team average SS 80+", "everyone logs 5 days")
- **D-06:** Completing a challenge earns XP bonus (flat amount) plus a visual flair icon next to the user's name in the leaderboard for that week
- **D-07:** Challenge XP integrates into calcXPBreakdown, not as a parallel system

### Social Reactions & Fun Facts
- **D-08:** Kudos system extended with optional short text comments alongside emoji reactions — shows as a small speech bubble in the leaderboard
- **D-09:** Weekly highlight reel card displayed prominently above the leaderboard, showing superlatives: records broken, biggest improvements, "Most consistent", "Biggest comeback", etc.
- **D-10:** Highlight reel is computed from data (not AI-generated), refreshed weekly (Monday start)

### Goal Setting & Tracking
- **D-11:** Users set monthly SS targets via a settings/profile area (slider 60-95 range, default suggestion based on last month's average)
- **D-12:** Goal stored in localStorage as st_goal_{user}_{month}
- **D-13:** Goal progress appears in leaderboard rows for all users — everyone sees everyone's goal status (social pressure)
- **D-14:** Goal display format in leaderboard is Claude's discretion (compact chip, sub-row, or other approach that fits existing layout)
- **D-15:** When no goal is set, the settings area shows a prompt to set one; leaderboard row shows no goal indicator

### Claude's Discretion
- Streak competition visual design (race indicators, milestone callouts, or hybrid)
- Goal progress display format in leaderboard (chip vs sub-row vs inline)
- Challenge pool content (specific challenge definitions and XP amounts)
- Highlight reel card design and superlative categories
- Reaction comment UI (bubble style, max length, display pattern)
- Confetti/celebration for challenge completion
- Week boundary logic (Monday start vs Sunday start)
- How the settings/profile area is accessed (gear icon, user menu, separate page)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Gamification Rules
- `GAMIFICATION.md` — XP earning/spending rules, streak rules, kudos rules, color system — challenge XP and goal systems must integrate with these rules

### Requirements
- `.planning/REQUIREMENTS.md` §Sleep Goals — GOAL-01, GOAL-02 goal requirements (still active)

### Source Files (integration points)
- `src/lib/gamify.ts` — XP calculation (calcXPBreakdown), streak logic (loggingStreak) — challenge XP adds here
- `src/components/dashboard/Leaderboard.tsx` — Current leaderboard: SS-sorted, kudos, level/tier display — primary extension point for multi-metric, time periods, goal display
- `src/components/dashboard/BonusSection.tsx` — Current bonus section with BONUS_DEFS array — replaced by challenges
- `src/components/dashboard/HeroCard.tsx` — Hero card (goal prompt removed in favor of leaderboard integration)
- `src/components/dashboard/XPBreakdown.tsx` — XP breakdown display where challenge XP line is added
- `src/lib/kudos.ts` — Kudos system (getKudos, saveKudos, getKudosFor, getTotalKudos) — extended with comment text
- `src/hooks/useGameState.ts` — Game state hook — may need challenge and goal state integration
- `src/components/shared/Toast.tsx` — Toast for challenge completion celebrations

### Phase 1 Context
- `.planning/phases/01-foundation-refactor/01-CONTEXT.md` — Phase 1 decisions, especially D-05 (data-driven BonusSection for extensibility)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `Leaderboard.tsx`: Already renders per-person rows with medal, avatar, level badge, streak, SS, kudos — extend for multi-metric, goal display, time periods
- `BonusSection.tsx` + `BONUS_DEFS`: Data-driven bonus array with progress tracking — pattern reusable for challenge definitions
- `kudos.ts`: Full kudos CRUD (getKudos, saveKudos, getKudosFor, getTotalKudos) — extend for comment text
- `Toast.tsx`: Toast notification component — reuse for challenge completion
- `Section` component: Expandable card wrapper for dashboard sections
- shadcn `Slider`, `Dialog`, `Popover`, `Tabs` components available
- CSS keyframe animations in index.css (fadeUp, fadeIn, slideIn, pulse-soft)

### Established Patterns
- localStorage with `st_` prefix for all client state
- Props-down from App.tsx, no state library
- Data-driven rendering (BONUS_DEFS array → rendered list)
- useMemo for computed values (leaderboard already memoized)
- Color functions (ssColor, rhrColor, hrvColor) for metric-semantic coloring
- NAMES constant for team member iteration

### Integration Points
- `App.tsx` passes data/user to DashboardPage → Leaderboard, BonusSection — challenge/goal state flows through same path
- `calcXPBreakdown` in gamify.ts — add challengeXP to the breakdown interface and total calculation
- `useGameState` hook — include challenge and goal state for dashboard consumption
- Toast system in App.tsx (showToast callback) — use for challenge completions

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches

</specifics>

<deferred>
## Deferred Ideas

- Badge system (17 achievements across 4 categories) — reverted, could return as future phase if team wants collectibles
- AI-generated weekly challenges based on team data — keep challenge pool static for now, AI generation could enhance in Phase 3
- Team challenges with multi-week tracking — keep challenges weekly for simplicity

</deferred>

---

*Phase: 02-badges-and-goals*
*Context gathered: 2026-03-24 (updated)*
