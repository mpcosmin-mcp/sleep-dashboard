# Phase 2: Badges and Goals - Research

**Researched:** 2026-03-24
**Domain:** Achievement badge system, celebratory notifications, personal sleep goal tracking — all within existing React/TypeScript/localStorage stack
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Badge Presentation**
- D-01: BonusSection is replaced by a full Badge Collection section in the dashboard — BONUS_DEFS evolves into badge definitions
- D-02: Compact grid layout — small circular/square badge icons, 4 per row. Earned badges are colorful, locked are greyed out
- D-03: Tapping a badge shows name + progress in a tooltip or small popup
- D-04: Section header shows earned count (e.g., "Badges (4/16 earned)")

**Badge XP Integration**
- D-05: Badge XP appears as a new line in the existing XP breakdown ("Badge XP +75")
- D-06: Flat 25 XP per badge regardless of difficulty — 16 badges = 400 XP max (~4 extra levels)
- D-07: Badge XP integrates into gamify.ts via calcXPBreakdown, not as a parallel system

**Unlock Celebrations**
- D-08: Toast notification with badge icon, name, and "+25 XP" text, plus CSS confetti particle burst — no npm dependency for confetti
- D-09: Toast disappears after 4-5 seconds, confetti uses CSS keyframe animations
- D-10: Badge checks run on data load and after entry submit — compare against localStorage list of earned badges (st_badges_{user}) to detect new unlocks
- D-11: Multiple simultaneous unlocks are queued as sequential toasts

**Goal Setting & Tracking**
- D-12: Goal tracker lives inside HeroCard — shows monthly SS target, current average, and on-track/behind status
- D-13: Tapping the goal area opens a popover/dialog with a slider (60-95 range), default suggestion based on last month's average
- D-14: Goal stored in localStorage as st_goal_{user}_{month}
- D-15: When no goal is set, HeroCard shows a subtle "Set a monthly target ->" prompt

### Claude's Discretion
- Badge progress hints for locked badges (progress bar, hint text, or hidden)
- Goal status visual design (color-coded progress bar + text, emoji indicators, or hybrid)
- Exact badge icon/emoji choices per badge
- Confetti particle animation details (colors, particle count, spread)
- Badge popup/tooltip design details
- How badge definitions are structured in code (extending BONUS_DEFS or new module)

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| BADGE-01 | User can earn consistency badges: First Log, Week Warrior (7d streak), Month Master (30d streak), Quarter Legend (90d streak) | loggingStreak() in gamify.ts provides streak.days; data.filter(name).length provides total logs — both available |
| BADGE-02 | User can earn quality badges: Sweet Dreams (SS >= 90 single day), Dream Week (7 consecutive days SS >= 85), Personal Best (new all-time high SS, lowest RHR, highest HRV) | SleepEntry[] array supports all these computations; Personal Best requires sorted max/min scan |
| BADGE-03 | User can earn social badges: First Kudos (give first kudos), Cheerleader (30 kudos given), Fan Favorite (50 kudos received), Team MVP (most kudos received in a month) | kudos.ts provides getTotalKudos(to) for received; need a parallel getTotalKudosGiven(from) function |
| BADGE-04 | User can earn fun/surprise badges: Night Owl (SS < 60 three times in a week), Comeback Kid (SS improves 15+ points week-over-week), Weekend Warrior (best SS consistently on weekends), Steady Eddie (SS within 3-point range for 7 days) | All computable from SleepEntry[]; weekend detection via Date.getDay() |
| BADGE-05 | User sees a badge collection/gallery showing earned and locked badges | Replaces BonusSection.tsx per D-01; grid layout per D-02 |
| BADGE-06 | User receives a celebratory notification (toast + confetti) when unlocking a new badge | Extends existing Toast component in App.tsx; CSS-only confetti per D-08 |
| BADGE-07 | Badge XP integrates into the existing XP system through gamify.ts | Extends XPBreakdown interface + calcXPBreakdown function in gamify.ts per D-07 |
| GOAL-01 | User can set a personal monthly SS target (e.g., "average SS >= 85 this month") | localStorage st_goal_{user}_{month} per D-14; Dialog component exists in shadcn (dialog.tsx present) |
| GOAL-02 | User can see progress toward their goal with on-track/behind/ahead status and trajectory visualization | Current month entries from data[] + goal from localStorage; trajectory = projected average using current data |
</phase_requirements>

