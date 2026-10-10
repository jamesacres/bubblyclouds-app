import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const SHARED_ROOTS = [
  'packages/ui',
  'packages/auth',
  'packages/template',
  'packages/games',
];

export const APPS = {
  sudoku: ['packages/sudoku', 'apps/sudoku'],
  unblockrace: ['packages/unblockrace', 'apps/unblockrace'],
};

export function rootsFor(app) {
  if (app) {
    return [...SHARED_ROOTS, ...APPS[app]];
  }
  return [...SHARED_ROOTS, ...Object.values(APPS).flat()];
}

export function appOf(root) {
  return Object.keys(APPS).find((app) => root === `apps/${app}`) ?? null;
}

export function defaultRepoRoot() {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
}

export function localePath(repo, root, tag) {
  return path.join(repo, root, 'src', 'locales', `${tag}.json`);
}
