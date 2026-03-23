# Project Research Summary

**Project:** Social Gamified Sleep Tracker — Milestone 2
**Domain:** Gamified social health tracking (React SPA, Google Sheets backend)
**Researched:** 2026-03-23
**Confidence:** HIGH

## Executive Summary

This is a social gamified sleep tracker for a small 3-person team, built on React 19 + TypeScript + Vite with Google Sheets as the backend and a Cloudflare Worker as an AI proxy. The existing app has solid gamification foundations (XP, streaks, tiers, levels, kudos, leaderboard) but milestone 2 adds four distinct capability areas: achievement badges, sleep goals, weekly AI analysis, and mobile UX improvements. Research is grounded in direct codebase analysis rather than greenfield speculation, which increases confidence substantially.

The recommended approach is strict phase separation: refactor the existing monolithic DashboardPage (750 lines) into focused components before adding any new features. This order is non-negotiable — all four new features need clean component insertion points, a single XP source of truth (to integrate badge XP), and memoized computations (to handle badge and goal checks without slowing the dashboard). The refactor is the enabler, not a nice-to-have. New stack additions are minimal: one npm package (react-confetti-explosion, 3KB), Cloudflare KV for AI report caching, and a plain TypeScript strings module to replace hardcoded Romanian strings.

The primary risks are all architectural: setState-during-render in the current jump logic, duplicated XP calculation functions that will diverge when badges add new XP sources, and the temptation to combine refactor work with feature work (which causes merge conflicts and features built on the wrong abstraction layer). A secondary risk is the AI weekly analysis becoming stale and ignored if the prompt is not designed for week-over-week comparison from the start. Both risks are fully addressable with the phase structure and design decisions outlined below.

## Key Findings

### Recommended Stack

The existing stack (React 19, TypeScript, Tailwind, shadcn/ui, Chart.js, date-fns, Google Sheets JSONP) is production-validated and should not change. New additions are intentionally minimal. Cloudflare KV and Cron Triggers extend the existing Cloudflare Worker rather than adding a new service — the worker gains a `scheduled()` handler that runs weekly, calls Claude Haiku with last 30 days of team data, and stores the result in KV. The client reads a cached `/report` endpoint instead of calling the AI on every load. This also moves the Anthropic API key off the client entirely (currently a `VITE_` prefixed env var — a security issue that must be fixed).

For localization, no library is needed. The app is replacing Romanian with English (one language swap), not adding multi-language runtime switching. A single `src/lib/strings.ts` file with English string constants is the correct scope. Installing react-i18next (22KB+) for a find-and-replace task is over-engineering. Badge logic and goal storage are pure TypeScript modules backed by localStorage — no gamification SDK exists for React that is mature enough to justify the dependency.

**Core technologies:**
- Cloudflare KV + Cron Triggers: weekly AI batch and report caching — extends existing CF Worker, free tier sufficient for 3 users
- Plain TypeScript strings module: English UI migration — single source of truth, zero dependencies, future-i18n-ready
- Pure TypeScript badges.ts: achievement system — domain-specific logic, no mature library alternative exists
- Pure TypeScript goals.ts + localStorage: sleep goal CRUD and progress — consistent with existing habits/kudos pattern
- react-confetti-explosion@^2.1.2: badge unlock celebration — only new npm dependency, 3KB CSS-only

### Expected Features

Research confirms that users of gamified health apps treat badges, personal goals, and periodic AI summaries as table stakes once XP and streaks are already present. Every major fitness platform (Fitbit, Garmin, Apple Watch) has all three. The social team angle is the differentiator: a team-facing AI report (comparing all three users) and social badges tied to the existing kudos system are capabilities no solo sleep app can offer.

**Must have (table stakes):**
- Achievement badges with visible collection — XP and levels exist but users have nothing to "collect"; every platform with progression has badges
- Personal sleep score goal with progress indicator — without goals, data is passive observation; research confirms goal-setting as top behavior change technique in health apps
- Weekly AI team report — Claude Haiku proxy already exists; not providing a summary now feels like a gap; creates weekly shared discussion point
- Mobile scroll reduction — app is used daily on phones; a 750-line dashboard with heavy scroll breaks the core loop
- Badge unlock notification (toast + confetti) — silent unlocks defeat the dopamine loop; one-time celebratory pop-up is required

