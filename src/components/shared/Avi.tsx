import { initials, avatarColor } from '@/lib/sleep';

export function Avi({ name, size = 'sm' }: { name: string; size?: 'sm' | 'md' }) {
  const c = avatarColor(name);
  const s = size === 'md' ? 'w-9 h-9 text-xs' : 'w-7 h-7 text-[10px]';
  return (
    <div
      className={`${s} rounded-full flex items-center justify-center font-bold shrink-0`}
      style={{ background: c + '18', color: c }}
    >
      {initials(name)}
    </div>
  );
}
