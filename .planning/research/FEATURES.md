# Feature Research

**Domain:** Gamified social sleep tracking with AI analysis
**Researched:** 2026-03-23
**Confidence:** MEDIUM-HIGH

## Feature Landscape

This research focuses on the four active feature areas: weekly AI analysis, sleep goals, achievement badges, and mobile UX improvements. The existing app already has strong gamification foundations (XP, streaks, tiers, kudos, leaderboard). These features extend that foundation.

### Table Stakes (Users Expect These)

For a gamified health tracker that already has XP and streaks, these are the features users will feel are "missing" without them.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Achievement badges with visible collection | XP and levels exist but nothing to "earn" beyond tier names. Every fitness platform (Fitbit 100+ badges, Garmin 100+ badges, Apple Watch awards) has badges. Users expect collectibles alongside progression. | MEDIUM | Badge definitions are data; rendering a badge gallery and unlock notifications is the work. |
| Personal sleep score goal with progress indicator | Sleep Cycle, Fitbit, and every goal-oriented health app lets users set a target and see progress toward it. Without goals, data is passive observation. | LOW | A single numeric target (e.g., "average SS >= 85 this month") with a progress bar. Keep it simple -- one goal at a time. |
| Weekly trend summary (human-readable) | Users who log daily expect periodic feedback. Even without AI, apps like Sleep Cycle show weekly summaries. With an AI proxy already built, not providing a summary feels like a gap. | MEDIUM | The Cloudflare Worker proxy to Claude Haiku already exists. The work is prompt engineering, data aggregation, and displaying the result. |
| Mobile-optimized dashboard (reduced scroll) | The app is used daily on phones. A 750-line dashboard that requires heavy scrolling breaks the core loop. Health apps (Fitbit, Apple Health) show 3-5 cards on initial mobile view. | MEDIUM | Requires the architecture refactor (breaking DashboardPage) to be done first. Collapsible sections, progressive disclosure, priority ordering of cards. |
| Badge unlock notifications | When a badge is earned, the user must know immediately. Silent unlocks defeat the dopamine loop. Fitbit and Garmin both show celebratory pop-ups. | LOW | A toast/modal on unlock. Pairs with the badge system -- not a separate feature. |

### Differentiators (Competitive Advantage)

These are not expected but create genuine engagement advantages, especially for a small social team.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| AI-generated weekly team report (not just personal) | Most sleep apps are solo. A team-facing AI report that compares trends across the group, highlights who improved most, and suggests group experiments is unique. This creates a shared discussion point (the stated core value). | MEDIUM | Prompt engineering to compare 3 users' weekly data. Output a single team report, not 3 individual reports. This is the differentiator vs solo sleep apps. |
| Surprise/fun badge category | Fitbit and Garmin badges are mostly milestone-based (boring after a while). Adding surprise badges ("Night Owl: logged SS below 60 three days in a row", "Comeback Kid: improved SS by 15+ points week over week", "Weekend Warrior: best SS always on weekends") creates delight and conversation. | LOW | These are just badge definitions with trigger conditions. The detection logic is cheap since all data is already computed. |
| Social badges tied to kudos system | Most badge systems are solo achievements. Badges like "First Kudos Given", "Team Cheerleader: 30 kudos given", "Fan Favorite: 50 kudos received" leverage the existing social mechanics in a way solo sleep apps cannot. | LOW | Kudos data already tracked. Badge triggers are simple count checks. |
| Contextual goal nudges | Rather than fixed reminder schedules, nudging only when the user is falling behind their goal ("You need SS 88+ for the remaining 3 days to hit your monthly target") creates urgency without annoyance. Research shows contextual nudges outperform fixed schedules for retention. | MEDIUM | Requires goal progress calculation and conditional display logic. Not a push notification -- just in-app messaging when they open the dashboard. |
| Collapsible "focus mode" dashboard | Instead of showing everything, let users collapse sections they don't need daily. Hero card + streak + one section visible by default. Everything else behind a tap. This directly addresses scroll depth. | LOW | CSS + localStorage for collapse state. Simple but effective. |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Daily AI analysis | "More AI = better" | Claude Haiku costs add up with daily calls for 3 users x 365 days. Daily insights become noise -- users stop reading them. Sleep patterns need a week of data to show meaningful trends. | Weekly batch analysis every Sunday. Creates anticipation ("AI report day") and keeps costs minimal. |
| Conversational AI chat about sleep | ChatGPT-style interactions feel modern | Requires real-time API calls (expensive), conversation state management, and the AI cannot actually diagnose sleep issues. Creates liability concerns. For 3 users, this is massive overengineering. | One-way AI report. Users discuss it among themselves on WhatsApp. The social discussion IS the value. |
| Behavior-based goals ("no screens after 10pm") | Feels like a complete wellness app | Unverifiable without device integration. Self-reported behavior goals have very low adherence. Creates guilt, not motivation. The app tracks wearable output (SS/RHR/HRV), not behavior. | Outcome-based goals: "average SS >= 85 this month." Measurable, automatic, tied to existing data. |
| Badge trading or gifting | Social and fun-sounding | With 3 users, trading is meaningless. Adds complexity for zero engagement benefit. Creates weird dynamics ("I have badges you don't"). | Shared badge gallery where everyone can see each other's badges on the leaderboard. Visibility without transaction complexity. |
| Too many badge tiers per category | "Bronze/Silver/Gold/Platinum/Diamond for every badge" | With 3 users and limited data history, most upper tiers become unachievable for months. Seeing locked badges you can't earn is demotivating, not aspirational. | 2-3 tiers max per badge line. Most badges should be single-earn. A few "legendary" badges (90-day streak, team MVP for a month) provide stretch goals. |
| Push notifications / reminders to log | Standard health app feature | This is a web app on GitHub Pages -- no push notification capability. Web notifications are unreliable and annoying. The team already logs daily because of social pressure (leaderboard, streaks). | The streak system IS the reminder. Losing a streak or falling on the leaderboard is more motivating than any notification. |
| Real-time leaderboard animations | Feels polished and dynamic | Leaderboard data only changes once per day (when someone logs). Animating something that changes once daily is wasted effort. Adds JS bundle size for no user value. | Simple sorted list with yesterday's rank change indicator (up/down arrow). Clean, informative, zero performance cost. |

