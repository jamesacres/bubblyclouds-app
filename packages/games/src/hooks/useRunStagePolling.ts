import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Parties,
  Party,
  ServerStateNotFoundResult,
  ServerStateResult,
  Session,
} from '@bubblyclouds-app/types/serverTypes';

// Keeps every OTHER stage's opponent sessions fresh for a chained multi-stage
// run — not just the current stage's — so an end-of-run leaderboard can show
// each player's result per stage and their running total. Genericized over
// the game's own server state (State); the current stage's own session
// polling stays in the caller, which already owns that via its own
// getValue/saveValue.
function useRunStagePolling<State extends { completed?: unknown }>({
  app,
  stageId,
  runStageIdsKey,
  user,
  isDocumentVisible,
  isPaused,
  showLobby,
  parties,
  getServerValue,
  patchFriendSessions,
}: {
  app: string;
  // The current stage's own id, excluded from the other-stage fetch set.
  stageId: string;
  // Stable comma-joined key of every stage id in the run, current stage
  // included — callers passing a fresh array each render should memoise this
  // themselves so it doesn't retrigger the end-of-stage fetch every render.
  runStageIdsKey: string;
  user: unknown;
  isDocumentVisible: boolean;
  isPaused: boolean;
  showLobby: boolean;
  // Every party the user belongs to, account-level (not scoped to this run)
  // — only used to bound which friends are worth polling for.
  parties: Party[];
  getServerValue: <T>(options?: {
    id?: string;
  }) => Promise<
    ServerStateResult<T> | ServerStateNotFoundResult<T> | undefined
  >;
  // Write-through into the caller's own friend-sessions cache; read via a
  // ref internally so a caller whose function identity changes on every
  // write (e.g. a provider that re-derives it from its own state) doesn't
  // retrigger the fetch loop.
  patchFriendSessions: (
    sessionKeyPrefix: string,
    userSessions: { [userId: string]: Session<State> }
  ) => void;
}): {
  runStageParties: { [stageId: string]: Parties<Session<State>> };
  setStageParties: (
    stageId: string,
    stageParties: Parties<Session<State>>
  ) => void;
  refreshSessionParties: () => Promise<
    ServerStateResult<State> | ServerStateNotFoundResult<State> | undefined
  >;
  isPolling: boolean;
} {
  const patchFriendSessionsRef = useRef(patchFriendSessions);
  patchFriendSessionsRef.current = patchFriendSessions;

  // Parties per stage of the whole run, keyed by stage id. Accumulates
  // across stage changes, so a run leaderboard can show every player's time
  // on every stage.
  const [runStageParties, setRunStagePartiesLocal] = useState<{
    [stageId: string]: Parties<Session<State>>;
  }>({});
  const setStageParties = useCallback(
    (stageId: string, stageParties: Parties<Session<State>>) => {
      setRunStagePartiesLocal((prev) => ({ ...prev, [stageId]: stageParties }));
      const partySessions = Object.values(stageParties || {});
      const userSessions: { [userId: string]: Session<State> } = {};
      for (const partySession of partySessions) {
        if (partySession?.memberSessions) {
          Object.assign(userSessions, partySession.memberSessions);
        }
      }
      // patchFriendSessions is read via a ref, not as a dependency: its
      // identity can change with the caller's own re-derivation of it —
      // depending on it directly would make setStageParties (and everything
      // downstream, including fetchOtherStageParties) unstable across its
      // own writes.
      patchFriendSessionsRef.current(`${app}-${stageId}`, userSessions);
    },
    [app]
  );

  // Reference to runStageParties to read inside fetchOtherStageParties
  // without that callback's identity changing every time a fetch writes its
  // own result back via setStageParties.
  const runStagePartiesRef = useRef(runStageParties);
  runStagePartiesRef.current = runStageParties;

  // All of the user's friends across every party — this is account-level,
  // not scoped to this run, so it includes people who have never touched
  // this puzzle at all. Only used to bound stage1FriendIds below; polling
  // decisions must never key off this directly, or a user with any friends
  // ends up polling every other stage forever even when none of those
  // friends have ever joined this race.
  const knownFriendIds = useCallback(
    (): Set<string> =>
      new Set(
        parties.flatMap((party) =>
          party.members.filter((m) => !m.isUser).map((m) => m.userId)
        )
      ),
    [parties]
  );

  // Which known friends have actually started this run, i.e. have a session
  // on stage 1 — the run's first stage id, always the first entry of
  // runStageIdsKey when a multi-stage run is passed. A friend who's in the
  // party list but never opened this race shouldn't keep other-stage polling
  // alive. `stage1Parties` is passed in explicitly (rather than read from the
  // ref) so a caller that just fetched stage 1 itself can pass that fresh
  // response straight through without waiting on a render for the ref to
  // catch up. Returns undefined when stage 1's own party data isn't
  // available at all (we don't know either way yet), which callers treat as
  // "poll once to find out."
  const stage1Id = runStageIdsKey ? runStageIdsKey.split(',')[0] : undefined;
  const stage1FriendIdsFrom = useCallback(
    (
      stage1Parties: Parties<Session<State>> | undefined
    ): Set<string> | undefined => {
      if (!stage1Id) {
        return new Set();
      }
      if (!stage1Parties) {
        return undefined;
      }
      const friendIds = knownFriendIds();
      const stage1MemberIds = new Set(
        Object.values(stage1Parties).flatMap((party) =>
          Object.keys(party?.memberSessions || {})
        )
      );
      return new Set([...friendIds].filter((id) => stage1MemberIds.has(id)));
    },
    [stage1Id, knownFriendIds]
  );
  // A confirmed-empty stage 1 fetch (server responded, zero parties there)
  // never gets written into runStageParties — an empty result there would
  // otherwise clobber later, richer data (see fetchOneStageParties) — so
  // that "we checked, nobody's here" answer has nowhere else to live across
  // renders. This ref is the only place it's remembered; cleared the moment
  // any fetch (forced or not) finds a friend there instead.
  const stage1CheckedEmptyRef = useRef(false);
  const stage1FriendIds = useCallback((): Set<string> | undefined => {
    const stage1Parties = stage1Id
      ? runStagePartiesRef.current[stage1Id]
      : undefined;
    if (!stage1Parties && stage1CheckedEmptyRef.current) {
      return new Set();
    }
    return stage1FriendIdsFrom(stage1Parties);
  }, [stage1FriendIdsFrom, stage1Id]);

  // A stage still needs (re)fetching if some friend of interest either has
  // no session there yet, or has one that isn't completed — that friend
  // might finish at any time, so the stage stays a candidate until every one
  // of them reads as completed there. A stage with no data at all is always
  // unresolved. `friendIds` is passed in explicitly by the caller, which has
  // already resolved whether that's stage1FriendIds (once stage 1's state is
  // known — narrowed to friends who actually started this run, stopping
  // polling altogether once that set is empty) or the account's whole
  // friend list (the original bootstrap-everything behaviour, used only
  // while stage 1's own state is still completely unknown).
  const unresolvedStageIds = useCallback(
    (stageIds: string[], friendIds: Set<string>): string[] => {
      if (!friendIds.size) {
        return [];
      }
      return stageIds.filter((stageId) => {
        const stageParties = runStagePartiesRef.current[stageId];
        if (!stageParties) {
          return true;
        }
        const knownSessions = new Map(
          Object.values(stageParties).flatMap((party) =>
            Object.entries(party?.memberSessions || {})
          )
        );
        return [...friendIds].some((memberId) => {
          const session = knownSessions.get(memberId);
          return !session || !session.state.completed;
        });
      });
    },
    []
  );

  // Every other stage id in the run, current stage excluded.
  const otherStageIds = useCallback((): string[] => {
    const stageIds = runStageIdsKey ? runStageIdsKey.split(',') : [];
    return stageIds.filter((id) => id !== stageId);
  }, [runStageIdsKey, stageId]);

  const fetchOneStageParties = useCallback(
    async (
      otherStageId: string
    ): Promise<Parties<Session<State>> | undefined> => {
      const serverValue = await getServerValue<State>({ id: otherStageId });
      // A non-empty result is persisted (an empty one would otherwise
      // clobber previously-cached richer data with nothing, e.g. after a
      // stale/partial response). Either way, the raw parties object — even
      // genuinely empty — is still returned to the caller: stage1FriendIdsFrom
      // needs to tell "confirmed nobody's here" (an empty object) apart from
      // "we don't actually know" (no parties field returned at all).
      if (serverValue?.parties && Object.keys(serverValue.parties).length) {
        setStageParties(otherStageId, serverValue.parties);
      }
      return serverValue?.parties;
    },
    [getServerValue, setStageParties]
  );

  // Other-stage refresh: a direct per-stage GET works for every other stage,
  // whether we've already played it (our own session row exists there) or
  // never started it (the server 404s but still includes party member
  // sessions in the response body) — a single request scoped to that stage's
  // own party data. Only re-fetches stages still unresolved (some known
  // friend hasn't completed it there yet); once every known friend has
  // finished a stage, it drops out and is never GET again.
  //
  // Whether any friend has started stage 1 gates everything else, so it's
  // resolved first, on its own: if it comes back with no friend on it,
  // there's nothing worth checking any other stage for, and the whole call
  // is done in one request. The freshly-fetched stage 1 response is passed
  // straight into stage1FriendIdsFrom rather than read back off the ref
  // (which only updates on the next render, after this async function has
  // already moved on) so the very same call that learns "nobody's here" also
  // skips fetching everything else.
  //
  // Once nobody's been found on stage 1, the periodic poll below stops
  // re-checking it (that's the whole point — no more polling for a run
  // nobody's joined) but a friend can start stage 1 at literally any moment,
  // so it can't just be forgotten forever either: forceCheckStage1 makes
  // this call re-check stage 1 regardless of that cached "empty" answer. The
  // manual refresh always passes true, so refreshing always has a chance to
  // notice a friend who just joined. Once stage 1 shows a friend, it flows
  // into the normal unresolvedStageIds tracking below and drops out again on
  // its own once everyone there is done — this flag only ever re-opens the
  // "is anyone here at all" question, never overrides an already-resolved
  // stage.
  const fetchOtherStageParties = useCallback(
    async (forceCheckStage1 = false) => {
      const targets = otherStageIds();
      let stage1Friends = stage1FriendIds();
      const stage1NeedsCheck =
        stage1Id &&
        targets.includes(stage1Id) &&
        (stage1Friends === undefined ||
          (forceCheckStage1 && stage1Friends.size === 0));
      if (stage1NeedsCheck) {
        const stage1Parties = await fetchOneStageParties(stage1Id);
        stage1Friends = stage1FriendIdsFrom(stage1Parties);
        stage1CheckedEmptyRef.current =
          stage1Parties !== undefined && stage1Friends?.size === 0;
      }
      const friendIds = stage1Friends ?? knownFriendIds();
      // Only skip stage 1 in the batch below when it was just fetched fresh
      // above — otherwise it's already-known but unhandled this call, and
      // must still flow through unresolvedStageIds like any other stage so
      // it keeps getting polled until it's actually resolved.
      const remaining = stage1NeedsCheck
        ? targets.filter((otherId) => otherId !== stage1Id)
        : targets;
      const stageIds = unresolvedStageIds(remaining, friendIds);
      await Promise.all(stageIds.map(fetchOneStageParties));
    },
    [
      otherStageIds,
      unresolvedStageIds,
      stage1FriendIds,
      stage1FriendIdsFrom,
      stage1Id,
      knownFriendIds,
      fetchOneStageParties,
    ]
  );

  // Backfill every unresolved other stage once on mount/stage-change (covers
  // a friend who was already ahead of or behind us before we ever opened
  // this run) and then keep it periodically fresh for as long as the caller
  // considers itself the visible screen (showLobby false) — while the Lobby
  // is open instead, its own poll covers the same ground, so this would
  // otherwise be a redundant second poll running at the same time.
  useEffect(() => {
    if (
      !user ||
      !runStageIdsKey ||
      !isDocumentVisible ||
      isPaused ||
      showLobby
    ) {
      return;
    }
    let active = true;
    fetchOtherStageParties();
    const intervalId = setInterval(() => {
      if (active) {
        fetchOtherStageParties();
      }
    }, 30000);
    return () => {
      active = false;
      clearInterval(intervalId);
    };
  }, [
    user,
    runStageIdsKey,
    isDocumentVisible,
    isPaused,
    showLobby,
    fetchOtherStageParties,
  ]);

  const [isPolling, setIsPolling] = useState(false);
  // Refreshes the current stage's own session alongside the whole run's
  // other stages — called both by a manual refresh action and by a caller's
  // own periodic poll while a lobby/friends view is open, taking over from
  // the interval above (which stops polling once showLobby is true, to avoid
  // the two overlapping). forceCheckStage1: this is also what a manual
  // refresh and any lobby-open poll run on, so both always get a chance to
  // notice a friend who just started stage 1 even after the periodic poll
  // (which never forces this) had written it off.
  const refreshSessionParties = useCallback(async () => {
    setIsPolling(true);
    try {
      const [serverValue] = await Promise.all([
        getServerValue<State>(),
        fetchOtherStageParties(true),
      ]);
      return serverValue;
    } finally {
      setIsPolling(false);
    }
  }, [getServerValue, fetchOtherStageParties]);

  return {
    runStageParties,
    setStageParties,
    refreshSessionParties,
    isPolling,
  };
}

export { useRunStagePolling };
