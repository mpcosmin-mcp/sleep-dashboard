# Phase 2: Social Competitions + Goals - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-24
**Phase:** 02-badges-and-goals (pivoted from badges to social competitions)
**Areas discussed:** Leaderboard expansion, BonusSection evolution, Social reactions & fun facts, Goal setting & tracking

---

## Phase Pivot

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, full pivot | Drop badges and goals entirely. Phase 2 becomes social competitions. | |
| Mostly pivot | Keep sleep goals but replace badges with social competitions | ✓ |
| Let me explain | Different vision | |

**User's choice:** Mostly pivot — keep goals (GOAL-01, GOAL-02), replace badges with social competitions

---

## Leaderboard Expansion

### Time-based leaderboards

| Option | Description | Selected |
|--------|-------------|----------|
| Tab-based periods | Add tabs (This Week / This Month / All Time) | |
| Weekly spotlight only | Keep existing + add "This Week's Winner" highlight | |
| Rotating automatic | Auto-shows most relevant period | ✓ |

### Streak competition

| Option | Description | Selected |
|--------|-------------|----------|
| Streak race indicator | Visual race bar | |
| Streak milestone callouts | Toast notifications at milestones | |
| Both race + milestones | Race visual + milestone toasts | |
| You decide | Claude picks best approach | ✓ |

### Sorting

| Option | Description | Selected |
|--------|-------------|----------|
| SS only (current) | Keep sorting by Sleep Score only | |
| Multi-metric toggle | Sortable by SS, streak, XP, improvement | ✓ |
| SS + weekly improvement | Two views: Best Score and Most Improved | |

### Manual switch

| Option | Description | Selected |
|--------|-------------|----------|
| Auto only | Fully automatic rotation | |
| Auto + manual override | Auto-selects but chips let you switch | ✓ |

---

## BonusSection Evolution

### What happens to BonusSection

| Option | Description | Selected |
|--------|-------------|----------|
| Keep as milestones | Rebrand to "Milestones" with English text | |
| Merge into leaderboard | Remove section, merge into leaderboard/XP | |
| Evolve into challenges | Rotating weekly challenges, social and time-limited | ✓ |

### Challenge rotation

| Option | Description | Selected |
|--------|-------------|----------|
| Hardcoded rotation | Fixed pool, rotate by week number | |
| AI-generated | Claude Haiku picks based on data | |
| Random from pool | Random selection, seeded by date | ✓ |

### Challenge type

| Option | Description | Selected |
|--------|-------------|----------|
| Mix of both | Individual + team challenges | ✓ |
| Team only | All challenges are team goals | |
| Individual only | Personal challenges only | |

### Rewards

| Option | Description | Selected |
|--------|-------------|----------|
| XP bonus | Flat XP reward | |
| XP + visual flair | XP bonus + icon next to name in leaderboard | ✓ |
| Bragging rights only | No XP, just visual | |

---

## Social Reactions & Fun Facts

### Like/reaction evolution

| Option | Description | Selected |
|--------|-------------|----------|
| Keep as-is | Current kudos works fine | |
| Expand reactions | Multiple reaction types per day | |
| Reaction + comment | Emoji + optional short text | ✓ |

### Fun facts

| Option | Description | Selected |
|--------|-------------|----------|
| Auto-generated stats | Daily rotating fun facts | |
| Weekly highlight reel | Single weekly summary card with superlatives | ✓ |
| Both daily + weekly | Daily snippets + weekly highlight card | |

### Highlight placement

| Option | Description | Selected |
|--------|-------------|----------|
| Top card | Prominent card above leaderboard | ✓ |
| Inside leaderboard | Header within leaderboard component | |
| Separate section | New collapsible Section | |

---

## Goal Setting & Tracking

### Goal UI location

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, HeroCard | Goal tracker in HeroCard with slider dialog | |
| Separate goal card | Standalone card below HeroCard | |
| Leaderboard integration | Goal progress visible in leaderboard rows | ✓ |

### Goal-setting initiation

| Option | Description | Selected |
|--------|-------------|----------|
| Tap own row | Tap leaderboard row to set goal | |
| HeroCard prompt | HeroCard shows set target prompt | |
| Settings/profile area | Goal setting in settings menu | ✓ |

### Goal display in leaderboard

| Option | Description | Selected |
|--------|-------------|----------|
| Small progress chip | Tiny indicator next to name | |
| Sub-row | Second line under stats | |
| You decide | Claude picks best compact approach | ✓ |

---

## Claude's Discretion

- Streak competition design (race bars, milestones, or hybrid)
- Goal progress display format in leaderboard
- Challenge pool content and XP amounts
- Highlight reel design and superlative categories
- Reaction comment UI details
- Settings/profile area access pattern

## Deferred Ideas

- Badge system (17 achievements) — reverted, could be future phase
- AI-generated challenges based on team data — static pool for now
- Multi-week team challenges — keep weekly for simplicity
