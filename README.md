# SleepTrack — Conti Sibiu

Team sleep tracking dashboard. Tracks Sleep Score, RHR, HRV with color-coded metrics, leaderboard, charts, and history.

## Stack

- **React 18** + TypeScript
- **Tailwind CSS** + shadcn/ui
- **Chart.js** (npm, not CDN)
- **Google Sheets** backend via JSONP
- **Parcel** → single HTML bundle

## Structure

```
src/
├── App.tsx                        # Layout shell + routing (~160 lines)
├── index.css                      # Design system (bronze palette, dark mode)
├── lib/
│   ├── sleep.ts                   # Types, API, scoring, colors
│   └── hide.ts                    # HideCtx for data masking
├── components/
│   ├── shared/
│   │   ├── MVal.tsx               # Metric value (color-coded, maskable)
│   │   ├── Avi.tsx                # Avatar (initials + color)
│   │   └── Toast.tsx              # Notifications
│   ├── pages/
│   │   ├── InputPage.tsx          # Log daily sleep data
│   │   ├── DashboardPage.tsx      # Stats, leaderboard, profiles
│   │   ├── ChartsPage.tsx         # Trends with user filter
│   │   └── HistoryPage.tsx        # Archive table
│   └── ui/                        # shadcn/ui (don't edit)
```

## Dev

```bash
pnpm install
pnpm dev                           # hot reload on localhost
```

## Build & Deploy

```bash
bash scripts/bundle-artifact.sh    # → bundle.html (single file)
cp bundle.html index.html          # rename for GitHub Pages
git add . && git push              # deploy
```

## Team

Clara-Ileana Cirpatorea · Petrica Cosmin Moga · Cornel-Gabriel Meleru
