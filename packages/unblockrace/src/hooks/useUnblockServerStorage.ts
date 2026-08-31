'use client';

import { useCallback } from 'react';
import { useServerStorage } from '@bubblyclouds-app/template/hooks/serverStorage';
import {
  UnblockCollectionOfTheMonth,
  UnblockRaceCollectionOfTheMonthResponse,
  UnblockRaceOfTheDayResponse,
  UnblockRaceOfTheDayRun,
} from '../types/serverTypes';
import { StateType } from '@bubblyclouds-app/types/stateType';
import { useFetch } from '@bubblyclouds-app/auth/hooks/useFetch';
import { useOnline } from '@bubblyclouds-app/template/hooks/online';
import { mapPuzzleDto } from '../helpers/mapPuzzleDto';

function useUnblockServerStorage({
  app,
  apiUrl,
  type: initialType,
  id: initialId,
}: {
  app: string;
  apiUrl: string;
  type?: StateType;
  id?: string;
}) {
  const baseStorage = useServerStorage({
    app,
    apiUrl,
    type: initialType,
    id: initialId,
  });
  const { fetch } = useFetch();
  const { isOnline } = useOnline();

  const getUnblockRaceOfTheDay = useCallback(async (): Promise<
    UnblockRaceOfTheDayRun | undefined
  > => {
    if (isOnline && (await baseStorage.isLoggedIn())) {
      try {
        console.info('fetching unblock race of the day');
        const response = await fetch(
          new Request(`${baseStorage.apiUrl}/unblockRace/ofTheDay`)
        );
        if (response.ok) {
          const unblockRaceOfTheDayResponse =
            (await response.json()) as UnblockRaceOfTheDayResponse;
          return {
            runId: unblockRaceOfTheDayResponse.unblockRaceId,
            puzzles: unblockRaceOfTheDayResponse.puzzles.map(mapPuzzleDto),
            createdAt: new Date(unblockRaceOfTheDayResponse.createdAt),
            updatedAt: new Date(unblockRaceOfTheDayResponse.updatedAt),
          };
        }
      } catch (e) {
        console.error(e);
      }
    }
    return undefined;
  }, [baseStorage, fetch, isOnline]);

  const getUnblockRaceCollectionOfTheMonth = useCallback(async (): Promise<
    UnblockCollectionOfTheMonth | undefined
  > => {
    if (isOnline && (await baseStorage.isLoggedIn())) {
      try {
        console.info('fetching unblock race collection of the month');
        const response = await fetch(
          new Request(`${baseStorage.apiUrl}/unblockRace/collectionOfTheMonth`)
        );
        if (response.ok) {
          const collectionOfTheMonthResponse =
            (await response.json()) as UnblockRaceCollectionOfTheMonthResponse;
          return {
            unblockCollectionId:
              collectionOfTheMonthResponse.unblockRaceCollectionId,
            puzzles: collectionOfTheMonthResponse.puzzles.map(mapPuzzleDto),
            createdAt: new Date(collectionOfTheMonthResponse.createdAt),
            updatedAt: new Date(collectionOfTheMonthResponse.updatedAt),
          };
        }
      } catch (e) {
        console.error(e);
      }
    }
    return undefined;
  }, [baseStorage, fetch, isOnline]);

  return {
    ...baseStorage,
    getUnblockRaceOfTheDay,
    getUnblockRaceCollectionOfTheMonth,
  };
}

export { useUnblockServerStorage };
