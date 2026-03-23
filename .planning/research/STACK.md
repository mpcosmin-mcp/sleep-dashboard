# Stack Research

**Domain:** Social gamified sleep tracker -- milestone 2 additions (AI analysis, badges, goals, mobile UX, localization)
**Researched:** 2026-03-23
**Confidence:** HIGH

## Existing Stack (Do Not Change)

Already validated and in production. Listed for reference only -- not re-researched.

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.2 | UI framework |
| Vite | 7.3 | Build tooling |
| TypeScript | 5.9 | Type safety |
| Tailwind CSS | 3.4.1 | Styling |
| shadcn/ui + Radix | various | UI primitives |
| Chart.js + react-chartjs-2 | 4.5 / 5.3 | Data visualization |
| date-fns | 4.1 | Date utilities |
| lucide-react | 0.576 | Icons |
| Zod | 4.3 | Schema validation |
| Google Sheets + Apps Script JSONP | -- | Backend/data layer |
| Cloudflare Worker | -- | AI proxy (CORS) |
| Claude Haiku 4.5 | claude-haiku-4-5-20251001 | AI model |

## Recommended New Stack

### AI Weekly Analysis: Cloudflare Cron Triggers + KV Storage

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Cloudflare Cron Triggers | -- | Schedule weekly AI analysis every Sunday | Already using CF Workers for the AI proxy; cron triggers are a free built-in feature, no new service needed. Add a `scheduled()` handler to the existing worker. |
| Cloudflare KV | -- | Cache the weekly AI report (JSON) | Free tier allows 100K reads/day, 1K writes/day -- a weekly write + daily reads fits trivially. The client fetches the cached report instead of calling Claude on every page load. |
| wrangler.toml | -- | Worker configuration with cron schedule | Required to declare `[triggers] crons = ["0 8 * * 1"]` (Monday 8am UTC). Currently missing from the project. |

**Confidence:** HIGH -- Cloudflare Cron Triggers are documented, stable, and the project already uses a CF Worker.

**Architecture:** The existing `worker/proxy.js` gains two responsibilities:
1. On-demand proxy (existing `fetch()` handler)
2. Weekly scheduled analysis (new `scheduled()` handler) -- fetches data from Google Sheets API, calls Claude Haiku, writes result to KV

The client reads the cached report from a new `/report` endpoint on the same worker. This eliminates the API key exposure issue (key lives server-side in CF secrets, not in client `.env`).

**Cost estimate:** Weekly batch for 3 users, ~30 days of data = ~2K input tokens + ~500 output tokens per run. At Haiku 4.5 pricing ($1/M input, $5/M output): approximately $0.005/month. Negligible.

### Localization: Manual String Constants (No Library)

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Plain TypeScript object | -- | English string constants | The app has ~50-80 user-facing strings currently hardcoded in Romanian. A single `src/lib/strings.ts` file with a `const en = { ... }` object is the right scope. No library needed. |

**Confidence:** HIGH

**Why NOT i18next/react-i18next:** The app serves one language (English). There is no multi-language requirement -- Romanian is being *replaced*, not offered as an alternative. Installing 22KB+ of i18n infrastructure for a find-and-replace task is over-engineering. If multi-language support is ever needed, migrate to i18next then.

**Why NOT LinguiJS/zero-intl:** Same reasoning. These solve a problem (runtime language switching) that does not exist here.

**Approach:** Create `src/lib/strings.ts` exporting all UI strings. Replace hardcoded Romanian strings throughout components. This also creates a single source of truth that makes future i18n trivial if needed.

### Achievement Badges: Pure TypeScript + Existing UI

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| No new library | -- | Badge definitions and unlock logic | Badges are computed from data (streak length, SS averages, kudos count). This is pure business logic -- a `src/lib/badges.ts` module with typed badge definitions and an `unlockedBadges(data, name)` function. |
| react-confetti-explosion | ^2.1 | Celebration animation on badge unlock | CSS-only (no canvas), ~3KB gzipped, zero dependencies. Fire once when a new badge is detected. |
| localStorage | -- | Track "seen" badges to detect new unlocks | Pattern already used throughout the app for kudos, streaks, repairs. |

**Confidence:** HIGH

**Why NOT a gamification library:** No React gamification libraries are mature or widely adopted. The badge system is domain-specific (sleep metrics, streak milestones, social actions). Rolling your own with TypeScript types is simpler and more maintainable than adapting a generic framework.

**Badge categories (from PROJECT.md):**
- Consistency: 7d/30d/90d streak
- Quality: SS >= 90 for 7 days, personal records
- Social: first kudos, 10 received, team MVP
- Fun/surprise: night owl, weekend warrior, comeback kid

All computable from existing `SleepEntry[]` data + localStorage kudos state. No new data sources needed.

### Sleep Goals: Pure TypeScript + localStorage

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| No new library | -- | Goal setting and progress tracking | A goal is `{ targetSS: number, period: 'week' \| 'month', startDate: string }` stored in localStorage. Progress is computed from existing data. |
| Radix Progress (already installed) | -- | Visual progress bar toward goal | `@radix-ui/react-progress` is already in the bundle. |

**Confidence:** HIGH

**Approach:** Goals stored in localStorage (consistent with habits, kudos, streak repairs). Progress computed from `SleepEntry[]` filtered to the goal period. Display as a progress ring or bar on the dashboard hero card.