---

## Summary

Phase 2 adds badges and sleep goals onto the existing gamification stack. The codebase after Phase 1 is well-prepared: `BonusSection.tsx` exists as a data-driven component ready for evolution into a badge collection, `gamify.ts` has a clean `calcXPBreakdown` interface, and the `Toast` + `useGameState` patterns are established. No new npm packages are required.

The most significant architectural decision is where badge state lives. Badge definitions (what each badge requires) live in code; earned badge state (which badges a user has unlocked) lives in localStorage under `st_badges_{user}`. The check function runs on data load and after entry submit, diffs against localStorage, and fires sequential toasts for new unlocks. This is the same pattern already used for kudos and streak repairs.

The goal tracker integrates into `HeroCard` as a new row. The goal-setting UI requires a slider — `@radix-ui/react-slider` is installed as an npm package but NOT wired up as a shadcn component (no `src/components/ui/slider.tsx` exists). Similarly `@radix-ui/react-popover` is installed but not wired. The planner must include tasks to generate these shadcn components or build custom equivalents. The `dialog.tsx` shadcn component IS already present as an alternative goal-entry approach.

**Primary recommendation:** Build `src/lib/badges.ts` as the single home for badge definitions and evaluation logic (analogous to `gamify.ts` for XP). Keep badge state in localStorage. Wire badge XP into `calcXPBreakdown` as a new `badgeXP` field. Add confetti as pure CSS keyframes in `index.css`.

---

## Standard Stack

### Core (No New Packages Needed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React useState/useMemo | 19.2.0 | Badge state, computed earned list | Already used everywhere |
| localStorage | Browser API | st_badges_{user}, st_goal_{user}_{month} | Established pattern with st_ prefix |
| CSS @keyframes | Browser API | Confetti animation per D-09 | Project already uses fadeUp/fadeIn/slideIn |
| shadcn Dialog | Installed | Goal setting modal alternative | dialog.tsx already exists in src/components/ui/ |
| Radix Tooltip | ^1.2.8 in package.json | Badge name popup on tap per D-03 | tooltip.tsx already installed |

### UI Components Needing Generation

| Component | Status | Action |
|-----------|--------|--------|
| `src/components/ui/slider.tsx` | Missing — package installed | `npx shadcn@latest add slider` |
| `src/components/ui/popover.tsx` | Missing — package installed | `npx shadcn@latest add popover` (optional — Dialog may suffice) |

**Important:** `@radix-ui/react-slider` (v1.3.6) and `@radix-ui/react-popover` (v1.1.15) are in `node_modules` but no shadcn wrapper exists in `src/components/ui/`. The planner must add a Wave 0 task to run `npx shadcn@latest add slider` before the goal UI task.

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| shadcn Slider | Native `<input type="range">` | Native range input works and avoids needing shadcn generation; styled consistently with Tailwind. Viable if shadcn add is undesirable. |
| shadcn Popover | shadcn Dialog (already exists) | Dialog is heavier (full modal) but already wired. For goal-setting on mobile, Dialog may be better UX than a popover. |
| CSS confetti | canvas-confetti npm | npm package is simpler to author but D-08 explicitly forbids npm dependency. CSS keyframes only. |

**Installation for slider (if using shadcn):**
```bash
npx shadcn@latest add slider
```

---

## Architecture Patterns

### Recommended Project Structure

```
src/lib/
├── badges.ts           # Badge definitions, evaluation logic, localStorage I/O
└── gamify.ts           # Extended: XPBreakdown gains badgeXP field

src/components/dashboard/
├── BadgeSection.tsx    # Replaces BonusSection.tsx — grid of earned/locked badges
├── HeroCard.tsx        # Extended: goal tracker row added
└── XPBreakdown.tsx     # Extended: renders badgeXP line item

src/components/ui/
└── slider.tsx          # Generated via npx shadcn@latest add slider (Wave 0 task)

src/index.css           # Extended: confetti @keyframes added
```