**Should have (competitive):**
- Team-comparative AI report (not just personal) — most sleep apps are solo; comparing 3 users and highlighting group trends is a genuine differentiator
- Social badges tied to kudos (Fan Favorite, Cheerleader, Team MVP) — leverages existing social mechanics in a way solo apps cannot
- Surprise/fun badge category (Comeback Kid, Night Owl, Weekend Warrior) — creates delight and conversation; competitors rely on boring milestone badges
- Contextual goal nudges ("you need SS 88+ for remaining 3 days") — contextual reminders outperform fixed schedules; in-app only, no push notifications

**Defer (v2+):**
- AI trend comparison across months — needs 3+ months of history to be meaningful
- Team challenges ("team averages SS 80+ this week") — after individual goals are validated
- Badge gallery dedicated page — only if badge engagement warrants it
- Conversational AI chat — massive overengineering for 3 users; liability concerns

### Architecture Approach

The architecture refactor decomposes the 750-line DashboardPage god component into a thin orchestrator (~100 lines) that composes extracted section components. Simultaneously, business logic migrates from DashboardPage and sleep.ts into dedicated lib/ modules: gamify.ts (XP/streak/tiers), kudos.ts (social), goals.ts, badges.ts, and enhanced ai.ts. Custom hooks with useMemo (useGameState, useBadges, useGoals) replace per-render computations. This is extract-and-compose, not a rewrite — the visual output is identical after Phase 1.

**Major components:**
1. gamify.ts — single source of truth for XP, streak, tiers, levels (merged from split calcXP + calcXPBreakdown)
2. badges.ts — badge definitions, unlock criteria, earned check; called by calcXPBreakdown so badge XP flows into the XP system
3. GoalCard + goals.ts — goal CRUD with start snapshot, deadline, trajectory calculation; localStorage-backed
4. AIReport + enhanced ai.ts — weekly report display; reads CF KV via /report endpoint; manual refresh trigger
5. useGameState hook — memoized XP/streak/level computation; prevents per-render recalculation for all 3 leaderboard users
6. ErrorBoundary — graceful crash containment; currently missing entirely

### Critical Pitfalls

1. **setState-during-render in jump logic** — DashboardPage lines 216-224 call setSelDate, setView, clearJump() during render. Currently works by accident due to a guard, but any refactor touching this code risks an infinite re-render loop causing a white screen. Fix in Phase 1 by moving to useEffect with [jumpDate, jumpUser] dependencies. This is a Phase 1 blocker.

2. **Duplicated XP calculation logic** — calcXP in sleep.ts and calcXPBreakdown in DashboardPage implement the same rules independently. Adding badge XP would require updating both. They will diverge. Fix in Phase 1: single calcXPBreakdown returning a full breakdown object; calcXP becomes a thin wrapper. Must be done before badges ship.

3. **Refactor + features in the same phase** — combining DashboardPage decomposition with feature additions causes constant merge conflicts and forces features to be re-refactored later. Strict phase separation: Phase 1 is refactor-only. Phase 2 starts only after Phase 1 is merged and the app behaves identically.

4. **Badge system disconnected from XP** — if badges are built as an isolated feature with their own XP logic, the app ends up with two parallel reward systems that diverge. Design decision required in Phase 1: badges are an extension of the XP system, not alongside it. Existing "Bonusuri" bonus bars become badges. Badge XP flows through calcXPBreakdown.

5. **API key exposed in client bundle** — VITE_ANTHROPIC_KEY is bundled into client JS. Anyone viewing source can call the proxy. Fix by moving the Anthropic key to Cloudflare Worker secrets and authenticating requests via origin header check + rate limiting. Must be fixed before expanding AI features.

## Implications for Roadmap

Based on cross-file analysis, the dependency graph mandates a 4-phase structure. Architecture must lead, features follow, polish closes.

### Phase 1: Foundation Refactor
**Rationale:** All new features require clean insertion points, a single XP source of truth (badge XP cannot be integrated twice), and memoized computations (badge checks add to the per-render computation tree). The setState-during-render bug and API key exposure are active defects that must not be carried into feature work. This phase is refactor-only — zero new user-visible features.
**Delivers:** DashboardPage drops from 750 to ~100 lines; gamify.ts becomes XP single source of truth; kudos.ts extracted; useGameState hook created; ErrorBoundary added; setState-during-render fixed; API key moved to CF Worker secrets; unused shadcn components pruned.
**Addresses:** Architecture refactor (P0 prerequisite from FEATURES.md)
**Avoids:** Pitfalls 1, 2, 3, 4, 5 — all are Phase 1 blockers per PITFALLS.md pitfall-to-phase mapping
**Research flag:** No additional research needed — direct codebase analysis, established React patterns, zero uncertainty.