### Mobile UX Improvements: CSS + Minimal Libraries

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Tailwind CSS (existing) | 3.4.1 | Responsive layout refactoring | The mobile issues are layout problems (scroll depth, chart readability), not missing capabilities. Fix with Tailwind responsive classes. |
| CSS `scroll-snap-type` | -- | Smooth tab/section navigation on mobile | Native CSS, zero JS overhead. Use for dashboard sections to reduce perceived scroll depth. |
| Chart.js responsive options | -- | Better chart readability on phones | Chart.js already supports `responsive: true` and `maintainAspectRatio`. Tune tick density, font sizes, and point radius for small screens. |

**Confidence:** HIGH

**Why NOT react-swipeable:** Swipe gestures add complexity without clear UX benefit here. The app uses a bottom tab bar for navigation (already implemented). Swipe-between-tabs conflicts with chart touch interactions. Avoid.

**Why NOT a virtual scroll library:** Dataset is 3 people x ~365 days. No performance issue to solve with virtualization.

**Key mobile fixes (no new libraries):**
1. Collapse dashboard hero card on mobile (show key metrics inline, expand on tap)
2. Reduce ProgressHub vertical footprint on mobile
3. Set Chart.js `plugins.legend.display: false` on mobile, use external legend
4. Use `@media (max-width: 640px)` or Tailwind `sm:` breakpoints for dashboard grid

## Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-confetti-explosion | ^2.1.2 | Badge unlock celebration | When a badge is newly unlocked (first render after earning) |

This is the **only new npm dependency** recommended for this milestone. Everything else uses existing libraries or pure TypeScript.

## Installation

```bash
# Single new dependency
npm install react-confetti-explosion@^2.1.2
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Plain string constants | react-i18next | If multi-language support becomes a requirement (2+ languages) |
| Cloudflare KV for report cache | localStorage cache | If CF KV setup proves too complex; less reliable since report would need client-side generation |
| react-confetti-explosion | canvas-confetti | If you need more complex particle effects; heavier but more customizable |
| CSS scroll-snap | react-swipeable | If explicit swipe-to-navigate between full-page sections is desired |
| Cloudflare Cron Triggers | GitHub Actions cron | If the worker needs to be decoupled from the proxy; GitHub Actions has 5-min cron granularity on free tier |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| react-i18next / any i18n library | Replacing one language, not adding multi-language. 22KB+ for no benefit. | `strings.ts` constant object |
| Firebase / Supabase for goal storage | Out of scope per PROJECT.md. Google Sheets is the backend. | localStorage for goals (client-local is acceptable per constraints) |
| Framer Motion for badge animations | 32KB+ gzipped. Massive bundle hit for one confetti effect. | react-confetti-explosion (3KB, CSS-only) |
| react-swipeable | Conflicts with Chart.js touch panning. Bottom tab bar already handles navigation. | CSS scroll-snap for section snapping |
| Any "gamification SDK" | None are mature for React. Badge logic is simple enough to hand-roll with types. | Pure TypeScript badge system |
| OpenAI / GPT for analysis | Already using Claude Haiku via CF Worker. Switching adds complexity, no benefit. | Keep Claude Haiku 4.5 |
| next-themes upgrade | Already installed and working for dark mode toggle. No changes needed. | Keep existing |

## Stack Patterns

**If goals need cross-device sync later:**
- Store goals in Google Sheets (add a "goals" sheet/tab)
- Read via existing JSONP pattern
- This is a future enhancement, not needed for MVP

**If badge unlock notifications need persistence:**
- Store unlock timestamps in localStorage (same pattern as kudos)
- On first detection of new badge, show confetti + toast
- Mark as "seen" to prevent re-triggering

**If AI report needs to be richer (charts, comparisons):**
- Increase Claude max_tokens from 1024 to 2048
- Add structured sections (trend analysis, week-over-week comparison, personalized tips)
- Still fits within Haiku 4.5 capabilities and cost budget

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| react-confetti-explosion@2.x | React 18+ / React 19 | Uses standard React components, no version conflicts |
| Cloudflare KV | wrangler 3.x | Requires `wrangler.toml` with KV namespace binding |
| Cloudflare Cron Triggers | wrangler 3.x | Requires `[triggers]` section in `wrangler.toml` |

## Sources

- [Cloudflare Cron Triggers docs](https://developers.cloudflare.com/workers/configuration/cron-triggers/) -- scheduled handler configuration
- [Cloudflare KV docs](https://developers.cloudflare.com/workers/runtime-apis/kv/) -- key-value storage for workers
- [Claude Haiku 4.5 pricing](https://platform.claude.com/docs/en/about-claude/pricing) -- $1/M input, $5/M output tokens
- [react-confetti-explosion npm](https://www.npmjs.com/package/react-confetti-explosion) -- CSS-only confetti component
- [react-i18next](https://react.i18next.com/) -- evaluated and rejected for this use case
- Existing codebase analysis: `worker/proxy.js`, `src/lib/ai.ts`, `src/lib/sleep.ts`, `package.json`

---
*Stack research for: Social gamified sleep tracker -- milestone 2 (AI, badges, goals, mobile, localization)*
*Researched: 2026-03-23*
