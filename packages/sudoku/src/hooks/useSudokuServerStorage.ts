'use client';

import { useCallback } from 'react';
import { useServerStorage } from '@sudoku-web/template/hooks/serverStorage';
import {
  SudokuOfTheDay,
  SudokuBookOfTheMonth,
  SudokuOfTheDayResponse,
  SudokuBookOfTheMonthResponse,
} from '../types/serverTypes';
import { Difficulty } from '@sudoku-web/games/types/difficulty';
import { StateType } from '@sudoku-web/types/stateType';
import { useFetch } from '@sudoku-web/auth/hooks/useFetch';
import { useOnline } from '@sudoku-web/template/hooks/online';

function useSudokuServerStorage({
  type: initialType,
  id: initialId,
}: { type?: StateType; id?: string } = {}) {
  const baseStorage = useServerStorage({
    app: 'sudoku',
    type: initialType,
    id: initialId,
  });
  const { fetch } = useFetch();
  const { isOnline } = useOnline();

  const getSudokuOfTheDay = useCallback(
    async (difficulty: Difficulty): Promise<SudokuOfTheDay | undefined> => {
      if (isOnline && (await baseStorage.isLoggedIn())) {
        try {
          console.info('fetching sudoku of the day', difficulty);
          const response = await fetch(
            new Request(
              `${baseStorage.apiUrl}/sudoku/ofTheDay?difficulty=${difficulty}`
            )
          );
          if (response.ok) {
            const sudokuOfTheDayResponse =
              (await response.json()) as SudokuOfTheDayResponse;
            return {
              ...sudokuOfTheDayResponse,
              createdAt: new Date(sudokuOfTheDayResponse.createdAt),
              updatedAt: new Date(sudokuOfTheDayResponse.updatedAt),
            };
          }
        } catch (e) {
          console.error(e);
        }
      }
      return undefined;
    },
    [baseStorage, fetch, isOnline]
  );

  const getSudokuBookOfTheMonth = useCallback(async (): Promise<
    SudokuBookOfTheMonth | undefined
  > => {
    if (isOnline && (await baseStorage.isLoggedIn())) {
      try {
        console.info('fetching sudoku book of the month');
        const response = await fetch(
          new Request(`${baseStorage.apiUrl}/sudoku/bookOfTheMonth`)
        );
        if (response.ok) {
          const sudokuBookOfTheMonthResponse =
            (await response.json()) as SudokuBookOfTheMonthResponse;
          return {
            ...sudokuBookOfTheMonthResponse,
            createdAt: new Date(sudokuBookOfTheMonthResponse.createdAt),
            updatedAt: new Date(sudokuBookOfTheMonthResponse.updatedAt),
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
    getSudokuOfTheDay,
    getSudokuBookOfTheMonth,
  };
}

export { useSudokuServerStorage };
