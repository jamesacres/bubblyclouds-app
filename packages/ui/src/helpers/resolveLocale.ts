function normalize(tag: string): string[] {
  return tag.trim().replace(/_/g, '-').toLowerCase().split('-').filter(Boolean);
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
    const parts = normalize(candidate);
    if (parts.length === 0) {
      continue;
    }
    const joined = parts.join('-');

    const exact = normalizedSupported.find(
      (entry) => entry.parts.join('-') === joined
    );
    if (exact) {
      return exact.tag;
    }

    let best: { tag: string; shared: number; length: number } | undefined;
    for (const entry of normalizedSupported) {
      if (entry.parts[0] !== parts[0]) {
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
