import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { type SleepEntry, ssColor, rhrColor, hrvColor, getTier, fmtDate, personColor } from '@/lib/sleep';
import { getKudos, saveKudos, getKudosFor } from '@/lib/kudos';
import { Avi } from '@/components/shared/Avi';

export function SnapshotView({ data, filtered, activeDate, user, snapshotUser, onClose, onBack }: {
  data: SleepEntry[]; filtered: SleepEntry[]; activeDate: string; user: string; snapshotUser?: string; onClose: () => void; onBack?: () => void;
}) {
  const [cheerRefresh, setCheerRefresh] = useState(0);
  const me = user;
  const handleCheer = (to: string, emoji: string) => { if (!me) return; saveKudos(me, to, activeDate, emoji); setCheerRefresh(c => c + 1); };

  return (
    <div>
      {/* Back button */}
      <button onClick={() => { onClose(); if (onBack) onBack(); }}
        className="flex items-center gap-1.5 mb-3 text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors">
        <span>←</span> Înapoi la Evoluție
      </button>

      <Card className="shadow-sm border-primary/20">
        <CardContent className="py-4 px-4">
          <div className="text-center mb-3">
            <div className="text-lg font-bold">📊 {fmtDate(activeDate)}</div>
            <div className="text-[10px] text-muted-foreground">
              {snapshotUser ? `${snapshotUser.split(' ')[0]}` : 'Toată echipa'}
            </div>
          </div>
          <div className="space-y-2.5">
            {filtered
              .filter(e => !snapshotUser || e.name === snapshotUser)
              .sort((a, b) => b.ss - a.ss)
              .map((entry, i) => {
                const pc = personColor(entry.name);
                const entryTier = getTier(entry.ss);
                const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉';
                return (
                  <div key={entry.name} className="flex items-center gap-2.5 p-2.5 rounded-lg" style={{ background: pc + '08', borderLeft: `3px solid ${pc}` }}>
                    <span className="text-sm w-5 text-center">{medal}</span>
                    <Avi name={entry.name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] font-bold" style={{ color: pc }}>{entry.name}</div>
                      <div className="text-[9px]" style={{ color: entryTier.color }}>{entryTier.label}</div>
                    </div>
                    <div className="flex gap-3 shrink-0">
                      <div className="text-center">
                        <div className="text-[7px] text-muted-foreground">SS</div>
                        <div className="font-mono text-lg font-bold" style={{ color: ssColor(entry.ss) }}>{entry.ss}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-[7px] text-muted-foreground">RHR</div>
                        <div className="font-mono text-sm font-bold" style={{ color: rhrColor(entry.rhr) }}>{entry.rhr}</div>
                      </div>
                      {entry.hrv != null && (
                        <div className="text-center">
                          <div className="text-[7px] text-muted-foreground">HRV</div>
                          <div className="font-mono text-sm font-bold" style={{ color: hrvColor(entry.hrv) }}>{entry.hrv}</div>
                        </div>
                      )}
                    </div>
                    {/* Like in snapshot */}
                    {entry.name !== me && (() => {
                      const myLike = me ? getKudos(me, entry.name, activeDate) : null;
                      const likes = getKudosFor(entry.name, activeDate);
                      return (
                        <button onClick={() => {
                          if (myLike) { try { localStorage.removeItem(`st_kudos_${activeDate}_${me}_${entry.name}`); } catch {} }
                          else { handleCheer(entry.name, '❤️'); }
                          setCheerRefresh(c => c + 1);
                        }} className="shrink-0 flex items-center gap-0.5 hover:scale-110 transition-all">
                          <span className={`text-base ${myLike ? '' : 'grayscale opacity-25'}`}>❤️</span>
                          {likes.length > 0 && <span className={`text-[10px] font-bold ${myLike ? '' : 'text-muted-foreground'}`} style={myLike ? { color: '#2563eb' } : undefined}>{likes.length}</span>}
                        </button>
                      );
                    })()}
                  </div>
                );
              })}
            {filtered.filter(e => !snapshotUser || e.name === snapshotUser).length === 0 && (
              <div className="text-xs text-muted-foreground text-center py-4">Nicio înregistrare în această zi{snapshotUser ? ` pentru ${snapshotUser.split(' ')[0]}` : ''}</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
