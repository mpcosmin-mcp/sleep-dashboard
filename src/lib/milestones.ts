import { type SleepEntry, NAMES } from '@/lib/sleep';
import { calcXP, loggingStreak, xpLevel } from '@/lib/gamify';
import { getTotalKudos } from '@/lib/kudos';
import { getTrophiesFor } from '@/lib/trophies';

// ════════════════════════════════════════════════════════════════
// Personal Milestones — surprise achievements, detected at login
// ════════════════════════════════════════════════════════════════

export interface Milestone {
  id: string;
  emoji: string;
  text: string;
}

interface MilestoneDef {
  id: string;
  emoji: string;
  text: string;
  check: (data: SleepEntry[], user: string) => boolean;
}

const MILESTONES: MilestoneDef[] = [
  {
    id: 'first_log',
    emoji: '🎉',
    text: 'Primul pas! Bine ai venit in echipa somnului.',
    check: (data, user) => data.filter(d => d.name === user).length >= 1,
  },
  {
    id: 'week_logged',
    emoji: '📅',
    text: '7 zile logate! Incepe sa devina obicei.',
    check: (data, user) => data.filter(d => d.name === user).length >= 7,
  },
  {
    id: 'month_logged',
    emoji: '📅',
    text: '30 de zile logate! Un obicei format.',
    check: (data, user) => data.filter(d => d.name === user).length >= 30,
  },
  {
    id: 'first_90',
    emoji: '💎',
    text: 'SS 90+! Ai dormit ca un rege!',
    check: (data, user) => data.some(d => d.name === user && d.ss >= 90),
  },
  {
    id: 'first_80_week',
    emoji: '🌟',
    text: 'O saptamana de aur! Media SS 80+.',
    check: (data, user) => {
      const entries = data.filter(d => d.name === user).sort((a, b) => a.date.localeCompare(b.date));
      // Check any 7 consecutive entries with avg ≥ 80
      for (let i = 0; i <= entries.length - 7; i++) {
        const slice = entries.slice(i, i + 7);
        const avg = slice.reduce((s, e) => s + e.ss, 0) / 7;
        if (avg >= 80) return true;
      }
      return false;
    },
  },
  {
    id: 'streak_7',
    emoji: '🔥',
    text: '7 zile consecutive! Ritm de campion.',
    check: (data, user) => loggingStreak(data, user).days >= 7,
  },
  {
    id: 'streak_30',
    emoji: '⚡',
    text: '30 de zile consecutive! Esti o legenda.',
    check: (data, user) => loggingStreak(data, user).days >= 30,
  },
  {
    id: 'level_5',
    emoji: '🥈',
    text: 'Nivel 5 — Silver tier deblocat!',
    check: (data, user) => xpLevel(calcXP(data, user)) >= 5,
  },
  {
    id: 'level_10',
    emoji: '🥇',
    text: 'Nivel 10 — Gold! Respectul creste.',
    check: (data, user) => xpLevel(calcXP(data, user)) >= 10,
  },
  {
    id: 'level_20',
    emoji: '💎',
    text: 'Nivel 20 — Diamond! Elite sleeper.',
    check: (data, user) => xpLevel(calcXP(data, user)) >= 20,
  },
  {
    id: 'first_trophy',
    emoji: '🏆',
    text: 'Primul trofeu! Gustul victoriei.',
    check: (data, user) => getTrophiesFor(user, data).length >= 1,
  },
  {
    id: 'trophy_3',
    emoji: '👑',
    text: '3 trofee! Se contureaza o colectie.',
    check: (data, user) => getTrophiesFor(user, data).length >= 3,
  },
  {
    id: 'rhr_under_55',
    emoji: '🫀',
    text: 'RHR sub 55! Inima de atlet.',
    check: (data, user) => data.some(d => d.name === user && d.rhr > 0 && d.rhr < 55),
  },
  {
    id: 'hrv_over_50',
    emoji: '🧬',
    text: 'HRV 50+! Recovery de elita.',
    check: (data, user) => data.some(d => d.name === user && d.hrv != null && d.hrv >= 50),
  },
  {
    id: 'all_team_80',
    emoji: '🤝',
    text: 'Toata echipa peste 80! Asta e putere!',
    check: (data, _user) => {
      const dates = [...new Set(data.map(d => d.date))];
      return dates.some(date => {
        const dayEntries = data.filter(d => d.date === date);
        return NAMES.every(n => dayEntries.some(d => d.name === n && d.ss >= 80));
      });
    },
  },
  {
    id: 'kudos_10',
    emoji: '❤️',
    text: '10 inimi! Esti apreciat.',
    check: (_data, user) => getTotalKudos(user) >= 10,
  },
];

/** Check if milestone was already seen by user */
function isSeen(user: string, id: string): boolean {
  try { return localStorage.getItem(`st_milestone_${user}_${id}`) === '1'; } catch { return false; }
}

/** Mark milestone as seen */
function markSeen(user: string, id: string): void {
  try { localStorage.setItem(`st_milestone_${user}_${id}`, '1'); } catch {}
}

/** Detect first unseen milestone for a user. Returns null if none new. */
export function detectMilestone(data: SleepEntry[], user: string): Milestone | null {
  for (const m of MILESTONES) {
    if (isSeen(user, m.id)) continue;
    try {
      if (m.check(data, user)) {
        markSeen(user, m.id);
        return { id: m.id, emoji: m.emoji, text: m.text };
      }
    } catch { /* skip broken check */ }
  }
  return null;
}
