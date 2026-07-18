'use client';
import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { UserContext } from '@bubblyclouds-app/auth/providers/AuthProvider';
import { useLocalStorage } from '@bubblyclouds-app/template/hooks/localStorage';
import { useServerStorage } from '@bubblyclouds-app/template/hooks/serverStorage';
import { useParties } from '@bubblyclouds-app/template/hooks/useParties';
import { StateType } from '@bubblyclouds-app/types/stateType';
import { DEFAULT_TAX_BANDS } from '../engine/tax';
import {
  isMonthComplete,
  resolveSharedAssets,
  resolveSharedAssumptions,
} from '../helpers/lww';
import { isValidMonthId } from '../helpers/monthId';
import { HouseholdAssumptions } from '../types/assumptions';
import {
  HouseholdData,
  HouseholdMember,
  HouseholdMonth,
} from '../types/household';
import { MonthId } from '../types/monthId';
import { ProfileData } from '../types/profile';
import { MonthlySnapshotData } from '../types/snapshot';
import { MoneyBagsMonthState, MoneyBagsProfileState } from '../types/state';

export const PROFILE_SESSION_ID = 'profile';

// Fallback identity for logged-out, local-only usage.
export const LOCAL_USER_ID = 'local';

export const DEFAULT_ASSUMPTIONS: HouseholdAssumptions = {
  inflationRatePct: 2.5,
  returnScenarios: { lowerRealPct: 2, centralRealPct: 5, upperRealPct: 7 },
  taxBands: DEFAULT_TAX_BANDS,
  statePensionAnnualPence: 1_197_300, // full new state pension 2025/26: £11,973/yr
  targetSuccessRatePct: 90,
};

export const EMPTY_PROFILE: ProfileData = {
  schemaVersion: 1,
  accounts: [],
  contributions: { monthlyPencePerWrapper: {}, stepChanges: [] },
  overrides: {},
};

interface StoredEntry<Data> {
  updatedAtMs: number;
  data: Data;
}

interface MemberSessions {
  profile?: StoredEntry<ProfileData>;
  months: { [month: MonthId]: StoredEntry<MonthlySnapshotData> };
}

interface RawEntry {
  id: string;
  updatedAtMs: number;
  state: unknown;
}

const EMPTY_MEMBER_SESSIONS: MemberSessions = { months: {} };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const sessionData = (state: unknown): unknown =>
  isRecord(state) ? state.data : undefined;

const isProfileData = (data: unknown): data is ProfileData =>
  isRecord(data) &&
  Array.isArray(data.accounts) &&
  isRecord(data.contributions);

const isMonthlySnapshotData = (data: unknown): data is MonthlySnapshotData =>
  isRecord(data) &&
  Array.isArray(data.accounts) &&
  typeof data.month === 'string';

const stripSessionPrefix = (sessionId: string, app: string): string =>
  sessionId.startsWith(`${app}-`) ? sessionId.slice(app.length + 1) : sessionId;

// Newest-wins merge per session id: local `lastUpdated` vs server `updatedAt`.
const buildMemberSessions = (entries: RawEntry[]): MemberSessions => {
  const newestById = new Map<string, RawEntry>();
  for (const entry of entries) {
    const existing = newestById.get(entry.id);
    if (!existing || entry.updatedAtMs > existing.updatedAtMs) {
      newestById.set(entry.id, entry);
    }
  }
  const sessions: MemberSessions = { months: {} };
  for (const [id, entry] of newestById) {
    const data = sessionData(entry.state);
    if (id === PROFILE_SESSION_ID) {
      if (isProfileData(data)) {
        sessions.profile = { updatedAtMs: entry.updatedAtMs, data };
      }
    } else if (isValidMonthId(id) && isMonthlySnapshotData(data)) {
      sessions.months[id] = { updatedAtMs: entry.updatedAtMs, data };
    }
  }
  return sessions;
};

const toMonthState = (data: MonthlySnapshotData): MoneyBagsMonthState => ({
  answerStack: [],
  initial: {},
  final: {},
  data,
});

const toProfileState = (data: ProfileData): MoneyBagsProfileState => ({
  answerStack: [],
  initial: {},
  final: {},
  data,
});

// Monthly history must never expire server-side (spec Q19); the template
// default of now + 32 days is overridden on every write.
const farFutureExpiry = (): Date => {
  const expiresAt = new Date();
  expiresAt.setFullYear(expiresAt.getFullYear() + 100);
  return expiresAt;
};

