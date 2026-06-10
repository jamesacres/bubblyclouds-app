import { ComponentType } from 'react';
import { BaseServerState } from '../../types/state';

export function PuzzleHeader<ServerState extends BaseServerState>({
  difficulty,
  difficultyBadgeColor,
  title,
  metaLabel,
  initialState,
  CompactSimpleState,
}: {
  difficulty?: string;
  difficultyBadgeColor?: string;
  title?: string;
  metaLabel?: string;
  initialState?: ServerState;
  CompactSimpleState?: ComponentType<{ state: ServerState }>;
}) {
  if (!difficulty && !title && !initialState) return null;

  return (
    <div
      className="flex items-center gap-3.5 rounded-[18px] p-3"
      style={{
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
      }}
    >
      {initialState && CompactSimpleState && (
        <div
          className="pointer-events-none flex-shrink-0 overflow-hidden rounded-lg p-1"
          style={{ width: 84, height: 84, background: 'rgba(0,0,0,0.25)' }}
        >
          <CompactSimpleState state={initialState} />
        </div>
      )}
      <div className="min-w-0 flex-1">
        {metaLabel && (
          <div
            className="mb-1 text-[10.5px] font-extrabold uppercase tracking-widest"
            style={{ color: 'rgba(255,255,255,0.4)' }}
          >
            {metaLabel}
          </div>
        )}
        {title && (
          <div className="mb-1.5 text-lg font-extrabold tracking-tight text-white">
            {title}
          </div>
        )}
        {difficulty && (
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider ${difficultyBadgeColor ?? ''}`}
            >
              {difficulty}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
