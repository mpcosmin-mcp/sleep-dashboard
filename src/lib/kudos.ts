import { NAMES } from '@/lib/sleep';

export const KUDOS_REACTIONS = ['👏', '🔥', '💪', '🚀', '😴', '🏆'];

export function kudosKey(from: string, to: string, date: string) {
  return `st_kudos_${date}_${from}_${to}`;
}

export function getKudos(from: string, to: string, date: string): string | null {
  try { return localStorage.getItem(kudosKey(from, to, date)); } catch { return null; }
}

export function saveKudos(from: string, to: string, date: string, emoji: string) {
  try { localStorage.setItem(kudosKey(from, to, date), emoji); } catch {}
}

export function getKudosFor(to: string, date: string): { from: string; emoji: string }[] {
  const result: { from: string; emoji: string }[] = [];
  for (const n of NAMES) { const k = getKudos(n, to, date); if (k) result.push({ from: n, emoji: k }); }
  return result;
}

export function getTotalKudos(to: string): number {
  let c = 0;
  try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k?.startsWith('st_kudos_') && k.endsWith(`_${to}`)) c++; } } catch {}
  return c;
}

export function getTotalKudosGiven(from: string): number {
  let c = 0;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith('st_kudos_')) {
        // Key format: st_kudos_{date}_{from}_{to}
        // parts[0]='st', parts[1]='kudos', parts[2]=date
        const parts = k.split('_');
        const datePrefix = `st_kudos_${parts[2]}_`;
        const rest = k.slice(datePrefix.length);
        if (rest.startsWith(from + '_') || rest === from) c++;
      }
    }
  } catch {}
  return c;
}

export function getMonthlyKudosReceived(to: string, yearMonth: string): number {
  let c = 0;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith(`st_kudos_${yearMonth}`) && k.endsWith(`_${to}`)) c++;
    }
  } catch {}
  return c;
}