export interface MoneyBagsDataContextValue {
  household: HouseholdData;
  ownUserId: string;
  ownProfile?: ProfileData;
  isLoading: boolean;
  isPartnerLoading: boolean;
  refresh: () => Promise<void>;
  saveOwnSnapshot: (month: MonthId, data: MonthlySnapshotData) => Promise<void>;
  saveOwnProfile: (data: ProfileData) => Promise<void>;
  saveSharedAssumptions: (assumptions: HouseholdAssumptions) => Promise<void>;
}

export const MoneyBagsDataContext = createContext<
  MoneyBagsDataContextValue | undefined
>(undefined);

export const MoneyBagsDataProvider = ({
  app,
  apiUrl,
  children,
}: {
  app: string;
  apiUrl: string;
  children: ReactNode;
}) => {
  const context = useContext(UserContext);
  const { user } = context || {};
  const { parties } = useParties();

  const {
    getValue: getLocalValue,
    listValues: listLocalValues,
    saveValue: saveLocalValue,
  } = useLocalStorage({ prefix: `${app}-`, type: StateType.PUZZLE });
  const {
    listValues: listServerValues,
    saveValue: saveServerValue,
    setIdAndType,
  } = useServerStorage({ app, apiUrl, type: StateType.PUZZLE });

  const [ownSessions, setOwnSessions] = useState<MemberSessions>(
    EMPTY_MEMBER_SESSIONS
  );
  const [partnerSessions, setPartnerSessions] = useState<{
    [userId: string]: MemberSessions;
  }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isPartnerLoading, setIsPartnerLoading] = useState(false);

  const ownUserId = user?.sub ?? LOCAL_USER_ID;

  // Own data: local `profile` via getValue (listValues purges >32-day
  // entries, so the profile must be read before any listValues call) +
  // recent months from local listValues, merged newest-wins with the
  // unfiltered server history (never SessionsProvider — it drops >32 days).
  const loadOwn = useCallback(async () => {
    setIsLoading(true);
    const entries: RawEntry[] = [];
    const localProfile = getLocalValue<unknown>({
      overrideId: PROFILE_SESSION_ID,
    });
    if (localProfile) {
      entries.push({
        id: PROFILE_SESSION_ID,
        updatedAtMs: localProfile.lastUpdated,
        state: localProfile.state,
      });
    }
    for (const item of listLocalValues<unknown>()) {
      const id = stripSessionPrefix(item.sessionId, app);
      if (isValidMonthId(id)) {
        entries.push({ id, updatedAtMs: item.lastUpdated, state: item.state });
      }
    }
    if (user) {
      const serverValues = await listServerValues<unknown>();
      for (const item of serverValues ?? []) {
        entries.push({
          id: stripSessionPrefix(item.sessionId, app),
          updatedAtMs: item.updatedAt.getTime(),
          state: item.state,
        });
      }
    }
    setOwnSessions(buildMemberSessions(entries));
    setIsLoading(false);
  }, [app, getLocalValue, listLocalValues, listServerValues, user]);

  // Partner data: first party's non-self members, read directly via
  // listValues({ partyId, userId }).
  const loadPartners = useCallback(async () => {
    const party = parties[0];
    if (!party || !user) {
      setPartnerSessions({});
      return;
    }
    setIsPartnerLoading(true);
    const result: { [userId: string]: MemberSessions } = {};
    for (const member of (party.members ?? []).filter(
      (member) => !member.isUser
    )) {
      const values = await listServerValues<unknown>({
        partyId: party.partyId,
        userId: member.userId,
      });
      result[member.userId] = buildMemberSessions(
        (values ?? []).map((item) => ({
          id: stripSessionPrefix(item.sessionId, app),
          updatedAtMs: item.updatedAt.getTime(),
          state: item.state,
        }))
      );
    }
    setPartnerSessions(result);
    setIsPartnerLoading(false);
  }, [app, listServerValues, parties, user]);

  const loadedOwnFor = useRef<string | undefined>('__none__');
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loadedOwnFor.current === user?.sub) {
        return;
      }
      loadedOwnFor.current = user?.sub;
      loadOwn();
    }, 0);
    return () => clearTimeout(timeout);
  }, [loadOwn, user]);

  const loadedPartnersFor = useRef('__none__');
  useEffect(() => {
    const party = parties[0];
    const key =
      party && user
        ? `${user.sub}:${party.partyId}:${(party.members ?? [])
            .map((member) => member.userId)
            .sort()
            .join(',')}`
        : 'logged-out';
    const timeout = setTimeout(() => {
      if (loadedPartnersFor.current === key) {
        return;
      }
      loadedPartnersFor.current = key;
      loadPartners();
    }, 0);
    return () => clearTimeout(timeout);
  }, [loadPartners, parties, user]);

  const refresh = useCallback(async () => {
    await Promise.all([loadOwn(), loadPartners()]);
  }, [loadOwn, loadPartners]);

  const saveOwnSnapshot = useCallback(
    async (month: MonthId, data: MonthlySnapshotData) => {
      const state = toMonthState(data);
      const local = saveLocalValue(state, { overrideId: month });
      setOwnSessions((previous) => ({
        ...previous,
        months: {
          ...previous.months,
          [month]: { updatedAtMs: local.lastUpdated, data },
        },
      }));
      setIdAndType({ type: StateType.PUZZLE, id: month });
      await saveServerValue(state, { expiresAt: farFutureExpiry() });
    },
    [saveLocalValue, saveServerValue, setIdAndType]
  );

  const saveOwnProfile = useCallback(
    async (data: ProfileData) => {
      const state = toProfileState(data);
      const local = saveLocalValue(state, { overrideId: PROFILE_SESSION_ID });
      setOwnSessions((previous) => ({
        ...previous,
        profile: { updatedAtMs: local.lastUpdated, data },
      }));
      setIdAndType({ type: StateType.PUZZLE, id: PROFILE_SESSION_ID });
      await saveServerValue(state, { expiresAt: farFutureExpiry() });
    },
    [saveLocalValue, saveServerValue, setIdAndType]
  );

  // Household assumptions are LWW across members; editing them only ever
  // writes into your own profile with a fresh updatedAt stamp.
  const saveSharedAssumptions = useCallback(
    async (assumptions: HouseholdAssumptions) => {
      const base = ownSessions.profile?.data ?? EMPTY_PROFILE;
      await saveOwnProfile({
        ...base,
        sharedAssumptions: {
          updatedAt: new Date().toISOString(),
          assumptions,
        },
      });
    },
    [ownSessions, saveOwnProfile]
  );

  const household = useMemo<HouseholdData>(() => {
    const party = parties[0];
    const sessionsByUserId: { [userId: string]: MemberSessions } = {
      ...partnerSessions,
      [ownUserId]: ownSessions,
    };
    const members: HouseholdMember[] =
      party && user
        ? (party.members ?? []).map((member) => ({
            userId: member.userId,
            nickname: member.memberNickname,
            isUser: member.isUser,
            profile: sessionsByUserId[member.userId]?.profile?.data,
          }))
        : [
            {
              userId: ownUserId,
              nickname: user?.given_name || user?.name || 'You',
              isUser: true,
              profile: ownSessions.profile?.data,
            },
          ];
    const memberUserIds = members.map((member) => member.userId);
    const monthIds = new Set<MonthId>();
    for (const userId of memberUserIds) {
      for (const month of Object.keys(sessionsByUserId[userId]?.months ?? {})) {
        monthIds.add(month);
      }
    }
    const orderedMonths = [...monthIds].sort();
    const months: { [month: MonthId]: HouseholdMonth } = {};
    for (const month of orderedMonths) {
      const memberSnapshots: {
        [userId: string]: MonthlySnapshotData | undefined;
      } = {};
      for (const userId of memberUserIds) {
        memberSnapshots[userId] = sessionsByUserId[userId]?.months[month]?.data;
      }
      months[month] = {
        month,
        memberSnapshots,
        effectiveShared: resolveSharedAssets(
          memberUserIds.map((userId) => memberSnapshots[userId])
        ),
        complete: isMonthComplete(memberUserIds, memberSnapshots),
      };
    }
    return {
      partyId: party && user ? party.partyId : undefined,
      members,
      months,
      orderedMonths,
      effectiveAssumptions:
        resolveSharedAssumptions(members.map((member) => member.profile))
          ?.assumptions ?? DEFAULT_ASSUMPTIONS,
    };
  }, [ownSessions, ownUserId, parties, partnerSessions, user]);

  return (
    <MoneyBagsDataContext.Provider
      value={{
        household,
        ownUserId,
        ownProfile: ownSessions.profile?.data,
        isLoading,
        isPartnerLoading,
        refresh,
        saveOwnSnapshot,
        saveOwnProfile,
        saveSharedAssumptions,
      }}
    >
      {children}
    </MoneyBagsDataContext.Provider>
  );
};
