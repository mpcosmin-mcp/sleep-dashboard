# Pitfalls Research

**Domain:** Social gamified sleep tracker refactor + feature expansion
**Researched:** 2026-03-23
**Confidence:** HIGH (based on direct codebase analysis + domain knowledge)

## Critical Pitfalls

### Pitfall 1: setState During Render Causes Infinite Re-render Loops

**What goes wrong:**
DashboardPage lines 216-224 call `setSelDate`, `setView`, `setTrackerRange`, `setSnapshotMode`, `setSnapshotUser`, and `clearJump()` directly during render (not inside useEffect). This is a React anti-pattern that triggers re-renders during the render phase itself. Currently it works by accident because the `jumpDate && jumpDate !== selDate` guard prevents infinite loops, but any refactor that touches this logic risks creating an infinite loop that freezes the app.

**Why it happens:**
The jump-from-Charts feature was added incrementally. The "quick fix" of checking state inline felt simpler than wiring up a useEffect with proper dependency tracking. When you are inside a 750-line component, the path of least resistance wins.

**How to avoid:**
Move the jump handling into a `useEffect` with `[jumpDate, jumpUser]` dependencies. The effect sets local state and calls `clearJump()`. This is the standard React pattern for "external trigger causes local state change." Do this in the refactor phase before adding any new features, because new features will add more state that interacts with the same flow.

**Warning signs:**
- White screen on navigation between Charts and Dashboard
- React dev tools showing "Maximum update depth exceeded" errors
- Any new feature that adds state to DashboardPage starts causing flicker

**Phase to address:**
Architecture refactor (Phase 1) -- this is a blocker for all other work.

---

### Pitfall 2: Duplicated XP Calculation Logic Drifts Out of Sync

**What goes wrong:**
XP is calculated in two separate places: `calcXP()` in sleep.ts (lines 320-364) and `calcXPBreakdown()` in DashboardPage.tsx (lines 57-81). Both implement the same rules (base XP, SS bonuses, streak bonuses, good sleep bonuses, kudos XP, spent XP) independently. When one is updated and the other is not, the XP total shown in the breakdown panel will not match the XP shown in the header, ProgressHub, and leaderboard. This will happen the moment anyone adds a new XP source (like badges).

**Why it happens:**
The breakdown function was created for the expandable XP detail view. Rather than refactoring `calcXP` to return a breakdown object, a second function was written that reimplements the logic with named intermediate variables. Classic "I just need this one extra thing" duplication.

**How to avoid:**
Replace both with a single `calcXPBreakdown()` that returns `{ base, bonusSS, streakBonus, goodSleepBonus, kudosXP, spent, total }`. The `calcXP()` function becomes a thin wrapper: `return calcXPBreakdown(data, name).total`. Do this before adding badges, because badges will be a new XP source that would need to be added in two places.

**Warning signs:**
- XP total in ProgressHub differs from XP breakdown sum
- Adding a badge that grants XP but it only shows in one place
- Users report "my XP went down" after a code change

**Phase to address:**
Architecture refactor (Phase 1) -- must be the single source of truth before badges add more XP sources.

---

### Pitfall 3: localStorage Scan for Kudos XP Is O(n) Per User Per Render

**What goes wrong:**
Both `calcXP()` and `getTotalKudos()` iterate over the entire `localStorage` (lines 350-355 in sleep.ts, lines 50-54 in DashboardPage.tsx) to count kudos. The leaderboard renders all 3 users, each calling `calcXP()`, which each scan all of localStorage. As kudos accumulate over months, localStorage grows (each kudos = one key like `st_kudos_2026-03-22_Petrica_Clara`). After 6 months with 3 users exchanging daily kudos, that is ~540 kudos keys. The full scan runs on every render because nothing is memoized.

**Why it happens:**
localStorage was the simplest persistence for a prototype. Scanning it works fine at 10 entries. Nobody profiled it because the team is 3 people and data is small. But it is called on every state change (cheerRefresh counter triggers re-renders).

