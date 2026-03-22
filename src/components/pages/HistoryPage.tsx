import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { type SleepEntry, ssColor, rhrColor, hrvColor, getTier, fmtDate, personColor } from '@/lib/sleep';
import { V } from '@/lib/hide';

export function HistoryPage({ data }: { data: SleepEntry[] }) {
  const [filter, setFilter] = useState('');
  const allNames = [...new Set(data.map(d => d.name))];
  const filtered = filter ? data.filter(d => d.name === filter) : data;
  const sorted = [...filtered].sort((a, b) => b.date.localeCompare(a.date) || b.ss - a.ss);

  if (!data.length) return <div className="text-center text-muted-foreground py-20 text-sm">Nicio înregistrare.</div>;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Arhivă</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Toate înregistrările</p>
      </div>

      <div className="flex items-center gap-2 mb-5 flex-wrap">
        <Tabs value={filter} onValueChange={v => setFilter(v)}>
          <TabsList className="h-8">
            <TabsTrigger value="" className="text-xs px-3 h-7">Toți</TabsTrigger>
            {allNames.map(n => (
              <TabsTrigger key={n} value={n} className="text-xs px-3 h-7">
                <span className="w-1.5 h-1.5 rounded-full mr-1.5 inline-block" style={{ background: personColor(n) }} />
                {n.split(' ')[0]}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <Card className="overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="text-[10px]">Data</TableHead>
              {!filter && <TableHead className="text-[10px]">Nume</TableHead>}
              <TableHead className="text-[10px] text-right">Sleep</TableHead>
              <TableHead className="text-[10px] text-right">RHR</TableHead>
              <TableHead className="text-[10px] text-right">HRV</TableHead>
              <TableHead className="text-[10px] text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((p, i) => {
              const tier = getTier(p.ss);
              return (
                <TableRow key={i}>
                  <TableCell className="font-mono text-xs" style={{ color: 'hsl(28 55% 40%)' }}>{fmtDate(p.date)}</TableCell>
                  {!filter && <TableCell className="text-sm">{p.name}</TableCell>}
                  <TableCell className="text-right font-mono text-xs font-bold" style={{ color: ssColor(p.ss) }}><V>{p.ss}</V></TableCell>
                  <TableCell className="text-right font-mono text-xs" style={{ color: rhrColor(p.rhr) }}><V>{p.rhr}</V></TableCell>
                  <TableCell className="text-right font-mono text-xs" style={{ color: hrvColor(p.hrv) }}>
                    {p.hrv !== null ? <V>{p.hrv}</V> : '—'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="outline" className="text-[10px] font-bold border-0 px-2 py-0.5"
                           style={{ color: tier.color, background: tier.color + '12' }}>
                      {tier.label}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
