# Phase 2: Social Competitions and Goals - Research

**Researched:** 2026-03-24
**Domain:** Social competitions (weekly challenges, expanded leaderboard, highlight reel), kudos comments, personal sleep goal tracking — all within existing React/TypeScript/localStorage stack
**Confidence:** HIGH

> **PIVOT NOTE (2026-03-24):** This research was originally written for a static badge system. The badge system was reverted and replaced with social competitions per CONTEXT.md. The user_constraints and phase_requirements sections below reflect the current social competitions scope. Architecture patterns in later sections that reference badges/BadgeSection/badges.ts are SUPERSEDED — refer to CONTEXT.md and the plan files for current architecture (challenges.ts, ChallengeSection.tsx, HighlightReel.tsx).

---

<user_constraints>
## User Constraints (from CONTEXT.md — Social Competitions Pivot)

### Locked Decisions

**Leaderboard Expansion**
- D-01: Leaderboard automatically rotates to the most relevant time period (weekly on weekdays, monthly near month-end) with manual override chips (This Week / This Month / All Time)
- D-02: Leaderboard supports multi-metric sorting via small toggle chips: SS, streak length, XP, improvement trend
- D-03: Streak competition design is Claude's discretion (race bars, milestone callouts, or hybrid)

**Weekly Challenges (BonusSection Evolution)**
- D-04: BonusSection is replaced by a rotating weekly challenge system — random selection from a pool of ~8-10 challenges, seeded by week number so all users see the same challenge
- D-05: Challenge pool includes a mix of individual challenges ("log every day this week", "beat your weekly SS average") and team challenges ("team average SS 80+", "everyone logs 5 days")
- D-06: Completing a challenge earns XP bonus (flat amount) plus a visual flair icon next to the user's name in the leaderboard for that week
- D-07: Challenge XP integrates into calcXPBreakdown, not as a parallel system

**Social Reactions & Fun Facts**
- D-08: Kudos system extended with optional short text comments alongside emoji reactions — shows as a small speech bubble in the leaderboard
- D-09: Weekly highlight reel card displayed prominently above the leaderboard, showing superlatives: records broken, biggest improvements, "Most consistent", "Biggest comeback", etc.
- D-10: Highlight reel is computed from data (not AI-generated), refreshed weekly (Monday start)