**How to avoid:**
Memoize XP calculations with `useMemo` keyed on `[data, user, cheerRefresh]`. Better: compute kudos count once (single localStorage scan) and pass it as a parameter to `calcXP()` instead of having calcXP reach into localStorage itself. This separates pure computation from side-effect-laden storage access.

**Warning signs:**
- Dashboard feels sluggish after months of use
- React Profiler shows DashboardPage render time growing over time
- Mobile devices (the primary platform) noticeably lag on the leaderboard

**Phase to address:**
Architecture refactor (Phase 1) -- memoization pass. Also relevant when adding badges (more things to compute per render).

---

### Pitfall 4: Refactoring a 750-Line Component While Adding Features Simultaneously

**What goes wrong:**
The plan includes both "break DashboardPage into focused components" and "add badges, goals, AI analysis." If these happen in the same phase, every feature branch conflicts with the refactor branch. The refactor moves code between files; the features add code to the old file. Merge conflicts become the primary time sink. Worse, features get built on the old architecture and then need to be re-refactored.

**Why it happens:**
Impatience. The refactor feels like "no user-visible progress" so there is pressure to combine it with feature work. Also, it seems efficient to "refactor as you go." In practice, refactoring changes every import path and component boundary, while features need a stable API to build against.

**How to avoid:**
Strict phase separation. Phase 1 is refactor only -- zero new features. The refactor produces a clean component API that Phase 2 (features) builds on. The refactor is "done" when:
1. No file exceeds 200 lines
2. XP logic has a single source of truth
3. All computations are memoized
4. The setState-during-render bug is fixed
5. The app behaves identically to before (visual regression test via screenshots)

**Warning signs:**
- "Let me just add this badge component while I am refactoring anyway"
- Merge conflicts in DashboardPage.tsx
- Features being built with inline logic instead of using extracted utilities

**Phase to address:**
Project structure -- Phase 1 must be refactor-only, Phase 2 is features.

---

### Pitfall 5: API Key Exposed in Client Bundle

**What goes wrong:**
The AI proxy configuration uses `import.meta.env.VITE_AI_PROXY_URL` and `import.meta.env.VITE_ANTHROPIC_KEY` (ai.ts lines 17-18). Any `VITE_` prefixed env var is bundled into client-side JavaScript and visible in browser source. The Cloudflare Worker proxy is supposed to protect the Anthropic API key, but if the proxy URL itself requires an API key header (`X-API-Key`), that key is exposed in the bundle. Anyone viewing source can call the proxy and run up the AI bill.

**Why it happens:**
The Cloudflare Worker was set up as a CORS proxy, and adding auth to the proxy felt like an extra step. The `VITE_ANTHROPIC_KEY` naming suggests the actual Anthropic key might be client-side, or at minimum a proxy auth key is exposed.

**How to avoid:**
The Cloudflare Worker should authenticate requests using a mechanism that does not require a secret in the client bundle. Options:
1. Rate-limit by origin domain (the Worker checks `Referer` or `Origin` header matches the GitHub Pages domain)
2. Use a simple shared token that is not the Anthropic key, with aggressive rate limiting on the Worker (max 1 request per user per week for weekly analysis)
3. Remove the `X-API-Key` header entirely and rely on origin-based auth in the Worker

The Anthropic API key must NEVER appear in client code or be prefixed with `VITE_`.

**Warning signs:**
- `VITE_ANTHROPIC_KEY` exists in `.env` or is set in GitHub Actions
- Browser DevTools Network tab shows an `X-API-Key` header on AI requests
- Unexpected Anthropic API charges

**Phase to address:**
Architecture refactor (Phase 1) for the security fix. Must be done before expanding AI features in later phases.

---

### Pitfall 6: Badge System Becomes a Second Gamification Engine Disconnected from XP

**What goes wrong:**
Badges (consistency, quality, social, fun) are planned as a separate achievement system. If implemented as an isolated feature, the app ends up with two parallel reward systems: XP/levels (existing) and badges (new). Users see badges but they do not affect XP. Or badges grant XP but the amounts conflict with the existing XP economy. The "Bonusuri" section already has streak-based achievements -- badges could duplicate or contradict these.