### Pattern 1: Badge Definition Structure

Each badge is a plain object with an `id`, display metadata, and a pure `check` function that takes `SleepEntry[]` + `name` + kudos counts and returns `{ earned: boolean; progress: number; target: number; hint: string }`.

```typescript
// src/lib/badges.ts
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

### Pattern 2: Earned Badge Persistence

```typescript
// In badges.ts
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

### Pattern 3: New Unlock Detection (D-10)

The check runs in `DashboardPage` (or a new hook) after `data` loads and after submit. It computes currently earned badges from live data, diffs against the localStorage-saved list, and queues toasts for new ones.

```typescript
// Pseudocode — actual implementation detail for planner
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

### Pattern 4: XPBreakdown Extension (D-07)

```typescript
// gamify.ts — extend XPBreakdown interface
export interface XPBreakdown {
  base: number;
  bonusSS: number;
  streakBonus: number;
  goodSleepBonus: number;
  kudosXP: number;
  badgeXP: number;   // NEW — flat 25 XP per earned badge
  spent: number;
  total: number;
}
```

`calcXPBreakdown` imports `getEarnedBadgeIds` from `badges.ts` and adds `badgeXP = earnedCount * 25` to the total. This is a pure function addition with no side effects.

### Pattern 5: Goal Storage and Status Computation

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
type GoalStatus = 'ahead' | 'on-track' | 'behind' | 'no-data';

function computeGoalStatus(
  entries: SleepEntry[],  // current month entries for user
  target: number,
  daysInMonth: number,
  today: number           // day-of-month (1-based)
): GoalStatus {
  if (!entries.length) return 'no-data';
  const currentAvg = entries.reduce((s, e) => s + e.ss, 0) / entries.length;
  const expectedByNow = target; // linear: if on track, avg should be ~= target throughout
  const delta = currentAvg - expectedByNow;
  if (delta >= 3) return 'ahead';
  if (delta >= -3) return 'on-track';
  return 'behind';
}
```

### Pattern 6: CSS Confetti (No npm)

Add to `src/index.css`. Confetti uses absolutely-positioned pseudo-elements or a container div with multiple `<span>` children animated via CSS transforms.

```css
/* src/index.css — confetti particle burst */
@keyframes confetti-fall {
  0%   { transform: translateY(-20px) rotate(0deg) scale(1); opacity: 1; }
  80%  { opacity: 1; }
  100% { transform: translateY(60px) rotate(720deg) scale(0.5); opacity: 0; }
}

.confetti-particle {
  position: absolute;
  width: 6px;
  height: 6px;
  border-radius: 1px;
  animation: confetti-fall 1.2s ease-out forwards;
  pointer-events: none;
}
```

Rendered via a React component that maps an array of 12-16 particles with randomized `left`, `animation-delay`, and color values. Component mounts on unlock, removes itself after animation completes (`onAnimationEnd`).

### Pattern 7: Badge Grid Layout (D-02, D-03)

```tsx
// BadgeSection.tsx — 4-per-row grid
<div className="grid grid-cols-4 gap-2 pt-2">
  {BADGE_DEFS.map(def => {
    const status = def.check(data, user);
    const isEarned = earnedIds.has(def.id);
    return (
      <Tooltip key={def.id}>
        <TooltipTrigger>
          <div className={`flex flex-col items-center gap-0.5 p-2 rounded-lg cursor-pointer
            ${isEarned ? 'bg-amber-50' : 'bg-muted/30 opacity-50 grayscale'}`}>
            <span className="text-xl">{def.icon}</span>
            <span className="text-[8px] font-bold text-center leading-tight">{def.name}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          {isEarned ? `Earned! +25 XP` : status.hint}
          {!isEarned && <div className="text-[9px]">{status.progress}/{status.target}</div>}
        </TooltipContent>
      </Tooltip>
    );
  })}
</div>
```

