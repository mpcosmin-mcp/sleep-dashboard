import { useHide, mask } from '@/lib/hide';

export function MVal({ value, color, unit, big }: {
  value: string | number; color: string; unit?: string; big?: boolean;
}) {
  const h = useHide();
  const display = h ? mask(value) : value;
  return (
    <span className={`font-mono font-bold ${big ? 'text-3xl' : 'text-base'}`} style={{ color }}>
      {display}
      {unit && <span className="text-xs font-medium ml-0.5 opacity-50">{unit}</span>}
    </span>
  );
}
