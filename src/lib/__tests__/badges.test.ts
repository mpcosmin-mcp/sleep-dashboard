import { describe, it, expect } from 'vitest';
import { BADGE_DEFS, checkBadges, getEarnedBadgeIds, saveEarnedBadge } from '@/lib/badges';
import { entry, consecutiveDays } from './setup';

const NAME = 'Petrica Cosmin Moga';

// Helper to find a badge check by id
function checkById(id: string, data: ReturnType<typeof entry>[], name: string) {
  const def = BADGE_DEFS.find(b => b.id === id);
  if (!def) throw new Error(`Badge not found: ${id}`);
  return def.check(data, name);
}

describe('BADGE_DEFS', () => {
  it('has exactly 17 badge definitions', () => {
    expect(BADGE_DEFS).toHaveLength(17);
  });

  it('each badge has required fields', () => {
    for (const b of BADGE_DEFS) {
      expect(b.id).toBeTruthy();
      expect(b.category).toMatch(/consistency|quality|social|fun/);
      expect(b.icon).toBeTruthy();
      expect(b.name).toBeTruthy();
      expect(b.xp).toBe(25);
      expect(typeof b.check).toBe('function');
    }
  });
});

describe('Consistency badges', () => {
  it('first_log: not earned with 0 entries', () => {
    const status = checkById('first_log', [], NAME);
    expect(status.earned).toBe(false);
    expect(status.progress).toBe(0);
    expect(status.target).toBe(1);
  });

  it('first_log: earned with 1 entry', () => {
    const status = checkById('first_log', [entry({ name: NAME })], NAME);
    expect(status.earned).toBe(true);
    expect(status.progress).toBe(1);
  });

  it('week_warrior: not earned with 6-day streak', () => {
    // Use past dates so streak is considered "active" -- use recent dates
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 5);
    const data = consecutiveDays(NAME, 6, startDate.toISOString().split('T')[0]);
    const status = checkById('week_warrior', data, NAME);
    expect(status.earned).toBe(false);
    expect(status.target).toBe(7);
  });

  it('week_warrior: progress field is a number', () => {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 2);
    const data = consecutiveDays(NAME, 3, startDate.toISOString().split('T')[0]);
    const status = checkById('week_warrior', data, NAME);
    expect(typeof status.progress).toBe('number');
    expect(status.target).toBe(7);
  });

  it('month_master: progress and target are correct', () => {
    const status = checkById('month_master', [], NAME);
    expect(status.target).toBe(30);
    expect(status.earned).toBe(false);
  });

  it('quarter_legend: target is 90', () => {
    const status = checkById('quarter_legend', [], NAME);
    expect(status.target).toBe(90);
    expect(status.earned).toBe(false);
  });
});

describe('Quality badges', () => {
  it('sweet_dreams: not earned when no entry has ss >= 90', () => {
    const data = [entry({ name: NAME, ss: 89 }), entry({ name: NAME, ss: 75, date: '2025-01-16' })];
    const status = checkById('sweet_dreams', data, NAME);
    expect(status.earned).toBe(false);
    expect(status.target).toBe(1);
  });

  it('sweet_dreams: earned when any entry has ss >= 90', () => {
    const data = [entry({ name: NAME, ss: 90 })];
    const status = checkById('sweet_dreams', data, NAME);
    expect(status.earned).toBe(true);
    expect(status.progress).toBe(1);
  });

  it('dream_week: not earned with 6 consecutive ss >= 85 days', () => {
    const data = Array.from({ length: 6 }, (_, i) =>
      entry({ name: NAME, ss: 85 + (i % 3), date: `2025-01-${(10 + i).toString().padStart(2, '0')}` })
    );
    const status = checkById('dream_week', data, NAME);
    expect(status.earned).toBe(false);
    expect(status.target).toBe(7);
  });

  it('dream_week: earned with 7 consecutive ss >= 85 days', () => {
    const data = Array.from({ length: 7 }, (_, i) =>
      entry({ name: NAME, ss: 85 + (i % 3), date: `2025-01-${(10 + i).toString().padStart(2, '0')}` })
    );
    const status = checkById('dream_week', data, NAME);
    expect(status.earned).toBe(true);
    expect(status.progress).toBe(7);
  });

  it('personal_best_ss: not earned with fewer than 10 entries', () => {
    const data = Array.from({ length: 9 }, (_, i) =>
      entry({ name: NAME, date: `2025-01-${(10 + i).toString().padStart(2, '0')}` })
    );
    const status = checkById('personal_best_ss', data, NAME);
    expect(status.earned).toBe(false);
  });

  it('personal_best_ss: earned with 10+ entries', () => {
    const data = Array.from({ length: 10 }, (_, i) =>
      entry({ name: NAME, date: `2025-01-${(10 + i).toString().padStart(2, '0')}` })
    );
    const status = checkById('personal_best_ss', data, NAME);
    expect(status.earned).toBe(true);
  });

  it('personal_best_rhr: earned with 10+ entries', () => {
    const data = Array.from({ length: 10 }, (_, i) =>
      entry({ name: NAME, date: `2025-01-${(10 + i).toString().padStart(2, '0')}` })
    );
    const status = checkById('personal_best_rhr', data, NAME);
    expect(status.earned).toBe(true);
  });

  it('personal_best_hrv: not earned with fewer than 10 entries with HRV', () => {
    const data = Array.from({ length: 9 }, (_, i) =>
      entry({ name: NAME, date: `2025-01-${(10 + i).toString().padStart(2, '0')}`, hrv: 45 })
    );
    const status = checkById('personal_best_hrv', data, NAME);
    expect(status.earned).toBe(false);
  });

  it('personal_best_hrv: earned with 10+ entries with HRV', () => {
    const data = Array.from({ length: 10 }, (_, i) =>
      entry({ name: NAME, date: `2025-01-${(10 + i).toString().padStart(2, '0')}`, hrv: 45 })
    );
    const status = checkById('personal_best_hrv', data, NAME);
    expect(status.earned).toBe(true);
  });
});