The `Tooltip` component (`tooltip.tsx`) is already installed and uses `@radix-ui/react-tooltip` which is in `package.json`.

### Anti-Patterns to Avoid

- **Badge XP as a separate calculation:** D-07 is explicit — badge XP must flow through `calcXPBreakdown`. Do NOT add a separate `calcBadgeXP()` call in the component.
- **Checking badges on every render:** Badge checking should happen in a `useEffect` triggered by `data` changes, not inline in render. Computing earned status for the grid IS fine in render (pure computation from data); the "detect NEW unlocks and show toast" path must be in `useEffect`.
- **Storing computed badge status in localStorage:** Only store the earned badge IDs list. Badge status is always recomputed from live data. This avoids stale state bugs.
- **Multiple toast system:** Do not introduce `sonner` or a second toast system. Extend the existing `Toast` component in `src/components/shared/Toast.tsx` (single `msg: string`, `show: boolean` props — extend to accept optional `duration`).
- **Using native slider without Tailwind styling:** If choosing native `<input type="range">` over shadcn Slider, it must be styled with Tailwind CSS to match the design system. Unstyled native inputs will look wrong.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Tooltip on badge tap | Custom hover/click state popup | `Tooltip` from `@/components/ui/tooltip` | Already installed, handles positioning, keyboard access, portal |
| Slider for goal | Custom drag interaction | shadcn Slider (`npx shadcn@latest add slider`) or native `<input type="range">` | Complex touch handling, accessibility |
| Modal for goal setting | Custom overlay + click-outside | shadcn `Dialog` (already at `src/components/ui/dialog.tsx`) | Already wired |
| Date calculations for badges | Custom date math | `date-fns` (^4.1.0 installed) | Handles month boundaries, week calculations, timezone edge cases |
| Personal Best tracking | Custom history scanner | Computed from `SleepEntry[]` on each check | Data is already in memory; no additional store needed |

**Key insight:** The project has already paid the cost of installing shadcn/Radix primitives. Use what's there before reaching for custom solutions or new packages.

---

## Badge Definitions — Complete Inventory

All 16 badges across 4 categories (per REQUIREMENTS.md BADGE-01 through BADGE-04):

### Consistency (4 badges)
| Badge | Condition | Progress Metric |
|-------|-----------|-----------------|
| First Log | data.filter(name).length >= 1 | 0/1 logs |
| Week Warrior | streak.days >= 7 | streak.days/7 |
| Month Master | streak.days >= 30 | streak.days/30 |
| Quarter Legend | streak.days >= 90 | streak.days/90 |

Note: "Quarter Legend" requires a 90-day streak. With the current team of 3 starting fresh, this badge will be aspirational. It should still be defined and displayed.

### Quality (4 badges)
| Badge | Condition | Progress Metric |
|-------|-----------|-----------------|
| Sweet Dreams | any single entry with ss >= 90 | boolean (0/1) |
| Dream Week | 7 consecutive entries with ss >= 85 | consecutive run / 7 |
| Personal Best SS | current all-time high ss (new record) | current max / personal max |
| Personal Best RHR | current all-time low rhr | current min rhr |

Note: "Personal Best" for HRV is mentioned in requirements. The requirement says "new all-time high SS, lowest RHR, highest HRV" — this should be 3 separate badges OR one combined badge. Decision is Claude's discretion. Recommend: one "Personal Best" badge per metric = 3 badges (SS PB, RHR PB, HRV PB), but this expands the count to 18. Alternative: one "Personal Best" badge that unlocks when any metric hits its personal best. Planner should choose; either is valid.

### Social (4 badges)
| Badge | Condition | Data Source |
|-------|-----------|-------------|
| First Kudos | given at least 1 kudos ever | new `getTotalKudosGiven(from)` needed in kudos.ts |
| Cheerleader | given >= 30 kudos | same function |
| Fan Favorite | received >= 50 kudos | existing `getTotalKudos(to)` in kudos.ts |
| Team MVP | most kudos received in current month | new monthly scan needed in kudos.ts |

