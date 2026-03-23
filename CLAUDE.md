<!-- GSD:project-start source:PROJECT.md -->
## Project

**Sleep Tracker**

A fun, social sleep tracking dashboard for a small team (currently 3 people in Sibiu). Users log daily sleep metrics (Sleep Score, RHR, HRV) from their wearables, then engage with each other through a gamified leaderboard, kudos system, streak tracking, and XP progression. The app makes sleep improvement social and competitive in a friendly way. Built as a single-page React app backed by Google Sheets.

**Core Value:** People log sleep data daily because it's fun and social — the gamification and team dynamics keep them coming back, which leads to actual sleep improvement.

### Constraints

- **Backend**: Google Sheets only — no new databases or servers
- **Hosting**: GitHub Pages (single-file HTML deployment)
- **AI costs**: Claude Haiku via Cloudflare Worker — keep costs minimal (weekly batch, not real-time)
- **Team size**: 3 users — performance optimization for small datasets, not scale
- **Browser-only state**: localStorage for client state is acceptable (no cross-device sync needed)
<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->
## Technology Stack

## Languages
- **TypeScript** ~5.9.3 -- all application source code (`src/**/*.{ts,tsx}`)
- **JavaScript** -- Cloudflare Worker proxy (`worker/proxy.js`), build configs
- **CSS** -- Tailwind utility classes + HSL CSS custom properties (`src/index.css`)
## Runtime & Target
- **Browser SPA** -- no server-side rendering, ships as a single-page application
- **ES2022** target, DOM + DOM.Iterable libs (`tsconfig.app.json`)
- **ESNext modules** with bundler module resolution
- **Node 20** used in CI for build steps
## Framework & Core Libraries
| Library | Version | Role |
|---|---|---|
| React | ^19.2.0 | UI framework (strict mode) |
| React DOM | ^19.2.0 | DOM renderer |
| Vite | ^7.3.1 | Dev server & bundler (`vite.config.ts`) |
| @vitejs/plugin-react | ^5.1.1 | React fast refresh in dev |
## UI Component System
- **shadcn/ui** -- component generator configured in `components.json` (style: default, base color: slate, CSS variables enabled)
- **Radix UI** primitives -- accordion, avatar, checkbox, dialog, dropdown-menu, label, popover, progress, scroll-area, select, separator, slider, switch, tabs, toast, toggle, tooltip (all under `@radix-ui/react-*`)
- **Tailwind CSS** 3.4.1 with `tailwindcss-animate` plugin (`tailwind.config.js`)
- **class-variance-authority** ^0.7.1 -- variant-based component styling
- **clsx** ^2.1.1 + **tailwind-merge** ^3.5.0 -- class name utilities (`src/lib/utils.ts`)
- **lucide-react** ^0.576.0 -- icon library
## Charting
- **Chart.js** ^4.5.1 -- chart engine
- **react-chartjs-2** ^5.3.1 -- React bindings (`src/components/pages/ChartsPage.tsx`)
## Forms & Validation
- **react-hook-form** ^7.71.2 -- form state management
- **@hookform/resolvers** ^5.2.2 -- schema resolver bridge
- **zod** ^4.3.6 -- runtime schema validation
## Additional UI Libraries
| Library | Version | Purpose |
|---|---|---|
| vaul | ^1.1.2 | Drawer component |
| cmdk | ^1.1.1 | Command palette |
| sonner | ^2.0.7 | Toast notifications |
| embla-carousel-react | ^8.6.0 | Carousel |
| react-day-picker | ^9.14.0 | Date picker |
| react-resizable-panels | ^4.7.0 | Resizable panel layout |
| next-themes | ^0.4.6 | Theme management |
| date-fns | ^4.1.0 | Date formatting/manipulation |
## Build & Dev Tooling
| Tool | Version | Config File |
|---|---|---|
| Vite | ^7.3.1 | `vite.config.ts` |
| TypeScript | ~5.9.3 | `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json` |
| ESLint | ^9.39.1 | `eslint.config.js` |
| PostCSS | ^8.5.8 | `postcss.config.js` |
| Autoprefixer | ^10.4.27 | via PostCSS |
| Parcel | ^2.16.4 | CI-only: single-HTML bundling for GitHub Pages deploy |
| html-inline | ^1.2.0 | CI-only: inlines assets into one HTML file |
## CI/CD
- **GitHub Actions** -- `.github/workflows/deploy.yml`
- Workflow: `npm install` -> Parcel build -> `html-inline` -> deploy to GitHub Pages
- Uses `actions/checkout@v4`, `actions/setup-node@v4`, `actions/upload-pages-artifact@v3`, `actions/deploy-pages@v4`
## Path Aliases
- `@/*` maps to `./src/*` (configured in both `tsconfig.json` and `vite.config.ts`)
## Fonts
- **Fraunces** (variable, 300-700) -- imported via Google Fonts in `src/index.css`
- **Geist Mono** (400-700) -- imported via Google Fonts in `src/index.css`
## Color System
- HSL CSS custom properties for theming (light/dark modes defined in `src/index.css`)
- Dark mode via `class` strategy on `<html>` element (`tailwind.config.js`: `darkMode: ["class"]`)
- Per-metric color functions: `ssColor()`, `rhrColor()`, `hrvColor()` in `src/lib/sleep.ts`
## State Management
- **React useState/useCallback** -- no external state library
- **localStorage** -- user preferences, streak repairs, habit configs/logs, kudos, XP spent
- **Context API** -- `HideCtx` for privacy mode (`src/lib/hide.tsx`)
## Package Configuration
- `"type": "module"` in `package.json` (ES modules)
- Private package, version 0.0.0
- Scripts: `dev`, `build` (tsc + vite), `lint`, `preview`
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

