'use client';
import { Suspense, useCallback, useContext, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { UserContext } from '@bubblyclouds-app/auth/providers/AuthProvider';
import { useLocalStorage } from '@bubblyclouds-app/template/hooks/localStorage';
import { useServerStorage } from '@bubblyclouds-app/template/hooks/serverStorage';
import { StateType } from '@bubblyclouds-app/types/stateType';
import { LoginContext } from '@bubblyclouds-app/types/loginContext';
import { APP_CONFIG } from '../../../app.config.js';
import { MoneyBagsState } from '../../types/state';
import {
  currentMonthStateId,
  isValidMonthStateId,
} from '../../helpers/monthStateId';

const EMPTY_STATE: MoneyBagsState = {
  answerStack: [],
  initial: {},
  final: {},
  data: {},
};

function StateComponent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const context = useContext(UserContext);
  const { user, showLoginModal } = context || {};

  const monthParam = searchParams.get('month');
  const stateId =
    monthParam && isValidMonthStateId(monthParam)
      ? monthParam
      : currentMonthStateId();

  useEffect(() => {
    if (!monthParam) {
      router.replace(`/state?month=${currentMonthStateId()}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthParam]);

  const { getValue: getLocalValue, saveValue: saveLocalValue } =
    useLocalStorage({
      prefix: `${APP_CONFIG.app}-`,
      id: stateId,
      type: StateType.PUZZLE,
    });
  const { getValue: getServerValue, saveValue: saveServerValue } =
    useServerStorage({
      app: APP_CONFIG.app,
      apiUrl: APP_CONFIG.apiUrl,
      id: stateId,
      type: StateType.PUZZLE,
    });

  const [state, setState] = useState<MoneyBagsState>(EMPTY_STATE);
  const [jsonText, setJsonText] = useState(
    JSON.stringify(EMPTY_STATE.data, null, 2)
  );
  const [jsonError, setJsonError] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | undefined>(undefined);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setIsLoading(true);
      const local = getLocalValue<MoneyBagsState>();
      const server = user ? await getServerValue<MoneyBagsState>() : undefined;

      if (!active) {
        return;
      }

      const localUpdatedAt = local?.lastUpdated
        ? new Date(local.lastUpdated)
        : undefined;
      const serverUpdatedAt = server?.updatedAt;

      const newest =
        serverUpdatedAt && (!localUpdatedAt || serverUpdatedAt > localUpdatedAt)
          ? server?.state
          : local?.state;

      const resolvedState = newest || EMPTY_STATE;
      setState(resolvedState);
      setJsonText(JSON.stringify(resolvedState.data, null, 2));
      setIsLoading(false);
    };

    load();

    return () => {
      active = false;
    };
  }, [getLocalValue, getServerValue, stateId, user]);

  const handleSave = useCallback(async () => {
    if (!user) {
      showLoginModal?.(undefined, LoginContext.PUZZLE_ENTRY);
      return;
    }

    let parsedData: Record<string, unknown>;
    try {
      parsedData = JSON.parse(jsonText);
      setJsonError(undefined);
    } catch (e) {
      setJsonError(e instanceof Error ? e.message : 'Invalid JSON');
      return;
    }

    const nextState: MoneyBagsState = { ...state, data: parsedData };

    setIsSaving(true);
    try {
      saveLocalValue(nextState);
      const saved = await saveServerValue(nextState);
      setState(nextState);
      setSavedAt(saved?.updatedAt || new Date());
    } finally {
      setIsSaving(false);
    }
  }, [jsonText, saveLocalValue, saveServerValue, showLoginModal, state, user]);

  return (
    <div className="pt-safe container mx-auto max-w-2xl px-5 pb-32">
      <div className="flex flex-col gap-1 pb-6 pt-5">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
          {stateId}
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Saved state for this month
        </p>
      </div>

      {isLoading ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading…</p>
      ) : (
        <div className="flex flex-col gap-3">
          <textarea
            className="min-h-[300px] w-full rounded-2xl border border-zinc-200 bg-white p-4 font-mono text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            spellCheck={false}
          />
          {jsonError && <p className="text-sm text-red-500">{jsonError}</p>}
          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-theme-primary cursor-pointer rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all duration-200 active:scale-95 disabled:opacity-50"
            >
              {isSaving ? 'Saving…' : 'Save'}
            </button>
            {savedAt && (
              <span className="text-xs text-zinc-400 dark:text-zinc-500">
                Saved {savedAt.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function StatePage() {
  return (
    <Suspense>
      <StateComponent />
    </Suspense>
  );
}