**Important gap:** `kudos.ts` has `getTotalKudos(to)` (all-time received) but NO function for kudos given. The planner needs a "add `getTotalKudosGiven(from: string): number`" task. This function scans localStorage keys matching `st_kudos_*_{from}_*` pattern.

Also, "Team MVP" requires cross-user comparison: who has most kudos received THIS month. The kudos key format is `st_kudos_{date}_{from}_{to}`. Monthly kudos for a user = count keys where date starts with `YYYY-MM` and key ends with `_{user}`.

### Fun/Surprise (4 badges)
| Badge | Condition | Notes |
|-------|-----------|-------|
| Night Owl | ss < 60 on 3+ days within any rolling 7-day window | requires sliding window scan |
| Comeback Kid | week-over-week SS improves >= 15 points (7-day avg) | compare last 7 days avg vs prior 7 days avg |
| Weekend Warrior | average weekend SS > average weekday SS over last 30 entries | Date.getDay() === 0 or 6 |
| Steady Eddie | SS stays within 3-point range for any 7 consecutive days | max - min <= 3 in sliding window |

---

## Common Pitfalls

### Pitfall 1: Badge Check on Stale localStorage vs Fresh Data

**What goes wrong:** Badge check runs before `data` is loaded. `getEarnedBadgeIds` returns empty array. On first load with empty data, no new badges detected. After data loads, check never re-runs. User misses notifications.

**Why it happens:** `useEffect` dependency array doesn't include `data`.

**How to avoid:** The badge check effect MUST depend on `data`. `useEffect(() => { checkForNewBadges(...) }, [data, user])`. The check is idempotent — re-running when data hasn't changed is safe because `saveEarnedBadge` deduplicates.

**Warning signs:** Badges appear in the grid (computed from live data) but toast never fires on first visit.

### Pitfall 2: Toast Duration Mismatch

**What goes wrong:** Existing `showToast` in `App.tsx` hides after 2500ms. D-09 specifies 4-5 seconds for badge toasts. Using the existing `showToast` cuts off the badge celebration.

**Why it happens:** `showToast` has hardcoded `setTimeout(..., 2500)`.

**How to avoid:** Extend `showToast` signature to `showToast(msg: string, duration?: number)` with `duration` defaulting to 2500ms. Badge calls use `showToast(msg, 4500)`. Pass the extended signature down from `App.tsx`.

**Warning signs:** Toast flashes briefly and disappears before user can read it.

### Pitfall 3: badgeXP Causes XP Total Double-Count

**What goes wrong:** `calcXPBreakdown` calls `getEarnedBadgeIds` which reads localStorage. But `getEarnedBadgeIds` is set DURING the same render cycle when new badges fire. Race condition: badge detected as new → toast queued → `saveEarnedBadge` called in timeout → next render of `calcXPBreakdown` picks up new badge → XP increases → level might change mid-celebration.

**Why it happens:** localStorage writes and React renders are not coordinated.

**How to avoid:** This is actually the desired behavior (badge earned → XP increases → user sees level up). The sequence is correct — the toast fires first (setTimeout 0), then saveEarnedBadge runs, then the next `data`-triggered re-render or the `setCheerRefresh` trigger picks up the new XP. Ensure `saveEarnedBadge` is called INSIDE the sequential toast timer, not before queuing.

**Warning signs:** XP jumps without toast, or toast fires for a badge that was already earned.

### Pitfall 4: Slider Component Not Available

**What goes wrong:** Planner adds task to build goal UI with `<Slider>` but `src/components/ui/slider.tsx` doesn't exist. Implementation fails at import.