**Why it happens:**
Badges feel like a "new feature" rather than an extension of the existing gamification system. The developer builds a `badges.ts` module that checks conditions independently, without integrating into the XP calculation pipeline.

**How to avoid:**
Design badges as part of the XP system, not alongside it:
1. Define badge tiers (bronze/silver/gold) with XP rewards baked in
2. Replace the current "Bonusuri" section with badges -- the existing 4 bonus progress bars ARE badges, they just do not have names/icons yet
3. Badge unlock state goes into localStorage (like streak repairs), and `calcXPBreakdown` includes badge XP as a category
4. Create a `badges.ts` module that exports `checkBadges(data, name) => Badge[]`, and `calcXPBreakdown` calls it

**Warning signs:**
- Badge component has its own XP granting logic
- "Bonusuri" section and badges section show conflicting achievement progress
- Users confused about what grants XP

**Phase to address:**
Feature phase (Phase 2) -- but the design decision must be made during Phase 1 planning.

---

### Pitfall 7: AI Weekly Analysis Becomes Stale or Ignored

**What goes wrong:**
The AI analysis runs weekly and generates a report. But if the report is static text cached in localStorage, users see the same analysis all week and stop reading it. If it runs live on every page load, it costs money and adds latency. If the prompt is too generic, the analysis says the same things every week ("try to sleep earlier, avoid screens"). Users ignore it within 3 weeks.

**Why it happens:**
The initial implementation focuses on "can we call Claude Haiku and display the result" rather than "what makes this analysis worth reading every week." The prompt in ai.ts is already somewhat generic ("analyse sleep data and give personalized insights in Romanian").

**How to avoid:**
1. Run analysis exactly once per week (Sunday batch, store result in Google Sheets or localStorage with a date key)
2. Make the prompt week-over-week comparative: "Here is last week's analysis and this week's data. What changed? What is the experiment for next week?" This makes each report feel fresh
3. Include specific, falsifiable predictions: "Based on your trend, if you maintain current habits, your SS should reach X by next week"
4. Keep it short -- 3-4 bullet points per person, not paragraphs
5. Display with a "New this week" indicator that fades after the user reads it

**Warning signs:**
- Users stop scrolling to the AI section
- Every weekly report starts with the same phrasing
- AI costs creep up because analysis runs more than once per week

**Phase to address:**
AI feature phase (Phase 2 or 3, after refactor).

---

### Pitfall 8: Goal Tracking Without Historical Context Loses Meaning

**What goes wrong:**
Sleep goals ("average SS 85 this month") are implemented as a simple target number stored in localStorage. The goal widget shows current average vs target. But without showing the trajectory -- are you on track? when did you set this goal? what was your average when you started? -- the goal becomes just another number. Users set ambitious goals, fall short, and stop setting them.

**Why it happens:**
Goals seem simple: store a number, compare to current average, show progress bar. But the value of goals is in the narrative: "you started at 72, you are now at 79, you need 85 by month end, that requires 91 average for the remaining days." Without this narrative, goals are meaningless.

**How to avoid:**
1. Store goal with start date and starting average (snapshot at goal creation time)
2. Calculate required daily average to hit the goal by deadline
3. Show trajectory: on-track / behind / ahead
4. When a goal period ends, store it as a completed/failed goal in history
5. Keep goal UI minimal -- do not build a goal management system. One active goal per person, displayed in the header or ProgressHub

**Warning signs:**
- Goal is just a number in a card with a progress bar
- No historical goals visible
- Users set a goal once and never interact with it again

