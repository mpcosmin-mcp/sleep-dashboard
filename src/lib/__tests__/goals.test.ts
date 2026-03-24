import { describe, it, expect } from 'vitest';
import { getGoal, setGoal, clearGoal, computeGoalStatus } from '@/lib/goals';
import { entry } from './setup';

const NAME = 'Petrica Cosmin Moga';
const MONTH = '2025-01';

describe('getGoal / setGoal / clearGoal', () => {
  it('getGoal returns null when no goal set', () => {
    expect(getGoal(NAME, MONTH)).toBeNull();
  });

  it('getGoal returns saved target after setGoal', () => {
    setGoal(NAME, MONTH, 85);
    expect(getGoal(NAME, MONTH)).toBe(85);
  });

  it('clearGoal removes the goal', () => {
    setGoal(NAME, MONTH, 85);
    clearGoal(NAME, MONTH);
    expect(getGoal(NAME, MONTH)).toBeNull();
  });

  it('setGoal overwrites existing goal', () => {
    setGoal(NAME, MONTH, 80);
    setGoal(NAME, MONTH, 90);
    expect(getGoal(NAME, MONTH)).toBe(90);
  });
});

describe('computeGoalStatus', () => {
  it('returns no-data for empty entries', () => {
    expect(computeGoalStatus([], 80)).toBe('no-data');
  });

  it('returns ahead when currentAvg >= target + 3', () => {
    const data = [
      entry({ name: NAME, ss: 88 }),
      entry({ name: NAME, ss: 86, date: '2025-01-16' }),
    ];
    // avg = 87, target = 80, 87 >= 80 + 3 = 83
    expect(computeGoalStatus(data, 80)).toBe('ahead');
  });

  it('returns on-track when currentAvg within 3 of target (above)', () => {
    const data = [
      entry({ name: NAME, ss: 82 }),
      entry({ name: NAME, ss: 82, date: '2025-01-16' }),
    ];
    // avg = 82, target = 80, 82 >= 80 - 3 = 77 but not >= 80 + 3 = 83
    expect(computeGoalStatus(data, 80)).toBe('on-track');
  });

  it('returns on-track when currentAvg within 3 of target (below)', () => {
    const data = [
      entry({ name: NAME, ss: 78 }),
      entry({ name: NAME, ss: 79, date: '2025-01-16' }),
    ];
    // avg = ~78.5, target = 80, 78.5 >= 80 - 3 = 77
    expect(computeGoalStatus(data, 80)).toBe('on-track');
  });

  it('returns behind when currentAvg < target - 3', () => {
    const data = [
      entry({ name: NAME, ss: 70 }),
      entry({ name: NAME, ss: 72, date: '2025-01-16' }),
    ];
    // avg = 71, target = 80, 71 < 80 - 3 = 77
    expect(computeGoalStatus(data, 80)).toBe('behind');
  });
});
