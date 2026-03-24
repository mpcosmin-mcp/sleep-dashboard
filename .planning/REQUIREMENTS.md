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

### Achievement Badges

- [x] **BADGE-01**: User can earn consistency badges: First Log, Week Warrior (7d streak), Month Master (30d streak), Quarter Legend (90d streak)
- [x] **BADGE-02**: User can earn quality badges: Sweet Dreams (SS >= 90 single day), Dream Week (7 consecutive days SS >= 85), Personal Best (new all-time high SS, lowest RHR, highest HRV)
- [x] **BADGE-03**: User can earn social badges: First Kudos (give first kudos), Cheerleader (30 kudos given), Fan Favorite (50 kudos received), Team MVP (most kudos received in a month)
- [x] **BADGE-04**: User can earn fun/surprise badges: Night Owl (SS < 60 three times in a week), Comeback Kid (SS improves 15+ points week-over-week), Weekend Warrior (best SS consistently on weekends), Steady Eddie (SS within 3-point range for 7 days)
- [x] **BADGE-05**: User sees a badge collection/gallery showing earned and locked badges
- [x] **BADGE-06**: User receives a celebratory notification (toast + confetti) when unlocking a new badge
- [x] **BADGE-07**: Badge XP integrates into the existing XP system through gamify.ts, not as a parallel reward system

### Sleep Goals

- [ ] **GOAL-01**: User can set a personal monthly SS target (e.g., "average SS >= 85 this month")
- [ ] **GOAL-02**: User can see progress toward their goal with on-track/behind/ahead status and trajectory visualization

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

### Badge Expansion

- **BADGE-08**: Additional surprise/fun badges added monthly to keep collection fresh
- **BADGE-09**: Dedicated badge gallery page with filtering by category

### AI Enhancement

- **AI-05**: AI report references user's goal progress ("you're 3 points away from your monthly target")
- **AI-06**: AI trend comparison across multiple months (requires 3+ months of history)

### Team Features

- **TEAM-01**: Team challenges (e.g., "team averages SS 80+ this week")

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
| BADGE-03 | Phase 2 | Complete |
| BADGE-04 | Phase 2 | Complete |
| BADGE-05 | Phase 2 | Pending |
| BADGE-06 | Phase 2 | Pending |
| BADGE-07 | Phase 2 | Complete |
| GOAL-01 | Phase 2 | Pending |
| GOAL-02 | Phase 2 | Pending |
| AI-01 | Phase 3 | Pending |
| AI-02 | Phase 3 | Pending |
| AI-03 | Phase 3 | Pending |
| AI-04 | Phase 3 | Pending |
| MOBILE-01 | Phase 4 | Pending |
| MOBILE-02 | Phase 4 | Pending |
| ENG-01 | Phase 3 | Pending |

**Coverage:**
- v1 requirements: 24 total
- Mapped to phases: 24
- Unmapped: 0

---
*Requirements defined: 2026-03-23*
*Last updated: 2026-03-23 after roadmap creation*
