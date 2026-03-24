const CONFETTI_COLORS = ['#8B5E3C', '#f59e0b', '#16a34a', '#3b82f6', '#ffffff'];

function ConfettiBurst() {
  // Respect reduced motion
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9998 }}>
      {Array.from({ length: 12 }, (_, i) => {
        const dx = Math.round(Math.random() * 80 - 40);
        const rot = Math.round(180 + Math.random() * 360);
        const delay = Math.round((i / 12) * 300);
        return (
          <div key={i} style={{
            position: 'absolute',
            bottom: '60px',
            right: '40px',
            width: '6px',
            height: '6px',
            borderRadius: '1px',
            background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
            animation: `confetti-fall 1.2s ease-out ${delay}ms forwards`,
            '--dx': `${dx}px`,
            '--rot': `${rot}deg`,
          } as React.CSSProperties} />
        );
      })}
    </div>
  );
}

export function Toast({ msg, show, confetti }: { msg: string; show: boolean; confetti?: boolean }) {
  return (
    <>
      {confetti && show && <ConfettiBurst />}
      <div
        role="status"
        aria-live="polite"
        className={`fixed bottom-5 right-5 z-50 px-4 py-2.5 rounded-lg border bg-card shadow-lg font-medium text-sm transition-all duration-300 ${
          show ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
        }`}
      >
        {msg}
      </div>
    </>
  );
}
