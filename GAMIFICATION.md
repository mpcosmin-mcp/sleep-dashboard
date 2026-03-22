# Sleep Tracker — Gamification System

> Keep it simple. Vizual, nu numeric. One-click info.

---

## Core Philosophy
1. **Social app** — vezi progresul echipei
2. **Suport reciproc** — kudos, încurajare
3. **Personal tracker** — streak, XP, evoluție
4. **Joc** — competiție prietenoasă

---

## XP (Experience Points)

### Earning

| Action | XP |
|---|---|
| Log somn | **+10** per zi |
| Sleep Score >= 80 | **+5** bonus |
| Sleep Score >= 90 | **+10** bonus (înlocuiește +5) |
| 7-day streak | **+50** milestone |
| 30-day streak | **+200** milestone |
| Primești kudos | **+5** per kudos |

### Spending

| Action | Cost |
|---|---|
| Streak repair (1 zi gap, SS < 75) | **50 XP** |

**Level** = `floor(XP / 100) + 1`
**Progress** = `XP % 100` din 100

XP-ul **nu scade niciodată automat**. Se cheltuie doar manual pe streak repair.

---

## Streak — Simple & Passive

### Reguli (4 reguli, atât)
1. **Zi logată consecutiv** → streak crește
2. **1 zi ratată + SS ≥ 75 a doua zi** → **AUTO SAFE**, streak continuă fără intervenție
3. **1 zi ratată + SS < 75 a doua zi** → Userul alege: **50 XP** sau **streak reset la 0**
4. **2+ zile ratate consecutiv** → Streak pierdut, fără opțiune de repair

### Detalii
- Fiecare gap de 1 zi se evaluează **individual** — nu se cumulează
- XP rămâne **intact** indiferent de streak reset
- Free freeze = automat, invizibil (contorizat ca "zile salvate automat")
- Repair = decizie manuală, buton vizibil doar când e cazul
- Data din sheet = noaptea de somn (log pe 22 → sheet = 21)
- Activ dacă ultima dată >= 2 zile în urmă (acoperă logging dimineața)

---

## Codul Culorilor

| Metric | Culoare | Scale |
|---|---|---|
| **Sleep Score** | Albastru → Verde → Galben → Roșu | 90+ / 80+ / 65+ / <65 |
| **RHR** | Albastru → Verde → Galben → Roșu | <52 / <58 / <65 / <72 |
| **HRV** | Violet → Albastru → Galben → Roșu | >65 / >50 / >35 / <35 |
| **XP** | Golden Amber `#f59e0b` | — |
| **Streak** | Orange `#f97316` | — |

---

## Kudos (Strava-style)
- 1 kudos/zi/teammate (nu ție)
- Reactions: 👏 🔥 💪 🚀 😴 🏆
- +5 XP per kudos primit

---

## Leaderboard
- Sortat după **Sleep Score** (calitatea somnului), nu XP

---

## Dashboard Structure
- **Hero card** — status personal (SS, RHR, HRV, XP, Streak, trends)
- **7-day tracker** — buline cu SS per zi
- **Streak** — expandable, cu auto-saved count + repair button
- **XP & Level** — expandable, progress bar + breakdown
- **Leaderboard** — expandable, top users by SS
- **Echipa** — kudos section

Toate secțiunile sunt **expandable** (accordion). Zero text static.

---

## TODO — Bonusuri viitoare
- [ ] Best weekly sleeper bonus
- [ ] Best monthly sleeper bonus
- [ ] Achievement badges
- [ ] AI weekly analysis (Claude Haiku)
- [ ] Dashboard personal view toggle (Echipă/Eu)
