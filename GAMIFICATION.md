# SleepTracker Gamification System

## XP (Experience Points)

### Earning XP
| Action | XP | Notes |
|---|---|---|
| Log sleep data | +10 | Per day logged |
| Sleep Score >= 80 | +5 | Bonus per entry |
| Sleep Score >= 90 | +10 | Bonus per entry (replaces +5) |
| 7-day streak | +50 | One-time milestone bonus |
| 30-day streak | +200 | One-time milestone bonus |
| Receive kudos | +5 | Per kudos from teammates |

### Spending XP
| Action | Cost | Condition |
|---|---|---|
| Streak freeze (1 day gap) | 50 XP | Only if SS < 75 after gap |
| Streak freeze (2 days gap) | 100 XP | No free option |
| Streak freeze (3 days gap) | 300 XP | No free option |

XP balance = earned - spent. Never goes below 0.

---

## Streak System

### How It Works
- Streak counts consecutive days with logged sleep data
- Starts from today (or yesterday if today not yet logged)
- Displayed as `⚡Xd` on profile cards and leaderboard

### Streak Freeze Rules
Gap days (days without logged data) can be "frozen" to preserve the streak:

**1 day gap:**
- **FREE** if the day after the gap has Sleep Score >= 75 (good sleep = you earned it)
- **OR** costs 50 XP (if SS < 75 or you prefer to spend XP)
- Player's choice is automatic: free freeze takes priority, XP freeze as fallback

**2 days gap:**
- Costs 100 XP (no free option)

**3 days gap:**
- Costs 300 XP (no free option)

**4+ days gap:**
- Streak is lost. No recovery possible.
- Rationale: max 3 days covers dead watch battery, travel, etc.

### Visual Indicators
- `⚡12d` — 12 day streak, no freezes
- `⚡12d ❄️1` — 12 day streak, 1 frozen day
- Tooltip shows: freeze details + XP spent

---

## Kudos System (Strava-style)

### How It Works
- Each user can send 1 kudos per day per teammate
- Choose from reactions: 👏 🔥 💪 🚀 😴 🏆
- Can't send kudos to yourself
- Kudos visible on profile cards with sender avatar
- Total kudos count shown as `👏 X` badge

### Where Kudos Appear
- **Profile cards** (Dashboard) — shows received kudos + reaction buttons for others
- **"Trimite kudos" section** — appears for teammates not in current view
- **Leaderboard** — kudos count badge next to name

### Storage
- localStorage: `st_kudos_{date}_{fromName}_{toName}` = emoji
- Per-device (not synced across devices)

---

## Smart Insights Engine

### Team Insights (based on filtered data)
| Condition | Emoji | Tone |
|---|---|---|
| Team avg SS >= 90 | 🏆 | Celebratory, sarcastic-proud |
| Team avg SS >= 80 | 🎯 | Encouraging, 1% better |
| Team avg SS >= 65 | ⚡ | Honest nudge, blame the phone |
| Team avg SS < 65 | 😴 | Wake-up call, Netflix callout |
| Gap >= 20 between best/worst | 📊 | Data-driven observation |
| Gap <= 5 between all | 🤝 | Team spirit celebration |

### Per-Person Insights (based on all data)
| Condition | Emoji | Tone |
|---|---|---|
| Trend up (+10 pts) | 📈 | Keep it up energy |
| Trend down (-10 pts) | 📉 | Honest, priority call |
| RHR spike (+8 bpm) | 💓 | Medical awareness |
| RHR athlete (<55 bpm) | 🧊 | Respect, athlete callout |
| HRV above average (+15ms) | 🧘 | Nervous system awareness |
| 7d consecutive SS > 80 | 🔥 | Consistency champion |
| SS >= 95 + RHR < 55 | 💎 | Diamond day callout |
| Last 3 days avg SS < 60 | 🚨 | Sarcastic wake-up call |

### Tone Guidelines
- Fun, sarcastic, but constructive
- Mix of Romanian and English slang
- Always actionable — not just observation
- Maximum 4 insights shown at once on Dashboard

---

## 1% Better (Habit Tracker)

### How It Works
- Each person selects habits from a pool of 10
- Daily checkbox tracking
- Streak counter (consecutive complete days)
- Monthly completion percentage

### Habit Pool
**Sleep Hygiene:**
- Culcat inainte de 23:00
- Fara telefon 30 min inainte de somn
- Fara cafea dupa 14:00
- Fara ecrane 1h inainte de somn

**General Self-Improvement:**
- 30 min miscare
- 2L apa
- 10 min meditatie / respiratie
- Citit 15 min
- Jurnal / reflectie
- Cold shower

### Storage
- localStorage: `st_habits_{slug}` (config) + `st_habit_log_{slug}` (daily completions)
- Per-device

---

## Future Ideas
- [ ] AI analysis (Claude Haiku) — weekly automated insights
- [ ] Personal profile page — dedicated view per user
- [ ] XP leaderboard — separate ranking by XP
- [ ] Achievements/badges — unlock at milestones (first 7d streak, 1000 XP, etc.)
- [ ] Habit XP integration — earn XP from habit completions
- [ ] Team challenges — weekly goals for the whole team
