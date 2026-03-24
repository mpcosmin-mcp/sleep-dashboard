import { describe, it, expect } from 'vitest';
import './setup';
import { entry } from './setup';
import {
  CHALLENGE_POOL,
  getWeeklyChallenge,
  getWeekNumber,
  type ChallengeStatus,
} from '@/lib/challenges';
import { NAMES } from '@/lib/sleep';

describe('challenges', () => {
  describe('getWeeklyChallenge', () => {
    it('returns a ChallengeDef from CHALLENGE_POOL deterministically', () => {
      const c = getWeeklyChallenge(5);
      expect(c).toBeDefined();
      expect(c.id).toBeTruthy();
      expect(c.xp).toBeGreaterThan(0);
      expect(CHALLENGE_POOL).toContain(c);
    });

    it('same weekNumber always returns same challenge', () => {
      const a = getWeeklyChallenge(42);
      const b = getWeeklyChallenge(42);
      expect(a.id).toBe(b.id);
    });

    it('different weekNumbers return different challenges (first 8)', () => {
      const ids = new Set<string>();
      for (let i = 0; i < 8; i++) {
        ids.add(getWeeklyChallenge(i).id);
      }
      expect(ids.size).toBe(8);
    });
  });

  describe('CHALLENGE_POOL', () => {
    it('has at least 8 challenges', () => {
      expect(CHALLENGE_POOL.length).toBeGreaterThanOrEqual(8);
    });

    it('includes both individual and team challenges', () => {
      const types = new Set(CHALLENGE_POOL.map(c => c.type));
      expect(types.has('individual')).toBe(true);
      expect(types.has('team')).toBe(true);
    });
  });

  describe('getWeekNumber', () => {
    it('returns a number between 1 and 53', () => {
      const wn = getWeekNumber();
      expect(wn).toBeGreaterThanOrEqual(1);
      expect(wn).toBeLessThanOrEqual(53);
    });

    it('returns consistent week for same date', () => {
      const d = new Date('2025-03-10T12:00:00');
      expect(getWeekNumber(d)).toBe(getWeekNumber(d));
    });
  });

  describe('challenge checks', () => {
    const logDaily = CHALLENGE_POOL.find(c => c.id === 'log_daily')!;
    const team80 = CHALLENGE_POOL.find(c => c.id === 'team_80')!;
    const ss90once = CHALLENGE_POOL.find(c => c.id === 'ss_90_once')!;
    const consistency = CHALLENGE_POOL.find(c => c.id === 'consistency')!;

    const weekStart = '2025-03-10'; // Monday
    const weekEnd = '2025-03-16';   // Sunday
    const user = 'Petrica Cosmin Moga';

    it('log_daily: completed with 7 entries', () => {
      const data = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date('2025-03-10T12:00:00');
        d.setDate(d.getDate() + i);
        data.push(entry({ date: d.toISOString().split('T')[0], name: user }));
      }
      const status = logDaily.check(data, user, weekStart, weekEnd);
      expect(status.completed).toBe(true);
      expect(status.progress).toBe(7);
      expect(status.target).toBe(7);
    });

    it('log_daily: incomplete with 3 entries', () => {
      const data = [
        entry({ date: '2025-03-10', name: user }),
        entry({ date: '2025-03-11', name: user }),
        entry({ date: '2025-03-12', name: user }),
      ];
      const status = logDaily.check(data, user, weekStart, weekEnd);
      expect(status.completed).toBe(false);
      expect(status.progress).toBe(3);
      expect(status.target).toBe(7);
    });

    it('team_80: completed when all 3 users avg >= 80', () => {
      const data = NAMES.flatMap(n => [
        entry({ date: '2025-03-10', name: n, ss: 82 }),
        entry({ date: '2025-03-11', name: n, ss: 84 }),
      ]);
      const status = team80.check(data, user, weekStart, weekEnd);
      expect(status.completed).toBe(true);
      expect(status.progress).toBe(3);
      expect(status.target).toBe(3);
    });

    it('team_80: fails when one user avg < 80', () => {
      const data = [
        ...NAMES.slice(0, 2).flatMap(n => [
          entry({ date: '2025-03-10', name: n, ss: 85 }),
        ]),
        entry({ date: '2025-03-10', name: NAMES[2], ss: 70 }),
      ];
      const status = team80.check(data, user, weekStart, weekEnd);
      expect(status.completed).toBe(false);
      expect(status.progress).toBe(2);
    });

    it('ss_90_once: completed with one SS >= 90 entry', () => {
      const data = [
        entry({ date: '2025-03-10', name: user, ss: 75 }),
        entry({ date: '2025-03-11', name: user, ss: 92 }),
      ];
      const status = ss90once.check(data, user, weekStart, weekEnd);
      expect(status.completed).toBe(true);
    });

    it('ss_90_once: incomplete with all SS < 90', () => {
      const data = [
        entry({ date: '2025-03-10', name: user, ss: 85 }),
        entry({ date: '2025-03-11', name: user, ss: 88 }),
      ];
      const status = ss90once.check(data, user, weekStart, weekEnd);
      expect(status.completed).toBe(false);
    });

    it('consistency: completed when all SS within 10 points', () => {
      const data = [
        entry({ date: '2025-03-10', name: user, ss: 80 }),
        entry({ date: '2025-03-11', name: user, ss: 85 }),
        entry({ date: '2025-03-12', name: user, ss: 82 }),
      ];
      const status = consistency.check(data, user, weekStart, weekEnd);
      expect(status.completed).toBe(true);
    });

    it('consistency: fails when SS range > 10', () => {
      const data = [
        entry({ date: '2025-03-10', name: user, ss: 70 }),
        entry({ date: '2025-03-11', name: user, ss: 90 }),
      ];
      const status = consistency.check(data, user, weekStart, weekEnd);
      expect(status.completed).toBe(false);
    });
  });
});