## Language & Toolchain
- **Language**: TypeScript (strict mode) with React 19 + JSX
- **Build**: Vite 7 (dev/preview) + Parcel (CI production build for single-HTML deploy)
- **Styling**: Tailwind CSS 3.4 with `tailwindcss-animate` plugin
- **UI primitives**: shadcn/ui (Radix + CVA + tailwind-merge), installed via `components.json`
- **Charts**: Chart.js via `react-chartjs-2`
- **Forms**: `react-hook-form` + `zod` (dependencies present; input page uses plain refs)
- **Target**: ES2022, bundler module resolution
## Project Structure
## Naming Conventions
### Files
- **Page components**: PascalCase with `Page` suffix (`DashboardPage.tsx`, `InputPage.tsx`)
- **Shared components**: PascalCase, short names (`Avi.tsx`, `MVal.tsx`, `Toast.tsx`)
- **UI primitives** (shadcn): kebab-case (`button.tsx`, `scroll-area.tsx`)
- **Lib modules**: lowercase (`sleep.ts`, `habits.ts`, `ai.ts`)
- **Hooks**: kebab-case with `use-` prefix (`use-toast.ts`)
### Exports
- Page components: named exports (`export function DashboardPage`)
- Shared components: named exports with barrel re-export from `index.ts`
- UI primitives: named exports of component + variant helper (e.g. `Button` + `buttonVariants`)
- Lib modules: mix of named exports for functions, types, and constants
### Variables & Functions
- **Functions**: camelCase (`fetchAllData`, `loggingStreak`, `calcXP`, `ssColor`)
- **Constants**: UPPER_SNAKE_CASE for config values (`NAMES`, `PALETTE`, `API`, `STREAK_REPAIR_COST`, `XP_PER_LEVEL`)
- **Color maps**: UPPER_SNAKE_CASE objects (`SS`, `RHR`, `HRV`, `PERSON_COLOR`)
- **Types/Interfaces**: PascalCase (`SleepEntry`, `AggEntry`, `StreakResult`, `HabitDef`, `PersonAnalysis`)
- **Component-local types**: PascalCase, defined above the component (`DashView`, `CalDay`, `MonthSummary`)
- **LocalStorage keys**: `st_` prefix with snake_case (`st_dark`, `st_user`, `st_repair_{name}_{date}`, `st_kudos_{date}_{from}_{to}`)
## Component Patterns
### Page Components
- Receive data + callbacks as props from `App.tsx` (no global store)
- Contain their own local state via `useState`
- Handle conditional rendering for auth-gated views (check `user` prop)
- Large pages define helper sub-components at the top of the same file (not extracted to separate files)
### Shared Components
- Small, focused, typically under 15 lines
- Accept typed props inline (no separate Props interface for simple components)
- Pattern: `export function Avi({ name, size = 'sm' }: { name: string; size?: 'sm' | 'md' })`
### UI Components (shadcn)
- Use `React.forwardRef` pattern with `cn()` utility
- CVA (class-variance-authority) for variant-based styling
- Follow shadcn conventions exactly; do not modify
### Inline Styling
- Tailwind classes for layout, spacing, typography
- Inline `style={{}}` for dynamic colors (color values computed from data)
- Pattern: `style={{ color: ssColor(entry.ss), background: ssColor(entry.ss) + '12' }}`
## State Management
### Architecture: Prop Drilling (No State Library)
- `App.tsx` holds all global state: `data`, `page`, `user`, `dark`, `hidden`, `toast`
- State is passed down via props to page components
- Callbacks (`showToast`, `pickUser`, `logout`, `setData`) are passed as props
- No Redux, Zustand, Jotai, or React Context for data (only `HideCtx` for privacy toggle)
### Data Flow
- `fetchAllData()` loads from Google Sheets API via JSONP
- Data is `SleepEntry[]` held in `App` state, passed to all pages
- Writes go through `submitEntry()` (JSONP to Google Apps Script), then local state is optimistically updated
### Persistence
- `localStorage` for user preferences (`st_dark`, `st_user`)
- `localStorage` for gamification state (kudos, streak repairs, XP spent, habit config/logs)
- All localStorage access wrapped in `try/catch` with empty catch blocks
### Navigation
- Manual page routing via `useState<Page>` in `App.tsx` (no react-router)
- Cross-page navigation via callbacks (`navigateToDashDate`)
- `jumpDate`/`jumpUser` pattern for Charts-to-Dashboard deep linking
## Error Handling
- **Network errors**: `try/catch` with user-facing toast (`showToast('Eroare la ...')`)
- **localStorage**: Every access wrapped in `try { ... } catch { return fallback; }`
- **Missing data**: Null coalescing (`??`), optional chaining (`?.`), fallback values
- **Empty states**: Conditional renders returning placeholder UI (`Nicio inregistrare.`, `Insuficiente date.`)
- **AI module**: Returns `null` on any error (missing config, network failure, parse failure)
- No error boundaries, no Sentry, no structured error logging
## Styling Conventions
### Color System
- Warm earthy palette via CSS custom properties in HSL
- Light + dark theme defined in `:root` and `.dark` in `src/index.css`
- Per-metric color functions: `ssColor()`, `rhrColor()`, `hrvColor()` return hex strings
- Per-person fixed colors: `PERSON_COLOR` record for consistent avatar/chart colors
- Background tint pattern: metric color hex + opacity suffix (e.g., `'#2563eb' + '12'`)
### Typography
- Body: Fraunces (serif)
- Mono (metrics): Geist Mono
- Size scale: heavy use of `text-[7px]` through `text-3xl` with arbitrary values
- Font weight: `font-bold` and `font-semibold` dominate; `font-medium` occasionally
### Layout
- Mobile-first responsive: flexbox + grid
- Desktop sidebar (`hidden lg:flex`) + mobile bottom tab bar (`lg:hidden fixed bottom-0`)
- Cards pattern: shadcn `Card` + `CardContent` for all content sections
- Expandable sections: custom `Section` component with toggle state
### Animations
- CSS keyframe animations defined in `index.css`: `fadeUp`, `fadeIn`, `slideIn`, `pulse-soft`
- Staggered card reveals via `nth-child` animation delays
- Tailwind transition utilities for interactive elements
- `prefers-reduced-motion` respected
## Import Conventions
- Path alias: `@/` maps to `src/` (configured in tsconfig + vite)
- Imports grouped: React hooks, then UI components, then lib modules, then shared components
- Type imports use `type` keyword: `import { type SleepEntry, fetchAllData } from '@/lib/sleep'`
- Chart.js registered once at module level in `ChartsPage.tsx`
## Language & i18n
- UI text is predominantly Romanian (buttons, labels, insights, error messages)
- Some English mixed in (level titles, technical labels like "Sleep Score", "RHR", "HRV")
- No i18n library; strings are hardcoded inline
- Comment headers and section dividers in English with decorative Unicode borders (`// ════════════`)
## Code Style
- **Semicolons**: Inconsistent — shadcn files omit them, custom files include them
- **Trailing commas**: Present in most places
- **Quotes**: Single quotes in custom code, double quotes in shadcn/generated code
- **Line length**: No hard limit; some lines are quite long (inline JSX with Tailwind classes)
- **Comments**: Section headers using `/* ── Title ── */` or `// ════════════` block dividers
- **Compact style**: Multiple statements on one line separated by `;` is common in data-processing code
- **Ternary expressions**: Heavily used inline in JSX for conditional rendering and styling
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

