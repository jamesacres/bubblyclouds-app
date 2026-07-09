function CountdownOverlay({ countdown }: { countdown: number }) {
  // countdown value from server: 4→3→2→1. Display: 3→2→1→GO!
  const isGo = countdown === 1;
  const displayed = countdown - 1; // matches TimerDisplay logic

  const lights = [
    { on: countdown <= 3, color: '#ef4444', glow: 'rgba(239,68,68,0.6)' },
    { on: countdown <= 2, color: '#facc15', glow: 'rgba(250,204,21,0.6)' },
    { on: isGo, color: '#4ade80', glow: 'rgba(74,222,128,0.6)' },
  ];

  return (
    <div
      className="fixed inset-0 z-[120] flex flex-col items-center justify-center gap-8 bg-white/20 dark:bg-[rgba(4,2,15,0.5)]"
      style={{
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      <style>{`
        @keyframes unblock-countdown-pop {
          0% { transform: scale(1.6); opacity: 0; }
          60% { transform: scale(0.95); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
      <div className="text-xs font-extrabold uppercase tracking-[0.2em] text-zinc-600 dark:text-white/50">
        Get ready
      </div>
      <div className="flex gap-4">
        {lights.map((l, i) => (
          <div
            key={i}
            className={`rounded-full transition-all duration-200 ${l.on ? '' : 'bg-black/10 dark:bg-white/[0.07]'}`}
            style={{
              width: 46,
              height: 46,
              background: l.on ? l.color : undefined,
              boxShadow: l.on
                ? `0 0 28px ${l.glow}, inset 0 2px 4px rgba(255,255,255,0.4)`
                : 'inset 0 1px 2px rgba(0,0,0,0.15)',
            }}
          />
        ))}
      </div>
      {isGo ? (
        <div
          className="text-[120px] font-extrabold leading-none"
          style={{
            color: 'var(--theme-primary)',
            textShadow:
              '0 0 40px color-mix(in srgb, var(--theme-primary) 65%, transparent)',
            animation: 'unblock-countdown-pop 300ms ease-out',
          }}
        >
          GO!
        </div>
      ) : (
        <div
          key={displayed}
          className="text-[120px] font-extrabold leading-none text-zinc-800 dark:text-white"
          style={{
            textShadow:
              '0 0 40px color-mix(in srgb, var(--theme-primary) 55%, transparent)',
            animation: 'unblock-countdown-pop 300ms ease-out',
          }}
        >
          {displayed}
        </div>
      )}
    </div>
  );
}

export default CountdownOverlay;
