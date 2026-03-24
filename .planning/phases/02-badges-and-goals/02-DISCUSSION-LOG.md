# Phase 2: Badges and Goals - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-24
**Phase:** 02-badges-and-goals
**Areas discussed:** Badge presentation, Unlock celebrations, Goal setting & tracking UX

---

## Badge Presentation

### Where should the badge collection live?

| Option | Description | Selected |
|--------|-------------|----------|
| Replace BonusSection | BonusSection becomes a full Badge Collection section in the dashboard. BONUS_DEFS evolves into badge definitions. | ✓ |
| Separate badge page | New page in the nav bar dedicated to badge gallery. Dashboard keeps a small badge summary. | |
| Both — dashboard section + expandable detail | Compact badge grid in dashboard. Tapping opens modal/drawer with full gallery. | |

**User's choice:** Replace BonusSection (Recommended)

### How should badges be laid out in the section?

| Option | Description | Selected |
|--------|-------------|----------|
| Compact grid | Small circular/square badge icons in a grid (3-4 per row). Earned colorful, locked greyed. Tap for tooltip. | ✓ |
| Category rows | One row per category (Consistency, Quality, Social, Fun) with horizontal badges. | |
| List with progress bars | Vertical list like current BonusSection, with all badges showing progress bars. | |

**User's choice:** Compact grid (Recommended)

### Should badge XP be a new line in the existing XP breakdown?

| Option | Description | Selected |
|--------|-------------|----------|
| New XP breakdown line | Add a 'Badge XP' row in XPBreakdown section showing total XP earned from badges. | ✓ |
| Silent integration | Badge XP just adds to total without a separate line. | |

**User's choice:** New XP breakdown line (Recommended)

### How much XP should each badge be worth?

| Option | Description | Selected |
|--------|-------------|----------|
| Flat 25 XP per badge | Every badge earns 25 XP regardless of difficulty. 16 badges = 400 XP max. | ✓ |
| Tiered by difficulty | Easy = 10 XP, medium = 25 XP, hard = 50 XP. | |
| You decide | Claude picks a balanced XP scheme. | |

**User's choice:** Flat 25 XP per badge (Recommended)

---

## Unlock Celebrations

### What kind of celebration when a badge is unlocked?

| Option | Description | Selected |
|--------|-------------|----------|
| Toast + confetti burst | Custom toast with badge icon, name, '+25 XP'. Confetti particles. CSS animations, no npm dep. | ✓ |
| Full-screen celebration | Full-screen overlay with large badge reveal, confetti rain, sound effect option. | |
| Subtle toast only | Standard toast notification, no confetti or extra animation. | |

**User's choice:** Toast + confetti burst (Recommended)

### When should badge unlock checks happen?

| Option | Description | Selected |
|--------|-------------|----------|
| On data load + after submit | Check all badge conditions on app load and after entry submit. Compare against localStorage. | ✓ |
| Real-time reactive | Check after every data change (kudos, streak repair, etc). | |
| You decide | Claude picks the right timing. | |

**User's choice:** On data load + after submit (Recommended)

---

## Goal Setting & Tracking UX

### Where should the goal tracker live?

| Option | Description | Selected |
|--------|-------------|----------|
| Inside HeroCard | Small progress indicator in existing hero card. Shows target, avg, status at a glance. | ✓ |
| New dashboard section | Separate expandable section like Streak or XP. | |
| Both — compact in hero + detail section | Small indicator in hero card plus expandable detail section below. | |

**User's choice:** Inside HeroCard (Recommended)

### How should the user set their monthly target?

| Option | Description | Selected |
|--------|-------------|----------|
| Tap target area in HeroCard | Tapping goal area opens popover with slider (60-95). Default based on last month avg. | ✓ |
| Settings/profile area | Goal setting in a settings section or profile page. | |
| You decide | Claude picks the best interaction pattern. | |

**User's choice:** Tap target area in HeroCard (Recommended)

### How should on-track/behind/ahead status be shown?

| Option | Description | Selected |
|--------|-------------|----------|
| Color-coded progress bar + text | Progress bar with green/amber/red and short text label. | |
| Emoji + text only | Just emoji status and number, no progress bar. | |
| You decide | Claude designs the best visual indicator. | ✓ |

**User's choice:** You decide

### What happens if no goal is set for the current month?

| Option | Description | Selected |
|--------|-------------|----------|
| Show 'Set a target' prompt | Subtle 'Set a monthly target →' link in HeroCard goal area. | ✓ |
| Hide goal area entirely | Don't show goal section until user sets one. | |
| Auto-suggest based on history | Suggest target based on last month avg with one-tap accept. | |

**User's choice:** Show 'Set a target' prompt (Recommended)

---

## Claude's Discretion

- Badge progress hints for locked badges
- Goal status visual design
- Badge icon/emoji choices
- Confetti animation details
- Badge popup/tooltip design
- Badge definition code structure

## Deferred Ideas

None — discussion stayed within phase scope
