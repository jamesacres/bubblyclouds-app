import { avatarGradient } from '../../helpers/playerAvatar';

export function PlayerAvatar({
  name,
  muted = false,
}: {
  name: string;
  muted?: boolean;
}) {
  return (
    <div
      className="flex flex-shrink-0 items-center justify-center rounded-full font-bold text-white"
      style={{
        width: 42,
        height: 42,
        fontSize: 17,
        background: avatarGradient(name),
        opacity: muted ? 0.55 : 1,
        boxShadow:
          '0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.25)',
      }}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}