**Why it happens:** `@radix-ui/react-slider` is installed as an npm package (dependency from CLAUDE.md's listed Radix packages) but the shadcn wrapper was not generated. Phase 1 cleanup (ARCH-08) removed unused shadcn files.

**How to avoid:** Wave 0 of the plan MUST include `npx shadcn@latest add slider`. Alternatively, use native `<input type="range" min={60} max={95} />` styled with Tailwind to avoid this dependency.

**Warning signs:** `Module not found: '@/components/ui/slider'` at build time.

### Pitfall 5: Personal Best Badge Needs a Comparison Baseline

**What goes wrong:** "Personal Best" badge is defined as "new all-time high SS" — but the badge should stay earned once earned (not toggle off if a future entry is lower). The badge is earned if at any point in history the user reached their personal best.

**Why it happens:** If the check is implemented as `currentAllTimeMax === currentAllTimeMax` it's always true. If it's "latest entry is a new record", it only fires once.

**How to avoid:** Personal Best badge should check: `the current all-time max/min IS the personal best AND this badge hasn't been earned yet`. Since earned badges are stored in localStorage, once saved it stays earned forever. The `check` function only needs to return `earned: true` when the user has reached their personal best at any point in history — which means checking if `personalBestSS = max(all entries)` is the actual max (always true after first entry achieving it). Better design: "Personal Best" badge is earned when the user's all-time best SS is in the top tier (>= 90), or simplify to "Sweet Dreams replaces this" and define Personal Best as a separate "hit a new high score compared to their average" check.

**Warning signs:** Personal Best badge is immediately earned on first data load for users with any SS >= some threshold.

### Pitfall 6: kudos.ts Missing getTotalKudosGiven

**What goes wrong:** Social badges Cheerleader and First Kudos require counting kudos GIVEN by a user. `kudos.ts` only has `getTotalKudos(to)` for kudos received. Checking social badges fails.

**Why it happens:** The existing kudos API was built for the receiving side (rendering kudos buttons + XP calculation).

**How to avoid:** Add `getTotalKudosGiven(from: string): number` to `kudos.ts`. Pattern mirrors `getTotalKudos`: scan localStorage keys matching `st_kudos_*` and count where the `_from_` segment matches. Key format: `st_kudos_{date}_{from}_{to}`.

```typescript
export function getTotalKudosGiven(from: string): number {
  let c = 0;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      // key format: st_kudos_{date}_{from}_{to}
      if (k?.startsWith('st_kudos_') && k.includes(`_${from}_`)) c++;
    }
  } catch {}
  return c;
}
```

Note: This pattern can have false positives if a name appears as a substring of another name. For the team of 3 with distinct first names, this is not a problem. If names overlap, use a more precise parse.

---

## Code Examples

### XPBreakdown Interface Extension

```typescript
// src/lib/gamify.ts — add badgeXP to interface and calculation
export interface XPBreakdown {
  base: number;
  bonusSS: number;
  streakBonus: number;
  goodSleepBonus: number;
  kudosXP: number;
  badgeXP: number;   // NEW: earnedBadgeCount * 25
  spent: number;
  total: number;
}

export function calcXPBreakdown(data: SleepEntry[], name: string): XPBreakdown {
  // ... existing logic ...
  const earnedBadgeIds = getEarnedBadgeIds(name); // imported from badges.ts
  const badgeXP = earnedBadgeIds.length * 25;

  return {
    base, bonusSS, streakBonus, goodSleepBonus, kudosXP,
    badgeXP,
    spent,
    total: Math.max(0, base + bonusSS + streakBonus + goodSleepBonus + kudosXP + badgeXP - spent)
  };
}
```

### XPBreakdown Display Extension

```tsx
// src/components/dashboard/XPBreakdown.tsx — add badgeXP line
{breakdown.badgeXP > 0 && (
  <div className="flex justify-between text-[11px]">
    <span className="text-muted-foreground">🏅 Badge XP ({breakdown.badgeXP / 25} badges earned)</span>
    <span className="font-mono font-bold">+{breakdown.badgeXP}</span>
  </div>
)}
```

### Goal Tracker in HeroCard (Minimal)

```tsx
// Added below Row 2 metrics in HeroCard.tsx
{user && (
  <div className="mt-2 pt-2 border-t">
    {goal ? (
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <div className="text-[9px] text-muted-foreground">Monthly target</div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden mt-0.5">
            <div className="h-full rounded-full transition-all"
                 style={{ width: `${Math.min(100, (currentMonthAvg / goal) * 100)}%`,
                          background: goalStatus === 'ahead' ? '#16a34a' : goalStatus === 'on-track' ? XP_COLOR : '#dc2626' }} />
          </div>
        </div>
        <span className="text-[10px] font-bold shrink-0" style={{ color: ssColor(currentMonthAvg) }}>
          {currentMonthAvg} / {goal}
        </span>
        <button onClick={() => setGoalOpen(true)} className="text-[9px] text-muted-foreground hover:text-foreground">
          ✏️
        </button>
      </div>
    ) : (
      <button onClick={() => setGoalOpen(true)}
              className="text-[10px] text-muted-foreground hover:text-foreground transition-colors">
        Set a monthly target →
      </button>
    )}
  </div>
)}
```

---

## Runtime State Inventory

> This section is SKIPPED. Phase 2 is a greenfield feature addition — no rename, refactor, or migration. No runtime state beyond adding new localStorage keys (`st_badges_{user}`, `st_goal_{user}_{month}`).

---

## Environment Availability

Step 2.6: SKIPPED — Phase 2 is purely code changes. No external services, databases, or CLI tools beyond the existing npm toolchain are required. All dependencies are already installed.

Caveat: `npx shadcn@latest add slider` will be run as a Wave 0 task. This requires npm and network access, both available in this environment.

---

## Validation Architecture

### Test Framework

No test framework is installed (vitest/jest: not found in package.json or node_modules). `nyquist_validation` is enabled in config.json.

| Property | Value |
|----------|-------|
| Framework | None installed — Wave 0 must install vitest |
| Config file | None — Wave 0 creates `vitest.config.ts` |
| Quick run command | `npx vitest run --reporter=verbose` (after install) |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| BADGE-01 | Consistency badge conditions (First Log, Week Warrior thresholds) | unit | `npx vitest run tests/badges.test.ts` | ❌ Wave 0 |
| BADGE-02 | Quality badge conditions (SS >= 90, consecutive SS >= 85, personal best) | unit | `npx vitest run tests/badges.test.ts` | ❌ Wave 0 |
| BADGE-03 | Social badge conditions (kudos given/received counts) | unit | `npx vitest run tests/badges.test.ts` | ❌ Wave 0 |
| BADGE-04 | Fun badge conditions (Night Owl sliding window, Comeback Kid week-over-week) | unit | `npx vitest run tests/badges.test.ts` | ❌ Wave 0 |
| BADGE-05 | Badge grid renders earned (colorful) vs locked (grey) | manual | visual check in browser | N/A |
| BADGE-06 | Toast fires with badge icon + "+25 XP" text on new unlock | manual | visual check on entry submit | N/A |
| BADGE-07 | calcXPBreakdown includes badgeXP and total is correct | unit | `npx vitest run tests/gamify.test.ts` | ❌ Wave 0 |
| GOAL-01 | Goal stored in localStorage as `st_goal_{user}_{month}` | unit | `npx vitest run tests/goals.test.ts` | ❌ Wave 0 |
| GOAL-02 | Goal status (ahead/on-track/behind) computed correctly | unit | `npx vitest run tests/goals.test.ts` | ❌ Wave 0 |

Note: Badge and goal logic are pure functions (no DOM dependency) — ideal for unit testing with vitest + jsdom. localStorage can be mocked with `vi.stubGlobal`.

### Sampling Rate
- **Per task commit:** `npx vitest run tests/badges.test.ts tests/gamify.test.ts tests/goals.test.ts`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `package.json` — add vitest: `npm install -D vitest @vitest/coverage-v8 jsdom @testing-library/react`
- [ ] `vitest.config.ts` — configure jsdom environment and path aliases
- [ ] `tests/badges.test.ts` — unit tests for all 16 badge check functions
- [ ] `tests/gamify.test.ts` — unit tests for calcXPBreakdown with badgeXP field
- [ ] `tests/goals.test.ts` — unit tests for goal status computation
- [ ] `tests/setup.ts` — localStorage mock, shared test fixtures (SleepEntry builder)
- [ ] `src/components/ui/slider.tsx` — `npx shadcn@latest add slider`

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| BONUS_DEFS array in BonusSection.tsx | BadgeDef array in badges.ts (Phase 2) | Phase 1 explicitly set up for this evolution | BonusSection replaced by BadgeSection |
| calcXP as standalone function | calcXP wraps calcXPBreakdown (Phase 1) | Phase 1 ARCH-02 | Adding badgeXP to breakdown is safe — total is computed in one place |
| Single-string Toast | Extended Toast with optional duration | Phase 2 | Backward compatible |
| No kudosGiven tracking | getTotalKudosGiven added to kudos.ts | Phase 2 | Needed for social badges |

---

## Open Questions

1. **Personal Best Badge — single badge or 3 separate badges?**
   - What we know: BADGE-02 mentions "Personal Best (new all-time high SS, lowest RHR, highest HRV)"
   - What's unclear: Is this one badge unlocked when any metric achieves its all-time best, or three distinct badges?
   - Recommendation: Implement as one badge ("Personal Best") triggered when ANY of the three metrics is at an all-time best value in the current dataset. This keeps the count at exactly 16 (4 per category). If 3 separate badges are desired, the total rises to 18.

2. **Night Owl — reward or punishment badge?**
   - What we know: "SS < 60 three times in a week" — this is a fun/surprise badge, but it rewards bad sleep behavior
   - What's unclear: Should the badge have a humorous tone (encouragement to improve) or be neutral collectible?
   - Recommendation: Display with humor ("You stayed up too late again...") and a distinct icon (🦉). The badge exists as a collectible, not a reward for bad behavior. Text is Claude's discretion.

3. **Toast confetti positioning**
   - What we know: D-08 specifies "CSS confetti particle burst" alongside the toast; D-09 specifies CSS keyframes
   - What's unclear: Does confetti overlay the toast (positioned inside Toast component) or burst at center of screen?
   - Recommendation: Confetti particles are absolutely positioned inside or above the Toast container. This localizes the animation to the notification rather than taking over the whole screen, which is better for accessibility and less disruptive.

---

## Sources

### Primary (HIGH confidence)

- Direct code inspection: `src/lib/gamify.ts` — verified XPBreakdown interface, calcXPBreakdown function signature
- Direct code inspection: `src/components/dashboard/BonusSection.tsx` — verified BonusDef interface, BONUS_DEFS pattern
- Direct code inspection: `src/lib/kudos.ts` — verified getTotalKudos, confirmed missing getTotalKudosGiven
- Direct code inspection: `src/components/shared/Toast.tsx` — verified current Toast API (msg + show only)
- Direct code inspection: `src/App.tsx` — verified showToast pattern (2500ms hardcoded)
- Direct code inspection: `package.json` — verified @radix-ui packages installed vs shadcn wrappers present
- Direct code inspection: `src/components/ui/` listing — confirmed slider.tsx and popover.tsx absent
- Direct code inspection: `src/index.css` — verified existing @keyframes (fadeUp, fadeIn, slideIn, pulse-soft)
- Direct code inspection: `src/hooks/useGameState.ts` — verified GameState interface, useMemo pattern
- Direct code inspection: `GAMIFICATION.md` — authoritative XP rules document

### Secondary (MEDIUM confidence)

- `@radix-ui/react-slider` v1.3.6 confirmed via `npm view` — package available in registry, shadcn add command will work
- shadcn/ui slider component: standard shadcn pattern, known to follow same Radix wrapper structure as other installed components

### Tertiary (LOW confidence)

- Vitest as test framework: recommended based on Vite being the dev bundler (native integration), but no prior vitest usage in this project to verify compatibility. Alternative: jest with ts-jest.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages verified against package.json and node_modules
- Architecture patterns: HIGH — derived from direct inspection of existing source files
- Badge conditions: HIGH — requirements are explicit; computation patterns are straightforward
- Pitfalls: HIGH — derived from actual code review of integration points
- Test infrastructure: MEDIUM — vitest recommended based on Vite stack match, but not yet validated in this project

**Research date:** 2026-03-24
**Valid until:** 2026-06-24 (stable stack; only risk is shadcn CLI version changes)