## Feature Dependencies

```
[Architecture Refactor (DashboardPage breakup)]
    └──enables──> [Mobile UX improvements]
                      └──enhances──> [Collapsible focus mode]
    └──enables──> [Badge notification display]

[Badge System (definitions + detection)]
    └──enables──> [Badge unlock notifications]
    └──enables──> [Social badges]
    └──enables──> [Surprise/fun badges]
    └──enables──> [Badge gallery on leaderboard]

[Sleep Goals (target + progress)]
    └──enables──> [Contextual goal nudges]
    └──enhances──> [Weekly AI report] (AI can reference goal progress)

[Weekly AI Report (personal)]
    └──enhances──> [Team AI report] (extend from personal to comparative)

[English UI migration]
    └──enables──> [AI report in English] (prompts and output must match UI language)
```

### Dependency Notes

- **Mobile UX requires Architecture Refactor:** The 750-line DashboardPage must be broken into components before any meaningful mobile layout changes. Trying to optimize scroll depth in a monolithic component is fighting the wrong battle.
- **Badge system is self-contained:** Badge definitions, detection, and display can be built independently of other features. It has no upstream dependencies.
- **Sleep Goals are independent but enhance AI:** Goals can ship without AI. But the AI report becomes much more valuable when it can say "You're 3 points away from your monthly goal" rather than just describing trends.
- **English migration enables AI:** If the AI report is in English but the UI has Romanian remnants, it feels disjointed. Complete the English migration before or alongside the AI work.

## MVP Definition

### Launch With (v1) -- This Milestone

These are the features that should ship together to create a cohesive "next level" of the app.

- [ ] Achievement badges (consistency + quality + social + fun categories) -- the biggest engagement gap in the current app
- [ ] Sleep goals (single SS target per user per month) -- gives purpose to daily logging beyond XP
- [ ] Weekly AI analysis (Sunday team report via Cloudflare Worker) -- the headline feature that creates weekly conversation
- [ ] Mobile scroll reduction (collapsible dashboard sections) -- unblocks daily usability

### Add After Validation (v1.x)

Features to layer on once the core v1 features are used and validated.

- [ ] Contextual goal nudges -- add when users are actually setting goals and you see engagement data
- [ ] Surprise/fun badge expansion -- add new badge definitions monthly to keep collection fresh
- [ ] Badge gallery page -- if users engage with badges, give them a dedicated showcase

### Future Consideration (v2+)

- [ ] AI trend comparison across months -- needs enough data history to be meaningful (3+ months)
- [ ] Team challenges (e.g., "Team averages SS 80+ this week") -- after individual goals are validated

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Architecture refactor | LOW (invisible to users) | HIGH | P0 (prerequisite) |
| Achievement badges | HIGH | MEDIUM | P1 |
| Badge unlock notifications | HIGH | LOW | P1 |
| Sleep goals (single target) | HIGH | LOW | P1 |
| Weekly AI team report | HIGH | MEDIUM | P1 |
| Mobile scroll reduction | HIGH | MEDIUM | P1 |
| English UI migration | MEDIUM | LOW | P1 |
| Contextual goal nudges | MEDIUM | MEDIUM | P2 |
| Surprise/fun badges | MEDIUM | LOW | P2 |
| Social badges | MEDIUM | LOW | P2 |
| Badge gallery page | LOW | LOW | P3 |

**Priority key:**
- P0: Prerequisite -- must complete before P1 work
- P1: Must have for this milestone
- P2: Should have, add when possible
- P3: Nice to have, future consideration

