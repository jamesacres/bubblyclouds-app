'use client';
import Link from 'next/link';
import {
  FocusEvent,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { ArrowLeft, Check, Users } from 'lucide-react';
import { UserContext } from '@bubblyclouds-app/auth/providers/AuthProvider';
import { LoginContext } from '@bubblyclouds-app/types/loginContext';
import { useParties } from '@bubblyclouds-app/template/hooks/useParties';
import { PartyInviteButton } from '@bubblyclouds-app/template/components/PartyInviteButton';
import { useHousehold } from '@bubblyclouds-app/moneybagsrace/hooks/useHousehold';
import { EMPTY_PROFILE } from '@bubblyclouds-app/moneybagsrace/providers/MoneyBagsDataProvider';
import { currentMonthId } from '@bubblyclouds-app/moneybagsrace/helpers/monthId';
import { AccountManager } from '@bubblyclouds-app/moneybagsrace/components/AccountManager';
import { AssumptionsForm } from '@bubblyclouds-app/moneybagsrace/components/AssumptionsForm';
import { ContributionsForm } from '@bubblyclouds-app/moneybagsrace/components/ContributionsForm';
import { CurrencyInput } from '@bubblyclouds-app/moneybagsrace/components/CurrencyInput';
import { HouseholdAssumptions } from '@bubblyclouds-app/moneybagsrace/types/assumptions';
import { ProfileData } from '@bubblyclouds-app/moneybagsrace/types/profile';
import { APP_CONFIG } from '../../../app.config.js';

const COUPLE_MAX_SIZE = 2;

const sectionClassName =
  'flex flex-col gap-3 rounded-3xl border border-zinc-200/80 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)] dark:border-zinc-700/60 dark:bg-zinc-800/60';

const numberFieldClassName =
  'w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-900 outline-none dark:border-white/10 dark:bg-white/5 dark:text-white';

type SaveState = 'saving' | 'saved';

const SaveStatus = ({ state }: { state: SaveState | undefined }) => {
  if (!state) {
    return null;
  }
  return (
    <span
      role="status"
      className="inline-flex items-center gap-1 self-start text-xs font-medium text-zinc-400 dark:text-white/40"
    >
      {state === 'saving' ? (
        'Saving…'
      ) : (
        <>
          <Check className="h-3.5 w-3.5" />
          Saved
        </>
      )}
    </span>
  );
};

function PartySection() {
  const context = useContext(UserContext);
  const { user, showLoginModal } = context || {};
  const {
    parties,
    saveParty,
    updateParty,
    isSaving,
    memberNickname,
    setMemberNickname,
    partyName,
    setPartyName,
  } = useParties({});
  const party = parties?.[0];

  if (!user) {
    return (
      <button
        onClick={() => showLoginModal?.(undefined, LoginContext.JOIN_TEAM)}
        className="bg-theme-primary cursor-pointer self-start rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all duration-200 active:scale-95"
      >
        Sign in to invite your partner
      </button>
    );
  }

  if (!party) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Create your household to invite your partner. Money Bags Race is built
          for two.
        </p>
        <input
          type="text"
          aria-label="Your nickname"
          placeholder="Your nickname"
          value={memberNickname}
          onChange={(event) => setMemberNickname(event.target.value)}
          className={numberFieldClassName}
        />
        <input
          type="text"
          aria-label="Household name"
          placeholder="Household name"
          value={partyName}
          onChange={(event) => setPartyName(event.target.value)}
          className={numberFieldClassName}
        />
        <button
          onClick={async () => {
            const created = await saveParty({ memberNickname, partyName });
            if (created) {
              await updateParty(created.partyId, {
                maxSize: COUPLE_MAX_SIZE,
              });
            }
          }}
          disabled={isSaving || !memberNickname.trim() || !partyName.trim()}
          className="bg-theme-primary cursor-pointer self-start rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all duration-200 active:scale-95 disabled:opacity-50"
        >
          {isSaving ? 'Creating…' : 'Create household'}
        </button>
      </div>
    );
  }

  const members = party.members ?? [];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-700">
          <Users className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
        </div>
        <h3 className="text-sm font-semibold tracking-tight text-zinc-800 dark:text-zinc-200">
          {party.partyName}
        </h3>
        <span className="ml-auto rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-500 dark:bg-zinc-700 dark:text-zinc-400">
          {members.length} of {COUPLE_MAX_SIZE}
        </span>
      </div>
      <ul className="divide-y divide-zinc-100 dark:divide-zinc-700/40">
        {members.map(({ userId, memberNickname: nickname }) => (
          <li key={userId} className="flex items-center gap-3 py-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-700">
              <span className="text-xs font-bold uppercase text-zinc-600 dark:text-zinc-300">
                {nickname.charAt(0)}
              </span>
            </div>
            <span className="flex-1 text-sm font-medium text-zinc-800 dark:text-zinc-200">
              {nickname}
            </span>
          </li>
        ))}
      </ul>
      {members.length < COUPLE_MAX_SIZE && (
        <PartyInviteButton
          sessionId={`${APP_CONFIG.app}-profile`}
          redirectUri="/"
          partyId={party.partyId}
          partyName={party.partyName}
          app={APP_CONFIG.app}
          appName={APP_CONFIG.appName}
          apiUrl={APP_CONFIG.apiUrl}
          appUrl={APP_CONFIG.appUrl}
        />
      )}
    </div>
  );
}

