import { describe, it, expect } from 'vitest';
import './setup';
import { entry } from './setup';
import { getGoal, saveGoal, clearGoal, goalStatus, getLastMonthAvg } from '@/lib/goals';

const user = 'Petrica Cosmin Moga';

describe('goals', () => {
  describe('CRUD', () => {
    it('saveGoal stores to localStorage key st_goal_{user}_{YYYY-MM}', () => {
      saveGoal(user, 85, '2025-03');
      expect(localStorage.getItem(`st_goal_${user}_2025-03`)).toBe('85');
    });

    it('getGoal retrieves saved value', () => {
      saveGoal(user, 82, '2025-03');
      expect(getGoal(user, '2025-03')).toBe(82);
    });

    it('getGoal returns null when not set', () => {
      expect(getGoal(user, '2099-01')).toBeNull();
    });

    it('clearGoal removes the key', () => {
      saveGoal(user, 85, '2025-04');
      clearGoal(user, '2025-04');
      expect(getGoal(user, '2025-04')).toBeNull();
    });
  });

  describe('goalStatus', () => {
    const month = '2025-03';

    it('returns null when no goal is set', () => {
      const data = [entry({ date: '2025-03-10', name: user, ss: 85 })];
      expect(goalStatus(data, user, month)).toBeNull();
    });

    it('returns "ahead" when current avg > target + 2', () => {
      saveGoal(user, 80, month);
      const data = [
        entry({ date: '2025-03-10', name: user, ss: 88 }),
        entry({ date: '2025-03-11', name: user, ss: 90 }),
      ];
      const s = goalStatus(data, user, month)!;
      expect(s).not.toBeNull();
      expect(s.status).toBe('ahead');
      expect(s.currentAvg).toBe(89);
      expect(s.target).toBe(80);
      expect(s.daysLogged).toBe(2);
    });

    it('returns "behind" when current avg < target - 2', () => {
      saveGoal(user, 85, month);
      const data = [
        entry({ date: '2025-03-10', name: user, ss: 75 }),
        entry({ date: '2025-03-11', name: user, ss: 78 }),
      ];
      const s = goalStatus(data, user, month)!;
      expect(s.status).toBe('behind');
    });

    it('returns "on-track" when current avg is within 2 points of target', () => {
      saveGoal(user, 85, month);
      const data = [
        entry({ date: '2025-03-10', name: user, ss: 84 }),
        entry({ date: '2025-03-11', name: user, ss: 86 }),
      ];
      const s = goalStatus(data, user, month)!;
      expect(s.status).toBe('on-track');
      expect(s.currentAvg).toBe(85);
    });

    it('returns projected average based on current data', () => {
      saveGoal(user, 80, month);
      const data = [
        entry({ date: '2025-03-10', name: user, ss: 82 }),
        entry({ date: '2025-03-11', name: user, ss: 84 }),
      ];
      const s = goalStatus(data, user, month)!;
      expect(s.projected).toBe(s.currentAvg);
    });

    it('handles zero entries gracefully', () => {
      saveGoal(user, 80, month);
      const s = goalStatus([], user, month)!;
      expect(s.currentAvg).toBe(0);
      expect(s.daysLogged).toBe(0);
      expect(s.status).toBe('behind');
    });
  });

  describe('getLastMonthAvg', () => {
    it('returns 80 when no previous month data', () => {
      expect(getLastMonthAvg([], user)).toBe(80);
    });

    it('returns average from last month entries', () => {
      const now = new Date();
      now.setMonth(now.getMonth() - 1);
      const lastMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const data = [
        entry({ date: `${lastMonth}-10`, name: user, ss: 80 }),
        entry({ date: `${lastMonth}-11`, name: user, ss: 90 }),
      ];
      expect(getLastMonthAvg(data, user)).toBe(85);
    });
  });
});
