const CONFETTI_COLORS = ['#8B5E3C', '#f59e0b', '#16a34a', '#3b82f6', '#ffffff'];

function ConfettiParticles() {
  const reducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reducedMotion) return null;
  return (
    <div style={{ position: 'fixed', bottom: '60px', right: '20px', pointerEvents: 'none', zIndex: 9998 }}>
      {Array.from({ length: 12 }, (_, i) => {
        const dx = Math.round(Math.random() * 80 - 40);
        const rot = Math.round(Math.random() * 360 + 180);
        const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
        return (
          <div
            key={i}
            className="confetti-particle"
            style={{
              '--dx': `${dx}px`,
              '--rot': `${rot}deg`,
              background: color,
              animationDelay: `${i * 25}ms`,
            } as React.CSSProperties}
          />
        );
      })}
    </div>
  );
}

export function Toast({ msg, show, confetti: showConfetti }: { msg: string; show: boolean; confetti?: boolean }) {
  return (
    <>
      {showConfetti && show && <ConfettiParticles />}
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
