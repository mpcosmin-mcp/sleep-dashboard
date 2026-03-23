# Roadmap: Sleep Tracker

## Overview

This milestone transforms the existing sleep tracker from a functional but monolithic app into a polished, feature-rich gamified experience. The 750-line DashboardPage god component is decomposed first (enabling all subsequent work), then badges and goals add collection and target-setting mechanics, followed by weekly AI team analysis with English migration, and finally mobile UX polish once all new dashboard content exists.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation Refactor** - Decompose DashboardPage, unify XP logic, fix defects, prune unused code
- [ ] **Phase 2: Badges and Goals** - Achievement badge system with unlock celebrations and personal sleep score targets
- [ ] **Phase 3: AI Analysis and English Migration** - Weekly AI team report via Cloudflare Worker and full English UI
- [ ] **Phase 4: Mobile UX Polish** - Collapsible dashboard sections, mobile-optimized charts, TypeScript cleanup

## Phase Details

### Phase 1: Foundation Refactor
**Goal**: The codebase is clean, modular, and safe to extend with new features
**Depends on**: Nothing (first phase)
**Requirements**: ARCH-01, ARCH-02, ARCH-03, ARCH-04, ARCH-05, ARCH-06, ARCH-07, ARCH-08
**Success Criteria** (what must be TRUE):
  1. DashboardPage renders the same UI but its source file is under 150 lines, composing extracted section components
  2. XP values are identical whether computed via calcXP or calcXPBreakdown — a single gamify.ts module is the sole source of XP logic
  3. Navigating from Charts to Dashboard via click-to-snapshot does not cause render loops or console errors
  4. The Anthropic API key does not appear anywhere in the client JavaScript bundle (verified by searching built output)
  5. The app recovers gracefully from a component crash (Error Boundary catches and displays fallback instead of white screen)
**Plans:** 4 plans
Plans:
- [ ] 01-01-PLAN.md — Extract gamify.ts and kudos.ts modules, unify XP logic
- [x] 01-02-PLAN.md — Fix setState-during-render, secure API key, add Error Boundary
- [ ] 01-03-PLAN.md — Decompose DashboardPage into section components with memoization
- [ ] 01-04-PLAN.md — Replace `any` types, remove unused shadcn/ui components and dependencies

### Phase 2: Badges and Goals
**Goal**: Users have things to collect (badges) and targets to chase (sleep goals), deepening daily engagement
**Depends on**: Phase 1
**Requirements**: BADGE-01, BADGE-02, BADGE-03, BADGE-04, BADGE-05, BADGE-06, BADGE-07, GOAL-01, GOAL-02
**Success Criteria** (what must be TRUE):
  1. User can view a badge collection showing earned badges (with unlock date) and locked badges (with progress hints) across all four categories
  2. When a badge is unlocked, user sees a celebratory toast notification with confetti animation
  3. Badge XP appears in the existing XP breakdown — earning a badge visibly increases the user's XP total and can affect level/tier
  4. User can set a monthly sleep score target and see whether they are on-track, behind, or ahead with a visual progress indicator
  5. Existing gamification (XP ring, streak dots, leaderboard, kudos) continues to work correctly with badges and goals integrated
**Plans**: TBD
**UI hint**: yes

### Phase 3: AI Analysis and English Migration
**Goal**: The team gets a weekly AI-generated sleep report and the entire UI speaks English
**Depends on**: Phase 2
**Requirements**: AI-01, AI-02, AI-03, AI-04, ENG-01
**Success Criteria** (what must be TRUE):
  1. Every Sunday, a new AI report is generated automatically without any user action
  2. User can view the weekly AI report showing per-person trend analysis and team-comparative insights
  3. The AI report loads from a cached endpoint — it does not trigger an AI call on every page visit
  4. All user-facing text throughout the app is in English (no Romanian strings remain)
**Plans**: TBD
**UI hint**: yes

### Phase 4: Mobile UX Polish
**Goal**: The app feels native-quality on mobile phones where it is used daily
**Depends on**: Phase 3
**Requirements**: MOBILE-01, MOBILE-02
**Success Criteria** (what must be TRUE):
  1. User can collapse and expand dashboard sections, and the app remembers which sections are collapsed across sessions
  2. Charts are readable on a phone screen without horizontal scrolling — legends, tick marks, and touch targets are appropriately sized
**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation Refactor | 0/4 | Planning complete | - |
| 2. Badges and Goals | 0/TBD | Not started | - |
| 3. AI Analysis and English Migration | 0/TBD | Not started | - |
| 4. Mobile UX Polish | 0/TBD | Not started | - |
