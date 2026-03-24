import { useState } from 'react';
import { Card } from '@/components/ui/card';

export function Section({ title, icon, badge, children, defaultOpen = false }: {
  title: string; icon: string; badge?: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card className="mb-3 shadow-sm overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/30 transition-colors">
        <div className="flex items-center gap-2">
          <span className="text-base">{icon}</span>
          <span className="font-bold text-sm">{title}</span>
          {badge}
        </div>
        <span className="text-[10px] text-muted-foreground select-none">{open ? '▲' : '▼'}</span>
      </button>
      {open && <div className="px-4 pb-3 border-t">{children}</div>}
    </Card>
  );
}