describe('Social badges', () => {
  it('first_kudos_given: not earned when no kudos given', () => {
    const status = checkById('first_kudos_given', [], NAME);
    expect(status.earned).toBe(false);
    expect(status.target).toBe(1);
  });

  it('first_kudos_given: earned when kudos given in localStorage', () => {
    localStorage.setItem(`st_kudos_2025-01-15_${NAME}_Cornel-Gabriel Meleru`, '👏');
    const status = checkById('first_kudos_given', [], NAME);
    expect(status.earned).toBe(true);
    expect(status.progress).toBe(1);
  });

  it('cheerleader: not earned with 29 kudos given', () => {
    // Use unique dates across 2 months to avoid key collisions
    for (let i = 0; i < 29; i++) {
      const month = Math.floor(i / 28) + 1;
      const day = (i % 28) + 1;
      const date = `2025-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      localStorage.setItem(`st_kudos_${date}_${NAME}_Cornel-Gabriel Meleru`, '👏');
    }
    const status = checkById('cheerleader', [], NAME);
    expect(status.earned).toBe(false);
    expect(status.target).toBe(30);
    expect(status.progress).toBe(29);
  });

  it('cheerleader: earned with 30+ kudos given', () => {
    for (let i = 0; i < 30; i++) {
      const date = `2025-${String(Math.floor(i / 28) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`;
      localStorage.setItem(`st_kudos_${date}_${NAME}_Cornel-Gabriel Meleru`, '👏');
    }
    const status = checkById('cheerleader', [], NAME);
    expect(status.earned).toBe(true);
    expect(status.progress).toBe(30);
  });

  it('fan_favorite: not earned with 49 kudos received', () => {
    for (let i = 0; i < 49; i++) {
      const date = `2025-${String(Math.floor(i / 28) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`;
      localStorage.setItem(`st_kudos_${date}_Cornel-Gabriel Meleru_${NAME}`, '🔥');
    }
    const status = checkById('fan_favorite', [], NAME);
    expect(status.earned).toBe(false);
    expect(status.target).toBe(50);
    expect(status.progress).toBe(49);
  });

  it('fan_favorite: earned with 50+ kudos received', () => {
    for (let i = 0; i < 50; i++) {
      const date = `2025-${String(Math.floor(i / 28) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`;
      localStorage.setItem(`st_kudos_${date}_Cornel-Gabriel Meleru_${NAME}`, '🔥');
    }
    const status = checkById('fan_favorite', [], NAME);
    expect(status.earned).toBe(true);
  });

  it('team_mvp: returns earned and progress', () => {
    const status = checkById('team_mvp', [], NAME);
    expect(typeof status.earned).toBe('boolean');
    expect(typeof status.progress).toBe('number');
    expect(status.target).toBe(1);
  });
});

describe('Fun badges', () => {
  it('night_owl: not earned with 2 low-SS days in 7-day window', () => {
    const data = [
      entry({ name: NAME, ss: 55, date: '2025-01-10' }),
      entry({ name: NAME, ss: 59, date: '2025-01-12' }),
      entry({ name: NAME, ss: 80, date: '2025-01-14' }),
    ];
    const status = checkById('night_owl', data, NAME);
    expect(status.earned).toBe(false);
    expect(status.target).toBe(3);
  });

  it('night_owl: earned with 3+ low-SS days in any 7-day window', () => {
    const data = [
      entry({ name: NAME, ss: 55, date: '2025-01-10' }),
      entry({ name: NAME, ss: 58, date: '2025-01-11' }),
      entry({ name: NAME, ss: 57, date: '2025-01-13' }),
      entry({ name: NAME, ss: 80, date: '2025-01-20' }),
    ];
    const status = checkById('night_owl', data, NAME);
    expect(status.earned).toBe(true);
  });

  it('comeback_kid: returns correct structure with not enough data', () => {
    const data = [entry({ name: NAME, ss: 80 })];
    const status = checkById('comeback_kid', data, NAME);
    expect(status.earned).toBe(false);
    expect(status.target).toBe(1);
  });

  it('comeback_kid: earned when 7-day avg improves by 15+', () => {
    // Week 1: low SS (avg ~50), Week 2: high SS (avg ~70) -- improvement = ~20 >= 15
    const week1 = Array.from({ length: 7 }, (_, i) =>
      entry({ name: NAME, ss: 45 + i, date: `2025-01-${(1 + i).toString().padStart(2, '0')}` })
    );
    const week2 = Array.from({ length: 7 }, (_, i) =>
      entry({ name: NAME, ss: 65 + i, date: `2025-01-${(8 + i).toString().padStart(2, '0')}` })
    );
    const status = checkById('comeback_kid', [...week1, ...week2], NAME);
    expect(status.earned).toBe(true);
  });

  it('weekend_warrior: not earned with insufficient weekend data', () => {
    const data = [
      entry({ name: NAME, ss: 80, date: '2025-01-13' }), // Monday
      entry({ name: NAME, ss: 82, date: '2025-01-14' }), // Tuesday
    ];
    const status = checkById('weekend_warrior', data, NAME);
    expect(status.earned).toBe(false);
    expect(status.target).toBe(1);
  });

  it('weekend_warrior: earned when weekend avg > weekday avg', () => {
    // Create data with weekend days having higher SS
    const data = [];
    // Weekdays: Mon-Fri (ss ~70)
    data.push(entry({ name: NAME, ss: 70, date: '2025-01-06' })); // Mon
    data.push(entry({ name: NAME, ss: 72, date: '2025-01-07' })); // Tue
    data.push(entry({ name: NAME, ss: 71, date: '2025-01-08' })); // Wed
    data.push(entry({ name: NAME, ss: 69, date: '2025-01-09' })); // Thu
    data.push(entry({ name: NAME, ss: 70, date: '2025-01-10' })); // Fri
    // Weekends (ss ~90)
    data.push(entry({ name: NAME, ss: 92, date: '2025-01-11' })); // Sat
    data.push(entry({ name: NAME, ss: 91, date: '2025-01-12' })); // Sun
    data.push(entry({ name: NAME, ss: 90, date: '2025-01-18' })); // Sat
    data.push(entry({ name: NAME, ss: 89, date: '2025-01-19' })); // Sun
    const status = checkById('weekend_warrior', data, NAME);
    expect(status.earned).toBe(true);
  });

  it('steady_eddie: not earned with variable SS', () => {
    const data = [
      entry({ name: NAME, ss: 60, date: '2025-01-10' }),
      entry({ name: NAME, ss: 75, date: '2025-01-11' }),
      entry({ name: NAME, ss: 50, date: '2025-01-12' }),
      entry({ name: NAME, ss: 88, date: '2025-01-13' }),
      entry({ name: NAME, ss: 65, date: '2025-01-14' }),
      entry({ name: NAME, ss: 90, date: '2025-01-15' }),
      entry({ name: NAME, ss: 55, date: '2025-01-16' }),
    ];
    const status = checkById('steady_eddie', data, NAME);
    expect(status.earned).toBe(false);
    expect(status.target).toBe(7);
  });

  it('steady_eddie: earned when SS stays within 3-point range for 7 consecutive days', () => {
    const data = Array.from({ length: 7 }, (_, i) =>
      entry({ name: NAME, ss: 80 + (i % 2), date: `2025-01-${(10 + i).toString().padStart(2, '0')}` })
    );
    const status = checkById('steady_eddie', data, NAME);
    expect(status.earned).toBe(true);
    expect(status.progress).toBe(7);
  });
});

describe('localStorage persistence', () => {
  it('getEarnedBadgeIds returns empty array initially', () => {
    const ids = getEarnedBadgeIds(NAME);
    expect(ids).toEqual([]);
  });

  it('saveEarnedBadge persists badge id', () => {
    saveEarnedBadge(NAME, 'first_log');
    const ids = getEarnedBadgeIds(NAME);
    expect(ids).toContain('first_log');
  });

  it('saveEarnedBadge does not duplicate', () => {
    saveEarnedBadge(NAME, 'first_log');
    saveEarnedBadge(NAME, 'first_log');
    const ids = getEarnedBadgeIds(NAME);
    expect(ids.filter(id => id === 'first_log')).toHaveLength(1);
  });
});

describe('checkBadges', () => {
  it('returns array of badge results for user with 1 entry', () => {
    const data = [entry({ name: NAME })];
    const results = checkBadges(data, NAME);
    expect(results).toHaveLength(BADGE_DEFS.length);
    const firstLog = results.find(r => r.def.id === 'first_log');
    expect(firstLog?.status.earned).toBe(true);
  });
});
