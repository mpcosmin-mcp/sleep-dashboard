# Backlog

## 999.1 — Sleep Oracle personalizat (needs Cloudflare proxy)
- **Ce:** Sleep Oracle cu predictii personalizate per user via Claude Haiku AI
- **De ce:** Versiunea locala da aceleasi predictii la toti userii — trebuie AI pentru personalizare
- **Prerequisite:** Setup Cloudflare Worker proxy + VITE_AI_PROXY_URL
- **Cod existent:** `src/lib/oracle.ts`, `src/components/dashboard/SleepOracle.tsx` (scos temporar din dashboard)
- **Weekly Story:** tot pe fallback local deocamdata, dar merge OK cu template-uri

## 999.2 — Weekly Story cu AI
- **Ce:** Povestea Saptamanii generata de Claude Haiku in loc de template-uri locale
- **Prerequisite:** Same Cloudflare Worker proxy
- **Cod existent:** `src/lib/weekly-story.ts` (are deja `generateAIStory()`, doar trebuie proxy URL)