### Phase 2: Gamification Expansion (Badges + Goals)
**Rationale:** Badge system and goals are self-contained features that share no dependencies with AI or mobile UX. Badges require gamify.ts (Phase 1) and kudos.ts (Phase 1) to be clean before integration. Goals are the simpler of the two and enhance the AI report in Phase 3. Building both together makes sense — they share the GoalCard and BadgeGrid insertion points in the newly decomposed DashboardPage.
**Delivers:** badges.ts with 4 categories (~20 badges total: consistency, quality, social, fun/surprise); BadgeGrid component; badge unlock toast + confetti; goals.ts with trajectory calculation (start snapshot, deadline, on-track/behind/ahead); GoalCard component in dashboard.
**Uses:** react-confetti-explosion (new dependency), Radix Progress (existing), localStorage module pattern
**Implements:** BadgeGrid, GoalCard, badges.ts, goals.ts, useBadges hook, useGoals hook
**Avoids:** Pitfall 6 (badge-XP disconnect — badges designed as XP system extension, not parallel system); Pitfall 8 (goal without context — data model includes startDate, startingAverage, trajectory)
**Research flag:** No additional research needed — badge logic is pure TypeScript business rules, goal model is straightforward.

### Phase 3: Weekly AI Analysis
**Rationale:** AI report is the headline feature but depends on the English UI migration (Romanian UI + English AI report is jarring), and is enhanced when it can reference a user's goal progress. Goals ship in Phase 2, English migration happens in Phase 3 alongside AI. The Cloudflare Worker changes (add scheduled handler, KV binding, wrangler.toml) are self-contained and do not conflict with React component work.
**Delivers:** Enhanced ai.ts with weekly batch logic; Cloudflare Worker gains scheduled() handler + KV cache; /report endpoint on the worker; AIReport component; English UI migration (strings.ts replacing all Romanian hardcoded strings); AI prompt designed for week-over-week comparison with goal progress reference.
**Uses:** Cloudflare KV, Cloudflare Cron Triggers, wrangler.toml, strings.ts, Claude Haiku 4.5
**Implements:** AIReport component, enhanced ai.ts, worker/proxy.js scheduled handler
**Avoids:** Pitfall 5 (API key in bundle — Anthropic key now in CF Worker secrets per Phase 1); Pitfall 7 (AI analysis staleness — prompt includes previous week's analysis, 3-4 bullet points per person, weekly date cache key)
**Research flag:** Cloudflare KV namespace binding and wrangler.toml cron configuration may need a quick doc check during planning — patterns are documented but project has no wrangler.toml yet.

### Phase 4: Mobile UX and Polish
**Rationale:** Mobile improvements require the decomposed components from Phase 1 — collapsing, reordering, and lazy-loading dashboard sections is trivial with separate components and impossible in a 750-line monolith. After Phases 2-3 add badges + goals + AI to the dashboard, scroll depth must be measured and addressed. TypeScript strictness (eliminating `any` types) and dark mode verification of new components close out the milestone.
**Delivers:** Collapsible dashboard sections (CSS + localStorage for collapse state); mobile-optimized card layout (Tailwind responsive classes, CSS scroll-snap-type); Chart.js mobile tuning (legend display off, tick density); TypeScript `any` elimination; dark mode audit of all new components; "data on this device only" indicator for localStorage-backed features.
**Uses:** Tailwind CSS (existing), CSS scroll-snap (native, zero JS), Chart.js responsive options (existing), Radix Progress (existing)
**Implements:** Focus mode collapsible layout, mobile-first dashboard grid
**Avoids:** UX pitfall of cognitive overload (too many gamification elements simultaneously visible)
**Research flag:** No additional research needed — Tailwind responsive classes and Chart.js responsive options are well-documented, standard patterns.

### Phase Ordering Rationale

- Phase 1 must come first because it fixes active defects (setState-during-render, API key exposure, XP duplication) that would corrupt any feature built on top of the current code. The refactor is a prerequisite, not a preference.
- Phase 2 before Phase 3 because goals enhance the AI report (the AI can reference goal progress) and badge social detection uses kudos data that Phase 1 standardizes.
- Phase 3 before Phase 4 because the AI section is a new dashboard card — its presence affects total scroll depth, which Phase 4 must account for when measuring mobile UX.
- Phase 4 last because mobile optimization requires all feature components to be in place (you cannot optimize scroll depth for content that does not exist yet).

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 3:** Cloudflare Worker wrangler.toml configuration with KV namespace binding and `[triggers] crons` section — no wrangler.toml currently exists in the project. Patterns are documented but a quick reference during planning step will prevent deployment surprises.

Phases with standard patterns (skip research-phase):
- **Phase 1:** Established React refactoring patterns (extract-and-compose, useMemo); direct codebase analysis already complete.
- **Phase 2:** Pure TypeScript business logic (badge criteria, goal math); localStorage module pattern already used in habits.ts.
- **Phase 4:** Tailwind responsive utilities and Chart.js responsive options are well-documented. No unknowns.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Existing stack is production-validated. New additions (CF KV, react-confetti-explosion) are documented and stable. Alternatives were explicitly evaluated and rejected with rationale. |
| Features | HIGH | Informed by Fitbit, Garmin, Apple Watch, Sleep Cycle competitive analysis plus UX research on goal-setting and contextual nudges. Badge taxonomy derived from multiple sources. |
| Architecture | HIGH | Based on direct codebase analysis of all source files. Patterns (extract-and-compose, useMemo hooks, localStorage module) are established React idioms with direct codebase evidence. |
| Pitfalls | HIGH | All 8 pitfalls identified from direct codebase analysis with specific line references. Recovery strategies and phase mapping included. |

**Overall confidence:** HIGH

### Gaps to Address

- **wrangler.toml configuration:** The project has no wrangler.toml yet. The KV namespace binding and cron trigger syntax need to be confirmed against current Cloudflare documentation during Phase 3 planning. Low risk (CF docs are stable) but should be verified before implementation starts.
- **Cloudflare KV free tier limits:** Research confirms 100K reads/day and 1K writes/day on free tier. The actual KV namespace binding requires a Cloudflare account with Workers KV enabled. If the team's CF account does not have KV provisioned, this needs to be set up. Not a technical gap but an operational one.
- **Goal model localStorage key schema:** The pitfalls research recommends storing `{ targetSS, startDate, startingAverage, deadline }` but the exact key naming convention should be decided during Phase 2 planning to match existing patterns (st_ prefix convention from kudos.ts and habits.ts).
- **Badge XP amounts:** Research recommends badges integrate with the XP system but does not specify XP values per badge tier. These must be decided during Phase 2 design to avoid unbalancing the existing XP economy (current range appears to be ~500-2000 XP for long streaks and quality bonuses based on the codebase).

## Sources

### Primary (HIGH confidence)
- Direct codebase analysis — DashboardPage.tsx (750 lines), sleep.ts (377 lines), ai.ts (86 lines), App.tsx (186 lines), ProgressHub.tsx (122 lines), habits.ts, package.json
- [Cloudflare Cron Triggers docs](https://developers.cloudflare.com/workers/configuration/cron-triggers/) — scheduled handler configuration
- [Cloudflare KV docs](https://developers.cloudflare.com/workers/runtime-apis/kv/) — KV namespace binding for workers
- React documentation — useMemo, useEffect, render-phase side effect rules

### Secondary (MEDIUM confidence)
- [Sleep Cycle Gamification Case Study (Trophy)](https://www.trophy.so/blog/sleep-cycle-gamification-case-study) — badge categories, streak mechanics, retention patterns
- [Fitbit Badge System Guide (Wareable)](https://www.wareable.com/fitbit/fitbit-badges-guide-864) — 100+ badge taxonomy, milestone categories
- [Garmin Badges Ultimate Guide (FitStrapsUK)](https://fitstraps.co.uk/blogs/news/garmin-badges-the-ultimate-guide) — activity-diverse badges, leveling system
- [Scoping Review of Sleep Apps (Frontiers in Psychiatry)](https://www.frontiersin.org/journals/psychiatry/articles/10.3389/fpsyt.2022.1037927/full) — goal setting as top behavior change technique
- [Dashboard UX Patterns (Pencil & Paper)](https://www.pencilandpaper.io/articles/ux-pattern-analysis-data-dashboards) — 5-6 card limit, progressive disclosure
- [Gamification in Health Apps (Plotline)](https://www.plotline.so/blog/gamification-in-health-and-fitness-apps) — points, badges, leaderboards as standard pattern

### Tertiary (LOW confidence)
- [Claude Haiku 4.5 pricing](https://platform.claude.com/docs/en/about-claude/pricing) — cost estimate (~$0.005/month for weekly 3-user batch); validate against current pricing before Phase 3
- [react-confetti-explosion npm](https://www.npmjs.com/package/react-confetti-explosion) — bundle size and API confirmed at time of research; verify version availability at install time

---
*Research completed: 2026-03-23*
*Ready for roadmap: yes*
