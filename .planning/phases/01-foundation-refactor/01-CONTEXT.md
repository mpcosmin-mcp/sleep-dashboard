# Phase 1: Foundation Refactor - Context

**Gathered:** 2026-03-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Decompose DashboardPage (750 lines) into focused components, unify XP logic, fix active defects (setState-during-render, API key exposure), add Error Boundary, replace `any` types, memoize expensive computations, and remove unused shadcn/ui components and npm dependencies. Zero new user-visible features — the app must look and behave identically after this phase.

</domain>

<decisions>
## Implementation Decisions

### Decomposition Strategy
- **D-01:** One component per dashboard section: HeroCard, Tracker, Leaderboard, XPBreakdown, Bonuses, SnapshotView — each in their own file
- **D-02:** DashboardPage becomes a thin orchestrator (~100 lines) that composes section components
- **D-03:** The existing `Section` wrapper component is preserved and reused by extracted components

### Visual Changes
- **D-04:** Pure refactor — pixel-identical output. No visual changes, no design cleanup, no dark mode fixes. Visual polish happens in Phase 4.

### Module Extraction
- **D-05:** Restructure the Bonusuri (bonus) section into a data-driven format that Phase 2 can extend into a full badge system. Extract bonus definitions as structured data, not inline JSX.

### Claude's Discretion
- File location for new dashboard section components (e.g., `src/components/dashboard/` vs keeping in `pages/`)
- Where helper functions go (into the component that uses them vs into lib/ modules) — decide based on reuse patterns
- How to split sleep.ts (378 lines) — by domain concern or minimal extraction. Claude determines the right granularity.
- Exact hook design for memoization (useGameState, etc.)
- Which unused shadcn/ui components and npm dependencies to remove (based on import analysis)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Architecture
- `.planning/research/ARCHITECTURE.md` — Component boundaries, data flow, suggested build order
- `.planning/research/PITFALLS.md` — Critical pitfalls with prevention strategies (setState-during-render, XP duplication, API key exposure)
- `.planning/codebase/ARCHITECTURE.md` — Current architecture, layer responsibilities, state management
- `.planning/codebase/CONCERNS.md` — All known technical debt, security issues, performance concerns

### Gamification Rules
- `GAMIFICATION.md` — XP earning/spending rules, streak rules, kudos rules, color system — must be preserved exactly

### Source Files (primary targets)
- `src/components/pages/DashboardPage.tsx` — 750-line god component to decompose
- `src/lib/sleep.ts` — 378-line module with duplicated XP logic to unify
- `src/lib/ai.ts` — API key exposure to fix
- `src/components/shared/ProgressHub.tsx` — Has duplicate 7-day logic to consolidate
- `worker/proxy.js` — Cloudflare Worker to secure

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `Section` component (DashboardPage.tsx:17-33): Expandable card wrapper — extract and reuse across all dashboard sections
- `Avi` component (shared/Avi.tsx): Avatar circle — already extracted, used by dashboard
- `MVal` component (shared/MVal.tsx): Metric value with hide support — already extracted
- `V` component (hide.tsx): Digit masking — already extracted
- `Card`, `Badge`, `Tabs` from shadcn/ui — used across dashboard sections

### Established Patterns
- Props-down data flow from App.tsx — no state library, all useState in App
- localStorage for client state with `st_` prefix convention
- Color functions (ssColor, rhrColor, hrvColor) for semantic metric coloring
- `personColor()` for per-user consistent colors

### Integration Points
- App.tsx passes `data`, `user`, `jumpDate`, `jumpUser`, `clearJump`, `onBack` to DashboardPage — extracted components receive these via DashboardPage props or custom hooks
- ProgressHub.tsx has its own `getLast7Days` function that duplicates `get7Days` in DashboardPage — consolidate during extraction
- `calcXP` in sleep.ts and `calcXPBreakdown` in DashboardPage.tsx — merge into single source of truth

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. The user trusts Claude's judgment on technical implementation details for this refactoring phase.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 01-foundation-refactor*
*Context gathered: 2026-03-23*
