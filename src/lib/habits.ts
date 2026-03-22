export interface HabitDef {
  id: string;
  label: string;
  category: 'sleep' | 'general';
  emoji: string;
}

export interface HabitConfig { selectedIds: string[]; }
export interface DailyLog { date: string; completed: string[]; }
export interface HabitLog { entries: DailyLog[]; }

export const HABIT_POOL: HabitDef[] = [
  { id: 'culcat-23',       label: 'Culcat înainte de 23:00',              category: 'sleep',   emoji: '🛏️' },
  { id: 'fara-telefon',    label: 'Fără telefon 30 min înainte de somn',  category: 'sleep',   emoji: '📵' },
  { id: 'fara-cafea',      label: 'Fără cafea după 14:00',                category: 'sleep',   emoji: '☕' },
  { id: 'fara-ecrane',     label: 'Fără ecrane 1h înainte de somn',       category: 'sleep',   emoji: '📺' },
  { id: 'miscare-30',      label: '30 min mișcare',                       category: 'general', emoji: '🏃' },
  { id: 'apa-2l',          label: '2L apă',                               category: 'general', emoji: '💧' },
  { id: 'meditatie-10',    label: '10 min meditație / respirație',        category: 'general', emoji: '🧘' },
  { id: 'citit-15',        label: 'Citit 15 min',                         category: 'general', emoji: '📖' },
  { id: 'jurnal',          label: 'Jurnal / reflecție',                   category: 'general', emoji: '✍️' },
  { id: 'cold-shower',     label: 'Cold shower',                          category: 'general', emoji: '🚿' },
];

function slugify(name: string) { return name.toLowerCase().replace(/\s+/g, '-'); }

export function loadConfig(user: string): HabitConfig {
  try { return JSON.parse(localStorage.getItem(`st_habits_${slugify(user)}`) || ''); }
  catch { return { selectedIds: [] }; }
}
export function saveConfig(user: string, config: HabitConfig) {
  localStorage.setItem(`st_habits_${slugify(user)}`, JSON.stringify(config));
}

export function loadLog(user: string): HabitLog {
  try { return JSON.parse(localStorage.getItem(`st_habit_log_${slugify(user)}`) || ''); }
  catch { return { entries: [] }; }
}
export function saveLog(user: string, log: HabitLog) {
  localStorage.setItem(`st_habit_log_${slugify(user)}`, JSON.stringify(log));
}

export function toggleHabit(log: HabitLog, date: string, habitId: string): HabitLog {
  const entries = log.entries.map(e => ({ ...e, completed: [...e.completed] }));
  let day = entries.find(e => e.date === date);
  if (!day) { day = { date, completed: [] }; entries.push(day); }
  const idx = day.completed.indexOf(habitId);
  if (idx >= 0) day.completed.splice(idx, 1); else day.completed.push(habitId);
  return { entries };
}

export function isDayComplete(log: HabitLog, date: string, selectedIds: string[]): boolean {
  if (!selectedIds.length) return false;
  const day = log.entries.find(e => e.date === date);
  if (!day) return false;
  return selectedIds.every(id => day.completed.includes(id));
}

export function completedCount(log: HabitLog, date: string): number {
  return log.entries.find(e => e.date === date)?.completed.length ?? 0;
}

export function calcStreak(log: HabitLog, selectedIds: string[], today: string): number {
  if (!selectedIds.length) return 0;
  let streak = 0;
  const d = new Date(today + 'T12:00:00');
  // If today is complete, count it; otherwise start from yesterday
  if (!isDayComplete(log, today, selectedIds)) d.setDate(d.getDate() - 1);
  for (let i = 0; i < 365; i++) {
    const ds = d.toISOString().split('T')[0];
    if (isDayComplete(log, ds, selectedIds)) { streak++; d.setDate(d.getDate() - 1); }
    else break;
  }
  return streak;
}

export function calcMonthPct(log: HabitLog, selectedIds: string[], year: number, month: number): number {
  if (!selectedIds.length) return 0;
  const now = new Date();
  const isCurrentMonth = now.getFullYear() === year && now.getMonth() + 1 === month;
  const totalDays = isCurrentMonth ? now.getDate() : new Date(year, month, 0).getDate();
  let complete = 0;
  for (let day = 1; day <= totalDays; day++) {
    const ds = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    if (isDayComplete(log, ds, selectedIds)) complete++;
  }
  return Math.round((complete / totalDays) * 100);
}

export function getHabit(id: string): HabitDef | undefined {
  return HABIT_POOL.find(h => h.id === id);
}
