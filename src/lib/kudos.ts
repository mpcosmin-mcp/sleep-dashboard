import { NAMES } from '@/lib/sleep';

export const KUDOS_REACTIONS = ['👏', '🔥', '💪', '🚀', '😴', '🏆'];

export function kudosKey(from: string, to: string, date: string) {
  return `st_kudos_${date}_${from}_${to}`;
}

export function getKudos(from: string, to: string, date: string): string | null {
  try { return localStorage.getItem(kudosKey(from, to, date)); } catch { return null; }
}

export function saveKudos(from: string, to: string, date: string, emoji: string, comment?: string) {
  try {
    localStorage.setItem(kudosKey(from, to, date), emoji);
    if (comment) {
      localStorage.setItem(`st_kudos_comment_${date}_${from}_${to}`, comment);
    }
  } catch {}
}

export function getKudosComment(from: string, to: string, date: string): string | null {
  try { return localStorage.getItem(`st_kudos_comment_${date}_${from}_${to}`); } catch { return null; }
}

export function getKudosFor(to: string, date: string): { from: string; emoji: string; comment?: string }[] {
  const result: { from: string; emoji: string; comment?: string }[] = [];
  for (const n of NAMES) {
    const k = getKudos(n, to, date);
    if (k) {
      const comment = getKudosComment(n, to, date) ?? undefined;
      result.push({ from: n, emoji: k, comment });
    }
  }
  return result;
}

export function getTotalKudos(to: string): number {
  let c = 0;
  try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k?.startsWith('st_kudos_') && !k.startsWith('st_kudos_comment_') && k.endsWith(`_${to}`)) c++; } } catch {}
  return c;
}

/** Get unseen kudos count since last login check */
export function getUnseenKudosCount(user: string): number {
  const total = getTotalKudos(user);
  const seenKey = `st_kudos_seen_${user}`;
  try {
    const seen = parseInt(localStorage.getItem(seenKey) || '0', 10);
    return Math.max(0, total - seen);
  } catch { return 0; }
}

/** Mark all current kudos as seen */
export function markKudosSeen(user: string) {
  const total = getTotalKudos(user);
  try { localStorage.setItem(`st_kudos_seen_${user}`, String(total)); } catch {}
}

/** Get recent kudos givers (from last 7 days) for notification message */
export function getRecentKudosGivers(user: string, data: { date: string }[]): string[] {
  const dates = [...new Set(data.map(d => d.date))].sort().slice(-7);
  const givers = new Set<string>();
  for (const date of dates) {
    for (const n of NAMES) {
      if (n === user) continue;
      if (getKudos(n, user, date)) givers.add(n.split(' ')[0]);
    }
  }
  return [...givers];
}

export function getTotalKudosGiven(from: string): number {
  let c = 0;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('st_kudos_') && !k.startsWith('st_kudos_comment_')) {
        // Key format: st_kudos_{date}_{from}_{to}
        // We need to check if {from} matches — extract from key
        const parts = k.substring('st_kudos_'.length);
        // date is YYYY-MM-DD (10 chars), then _ then from name
        const dateEnd = 10; // YYYY-MM-DD
        const afterDate = parts.substring(dateEnd + 1); // skip date + underscore
        if (afterDate.startsWith(from + '_')) c++;
      }
    }
  } catch {}
  return c;
}
