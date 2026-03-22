export function Toast({ msg, show }: { msg: string; show: boolean }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-5 right-5 z-50 px-4 py-2.5 rounded-lg border bg-card shadow-lg font-medium text-sm transition-all duration-300 ${
        show ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
      }`}
    >
      {msg}
    </div>
  );
}
