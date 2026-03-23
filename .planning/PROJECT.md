# Sleep Tracker

## What This Is

A fun, social sleep tracking dashboard for a small team (currently 3 people in Sibiu). Users log daily sleep metrics (Sleep Score, RHR, HRV) from their wearables, then engage with each other through a gamified leaderboard, kudos system, streak tracking, and XP progression. The app makes sleep improvement social and competitive in a friendly way. Built as a single-page React app backed by Google Sheets.

## Core Value

People log sleep data daily because it's fun and social — the gamification and team dynamics keep them coming back, which leads to actual sleep improvement.

## Requirements

### Validated

- Validated Daily sleep metric entry (SS, RHR, HRV) via Google Sheets backend — existing
- Validated Personal dashboard with hero card, view tabs (daily/weekly/monthly) — existing
- Validated 7-day / 30-day calendar / 12-month heatmap tracker — existing
- Validated Leaderboard sorted by Sleep Score with level badges, streak indicators, kudos — existing
- Validated XP system: +10/log, SS bonuses, streak milestones, kudos XP — existing
- Validated Streak system: consecutive logging, auto-save (SS >= 75), paid repair (50 XP) — existing
- Validated Level/tier progression: 10 tiers (Bronze through Transcendent), named titles — existing
- Validated Kudos (Strava-style likes): 1/day/teammate, emoji reactions, +5 XP per received — existing
- Validated Charts page: time-series SS/RHR/HRV with per-user filtering, click-to-snapshot navigation — existing
- Validated History page: full data table with per-person filtering — existing
- Validated Habit tracking: daily checklist with streak and monthly completion — existing
- Validated Day Snapshot view: per-user cards from chart click with like buttons — existing
- Validated Privacy/hide mode: digit masking across all metrics — existing
- Validated Dark mode with class-based toggling — existing
- Validated ProgressHub: persistent XP ring + 7-day streak dots above all pages — existing
- Validated AI analysis infrastructure: Claude Haiku via Cloudflare Worker proxy — existing (basic)

### Active

- [ ] Architecture refactor: break DashboardPage (750 lines) into focused components
- [ ] Architecture refactor: extract duplicated XP logic into single source of truth
- [ ] Architecture refactor: memoize expensive computations (calcXP, loggingStreak, leaderboard)
- [ ] Architecture refactor: fix React anti-pattern (setState during render in jump logic)
- [ ] Architecture refactor: remove 33+ unused shadcn/ui components and unused npm dependencies
- [ ] Architecture refactor: fix security issues (API key in client bundle, CORS proxy)
- [ ] Architecture refactor: add error boundary for graceful failure
- [ ] Architecture refactor: replace `any` types with proper TypeScript typing
- [ ] Weekly AI analysis: auto-generated deep report every Sunday comparing trends, suggesting experiments
- [ ] Sleep goals: set personal SS targets (e.g., "average SS 85 this month"), track progress
- [ ] Achievement badges: consistency (7d/30d/90d streak), quality (SS >= 90 for a week, personal records), social (first kudos, 10 received, team MVP), fun/surprise (night owl, weekend warrior, comeback kid)
- [ ] Better mobile UX: reduce scroll depth on dashboard, improve chart readability on phone
- [ ] Full English UI: migrate all Romanian text to English for shareability

### Out of Scope

- Multi-team / multi-tenant support — this is a personal tool for one team
- Real-time chat or messaging — conversations happen externally (WhatsApp, in person)
- Database migration (Supabase/Firebase) — Google Sheets stays as the backend
- OAuth / real authentication — user picker (name selection) is sufficient
- Mobile native app — web-first, optimized for mobile browser
- Offline support / PWA — always-online is acceptable
- Data export / backup tooling — Google Sheets is the export

## Context

- Team of 3 people in Sibiu, Romania who track sleep metrics from wearables
- App deployed to GitHub Pages as a single HTML file (Parcel + html-inline in CI)
- Google Sheets as source of truth, accessed via Apps Script JSONP
- AI proxy: Cloudflare Worker forwarding to Anthropic API
- Codebase is ~2500 lines of application code (excluding shadcn/ui primitives)
- The app is used daily on mobile phones — mobile UX is critical
- All gamification state (XP, streaks) is computed on-the-fly from data + localStorage flags
- Habit system is entirely localStorage-backed (device-local)
- Previously Romanian UI, transitioning to full English

## Constraints

- **Backend**: Google Sheets only — no new databases or servers
- **Hosting**: GitHub Pages (single-file HTML deployment)
- **AI costs**: Claude Haiku via Cloudflare Worker — keep costs minimal (weekly batch, not real-time)
- **Team size**: 3 users — performance optimization for small datasets, not scale
- **Browser-only state**: localStorage for client state is acceptable (no cross-device sync needed)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Keep Google Sheets as backend | Simple, works, team can see raw data directly | -- Pending |
| Full English UI | Enables shareability beyond the Sibiu team | -- Pending |
| Weekly batch AI analysis (not conversational) | Lower cost, creates a shared discussion point | -- Pending |
| Sleep goals as SS targets (not behavior goals) | Concrete, measurable, ties directly to tracked data | -- Pending |
| Full component refactor of DashboardPage | 750 lines is unmaintainable, blocks feature development | -- Pending |
| All badge categories (consistency + quality + social + fun) | Maximizes engagement variety | -- Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? -> Move to Out of Scope with reason
2. Requirements validated? -> Move to Validated with phase reference
3. New requirements emerged? -> Add to Active
4. Decisions to log? -> Add to Key Decisions
5. "What This Is" still accurate? -> Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check -- still the right priority?
3. Audit Out of Scope -- reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-03-23 after initialization*
