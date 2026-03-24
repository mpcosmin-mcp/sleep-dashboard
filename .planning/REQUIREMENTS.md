# Requirements: Sleep Tracker

**Defined:** 2026-03-23
**Core Value:** People log sleep data daily because it's fun and social — the gamification and team dynamics keep them coming back, which leads to actual sleep improvement.

## v1 Requirements

Requirements for this milestone. Each maps to roadmap phases.

### Architecture Refactor

- [x] **ARCH-01**: DashboardPage is decomposed from 750 lines into a thin orchestrator (~100 lines) composing focused section components
- [x] **ARCH-02**: XP calculation logic exists in a single source of truth (`gamify.ts`), eliminating duplication between `calcXP` and `calcXPBreakdown`
- [x] **ARCH-03**: setState-during-render anti-pattern in jump logic (lines 216-224) is replaced with proper useEffect
- [x] **ARCH-04**: Anthropic API key is removed from client bundle and stored as Cloudflare Worker secret
- [x] **ARCH-05**: React Error Boundary wraps the app for graceful crash containment
- [x] **ARCH-06**: `any` types in core modules (sleep.ts, ChartsPage.tsx) are replaced with proper TypeScript types
- [x] **ARCH-07**: Expensive computations (calcXP, loggingStreak, leaderboard building) are memoized with useMemo
- [x] **ARCH-08**: Unused shadcn/ui components (~33 files) and unused npm dependencies are removed

### Social Competitions

> **Note:** This section was originally "Achievement Badges" (BADGE-01 through BADGE-07 described a static badge system). The badge system was reverted and replaced with social competitions (weekly challenges, expanded leaderboard, highlight reel, kudos comments) per the Phase 2 pivot decision (2026-03-24). Requirement IDs are preserved for traceability.

- [x] **BADGE-01**: Weekly challenge engine provides a rotating challenge (from a pool of 8+) seeded by week number so all users see the same challenge each week
- [x] **BADGE-02**: Challenge pool includes a mix of individual challenges ("log every day this week", "beat your weekly SS average") and team challenges ("team average SS 80+", "everyone logs 5 days")
- [ ] **BADGE-03**: Leaderboard supports multi-metric sorting via toggle chips (SS, streak length, XP, improvement trend)
- [ ] **BADGE-04**: Weekly highlight reel card shows team superlatives (best sleep, most consistent, biggest improvement, most active) computed from data
- [x] **BADGE-05**: User sees the weekly challenge with progress bar and XP reward in the dashboard (ChallengeSection replaces BonusSection)
- [x] **BADGE-06**: Challenge completion triggers a celebratory toast notification with CSS confetti animation and a flair icon in the leaderboard
- [x] **BADGE-07**: Challenge XP integrates into the existing XP system through gamify.ts calcXPBreakdown, not as a parallel reward system

### Social Enhancements

- [x] **KUDOS-01**: Kudos system extended with optional short text comments alongside emoji reactions, visible as speech bubbles in the leaderboard

### Sleep Goals

- [x] **GOAL-01**: User can set a personal monthly SS target (e.g., "average SS >= 85 this month")
- [x] **GOAL-02**: User can see progress toward their goal with on-track/behind/ahead status and trajectory visualization; goal status is visible in leaderboard rows for all users

### Weekly AI Analysis

- [ ] **AI-01**: Cloudflare Worker runs a weekly scheduled analysis (Sunday) using Claude Haiku on last 30 days of team data
- [ ] **AI-02**: AI report is cached in Cloudflare KV and served via a /report endpoint (not computed on every client load)
- [ ] **AI-03**: User can view the weekly AI team report showing per-person trend analysis, patterns, and actionable tips
- [ ] **AI-04**: AI report includes team-comparative insights (who improved most, group patterns, suggested experiments)

### Mobile UX

- [ ] **MOBILE-01**: Dashboard sections are collapsible with remembered collapse state, reducing initial scroll depth
- [ ] **MOBILE-02**: Charts are optimized for mobile (appropriate tick density, legend handling, touch targets)

### English Migration

- [ ] **ENG-01**: All user-facing UI text is in English (replacing Romanian), managed through a centralized strings module

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Goals Enhancement

- **GOAL-03**: User receives contextual goal nudges ("you need SS 88+ for remaining 3 days to hit your monthly target")

### Badge System (Deferred)

- **BADGE-08**: Static badge/achievement system with collectible badges across categories (consistency, quality, social, fun) — originally planned for Phase 2, deferred in favor of social competitions
- **BADGE-09**: Dedicated badge gallery page with filtering by category

### AI Enhancement

- **AI-05**: AI report references user's goal progress ("you're 3 points away from your monthly target")
- **AI-06**: AI trend comparison across multiple months (requires 3+ months of history)

### Team Features

- **TEAM-01**: Team challenges with multi-week tracking (beyond weekly rotation)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Multi-team / multi-tenant support | Personal tool for one team |
| Real-time chat or messaging | Conversations happen externally |
| Database migration (Supabase/Firebase) | Google Sheets stays as backend |
| OAuth / real authentication | User picker is sufficient |
| Mobile native app | Web-first, optimized for mobile browser |
| Offline support / PWA | Always-online is acceptable |
| Daily AI analysis | Weekly is cheaper, more meaningful, creates anticipation |
| Conversational AI chat | Overengineering for 3 users, liability concerns |
| Behavior-based goals | Unverifiable without device integration |
| Badge trading/gifting | Meaningless with 3 users |
| Push notifications | Web app on GitHub Pages, no capability |
| Real-time leaderboard animations | Data changes once daily, wasted effort |
| Multi-language i18n | Replacing Romanian with English, not adding runtime switching |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| ARCH-01 | Phase 1 | Complete |
| ARCH-02 | Phase 1 | Complete |
| ARCH-03 | Phase 1 | Complete |
| ARCH-04 | Phase 1 | Complete |
| ARCH-05 | Phase 1 | Complete |
| ARCH-06 | Phase 1 | Complete |
| ARCH-07 | Phase 1 | Complete |
| ARCH-08 | Phase 1 | Complete |
| BADGE-01 | Phase 2 | Complete |
| BADGE-02 | Phase 2 | Complete |
| BADGE-03 | Phase 2 | Pending |
| BADGE-04 | Phase 2 | Pending |
| BADGE-05 | Phase 2 | Complete |
| BADGE-06 | Phase 2 | Complete |
| BADGE-07 | Phase 2 | Complete |
| KUDOS-01 | Phase 2 | Complete |
| GOAL-01 | Phase 2 | Complete |
| GOAL-02 | Phase 2 | Complete |
| AI-01 | Phase 3 | Pending |
| AI-02 | Phase 3 | Pending |
| AI-03 | Phase 3 | Pending |
| AI-04 | Phase 3 | Pending |
| MOBILE-01 | Phase 4 | Pending |
| MOBILE-02 | Phase 4 | Pending |
| ENG-01 | Phase 3 | Pending |

**Coverage:**
- v1 requirements: 25 total
- Mapped to phases: 25
- Unmapped: 0

---
*Requirements defined: 2026-03-23*
*Last updated: 2026-03-24 after Phase 2 pivot from badges to social competitions*
