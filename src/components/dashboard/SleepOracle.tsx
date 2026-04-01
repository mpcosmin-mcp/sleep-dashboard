import { type SleepEntry } from '@/lib/sleep';
import { getOraclePrediction } from '@/lib/oracle';
import { Card, CardContent } from '@/components/ui/card';

export function SleepOracle({ data, user }: { data: SleepEntry[]; user: string }) {
  const prediction = getOraclePrediction(data, user);

  const isLocked = prediction.level === 'locked';
  const levelLabel = prediction.level === 'locked' ? '' : prediction.level === 'basic' ? 'Nivel I' : prediction.level === 'pattern' ? 'Nivel II' : 'Nivel III';

  return (
    <Card className="shadow-sm overflow-hidden">
      <div className="h-1" style={{
        background: isLocked
          ? 'linear-gradient(90deg, #64748b 0%, #94a3b8 100%)'
          : prediction.level === 'basic'
            ? 'linear-gradient(90deg, #7c3aed 0%, #a78bfa 100%)'
            : prediction.level === 'pattern'
              ? 'linear-gradient(90deg, #6d28d9 0%, #8b5cf6 50%, #c084fc 100%)'
              : 'linear-gradient(90deg, #4c1d95 0%, #7c3aed 30%, #c084fc 60%, #f0abfc 100%)',
      }} />
      <CardContent className="py-3 px-4">
        <div className="flex items-start gap-2.5">
          <span className={`text-xl ${isLocked ? 'grayscale opacity-40' : ''}`}>🔮</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-[11px] font-bold" style={{ color: isLocked ? '#94a3b8' : '#7c3aed' }}>Sleep Oracle</span>
              {levelLabel && (
                <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{ color: '#7c3aed', background: '#7c3aed15' }}>
                  {levelLabel}
                </span>
              )}
            </div>
            <p className={`text-[12px] leading-relaxed ${isLocked ? 'text-muted-foreground' : 'text-foreground'}`}
              style={{ fontStyle: isLocked ? 'normal' : 'italic' }}>
              {prediction.text}
            </p>
            {prediction.subtext && (
              <p className="text-[9px] text-muted-foreground mt-1">{prediction.subtext}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