## Pattern
## Layers
```
```
### Layer responsibilities
## Data Flow
```
```
### State management
- **No state library.** All state is React `useState` in `App.tsx`, passed as props.
- **Global data:** `data: SleepEntry[]` fetched once on mount, updated optimistically on submit.
- **User identity:** `user: string | null` persisted in `localStorage` key `st_user`. No authentication; just a name picker.
- **Gamification state:** XP and streaks are computed on every render from the data array + localStorage flags. No dedicated store.
- **Habit state:** Entirely localStorage-backed, isolated per user.
### Persistence
| What | Where | Keys |
|------|-------|------|
| Sleep entries | Google Sheets (remote) | -- |
| Current user | localStorage | `st_user` |
| Dark mode | localStorage | `st_dark` |
| Kudos given | localStorage | `st_kudos_{date}_{from}_{to}` |
| Streak repairs | localStorage | `st_repair_{name}_{date}` |
| XP spent on repairs | localStorage | `st_xp_spent_{name}` |
| Habit config | localStorage | `st_habits_{user-slug}` |
| Habit daily log | localStorage | `st_habit_log_{user-slug}` |
## Abstractions
### Color system
- **Sleep Score (SS):** blue (>=90) -> green (>=80) -> amber (>=65) -> orange (>=50) -> red
- **RHR (lower is better):** blue (<52) -> green (<58) -> amber (<65) -> orange (<72) -> red
- **HRV:** purple (>65) -> blue (>50) -> amber (>35) -> orange (>20) -> red
- **Per-person colors:** Fixed color per team member (rose, ocean blue, teal green)
### Gamification
- **XP** = 10/logged day + SS bonus (5 for >=80, 10 for >=90) + streak bonuses + kudos (5 each) - repair costs
- **Levels** = floor(XP / 100) + 1, with named titles (Romanian humor, up to level 100)
- **Tiers** = Bronze/Silver/Gold/Platinum/Diamond/Master/Grandmaster/Legend/Mythic/Transcendent
- **Streaks** = consecutive logged days, with 1-day gap auto-save (SS >= 75) or paid repair (50 XP)
### Privacy (Hide mode)
## Entry Points
| Entry point | Purpose |
|---|---|
| `index.html` | HTML shell, loads `src/main.tsx` as ES module |
| `src/main.tsx` | React DOM mount, renders `<App />` into `#root` |
| `src/App.tsx` | Application root: layout, navigation, data loading |
| `worker/proxy.js` | Cloudflare Worker entry (deployed independently) |
## Build and Deploy
- **Dev:** `npm run dev` (Vite dev server)
- **Build:** `npm run build` (TypeScript check + Vite build)
- **Deploy:** GitHub Actions workflow builds with Parcel, inlines into single HTML via `html-inline`, deploys to GitHub Pages
- **AI proxy:** Deployed separately via `npx wrangler deploy worker/proxy.js --name sleep-ai-proxy`
## Technology Stack
| Layer | Technology |
|---|---|
| Framework | React 19 |
| Language | TypeScript ~5.9 |
| Build (dev) | Vite 7 |
| Build (deploy) | Parcel 2 (single-file HTML output) |
| Styling | Tailwind CSS 3.4 + CSS custom properties (HSL) |
| UI components | shadcn/ui (Radix primitives) |
| Charts | Chart.js + react-chartjs-2 |
| Fonts | Fraunces (serif body), Geist Mono (metrics) |
| Data source | Google Sheets via Apps Script JSONP |
| AI | Claude Haiku via Cloudflare Worker proxy |
| Hosting | GitHub Pages (single HTML file) |
<!-- GSD:architecture-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd:quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd:debug` for investigation and bug fixing
- `/gsd:execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd:profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
