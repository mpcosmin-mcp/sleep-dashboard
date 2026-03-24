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
