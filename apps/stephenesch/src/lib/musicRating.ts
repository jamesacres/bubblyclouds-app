export interface MusicRatingData {
  key: string;
  title: string;
  release_year: number;
  rating: number;
  rating_date: string;
  artist: string;
}

export function extractMusicRatingData(
  content: string
): MusicRatingData | null {
  const match = content.match(/export\s+const\s+data\s*=\s*({[^}]*})/);
  if (!match) {
    return null;
  }

  try {
    const jsonStr = match[1]
      .replace(/'/g, '"')
      .replace(/^\s+(\w+)\s*:/gm, '"$1":')
      .replace(/,\s*}/g, '}');
    const dataObj = JSON.parse(jsonStr);
    return dataObj as MusicRatingData;
  } catch {
    return null;
  }
}

export function stripMusicRatingExport(content: string): string {
  let cleaned = content.replace(
    /^export\s+const\s+data\s*=\s*{[^}]*};?\n*/m,
    ''
  );
  cleaned = cleaned.replace(/<MusicRating\s+data=\{data\}\s*\/>\n*/m, '');
  return cleaned;
}

export function isMusicRatingData(data: unknown): data is MusicRatingData {
  if (typeof data !== 'object' || data === null) {
    return false;
  }
  const obj = data as Record<string, unknown>;
  return (
    typeof obj.key === 'string' &&
    typeof obj.title === 'string' &&
    typeof obj.release_year === 'number' &&
    typeof obj.rating === 'number' &&
    typeof obj.rating_date === 'string' &&
    typeof obj.artist === 'string'
  );
}