export default function SettingsPage() {
  const context = useContext(UserContext);
  const { user, showLoginModal } = context || {};
  const {
    household,
    ownUserId,
    ownProfile,
    isLoading,
    saveOwnProfile,
    saveSharedAssumptions,
  } = useHousehold();

  const [profileEdits, setProfileEdits] = useState<ProfileData | undefined>(
    undefined
  );
  const [assumptionsEdits, setAssumptionsEdits] = useState<
    HouseholdAssumptions | undefined
  >(undefined);
  const [profileSaveState, setProfileSaveState] = useState<
    SaveState | undefined
  >(undefined);
  const [assumptionsSaveState, setAssumptionsSaveState] = useState<
    SaveState | undefined
  >(undefined);

  const profile = profileEdits ?? ownProfile ?? EMPTY_PROFILE;
  const assumptions = assumptionsEdits ?? household.effectiveAssumptions;

  const profileEditsRef = useRef(profileEdits);
  const assumptionsEditsRef = useRef(assumptionsEdits);

  useEffect(() => {
    profileEditsRef.current = profileEdits;
  }, [profileEdits]);

  useEffect(() => {
    assumptionsEditsRef.current = assumptionsEdits;
  }, [assumptionsEdits]);

  const accountIdsWithData = new Set<string>();
  for (const month of Object.values(household.months)) {
    for (const snapshotAccount of month.memberSnapshots[ownUserId]?.accounts ??
      []) {
      accountIdsWithData.add(snapshotAccount.accountId);
    }
  }

  const flushProfile = useCallback(async () => {
    const pending = profileEditsRef.current;
    if (pending === undefined) {
      return;
    }
    if (!user) {
      showLoginModal?.(undefined, LoginContext.PUZZLE_ENTRY);
      return;
    }
    setProfileSaveState('saving');
    try {
      await saveOwnProfile(pending);
      setProfileEdits(undefined);
      setProfileSaveState('saved');
    } catch {
      setProfileSaveState(undefined);
    }
  }, [user, showLoginModal, saveOwnProfile]);

  const flushAssumptions = useCallback(async () => {
    const pending = assumptionsEditsRef.current;
    if (pending === undefined) {
      return;
    }
    if (!user) {
      showLoginModal?.(undefined, LoginContext.PUZZLE_ENTRY);
      return;
    }
    setAssumptionsSaveState('saving');
    try {
      await saveSharedAssumptions(pending);
      setAssumptionsEdits(undefined);
      setAssumptionsSaveState('saved');
    } catch {
      setAssumptionsSaveState(undefined);
    }
  }, [user, showLoginModal, saveSharedAssumptions]);

  const editProfile = useCallback((next: ProfileData) => {
    setProfileEdits(next);
    setProfileSaveState(undefined);
  }, []);

  const editAssumptions = useCallback((next: HouseholdAssumptions) => {
    setAssumptionsEdits(next);
    setAssumptionsSaveState(undefined);
  }, []);

  const flushProfileRef = useRef(flushProfile);
  const flushAssumptionsRef = useRef(flushAssumptions);

  useEffect(() => {
    flushProfileRef.current = flushProfile;
    flushAssumptionsRef.current = flushAssumptions;
  }, [flushProfile, flushAssumptions]);

  useEffect(
    () => () => {
      void flushProfileRef.current();
      void flushAssumptionsRef.current();
    },
    []
  );

  const handleSectionBlur = (
    event: FocusEvent<HTMLElement>,
    flush: () => void
  ) => {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      flush();
    }
  };

  const setOverride = (
    key: 'nmpaAgeOverride' | 'statePensionAgeOverride',
    raw: string
  ) => {
    const parsed = Number(raw);
    const value = raw === '' || Number.isNaN(parsed) ? undefined : parsed;
    editProfile({
      ...profile,
      overrides: { ...profile.overrides, [key]: value },
    });
  };

  return (
    <div className="pt-safe min-h-dvh bg-stone-50 pb-32 dark:bg-zinc-900">
      <div className="container mx-auto max-w-2xl px-5">
        <div className="flex flex-col gap-1 pb-6 pt-5">
          <Link
            href="/"
            onClick={() => {
              void flushProfile();
              void flushAssumptions();
            }}
            className="mb-2 inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            <ArrowLeft className="h-4 w-4" />
            Home
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Settings
          </h1>
        </div>

        {isLoading ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading…</p>
        ) : (
          <div className="flex flex-col gap-4">
            <section
              className={sectionClassName}
              aria-label="Accounts"
              onBlur={(event) => handleSectionBlur(event, flushProfile)}
            >
              <h2 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white">
                Accounts
              </h2>
              <AccountManager
                accounts={profile.accounts}
                currentMonth={currentMonthId()}
                accountIdsWithData={accountIdsWithData}
                onChange={(accounts) => editProfile({ ...profile, accounts })}
              />
              <SaveStatus state={profileSaveState} />
            </section>

            <section
              className={sectionClassName}
              aria-label="You"
              onBlur={(event) => handleSectionBlur(event, flushProfile)}
            >
              <h2 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white">
                You
              </h2>
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="date-of-birth"
                  className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-white/40"
                >
                  Date of birth
                </label>
                <input
                  id="date-of-birth"
                  type="date"
                  value={profile.dateOfBirth ?? ''}
                  onChange={(event) =>
                    editProfile({
                      ...profile,
                      dateOfBirth: event.target.value || undefined,
                    })
                  }
                  className={numberFieldClassName}
                />
                <p className="text-xs text-zinc-400 dark:text-white/35">
                  Used only to derive pension and state pension access ages.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="nmpa-override"
                    className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-white/40"
                  >
                    Pension access age override
                  </label>
                  <input
                    id="nmpa-override"
                    type="number"
                    value={profile.overrides.nmpaAgeOverride ?? ''}
                    onChange={(event) =>
                      setOverride('nmpaAgeOverride', event.target.value)
                    }
                    className={numberFieldClassName}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="sp-age-override"
                    className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-white/40"
                  >
                    State pension age override
                  </label>
                  <input
                    id="sp-age-override"
                    type="number"
                    value={profile.overrides.statePensionAgeOverride ?? ''}
                    onChange={(event) =>
                      setOverride('statePensionAgeOverride', event.target.value)
                    }
                    className={numberFieldClassName}
                  />
                </div>
              </div>
              <CurrencyInput
                id="sp-amount-override"
                label="Your state pension (annual override)"
                valuePence={
                  profile.overrides.statePensionAnnualPenceOverride ?? 0
                }
                onChangePence={(pence) =>
                  editProfile({
                    ...profile,
                    overrides: {
                      ...profile.overrides,
                      statePensionAnnualPenceOverride:
                        pence === 0 ? undefined : pence,
                    },
                  })
                }
              />
              <SaveStatus state={profileSaveState} />
            </section>

            <section
              className={sectionClassName}
              aria-label="Contributions"
              onBlur={(event) => handleSectionBlur(event, flushProfile)}
            >
              <h2 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white">
                Contributions
              </h2>
              <ContributionsForm
                plan={profile.contributions}
                currentMonth={currentMonthId()}
                onChange={(contributions) =>
                  editProfile({ ...profile, contributions })
                }
              />
              <SaveStatus state={profileSaveState} />
            </section>

            <section
              className={sectionClassName}
              aria-label="Assumptions"
              onBlur={(event) => handleSectionBlur(event, flushAssumptions)}
            >
              <h2 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white">
                Assumptions
              </h2>
              <p className="text-xs text-zinc-400 dark:text-white/35">
                Shared with your household — the newest save wins.
              </p>
              <AssumptionsForm
                assumptions={assumptions}
                onChange={editAssumptions}
              />
              <SaveStatus state={assumptionsSaveState} />
            </section>

            <section className={sectionClassName} aria-label="Party">
              <h2 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white">
                Party
              </h2>
              <PartySection />
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
