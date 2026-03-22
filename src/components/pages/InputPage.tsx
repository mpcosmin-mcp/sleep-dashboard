import { useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { type SleepEntry, NAMES, ssColor, rhrColor, hrvColor, getTier, todayStr, submitEntry, calcXP, loggingStreak, personColor } from '@/lib/sleep';
import { MVal } from '@/components/shared/MVal';
import { Avi } from '@/components/shared/Avi';

export function InputPage({ data, setData, user, pickUser, logout, showToast }: {
  data: SleepEntry[]; setData: (d: SleepEntry[]) => void;
  user: string | null; pickUser: (n: string) => void; logout: () => void;
  showToast: (m: string) => void;
}) {
  const [saving, setSaving] = useState(false);
  const ssRef = useRef<HTMLInputElement>(null);
  const rhrRef = useRef<HTMLInputElement>(null);
  const hrvRef = useRef<HTMLInputElement>(null);

  if (!user) {
    return (
      <div className="max-w-md mx-auto mt-6 lg:mt-16 text-center">
        <div className="text-4xl mb-3">👋</div>
        <h2 className="text-2xl font-bold tracking-tight mb-1">Alege profilul</h2>
        <p className="text-muted-foreground text-sm mb-6">Selectează-ți contul pentru a loga datele de somn.</p>
        <div className="flex flex-col gap-2">
          {[...NAMES].sort((a, b) => calcXP(data, b) - calcXP(data, a)).map((n, rank) => {
            const xp = calcXP(data, n);
            const sr = loggingStreak(data, n);
            const c = personColor(n);
            const medal = rank === 0 ? '🥇' : rank === 1 ? '🥈' : '🥉';
            return (
              <button key={n} onClick={() => pickUser(n)}
                className="flex items-center rounded-xl border bg-card hover:scale-[1.01] active:scale-[0.99] transition-all text-left group overflow-hidden">
                {/* Left section: rank + avatar + name */}
                <div className="flex items-center gap-3 flex-1 min-w-0 px-4 py-3">
                  <span className="text-sm w-5 text-center shrink-0">{medal}</span>
                  <Avi name={n} size="md" />
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold text-sm block truncate">{n}</span>
                    {sr.days > 0 && <span className="text-[10px] text-muted-foreground">⚡{sr.days}d streak</span>}
                  </div>
                </div>
                {/* Right section: XP pill */}
                {xp > 0 && (
                  <div className="flex items-center gap-1.5 px-4 py-3 border-l bg-muted/40 shrink-0"
                       style={{ borderLeftColor: c + '20' }}>
                    <span className="text-xs font-bold font-mono" style={{ color: c }}>{xp}</span>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">XP</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  const todayEntry = data.find(d => d.date === todayStr() && d.name === user);

  if (todayEntry) {
    const tier = getTier(todayEntry.ss);
    return (
      <div className="max-w-md mx-auto mt-4 lg:mt-12 text-center">
        <div className="text-3xl mb-2">✓</div>
        <h2 className="text-xl font-bold tracking-tight mb-1">Date salvate, {user.split(' ')[0]}!</h2>
        <p className="text-muted-foreground text-sm mb-5">Parametrii de azi sunt înregistrați.</p>
        <Card className="shadow-md">
          <CardContent className="pt-6 pb-5">
            <MVal value={todayEntry.ss} color={ssColor(todayEntry.ss)} unit="/100" big />
            <div className="text-xs font-bold uppercase tracking-wider mt-2 mb-5" style={{ color: tier.color }}>
              {tier.label}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-muted rounded-lg p-3 text-center">
                <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">RHR</div>
                <MVal value={todayEntry.rhr} color={rhrColor(todayEntry.rhr)} unit="bpm" />
              </div>
              <div className="bg-muted rounded-lg p-3 text-center">
                <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">HRV</div>
                <MVal value={todayEntry.hrv ?? '—'} color={hrvColor(todayEntry.hrv)} unit={todayEntry.hrv ? 'ms' : ''} />
              </div>
            </div>
            <Button variant="outline" className="w-full mt-4 text-xs" onClick={() => {
              setData(data.filter(d => !(d.date === todayStr() && d.name === user)));
            }}>
              Modifică datele de azi
            </Button>
          </CardContent>
        </Card>
        <button onClick={logout} className="text-xs text-muted-foreground mt-4 hover:text-foreground transition-colors">
          Schimbă utilizatorul
        </button>
      </div>
    );
  }

  const handleSubmit = async () => {
    const ss = parseFloat(ssRef.current?.value || '');
    const rhr = parseFloat(rhrRef.current?.value || '');
    const hrvVal = hrvRef.current?.value;
    const hrv = hrvVal ? parseFloat(hrvVal) : null;
    if (isNaN(ss) || isNaN(rhr)) { showToast('Sleep Score și RHR sunt obligatorii'); return; }
    setSaving(true);
    try {
      await submitEntry({ date: todayStr(), name: user, sleep_score: String(ss), rhr: String(rhr), hrv: hrv === null ? '' : String(hrv) });
      setData([...data, { date: todayStr(), name: user, ss, rhr, hrv }]);
      showToast('Date salvate');
    } catch { showToast('Eroare la salvare'); }
    setSaving(false);
  };

  return (
    <div className="max-w-md mx-auto mt-4 lg:mt-12 text-center">
      <div className="text-3xl mb-2">🌙</div>
      <h2 className="text-xl font-bold tracking-tight mb-1">Bună dimineața, {user.split(' ')[0]}</h2>
      <p className="text-muted-foreground text-sm mb-6">Introdu metricile de somn de aseară.</p>
      <Card className="shadow-md text-left">
        <CardContent className="pt-5 pb-5 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {[
              { ref: ssRef, label: 'Sleep Score', ph: '85', hint: '0–100' },
              { ref: rhrRef, label: 'RHR', ph: '58', hint: 'BPM' },
              { ref: hrvRef, label: 'HRV', ph: '45', hint: 'ms (opțional)' },
            ].map(f => (
              <div key={f.label} className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{f.label}</label>
                <input ref={f.ref} type="number" placeholder={f.ph}
                  className="font-mono text-xl font-bold text-center py-3 rounded-lg bg-muted border-2 border-transparent focus:border-primary/30 focus:bg-background outline-none transition-all w-full" />
                <span className="text-[10px] text-muted-foreground text-center">{f.hint}</span>
              </div>
            ))}
          </div>
          <Button className="w-full" disabled={saving} onClick={handleSubmit}>
            {saving ? 'Salvăm...' : 'Salvează'}
          </Button>
        </CardContent>
      </Card>
      <button onClick={logout} className="text-xs text-muted-foreground mt-4 hover:text-foreground transition-colors">
        Schimbă utilizatorul
      </button>
    </div>
  );
}
