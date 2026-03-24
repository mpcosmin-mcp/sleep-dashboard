---
phase: 2
slug: badges-and-goals
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-24
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | none — Wave 0 installs |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 0 | BADGE-01 | unit | `npx vitest run src/lib/__tests__/badges.test.ts` | ❌ W0 | ⬜ pending |
| 02-01-02 | 01 | 1 | BADGE-02 | unit | `npx vitest run src/lib/__tests__/badges.test.ts` | ❌ W0 | ⬜ pending |
| 02-01-03 | 01 | 1 | BADGE-03 | unit | `npx vitest run src/lib/__tests__/badges.test.ts` | ❌ W0 | ⬜ pending |
| 02-01-04 | 01 | 1 | BADGE-04 | unit | `npx vitest run src/lib/__tests__/badges.test.ts` | ❌ W0 | ⬜ pending |
| 02-02-01 | 02 | 1 | BADGE-05 | unit | `npx vitest run src/lib/__tests__/badges.test.ts` | ❌ W0 | ⬜ pending |
| 02-02-02 | 02 | 1 | BADGE-06 | manual | N/A — visual confetti | ❌ | ⬜ pending |
| 02-02-03 | 02 | 2 | BADGE-07 | unit | `npx vitest run src/lib/__tests__/gamify.test.ts` | ❌ W0 | ⬜ pending |
| 02-03-01 | 03 | 2 | GOAL-01 | unit | `npx vitest run src/lib/__tests__/goals.test.ts` | ❌ W0 | ⬜ pending |
| 02-03-02 | 03 | 2 | GOAL-02 | unit | `npx vitest run src/lib/__tests__/goals.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Install vitest + jsdom: `npm i -D vitest @testing-library/react @testing-library/jest-dom jsdom`
- [ ] `vitest.config.ts` — configure with jsdom environment, path aliases
- [ ] `src/lib/__tests__/badges.test.ts` — stubs for BADGE-01 through BADGE-05
- [ ] `src/lib/__tests__/gamify.test.ts` — stubs for BADGE-07 (XP integration)
- [ ] `src/lib/__tests__/goals.test.ts` — stubs for GOAL-01, GOAL-02

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Confetti animation on badge unlock | BADGE-06 | Visual animation cannot be unit-tested | Trigger a badge unlock → verify confetti renders for 3-4s with celebration toast |
| Badge collection UI layout | BADGE-05 | Layout/visual verification | Open badge collection → verify earned badges show unlock date, locked show progress hints |
| Goal progress indicator visual | GOAL-02 | Visual indicator rendering | Set monthly target → verify on-track/behind/ahead states render correctly |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