**Phase to address:**
Feature phase (Phase 2 or 3) -- but design the data model during Phase 1 so localStorage schema is planned.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Romanian strings hardcoded in components | Fast initial dev | Every string must be found and replaced for English migration; risk of missing strings in edge cases | Never again -- all new strings should be English, existing ones migrated in refactor |
| localStorage iteration for counting | No external dependencies | O(n) scans on every render, no indexing, no cross-device sync | Acceptable for 3 users if memoized. Unacceptable without memoization |
| Inline styles with color functions | Tight coupling of data to visual | Cannot theme easily, dark mode edge cases, hard to maintain | Acceptable for this project's scale. Extract to CSS custom properties only if dark mode bugs appear |
| JSONP for Google Sheets API | Avoids CORS issues entirely | No error handling granularity, no POST support (uses script tags), vulnerable to injection if API returns malicious JS | Acceptable given Google Sheets is trusted. Do not extend this pattern to other APIs |
| `any` types throughout | Fast iteration | Refactoring becomes guesswork, no IDE autocompletion for data shapes | Fix during refactor phase. Never acceptable for new code |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Google Sheets JSONP | Assuming response is always valid JSON; no timeout handling | The `jsonp()` function has no timeout. Add a `Promise.race` with a 10-second timeout. Handle the case where the Apps Script is over quota (free tier has daily limits) |
| Cloudflare Worker AI proxy | Sending all data on every request; no caching of weekly analysis | Cache the analysis result with a weekly key. Send only delta data or last 30 days (already done, good). Add request deduplication (prevent double-clicks triggering multiple API calls) |
| localStorage across devices | Assuming localStorage is shared; habits and kudos data is device-local | Document clearly that kudos given from phone are not visible from desktop. This is acceptable for 3 users but should be noted in the UI ("data on this device only") |
| GitHub Pages single-file deployment | Assuming env vars work at runtime | `VITE_` env vars are baked at build time. If the AI proxy URL changes, a rebuild and redeploy is required. Consider a simple config endpoint or hardcode the proxy URL since it rarely changes |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Recomputing XP, streak, calendar, year overview for every render | Dashboard feels slow on mobile; visible lag when switching tabs | `useMemo` for all expensive computations keyed on `[data, user]`. The leaderboard loop (line 268-273) calls `calcXP` and `loggingStreak` for each of 3 users on every render | Already noticeable on older phones now; will worsen with badge checks added |
| Rendering all sections even when collapsed | DOM is lighter when collapsed (content not rendered), but all data computations still run at the parent level | Move computations into child components. `<XPSection>` computes its own breakdown; `<TrackerSection>` computes its own calendar. Parent only passes `data` and `user` | When DashboardPage grows beyond 750 lines with new features |
| Full localStorage scan inside calcXP | See Pitfall 3 | Extract kudos count before calling calcXP; pass as parameter | After 6+ months of daily kudos exchange |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| API key in VITE_ env var (exposed in bundle) | Anyone can call the AI proxy and incur costs; potential API key abuse | Move auth to Cloudflare Worker (origin check + rate limit). Never prefix secrets with `VITE_` |
| Google Sheets API URL hardcoded and public | Anyone who finds the URL can read all sleep data (names, scores) | Acceptable risk for a personal team tool. If sharing the repo publicly, document that the API URL should be in env vars |
| No input validation on submitted sleep data | Malicious or accidental bad data (SS=999, negative RHR) corrupts averages and XP | Add validation in the Apps Script and client-side: SS 0-100, RHR 30-120, HRV 0-200 |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Too many gamification elements visible at once (XP + streak + level + tier + badges + goals + bonuses) | Cognitive overload on a mobile screen; users do not know what matters | Progressive disclosure: header shows XP + streak + level. Badges and goals are expandable sections. Never show more than 3 gamification metrics at once in the header |
| Badge unlock with no celebration moment | Users miss that they earned something; badges feel meaningless | Show a one-time toast/modal when a badge is earned. Store "seen" state in localStorage. Even a 2-second toast with confetti feels rewarding |
| AI analysis in Romanian while UI migrates to English | Confusing mixed-language experience | Switch AI prompt to English when the UI migration happens. Do both in the same phase |
| Goals that cannot be edited or deleted | User sets wrong goal, stuck with it for a month | Allow goal reset (with confirmation). Store previous goals as history |

