const LANGUAGE_ALIASES: Record<string, string> = {
  no: 'nb',
  nn: 'nb',
  iw: 'he',
  in: 'id',
};

const TRADITIONAL_REGIONS = ['tw', 'hk', 'mo'];

function normalize(tag: string): string[] {
  return tag.trim().replace(/_/g, '-').toLowerCase().split('-').filter(Boolean);
}

function canonicalize(parts: string[]): string[] {
  const [language, ...rest] = parts;
  return [LANGUAGE_ALIASES[language] ?? language, ...rest];
}

function chineseScript(parts: string[]): string {
  if (parts.includes('hant')) {
    return 'hant';
  }
  if (parts.includes('hans')) {
    return 'hans';
  }
  return parts.some((part) => TRADITIONAL_REGIONS.includes(part))
    ? 'hant'
    : 'hans';
}

export function fallbackTags(tag: string): string[] {
  const original = normalize(tag);
  if (original.length === 0) {
    return [];
  }
  const parts = canonicalize(original);
  const chain: string[] = [original.join('-'), parts.join('-')];
  if (parts[0] === 'zh') {
    chain.push(`zh-${chineseScript(parts)}`);
  } else {
    for (let length = parts.length - 1; length >= 1; length -= 1) {
      chain.push(parts.slice(0, length).join('-'));
    }
  }
  chain.push(parts[0]);
  return Array.from(new Set(chain));
}

function sharedSubtags(candidate: string[], supported: string[]): number {
  return candidate.filter((part) => supported.includes(part)).length;
}

export function resolveLocale(
  candidates: readonly string[],
  supported: readonly string[],
  fallback: string
): string {
  const normalizedSupported = supported.map((tag) => ({
    tag,
    parts: normalize(tag),
  }));

  for (const candidate of candidates) {
    const original = normalize(candidate);
    if (original.length === 0) {
      continue;
    }
    const parts = canonicalize(original);

    for (const tag of fallbackTags(candidate)) {
      const hit = normalizedSupported.find(
        (entry) => entry.parts.join('-') === tag
      );
      if (hit) {
        return hit.tag;
      }
    }

    let best: { tag: string; shared: number; length: number } | undefined;
    for (const entry of normalizedSupported) {
      if (canonicalize(entry.parts)[0] !== parts[0]) {
        continue;
      }
      const shared = sharedSubtags(parts, entry.parts);
      const isBetter =
        !best ||
        shared > best.shared ||
        (shared === best.shared && entry.parts.length < best.length);
      if (isBetter) {
        best = {
          tag: entry.tag,
          shared,
          length: entry.parts.length,
        };
      }
    }
    if (best) {
      return best.tag;
    }
  }

  return fallback;
}
