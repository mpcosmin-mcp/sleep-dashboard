import { useState } from 'react';
import { type SleepEntry, calcXP, loggingStreak, xpLevel, xpProgress, XP_PER_LEVEL, XP_COLOR, STREAK_COLOR, personColor } from '@/lib/sleep';
import { Avi } from './Avi';

function getLast7Days(data: SleepEntry[], name: string): (0 | 1 | 'today')[] {
  const personDates = new Set(data.filter(d => d.name === name).map(d => d.date));
  const result: (0 | 1 | 'today')[] = [];
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  for (let i = 0; i < 7; i++) {
    const ds = d.toISOString().split('T')[0];
    // Check both today's date and yesterday (since sleep date = night before)
    const yesterday = new Date(d);
    yesterday.setDate(yesterday.getDate() - 1);
    const ys = yesterday.toISOString().split('T')[0];
    if (i === 0) {
      result.push(personDates.has(ds) || personDates.has(ys) ? 1 : 'today');
    } else {
      result.push(personDates.has(ys) ? 1 : 0);
    }
    d.setDate(d.getDate() - 1);
  }
  return result.reverse(); // oldest first
}

const DAY_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

function getDayLabel(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - (6 - daysAgo));
  return DAY_LABELS[d.getDay() === 0 ? 6 : d.getDay() - 1];
}

export function ProgressHub({ user, data }: { user: string; data: SleepEntry[] }) {
  const [showInfo, setShowInfo] = useState(false);
  const xp = calcXP(data, user);
  const level = xpLevel(xp);
  const progress = xpProgress(xp);
  const sr = loggingStreak(data, user);
  const last7 = getLast7Days(data, user);
  const c = personColor(user);
  const pct = (progress / XP_PER_LEVEL) * 100;

  // SVG circle progress
  const r = 18;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;

  return (
    <div className="relative flex items-center gap-3 px-3 py-2 rounded-xl bg-card/80 border shadow-sm mb-4" style={{ zIndex: showInfo ? 50 : undefined }}>
      {/* XP Progress Ring */}
      <div className="relative shrink-0" title={`${xp} XP · ${progress}/${XP_PER_LEVEL} → Lv ${level + 1}`}>
        <svg width="44" height="44" className="-rotate-90">
          <circle cx="22" cy="22" r={r} fill="none" stroke="currentColor" strokeWidth="3" className="text-muted" />
          <circle cx="22" cy="22" r={r} fill="none" stroke={XP_COLOR} strokeWidth="3"
            strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
            className="transition-all duration-500" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[10px] font-bold" style={{ color: XP_COLOR }}>Lv{level}</span>
        </div>
      </div>

      {/* Center: name + week tracker */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-bold text-xs truncate" style={{ color: c }}>{user.split(' ')[0]}</span>
          {sr.days > 0 && (
            <span className="text-[10px] font-bold shrink-0" style={{ color: STREAK_COLOR }}>⚡{sr.days}d</span>
          )}
        </div>
        {/* 7-day tracker */}
        <div className="flex gap-1">
          {last7.map((status, i) => (
            <div key={i} className="flex flex-col items-center gap-0.5" title={
              status === 'today' ? 'Azi — nu ai logat încă' :
              status === 1 ? `${getDayLabel(i)} — logat ✓` :
              `${getDayLabel(i)} — ratat`
            }>
              <div className={`w-3.5 h-3.5 rounded-full transition-all ${
                status === 'today' ? 'animate-pulse border-2' :
                status === 1 ? '' : 'opacity-30'
              }`} style={{
                background: status === 1 ? STREAK_COLOR : status === 'today' ? 'transparent' : '#888',
                borderColor: status === 'today' ? STREAK_COLOR : undefined,
              }} />
              <span className="text-[7px] text-muted-foreground">{getDayLabel(i)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* XP number + info button */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="text-right">
          <div className="font-mono text-xs font-bold" style={{ color: XP_COLOR }}>{xp} XP</div>
          <div className="text-[8px] text-muted-foreground">{progress}/{XP_PER_LEVEL}</div>
        </div>
        <button onClick={() => setShowInfo(!showInfo)} className="w-5 h-5 rounded-full bg-muted text-[10px] font-bold text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center" aria-label="Info">
          ?
        </button>
      </div>

      {/* Info popover */}
      {showInfo && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 mx-3">
          <div className="bg-card border rounded-xl shadow-lg p-3 text-xs space-y-1.5">
            <div className="font-bold text-sm mb-1">Cum funcționează?</div>
            <div>⚡ <b>Streak</b> — Câte zile la rând ai logat somnul. Vino zilnic!</div>
            <div>😴 <b>Zi ratată?</b> — Dacă dormi bine a doua zi (scor ≥ 75), ești salvat automat. Dacă nu, 50 XP sau o iei de la zero.</div>
            <div>✨ <b>XP</b> — Câștigi puncte logând zilnic și dormind bine. La 100 XP urci un nivel.</div>
            <div>👏 <b>Kudos</b> — Încurajează-ți echipa! Fiecare kudos primit = 5 XP.</div>
            <button onClick={() => setShowInfo(false)} className="text-[10px] text-muted-foreground hover:text-foreground mt-1">Închide</button>
          </div>
        </div>
      )}
    </div>
  );
}