## "Looks Done But Isn't" Checklist

- [ ] **XP refactor:** Both `calcXP()` AND `calcXPBreakdown()` produce the same total -- verify with a test that calls both and asserts equality
- [ ] **Badge system:** Badges that grant XP are reflected in `calcXPBreakdown` total -- verify XP before and after badge unlock
- [ ] **Component extraction:** After splitting DashboardPage, the app renders identically -- verify with before/after screenshots on mobile viewport
- [ ] **English migration:** No Romanian strings remain in any component -- search for common Romanian words (zile, somn, echipa, logat, streak-ul)
- [ ] **AI weekly analysis:** Analysis only runs once per week, not on every page load -- verify localStorage has a dated cache key and the fetch only fires when key is missing/expired
- [ ] **Goal tracking:** Goal progress persists across browser refresh -- verify localStorage key exists after setting a goal
- [ ] **Dark mode:** All new components (badges, goals, AI report) render correctly in dark mode -- check for hardcoded white backgrounds or color values
- [ ] **Mobile scroll depth:** After adding badges + goals + AI sections, the dashboard does not require more than 4 thumb-scrolls to see everything -- measure on a real phone

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| XP logic out of sync (Pitfall 2) | LOW | Single function refactor, no data migration needed. All XP is computed from source data + localStorage flags |
| setState during render crash (Pitfall 1) | LOW | Move to useEffect, 5-minute fix. But if it shipped broken, users see white screen until fix is deployed |
| API key exposed (Pitfall 5) | MEDIUM | Rotate the exposed key immediately. Update Cloudflare Worker to use origin-based auth. Redeploy |
| Badge system disconnected from XP (Pitfall 6) | HIGH | Requires redesigning the badge data model and re-integrating with XP. If badges already shipped with their own XP logic, need to deduplicate without changing users' visible XP totals |
| Features built on un-refactored code (Pitfall 4) | HIGH | Features must be re-extracted from the monolithic component. Essentially doing the refactor twice |
| AI analysis running on every load (cost overrun) | MEDIUM | Add caching immediately. Audit Anthropic dashboard for unexpected charges. Add rate limiting to Cloudflare Worker |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| setState during render (1) | Phase 1: Refactor | No direct state mutations outside useEffect/handlers in any component |
| Duplicated XP logic (2) | Phase 1: Refactor | Single `calcXPBreakdown` function; `calcXP` is a wrapper. grep for duplicate XP patterns returns 0 |
| localStorage scan perf (3) | Phase 1: Refactor | All expensive computations wrapped in useMemo. React Profiler shows <16ms render time |
| Refactor + features collision (4) | Phase structure | Phase 1 is refactor-only. Phase 2 starts only after Phase 1 is merged and deployed |
| API key exposure (5) | Phase 1: Refactor | No `VITE_` env vars containing secrets. Cloudflare Worker uses origin-based auth |
| Badge-XP disconnect (6) | Phase 2: Features (design in Phase 1) | Badge XP appears in `calcXPBreakdown` output. Bonusuri section replaced by badges |
| AI analysis staleness (7) | Phase 2/3: AI Features | Analysis cached with weekly date key. Prompt includes previous week's analysis for comparison |
| Goal tracking without context (8) | Phase 2/3: Features | Goal model includes startDate, startingAverage, deadline. UI shows trajectory |

## Sources

- Direct codebase analysis of DashboardPage.tsx (750 lines), sleep.ts (377 lines), ai.ts (86 lines), App.tsx (186 lines), ProgressHub.tsx (122 lines)
- React documentation on setState during render: calling setState during render is only allowed for the same component's own state with a guard, but the current pattern calls clearJump (parent setState) during render which is explicitly forbidden
- localStorage API documentation: synchronous, blocking, scans are O(n) where n is total keys
- Vite documentation on env variables: VITE_ prefix exposes vars to client bundle

---
*Pitfalls research for: social gamified sleep tracker refactor + feature expansion*
*Researched: 2026-03-23*