**Goal Setting & Tracking**
- D-11: Users set monthly SS targets via a settings/profile area (slider 60-95 range, default suggestion based on last month's average)
- D-12: Goal stored in localStorage as st_goal_{user}_{month}
- D-13: Goal progress appears in leaderboard rows for all users — everyone sees everyone's goal status (social pressure)
- D-14: Goal display format in leaderboard is Claude's discretion (compact chip, sub-row, or other approach that fits existing layout)
- D-15: When no goal is set, the settings area shows a prompt to set one; leaderboard row shows no goal indicator

### Claude's Discretion
- Streak competition visual design (race indicators, milestone callouts, or hybrid)
- Goal progress display format in leaderboard (chip vs sub-row vs inline)
- Challenge pool content (specific challenge definitions and XP amounts)
- Highlight reel card design and superlative categories
- Reaction comment UI (bubble style, max length, display pattern)
- Confetti/celebration for challenge completion
- Week boundary logic (Monday start vs Sunday start)
- How the settings/profile area is accessed (gear icon, user menu, separate page)

### Deferred Ideas (OUT OF SCOPE)
- Badge system (17 achievements across 4 categories) — reverted, could return as future phase
- AI-generated weekly challenges based on team data — keep challenge pool static for now
- Team challenges with multi-week tracking — keep challenges weekly for simplicity
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| BADGE-01 | Weekly challenge engine with rotating challenges seeded by week number | BonusSection.tsx BONUS_DEFS pattern reusable for challenge definitions; getWeekNumber via Date API |
| BADGE-02 | Challenge pool with individual and team challenges | SleepEntry[] supports all computations; NAMES constant for team iteration |
| BADGE-03 | Leaderboard multi-metric sorting (SS, streak, XP, trend) | Leaderboard.tsx already has useMemo sort; extend with sortBy state |
| BADGE-04 | Weekly highlight reel with team superlatives | Computable from SleepEntry[] — max/min/avg/stddev scans |
| BADGE-05 | ChallengeSection UI with progress bar and XP reward | Replaces BonusSection.tsx; Section wrapper component available |
| BADGE-06 | Challenge completion celebration (confetti toast) + flair icon in leaderboard | Extends existing Toast component; CSS-only confetti per project pattern |
| BADGE-07 | Challenge XP integrates into gamify.ts calcXPBreakdown | Extends XPBreakdown interface + calcXPBreakdown function — same pattern as adding any new XP source |
| KUDOS-01 | Kudos extended with optional short text comments | kudos.ts extended with comment key; getKudosFor return type gains comment field |
| GOAL-01 | User can set a personal monthly SS target | localStorage st_goal_{user}_{month} per D-12; Dialog component exists in shadcn |
| GOAL-02 | User sees goal progress (ahead/on-track/behind) in HeroCard and leaderboard rows | Current month entries from data[] + goal from localStorage; status computation is pure function |
</phase_requirements>

---

## Summary

Phase 2 adds social competitions and sleep goals onto the existing gamification stack. The codebase after Phase 1 is well-prepared: `BonusSection.tsx` exists as a data-driven component ready for replacement by `ChallengeSection`, `gamify.ts` has a clean `calcXPBreakdown` interface, and the `Toast` + `useGameState` patterns are established. No new npm packages are required.

The core additions are: (1) a weekly challenge engine in `challenges.ts` with a pool of 8-10 rotating challenges, (2) an expanded leaderboard with multi-metric sorting, goal display, and challenge flair, (3) a highlight reel card with weekly superlatives, (4) kudos with optional text comments, and (5) personal goal tracking in `goals.ts` with HeroCard integration.

The goal tracker integrates into `HeroCard` as a new row. The goal-setting UI requires a slider — `@radix-ui/react-slider` is installed as an npm package but NOT wired up as a shadcn component (no `src/components/ui/slider.tsx` exists). The planner must include a task to run `npx shadcn@latest add slider` before the goal UI task. The `dialog.tsx` shadcn component IS already present.

**Primary recommendation:** Build `src/lib/challenges.ts` as the challenge engine and `src/lib/goals.ts` for goal tracking. Wire challenge XP into `calcXPBreakdown` as a new `challengeXP` field. Add confetti as pure CSS keyframes in `index.css`. Extend kudos.ts with comment support.

---

## Standard Stack

### Core (No New Packages Needed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React useState/useMemo | 19.2.0 | Challenge/goal state, computed leaderboard | Already used everywhere |
| localStorage | Browser API | st_challenge_completed_{user}_{week}, st_goal_{user}_{month} | Established pattern with st_ prefix |
| CSS @keyframes | Browser API | Confetti animation for challenge completion | Project already uses fadeUp/fadeIn/slideIn |
| shadcn Dialog | Installed | Goal setting modal | dialog.tsx already exists in src/components/ui/ |

### UI Components Needing Generation

| Component | Status | Action |
|-----------|--------|--------|
| `src/components/ui/slider.tsx` | Missing — package installed | `npx shadcn@latest add slider` |

**Important:** `@radix-ui/react-slider` (v1.3.6) is in `node_modules` but no shadcn wrapper exists in `src/components/ui/`. The planner must add a task to run `npx shadcn@latest add slider` before the goal UI task.

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| shadcn Slider | Native `<input type="range">` | Native range input works and avoids needing shadcn generation; styled consistently with Tailwind. Viable if shadcn add is undesirable. |
| shadcn Popover | shadcn Dialog (already exists) | Dialog is heavier (full modal) but already wired. For goal-setting on mobile, Dialog may be better UX than a popover. |
| CSS confetti | canvas-confetti npm | npm package is simpler to author but project pattern prefers CSS-only solutions. CSS keyframes only. |

**Installation for slider (if using shadcn):**
```bash
npx shadcn@latest add slider
```

---

## Architecture Patterns

### Recommended Project Structure

```
src/lib/
├── challenges.ts       # Challenge definitions, weekly selection, completion check, XP
├── goals.ts            # Goal storage, status computation
├── gamify.ts           # Extended: XPBreakdown gains challengeXP field
└── kudos.ts            # Extended: comment support alongside emoji

src/components/dashboard/
├── ChallengeSection.tsx # Replaces BonusSection.tsx — weekly challenge display
├── HighlightReel.tsx    # Weekly superlatives card
├── Leaderboard.tsx      # Extended: multi-metric sorting, goal display, flair
├── HeroCard.tsx         # Extended: goal tracker row + goal set dialog
└── XPBreakdown.tsx      # Extended: renders challengeXP line item

src/components/ui/
└── slider.tsx          # Generated via npx shadcn@latest add slider

src/index.css           # Extended: confetti @keyframes added
```

> **SUPERSEDED SECTIONS BELOW:** The following patterns (1-4, 7) were written for the original badge system. They are retained as historical reference but are NOT the current architecture. For current patterns, see CONTEXT.md decisions and plan files (02-01-PLAN.md through 02-03-PLAN.md).

### Pattern 1: Badge Definition Structure (SUPERSEDED — see challenges.ts in 02-01-PLAN.md)

Each badge is a plain object with an `id`, display metadata, and a pure `check` function that takes `SleepEntry[]` + `name` + kudos counts and returns `{ earned: boolean; progress: number; target: number; hint: string }`.

```typescript
// src/lib/badges.ts — SUPERSEDED by src/lib/challenges.ts
export interface BadgeDef {
  id: string;          // unique key, e.g. 'week_warrior'
  category: 'consistency' | 'quality' | 'social' | 'fun';
  icon: string;        // emoji
  name: string;
  xp: number;          // always 25 per D-06
  check: (data: SleepEntry[], name: string) => BadgeStatus;
}

export interface BadgeStatus {
  earned: boolean;
  progress: number;   // 0 to target
  target: number;     // denominator for progress bar
  hint: string;       // shown on locked badge tap
}
```

This extends the existing `BonusDef` pattern from `BonusSection.tsx` — same shape, richer fields.

### Pattern 2: Earned Badge Persistence (SUPERSEDED)

```typescript
// In badges.ts — SUPERSEDED
const BADGES_KEY = (user: string) => `st_badges_${user}`;

export function getEarnedBadgeIds(user: string): string[] {
  try {
    return JSON.parse(localStorage.getItem(BADGES_KEY(user)) || '[]');
  } catch { return []; }
}

export function saveEarnedBadge(user: string, id: string): void {
  try {
    const current = getEarnedBadgeIds(user);
    if (!current.includes(id)) {
      localStorage.setItem(BADGES_KEY(user), JSON.stringify([...current, id]));
    }
  } catch {}
}
```

Follows the `try/catch` + empty catch block pattern established in `kudos.ts` and `gamify.ts`.

### Pattern 3: New Unlock Detection (SUPERSEDED — challenge completion detection in 02-02-PLAN.md)

The check runs in `DashboardPage` (or a new hook) after `data` loads and after submit. It computes currently earned badges from live data, diffs against the localStorage-saved list, and queues toasts for new ones.

```typescript
// Pseudocode — SUPERSEDED by challenge completion detection in DashboardPage
function checkForNewBadges(data: SleepEntry[], user: string, showToast: (msg: string) => void) {
  const previouslyEarned = new Set(getEarnedBadgeIds(user));
  const nowEarned = BADGE_DEFS
    .filter(def => def.check(data, user).earned)
    .map(def => def.id);

  const newlyEarned = nowEarned.filter(id => !previouslyEarned.has(id));

  // Save all current earned badges atomically
  // Queue sequential toasts per D-11
  newlyEarned.forEach((id, i) => {
    setTimeout(() => {
      const def = BADGE_DEFS.find(d => d.id === id)!;
      saveEarnedBadge(user, id);
      showToast(`${def.icon} ${def.name} +25 XP`); // badge toast message
    }, i * 1200); // stagger by 1.2s each
  });
}
```

The existing `showToast` in `App.tsx` has a 2500ms auto-hide. For badge toasts D-09 specifies 4-5 seconds — the Toast component or showToast timeout will need to accept an optional duration parameter.

### Pattern 4: XPBreakdown Extension (CURRENT — field renamed from badgeXP to challengeXP)

```typescript
// gamify.ts — extend XPBreakdown interface
export interface XPBreakdown {
  base: number;
  bonusSS: number;
  streakBonus: number;
  goodSleepBonus: number;
  kudosXP: number;
  challengeXP: number;   // NEW — from weekly challenge completion
  spent: number;
  total: number;
}
```

`calcXPBreakdown` imports `getChallengeXP` from `challenges.ts` and adds `challengeXP` to the total. This is a pure function addition with no side effects.

### Pattern 5: Goal Storage and Status Computation (CURRENT)

```typescript
// Goal key: st_goal_{user}_{month} where month = 'YYYY-MM'
// Value: number (target SS, 60-95)

function getGoal(user: string, month: string): number | null {
  try {
    const v = localStorage.getItem(`st_goal_${user}_${month}`);
    return v ? parseInt(v) : null;
  } catch { return null; }
}

// Goal status computation
type GoalStatusLabel = 'ahead' | 'on-track' | 'behind';

function computeGoalStatus(
  entries: SleepEntry[],  // current month entries for user
  target: number,
  daysInMonth: number,
  today: number           // day-of-month (1-based)
): GoalStatusLabel {
  if (!entries.length) return 'on-track'; // no data yet, assume on-track
  const currentAvg = entries.reduce((s, e) => s + e.ss, 0) / entries.length;
  const delta = currentAvg - target;
  if (delta >= 2) return 'ahead';
  if (delta >= -2) return 'on-track';
  return 'behind';
}
```

### Pattern 6: CSS Confetti (No npm) (CURRENT)

Add to `src/index.css`. Confetti uses absolutely-positioned pseudo-elements or a container div with multiple `<span>` children animated via CSS transforms.

```css
/* src/index.css — confetti particle burst */
@keyframes confetti-fall {
  0%   { opacity: 1; transform: translate(0, 0) rotate(0deg); }
  100% { opacity: 0; transform: translate(var(--dx), 60px) rotate(var(--rot)); }
}
```

Rendered via a React component that maps an array of 12 particles with randomized positions, animation-delay, and color values. Component mounts on challenge completion, removes itself after animation completes.

### Pattern 7: Badge Grid Layout (SUPERSEDED — replaced by ChallengeSection)

```tsx
// BadgeSection.tsx — SUPERSEDED by ChallengeSection.tsx
// See 02-02-PLAN.md for ChallengeSection implementation
```

### Anti-Patterns to Avoid

- **Challenge XP as a separate calculation:** D-07 is explicit — challenge XP must flow through `calcXPBreakdown`. Do NOT add a separate `calcChallengeXP()` call in the component.
- **Multiple toast system:** Do not introduce `sonner` or a second toast system. Extend the existing `Toast` component in `src/components/shared/Toast.tsx` (single `msg: string`, `show: boolean` props — extend to accept optional `confetti` and `duration`).
- **Using native slider without Tailwind styling:** If choosing native `<input type="range">` over shadcn Slider, it must be styled with Tailwind CSS to match the design system. Unstyled native inputs will look wrong.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Slider for goal | Custom drag interaction | shadcn Slider (`npx shadcn@latest add slider`) or native `<input type="range">` | Complex touch handling, accessibility |
| Modal for goal setting | Custom overlay + click-outside | shadcn `Dialog` (already at `src/components/ui/dialog.tsx`) | Already wired |
| Date calculations for challenges | Custom date math | `date-fns` (^4.1.0 installed) | Handles month boundaries, week calculations, timezone edge cases |

**Key insight:** The project has already paid the cost of installing shadcn/Radix primitives. Use what's there before reaching for custom solutions or new packages.

---

## Common Pitfalls

### Pitfall 1: Toast Duration Mismatch

**What goes wrong:** Existing `showToast` in `App.tsx` hides after 2500ms. Challenge completion celebration needs 4-5 seconds. Using the existing `showToast` cuts off the celebration.

**Why it happens:** `showToast` has hardcoded `setTimeout(..., 2500)`.

**How to avoid:** Extend `showToast` signature to `showToast(msg: string, opts?: { confetti?: boolean; duration?: number })` with `duration` defaulting to 2500ms. Challenge completion calls use `showToast(msg, { confetti: true, duration: 4500 })`. Pass the extended signature down from `App.tsx`.

**Warning signs:** Toast flashes briefly and disappears before user can read it.

### Pitfall 2: Slider Component Not Available

**What goes wrong:** Planner adds task to build goal UI with `<Slider>` but `src/components/ui/slider.tsx` doesn't exist. Implementation fails at import.

**Why it happens:** `@radix-ui/react-slider` is installed as an npm package but the shadcn wrapper was not generated. Phase 1 cleanup (ARCH-08) removed unused shadcn files.

**How to avoid:** Wave 0 of the plan MUST include `npx shadcn@latest add slider`. Alternatively, use native `<input type="range" min={60} max={95} />` styled with Tailwind to avoid this dependency.

**Warning signs:** `Module not found: '@/components/ui/slider'` at build time.

### Pitfall 3: GoalTracker refreshKey vs useMemo

**What goes wrong:** GoalTracker uses a local `refreshKey` counter to force re-render after goal changes, but `gameState.goal` comes from `useMemo` with deps `[data, user]`. The refreshKey counter does not invalidate the useMemo.

**How to avoid:** GoalTracker should call `goalStatus(data, user)` directly rather than relying on `gameState.goal`, or accept `data` and `user` as props and compute goal status locally. This bypasses the stale useMemo cache.

### Pitfall 4: kudos.ts getTotalKudosGiven

**What goes wrong:** Kudos comment features need `getTotalKudosGiven(from)` function. `kudos.ts` only has `getTotalKudos(to)` for kudos received.

**How to avoid:** Add `getTotalKudosGiven(from: string): number` to `kudos.ts`. Pattern mirrors `getTotalKudos`: scan localStorage keys matching `st_kudos_*` and count where the `_from_` segment matches.

---

## Runtime State Inventory

> Phase 2 is a greenfield feature addition. New localStorage keys: `st_challenge_completed_{user}_{week}`, `st_challenge_celebrated_{user}_{week}`, `st_goal_{user}_{month}`, `st_kudos_comment_{date}_{from}_{to}`.

---

## Environment Availability

Step 2.6: SKIPPED — Phase 2 is purely code changes. No external services, databases, or CLI tools beyond the existing npm toolchain are required. All dependencies are already installed.

Caveat: `npx shadcn@latest add slider` will be run as a task. This requires npm and network access, both available in this environment.

---

## Validation Architecture

### Test Framework

Vitest is installed with test helpers in `src/lib/__tests__/setup.ts`.

| Property | Value |
|----------|-------|
| Framework | vitest |
| Config file | vitest.config.ts |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run` |

### Phase Requirements - Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| BADGE-01 | Weekly challenge engine deterministic selection | unit | `npx vitest run src/lib/__tests__/challenges.test.ts` | Plan 02-01 creates |
| BADGE-02 | Challenge pool individual + team check functions | unit | `npx vitest run src/lib/__tests__/challenges.test.ts` | Plan 02-01 creates |
| BADGE-05 | ChallengeSection renders progress and XP | manual | visual check in browser | N/A |
| BADGE-06 | Confetti toast fires on challenge completion | manual | visual check in browser | N/A |
| BADGE-07 | calcXPBreakdown includes challengeXP and total is correct | unit | `npx vitest run src/lib/__tests__/challenges.test.ts` | Plan 02-01 creates |
| KUDOS-01 | Kudos comments stored and displayed | manual | visual check in browser | N/A |
| GOAL-01 | Goal stored in localStorage as `st_goal_{user}_{month}` | unit | `npx vitest run src/lib/__tests__/goals.test.ts` | Plan 02-01 creates |
| GOAL-02 | Goal status (ahead/on-track/behind) computed correctly | unit | `npx vitest run src/lib/__tests__/goals.test.ts` | Plan 02-01 creates |

### Sampling Rate
- **Per task commit:** `npx vitest run src/lib/__tests__/challenges.test.ts src/lib/__tests__/goals.test.ts`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

---

## Sources

### Primary (HIGH confidence)

- Direct code inspection: `src/lib/gamify.ts` — verified XPBreakdown interface, calcXPBreakdown function signature
- Direct code inspection: `src/components/dashboard/BonusSection.tsx` — verified BonusDef interface, BONUS_DEFS pattern
- Direct code inspection: `src/lib/kudos.ts` — verified getTotalKudos, confirmed missing getTotalKudosGiven
- Direct code inspection: `src/components/shared/Toast.tsx` — verified current Toast API (msg + show only)
- Direct code inspection: `src/App.tsx` — verified showToast pattern (2500ms hardcoded)
- Direct code inspection: `package.json` — verified @radix-ui packages installed vs shadcn wrappers present
- Direct code inspection: `src/components/ui/` listing — confirmed slider.tsx absent
- Direct code inspection: `src/index.css` — verified existing @keyframes (fadeUp, fadeIn, slideIn, pulse-soft)
- Direct code inspection: `src/hooks/useGameState.ts` — verified GameState interface, useMemo pattern
- Direct code inspection: `GAMIFICATION.md` — authoritative XP rules document

### Secondary (MEDIUM confidence)

- `@radix-ui/react-slider` v1.3.6 confirmed via `npm view` — package available in registry, shadcn add command will work

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages verified against package.json and node_modules
- Architecture patterns: HIGH — derived from direct inspection of existing source files
- Challenge/goal conditions: HIGH — requirements are explicit; computation patterns are straightforward
- Pitfalls: HIGH — derived from actual code review of integration points

**Research date:** 2026-03-24
**Updated:** 2026-03-24 (pivot from badges to social competitions)
**Valid until:** 2026-06-24 (stable stack; only risk is shadcn CLI version changes)
