export function fmtClock(s: number): string {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

const AVATAR_GRADIENTS = [
  'linear-gradient(150deg,#4b5563,#374151)',
  'linear-gradient(150deg,#6b7280,#4b5563)',
  'linear-gradient(150deg,#374151,#1f2937)',
  'linear-gradient(150deg,#52525b,#3f3f46)',
];

export function avatarGradient(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++)
    h = (h * 31 + name.charCodeAt(i)) % AVATAR_GRADIENTS.length;
  return AVATAR_GRADIENTS[h];
}

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
