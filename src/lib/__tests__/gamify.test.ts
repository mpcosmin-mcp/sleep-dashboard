import { describe, it, expect } from 'vitest';
import { calcXPBreakdown } from '@/lib/gamify';
import { getEarnedBadgeIds, saveEarnedBadge } from '@/lib/badges';
import { entry } from './setup';

const NAME = 'Petrica Cosmin Moga';

describe('calcXPBreakdown with badgeXP', () => {
  it('XPBreakdown has a badgeXP field', () => {
    const breakdown = calcXPBreakdown([], NAME);
    expect('badgeXP' in breakdown).toBe(true);
  });

  it('badgeXP is 0 when no badges earned', () => {
    const breakdown = calcXPBreakdown([], NAME);
    expect(breakdown.badgeXP).toBe(0);
  });

  it('badgeXP = earnedBadgeCount * 25 with 1 badge', () => {
    saveEarnedBadge(NAME, 'first_log');
    const ids = getEarnedBadgeIds(NAME);
    expect(ids).toHaveLength(1);
    const breakdown = calcXPBreakdown([], NAME);
    expect(breakdown.badgeXP).toBe(25);
  });

  it('badgeXP = 75 with 3 earned badges', () => {
    saveEarnedBadge(NAME, 'first_log');
    saveEarnedBadge(NAME, 'sweet_dreams');
    saveEarnedBadge(NAME, 'week_warrior');
    const breakdown = calcXPBreakdown([], NAME);
    expect(breakdown.badgeXP).toBe(75);
  });

  it('total includes badgeXP in sum', () => {
    const withoutBadge = calcXPBreakdown([], NAME);
    const baseTotal = withoutBadge.total;
    expect(baseTotal).toBe(0); // no entries, no kudos, no badges yet

    saveEarnedBadge(NAME, 'first_log');
    const withBadge = calcXPBreakdown([], NAME);
    expect(withBadge.badgeXP).toBe(25);
    expect(withBadge.total).toBe(baseTotal + 25);
  });

  it('total increases by 75 with 3 earned badges', () => {
    const noData = calcXPBreakdown([], NAME);
    const baseTotal = noData.total;

    saveEarnedBadge(NAME, 'first_log');
    saveEarnedBadge(NAME, 'sweet_dreams');
    saveEarnedBadge(NAME, 'night_owl');
    const withBadges = calcXPBreakdown([], NAME);
    expect(withBadges.total).toBe(baseTotal + 75);
  });

  it('badgeXP included in total with actual entries', () => {
    const data = Array.from({ length: 5 }, (_, i) =>
      entry({ name: NAME, ss: 85, date: `2025-01-${(10 + i).toString().padStart(2, '0')}` })
    );
    saveEarnedBadge(NAME, 'first_log');
    const breakdown = calcXPBreakdown(data, NAME);
    expect(breakdown.badgeXP).toBe(25);
    expect(breakdown.total).toBe(breakdown.base + breakdown.bonusSS + breakdown.streakBonus + breakdown.goodSleepBonus + breakdown.kudosXP + breakdown.badgeXP - breakdown.spent);
  });
});
