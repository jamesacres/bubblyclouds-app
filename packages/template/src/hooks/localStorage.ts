'use client';

import { useCallback } from 'react';
import { StateType } from '@bubblyclouds-app/types/stateType';

export interface StateResult<T> {
  lastUpdated: number;
  state: T;
}

function useLocalStorage({
  type,
  id,
  prefix = 'sudoku-',
}: {
  type: StateType;
  id?: string;
  prefix?: string;
}) {
  const getStateKey = useCallback(
    (overrideId?: string) => {
      const thisId = overrideId || id;
      if (!thisId) {
        throw Error('id required');
      }
      let key = `${prefix}${thisId}`;
      if (type !== StateType.PUZZLE) {
        key = `${key}-${type}`;
      }
      return key;
    },
    [id, type, prefix]
  );

  const listValues = useCallback(<T>(): (StateResult<T> & {
    sessionId: string;
  })[] => {
    const oneMonthAgo = new Date().getTime() - 32 * 24 * 60 * 60 * 1000;

    if (typeof localStorage === 'undefined') {
      return [];
    }

    return Object.entries(localStorage)
      .filter(([key]) => {
        if (type !== StateType.PUZZLE) {
          return key.startsWith(prefix) && key.endsWith(`-${type}`);
        }
        // For PUZZLE type, match keys that start with prefix and don't end with a type suffix
        return key.startsWith(prefix) && !key.match(/-[A-Z]+$/);
      })
      .map(([key, value]) => {
        try {
          const parsedValue = JSON.parse(value);
          // For PUZZLE type, the sessionId is the full key (minus any type suffix)
          // For other types, extract the base key before the type suffix
          let sessionId = key;
          if (type !== StateType.PUZZLE) {
            sessionId = key.replace(new RegExp(`-${type}$`), '');
          }

          if (
            parsedValue.lastUpdated &&
            parsedValue.lastUpdated <= oneMonthAgo
          ) {
            localStorage.removeItem(key);
            return undefined;
          }
          return { ...parsedValue, sessionId };
        } catch (e) {
          console.error(e);
        }
        return undefined;
      })
      .filter((value) => !!value);
  }, [type, prefix]);

  const getValue = useCallback(
    <T>({
      overrideId,
    }: {
      overrideId?: string;
    } = {}): StateResult<T> | undefined => {
      const savedState = localStorage.getItem(getStateKey(overrideId));
      if (savedState) {
        try {
          return JSON.parse(savedState);
        } catch (e) {
          console.error(e);
        }
      }
      return undefined;
    },
    [getStateKey]
  );

  const saveValue = useCallback(
    <T>(
      state: T,
      { overrideId }: { overrideId?: string } = {}
    ): StateResult<T> => {
      const lastUpdated = new Date().getTime();
      const result = { lastUpdated, state };
      try {
        localStorage.setItem(getStateKey(overrideId), JSON.stringify(result));
      } catch (e) {
        if (e instanceof DOMException && e.name === 'QuotaExceededError') {
          console.error(
            'localStorage quota exceeded, attempting to clear old data'
          );
          try {
            // Remove old puzzle data (older than 3 days)
            let removedOldPuzzles = false;
            const threeDaysAgo = new Date().getTime() - 3 * 24 * 60 * 60 * 1000;
            if (typeof localStorage !== 'undefined') {
              Object.keys(localStorage).forEach((key) => {
                if (key.startsWith(prefix)) {
                  try {
                    const item = localStorage.getItem(key);
                    if (item) {
                      const parsed = JSON.parse(item);
                      if (
                        parsed.lastUpdated &&
                        parsed.lastUpdated < threeDaysAgo
                      ) {
                        console.log('Removing old item:', key);
                        localStorage.removeItem(key);
                        removedOldPuzzles = true;
                      }
                    }
                  } catch {
                    // If we can't parse it, remove it
                    console.log('Removing corrupted item:', key);
                    localStorage.removeItem(key);
                  }
                }
              });
            }

            if (!removedOldPuzzles && typeof localStorage !== 'undefined') {
              // If still not enough space, remove oldest 50% of remaining items
              const items: Array<{ key: string; lastUpdated: number }> = [];
              Object.keys(localStorage).forEach((key) => {
                if (key.startsWith(prefix)) {
                  try {
                    const item = localStorage.getItem(key);
                    if (item) {
                      const parsed = JSON.parse(item);
                      if (parsed.lastUpdated) {
                        items.push({ key, lastUpdated: parsed.lastUpdated });
                      }
                    }
                  } catch {
                    // Ignore
                  }
                }
              });

              if (items.length > 0) {
                items.sort((a, b) => a.lastUpdated - b.lastUpdated);
                const toRemove = Math.ceil(items.length / 2);
                for (let i = 0; i < toRemove; i++) {
                  console.log('Removing item to free space:', items[i].key);
                  localStorage.removeItem(items[i].key);
                }
              }
            }

            // Try saving again after cleanup
            localStorage.setItem(
              getStateKey(overrideId),
              JSON.stringify(result)
            );
          } catch (retryError) {
            console.error(
              'Failed to save to localStorage even after cleanup:',
              retryError
            );
          }
        } else {
          console.error('Error saving to localStorage:', e);
        }
      }
      return result;
    },
    [getStateKey, prefix]
  );

  return { prefix, listValues, getValue, saveValue };
}

export { useLocalStorage };
