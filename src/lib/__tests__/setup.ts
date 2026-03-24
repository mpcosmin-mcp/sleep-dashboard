import { beforeEach, vi } from 'vitest';

// Provide a fully functional localStorage mock for tests
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
    get length() { return Object.keys(store).length; },
    key: (index: number) => Object.keys(store)[index] ?? null,
  };
})();

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Clear localStorage before each test
beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

// SleepEntry factory for test data
export function entry(overrides: Partial<{ date: string; name: string; ss: number; rhr: number; hrv: number | null }> = {}) {
  return {
    date: overrides.date ?? '2025-01-15',
    name: overrides.name ?? 'Petrica Cosmin Moga',
    ss: overrides.ss ?? 80,
    rhr: overrides.rhr ?? 60,
    hrv: overrides.hrv !== undefined ? overrides.hrv : 45,
  };
}

// Generate consecutive date entries
export function consecutiveDays(
  name: string,
  count: number,
  startDate: string,
  ssBase = 80
): Array<{ date: string; name: string; ss: number; rhr: number; hrv: number | null }> {
  const entries = [];
  const start = new Date(startDate + 'T12:00:00');
  for (let i = 0; i < count; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    entries.push(entry({ date: d.toISOString().split('T')[0], name, ss: ssBase + (i % 5), rhr: 58, hrv: 45 }));
  }
  return entries;
}
