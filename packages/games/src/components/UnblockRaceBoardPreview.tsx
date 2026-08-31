import { ChevronsRight } from 'lucide-react';

const jamCell = (value: number) => `${(value / 6) * 100}%`;

const jamPieceStyle = (
  col: number,
  row: number,
  width: number,
  height: number
) => ({
  left: jamCell(col),
  top: jamCell(row),
  width: jamCell(width),
  height: jamCell(height),
});

const JAM_STATIC_PIECES = [
  { col: 0, row: 0, width: 2, height: 1, color: '#06b6d4' },
  { col: 0, row: 3, width: 1, height: 2, color: '#84cc16' },
  { col: 0, row: 5, width: 3, height: 1, color: '#f97316' },
  { col: 4, row: 4, width: 2, height: 1, color: '#14b8a6' },
];

// Looping preview of the Unblock Race game itself: two rivals slide clear,
// then the theme-coloured hero block escapes through the exit (keyframes
// defined per-app in globals.css, choreographed on a shared 9s clock).
export const UnblockRaceBoardPreview = () => (
  <div
    aria-hidden="true"
    className="relative aspect-square w-full overflow-hidden rounded-2xl"
    style={{
      background: 'rgba(2,8,20,0.85)',
      border: '1px solid rgba(148,163,184,0.16)',
      backgroundImage:
        'linear-gradient(rgba(148,163,184,0.09) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.09) 1px, transparent 1px)',
      backgroundSize: 'calc(100% / 6) calc(100% / 6)',
    }}
  >
    {JAM_STATIC_PIECES.map(({ col, row, width, height, color }) => (
      <div
        key={`${col}-${row}`}
        className="absolute"
        style={jamPieceStyle(col, row, width, height)}
      >
        <div
          className="absolute"
          style={{
            inset: '8%',
            borderRadius: '22%',
            background: color,
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)',
          }}
        />
      </div>
    ))}
    <div className="jam-rival-down absolute" style={jamPieceStyle(3, 0, 1, 3)}>
      <div
        className="absolute"
        style={{
          inset: '8%',
          borderRadius: '22%',
          background: '#f59e0b',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)',
        }}
      />
    </div>
    <div className="jam-rival-up absolute" style={jamPieceStyle(5, 1, 1, 2)}>
      <div
        className="absolute"
        style={{
          inset: '8%',
          borderRadius: '22%',
          background: '#f43f5e',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)',
        }}
      />
    </div>
    <div className="jam-hero absolute" style={jamPieceStyle(0, 2, 2, 1)}>
      <div
        className="absolute"
        style={{
          inset: '8%',
          borderRadius: '22%',
          background: 'var(--theme-primary)',
          boxShadow:
            '0 0 14px var(--theme-primary), inset 0 1px 0 rgba(255,255,255,0.4)',
        }}
      />
    </div>
    <div
      className="absolute right-0 flex items-center justify-end pr-0.5"
      style={{ top: jamCell(2), height: jamCell(1) }}
    >
      <div
        className="absolute right-0 h-full w-[3px]"
        style={{
          background:
            'linear-gradient(180deg, transparent, var(--theme-primary-light), transparent)',
        }}
      />
      <ChevronsRight className="jam-exit-pulse h-4 w-4 text-cyan-300" />
    </div>
  </div>
);

export default UnblockRaceBoardPreview;
