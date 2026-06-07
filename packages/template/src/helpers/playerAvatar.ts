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
