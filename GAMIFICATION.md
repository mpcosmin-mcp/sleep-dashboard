# Sleep Tracker — Gamification System

> Keep it simple. Vizual, nu numeric. One-click info.

---

## Core Architecture

Două axe: **XP** (efort acumulat) + **Streak** (consistență zilnică).

```
XP_total = sum(Action × Value)
Streak   = consecutive_days(last_activity >= yesterday)
```

### Regula celor 3 (Minimalist Strategy)
1. **XP-ul e fix** — fără multiplicatori sau formule grele
2. **Vizual, nu numeric** — bară de progres > "456 XP până la nivel 12"
3. **One-click info** — icon (i) cu tooltip, nu manual

---

## XP (Experience Points)

### Earning

| Action | XP | Condiție |
|---|---|---|
| Log somn | **+10** | Per zi logată |
| Sleep Score >= 80 | **+5** | Bonus |
| Sleep Score >= 90 | **+10** | Înlocuiește +5 |
| 7-day streak | **+50** | Milestone one-time |
| 30-day streak | **+200** | Milestone one-time |
| Primești kudos | **+5** | Per kudos |

### Spending

| Action | Cost | Când |
|---|---|---|
| Streak freeze (1 zi gap) | **50 XP** | Doar dacă SS < 75 |
| Streak freeze (2 zile gap) | **100 XP** | — |
| Streak freeze (3 zile gap) | **300 XP** | — |

`XP_balance = earned - spent` (min 0)

---

## Streak

### Logica de bază
- Userul logează **dimineața** somnul din noaptea anterioară
- Data din sheet = noaptea de somn (ex: log pe 22 Mar → sheet date = 21 Mar)
- Streak = zile consecutive cu date logate, pornind de la cea mai recentă
- Activ dacă ultima dată logată >= 2 zile în urmă (acoperă gap-ul natural log dimineață)

### Freeze Rules

**1 zi gap:**
- **GRATIS** dacă SS pe ziua de după gap >= 75 (ai dormit bine = meritat)
- **SAU** 50 XP (dacă SS < 75)

**2 zile gap:** 100 XP (fără opțiune gratuită)

**3 zile gap:** 300 XP (fără opțiune gratuită)

**4+ zile gap:** Streak pierdut. Fără recuperare.

> Rațional: max 3 zile acoperă ceas descărcat, călătorie, etc.

### Afișare
- `⚡12d` — 12 zile streak
- `⚡12d ❄️1` — cu 1 zi frozen
- Tooltip: detalii freeze + XP cheltuit

---

## Codul Culorilor

| Parametru | Culoare | Semnificație |
|---|---|---|
| **Sleep Score** | Albastru → Verde → Galben → Roșu | Calitatea somnului (90+ / 80+ / 65+ / <65) |
| **RHR** | Albastru → Verde → Galben → Roșu | Calmness & recovery (<52 / <58 / <65 / <72) |
| **HRV** | Violet → Albastru → Galben → Roșu | Sistemul nervos (>65 / >50 / >35 / <35) |
| **XP** | **Golden Amber** `#f59e0b` | Progres, recompensă |
| **Streak** | **Orange** `#f97316` | Energie, urgență, dinamism |
| **Task Done** | **Verde** `#16a34a` | Succes, validare |
| **Atenție** | **Roșu Soft** `#dc2626` | Acțiune necesară |

Fiecare metric cell are background tinted (culoare + 12% opacitate).

---

## Kudos (Strava-style)

- 1 kudos/zi/teammate (nu ție)
- Reactions: 👏 🔥 💪 🚀 😴 🏆
- Vizibil pe profile cards + secțiune "Trimite kudos"
- `+5 XP` per kudos primit
- Storage: `localStorage st_kudos_{date}_{from}_{to}`

---

## Daily Insight (One-liner)

Un singur mesaj funny pe Dashboard, bazat pe date. Se schimbă zilnic.

Pool de mesaje per condiție:
- Team SS >= 90: "Echipa doarme ca regii"
- Team SS < 65: "Netflix 1 — Echipa 0"
- Gap mare între best/worst: callout cu nume
- Per-person: SS 95+ = "diamant", RHR < 55 = "atlet", SS < 50 = "ai clipit?"

Ton: fun, sarcastic, constructiv. Mix RO/EN.

---

## 1% Better (Habit Tracker)

Selectezi din 10 habitudini, bifezi zilnic.

**Somn:** Culcat < 23:00, Fără telefon 30min, Fără cafea > 14:00, Fără ecrane 1h
**General:** 30min mișcare, 2L apă, 10min meditație, 15min citit, Jurnal, Cold shower

Stats: streak habitudini, % completare lunară.
Storage: localStorage per device.

---

## Infopoint (User-Facing)

Icon **(i)** lângă fiecare metric. La hover/tap:

- 🔥 **Streak**: "Câte zile la rând ai logat. Vino zilnic să crești scorul!"
- ✨ **XP**: "Efortul tău cuantificat. Fiecare zi logată + somn bun = XP."
- ❄️ **Freeze**: "Ai ratat o zi? Dacă ai dormit bine, streak-ul e salvat gratis. Altfel, costă XP."

---

## Next Steps
- [ ] AI weekly analysis (Claude Haiku, local script)
- [ ] Personal profile page
- [ ] Progress bar vizual pentru XP (în loc de număr)
- [ ] Achievements/badges la milestones