## Competitor Feature Analysis

| Feature | Sleep Cycle | Fitbit | Garmin Connect | SleepTown | Our Approach |
|---------|-------------|--------|----------------|-----------|--------------|
| Badges/Achievements | Basic milestones (first week, efficiency %) | 100+ badges across steps/distance/floors/lifetime | 100+ across activities, limited-time events | Buildings as visual rewards | 4 categories: consistency, quality, social, fun. ~20-30 badges total. Quality over quantity. |
| Sleep Goals | Implicit (improve your score) | Sleep duration target | Sleep score + duration targets | Bedtime/wake-up time goals | Single SS average target per month. Simple. Measurable. |
| AI/Insights | Personalized tips based on patterns | Sleep insights dashboard | Body Battery + sleep insights | None | Weekly Claude Haiku team report. Comparative, not just personal. |
| Social/Team | None | Friends + challenges | Challenges + groups | None | Built-in: leaderboard, kudos, team AI report. Social is core, not bolted on. |
| Streaks | Yes, basic | Active Zone Minutes streaks | Activity streaks | Building streaks | Already implemented with auto-save and paid repair. Proven. |
| Mobile UX | Native app (optimized) | Native app (optimized) | Native app (optimized) | Native app (optimized) | Web app -- must compensate with card-based collapsible layout. Cannot match native but can be fast and clean. |

## Badge Category Design (Recommended)

Based on Fitbit (milestone-heavy), Garmin (activity-diverse), Apple Watch (time-limited + streaks), and Sleep Cycle (behavior-aligned), here is the recommended badge taxonomy for this app:

### Consistency Badges (Streak-Based)
| Badge | Trigger | Notes |
|-------|---------|-------|
| First Log | Log sleep data once | Immediate reward, onboarding |
| Week Warrior | 7-day logging streak | First real milestone |
| Month Master | 30-day logging streak | Serious commitment |
| Quarter Legend | 90-day logging streak | Stretch goal, rare |

### Quality Badges (Performance-Based)
| Badge | Trigger | Notes |
|-------|---------|-------|
| Sweet Dreams | Single day SS >= 90 | Achievable, celebrates great nights |
| Dream Week | 7 consecutive days SS >= 85 | Sustained excellence |
| Personal Best | New all-time high SS | Automatic detection from history |
| Low Resting | RHR personal best (lowest) | Reward fitness improvement |
| Heart Harmony | HRV personal best (highest) | Reward recovery improvement |

### Social Badges (Kudos-Based)
| Badge | Trigger | Notes |
|-------|---------|-------|
| First Kudos | Give first kudos | Encourages social behavior |
| Cheerleader | Give 30 kudos total | Sustained social engagement |
| Fan Favorite | Receive 50 kudos total | Recognition from peers |
| Team MVP | Most kudos received in a month | Competitive, time-bound |

### Fun/Surprise Badges (Discovery-Based)
| Badge | Trigger | Notes |
|-------|---------|-------|
| Night Owl | SS below 60 three times in a week | Humor about bad sleep |
| Comeback Kid | SS improves 15+ points week-over-week | Celebrates recovery |
| Weekend Warrior | Best SS consistently on weekends | Pattern recognition |
| Steady Eddie | SS within 3-point range for 7 days | Consistency without peaks |

## Sources

- [Sleep Cycle Gamification Case Study (Trophy)](https://www.trophy.so/blog/sleep-cycle-gamification-case-study) -- badge categories, streak mechanics, retention patterns
- [Fitbit Badge System Guide (Wareable)](https://www.wareable.com/fitbit/fitbit-badges-guide-864) -- 100+ badge taxonomy, milestone categories
- [Garmin Badges Ultimate Guide (FitStrapsUK)](https://fitstraps.co.uk/blogs/news/garmin-badges-the-ultimate-guide) -- activity-diverse badges, leveling system
- [Apple Watch Awards (Wareable)](https://www.wareable.com/apple/how-to-view-earn-apple-watch-awards-challenges-badges-achievements) -- limited-time badges, monthly challenges
- [Scoping Review of Sleep Apps (Frontiers in Psychiatry)](https://www.frontiersin.org/journals/psychiatry/articles/10.3389/fpsyt.2022.1037927/full) -- goal setting as top behavior change technique
- [Dashboard UX Patterns (Pencil & Paper)](https://www.pencilandpaper.io/articles/ux-pattern-analysis-data-dashboards) -- 5-6 card limit, progressive disclosure
- [Self-Tracking App UX (UX Studio)](https://www.uxstudioteam.com/ux-blog/self-tracking) -- contextual reminders outperform fixed schedules
- [Gamification in Health Apps (Plotline)](https://www.plotline.so/blog/gamification-in-health-and-fitness-apps) -- points, badges, leaderboards as standard pattern

---
*Feature research for: Gamified social sleep tracking with AI analysis*
*Researched: 2026-03-23*
