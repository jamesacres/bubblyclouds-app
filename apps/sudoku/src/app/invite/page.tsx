'use client';
import { useSudokuServerStorage } from '@sudoku-web/sudoku/hooks/useSudokuServerStorage';
import {
  UserContext,
  UserContextInterface,
} from '@sudoku-web/auth/providers/AuthProvider';
import { RevenueCatContext } from '@sudoku-web/template/providers/RevenueCatProvider';
import { SubscriptionContext } from '@sudoku-web/types/subscriptionContext';
import { PremiumFeatures } from '@sudoku-web/template/components/PremiumFeatures';
import { PREMIUM_FEATURES } from '../../config/premiumFeatures';
import { APP_CONFIG } from '../../../app.config.js';
import {
  PublicInvite,
  EntitlementDuration,
} from '@sudoku-web/types/serverTypes';
import { useParties } from '@sudoku-web/template/hooks/useParties';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useContext, useEffect, useState } from 'react';
import { Loader, Users, Star } from 'react-feather';
import Image from 'next/image';

function InviteComponent() {
  const searchParams = useSearchParams();
  const inviteId = searchParams.get('inviteId');

  const router = useRouter();
  const context = useContext(UserContext) as UserContextInterface | undefined;
  const { isLoggingIn, user, loginRedirect } = context || {};
  const { isSubscribed, subscribeModal, refreshEntitlements } =
    useContext(RevenueCatContext) || {};
  const { getPublicInvite, createMember } = useSudokuServerStorage({
    app: APP_CONFIG.app,
    apiUrl: APP_CONFIG.apiUrl,
  });
  const {
    parties: userParties,
    isLoading: partiesLoading,
    refreshParties,
  } = useParties({});
  const [inviteLoading, setInviteLoading] = useState(!!inviteId);
  const [publicInvite, setPublicInvite] = useState<PublicInvite | undefined>(
    undefined
  );
  const name = user ? user?.given_name || user?.name : '';
  const [memberNickname, setMemberNickname] = useState(name || '');
  const [isJoining, setIsJoining] = useState(false);

  // Helper function to get entitlement duration text
  const getEntitlementText = useCallback(
    (entitlementDuration: EntitlementDuration) => {
      switch (entitlementDuration) {
        case EntitlementDuration.ONE_MONTH:
          return 'one month';
        case EntitlementDuration.ONE_YEAR:
          return 'one year';
        case EntitlementDuration.LIFETIME:
          return 'lifetime';
        default:
          return 'premium';
      }
    },
    []
  );

  // Check if user will get entitlement and should show premium benefits
  const shouldShowPremiumBenefits = useCallback(() => {
    if (!publicInvite || isSubscribed) return false;
    return !!publicInvite.entitlementDuration;
  }, [publicInvite, isSubscribed]);

  const getEntitlementDuration = useCallback(() => {
    if (!publicInvite) return undefined;
    return publicInvite.entitlementDuration;
  }, [publicInvite]);

  // Combined loading state - wait for both invite and parties
  const isLoading = inviteLoading || partiesLoading;

  const redirect = useCallback(
    (redirectUri: string | undefined) => {
      let uri =
        redirectUri &&
        new RegExp('^/puzzle\\?initial=[1-9.]+&final=[1-9]+').test(redirectUri)
          ? redirectUri
          : '/';

      // If redirecting to a puzzle from an invite, don't show racing prompt
      if (uri !== '/' && uri.includes('/puzzle?')) {
        uri += '&showRacingPrompt=false';
      }

      console.info('redirect', uri);
      // Scroll to top before redirecting
      window.scrollTo({ top: 0, behavior: 'smooth' });
      router.replace(uri);
    },
    [router]
  );

  const isAlreadyAMember = useCallback(
    (partyId: string) => {
      // Use the already loaded parties
      const party = userParties.find((party) => party.partyId === partyId);
      return !!party;
    },
    [userParties]
  );

  const checkIfMemberAndRedirect = useCallback(
    (publicInvite: PublicInvite) => {
      const partyId = publicInvite.resourceId.replace('party-', '');
      if (isAlreadyAMember(partyId)) {
        // They're a member! redirect to the game
        console.info('already a member, redirect', publicInvite);
        redirect(publicInvite?.redirectUri);
        return true;
      }
      return false;
    },
    [isAlreadyAMember, redirect]
  );

  // Load invite data (only after parties are loaded to ensure membership check works)
  useEffect(() => {
    console.info('invite page loading..');
    let active = true;

    // Don't proceed until parties are loaded
    if (partiesLoading) return;

    if (inviteId && !publicInvite) {
      const serverPromise = async () => {
        const publicInvite = await getPublicInvite(inviteId);
        if (active && publicInvite) {
          // Check if they are already a member, and redirect if so
          if (!checkIfMemberAndRedirect(publicInvite)) {
            // Otherwise, show invite page
            setPublicInvite(publicInvite);
            setInviteLoading(false);
          }
        }
        if (active && !publicInvite) {
          setInviteLoading(false);
        }
      };
      serverPromise();
    }

    return () => {
      active = false;
    };
  }, [
    getPublicInvite,
    inviteId,
    publicInvite,
    checkIfMemberAndRedirect,
    partiesLoading,
  ]);

  const performJoinParty = async () => {
    try {
      if (!isJoining && inviteId && publicInvite) {
        setIsJoining(true);
        const member = await createMember({
          memberNickname,
          inviteId,
        });
        if (!member) {
          // Invite expired while we were joining, likely max party size
          setPublicInvite(undefined);
          setIsJoining(false);
          setInviteLoading(false);
          return;
        }

        // Extract party ID from invite resource ID
        const partyId = publicInvite.resourceId.replace('party-', '');

        // Retry logic to verify party membership
        const maxRetries = 10;
        const retryDelay = 500; // 500ms
        let retryCount = 0;

        while (retryCount < maxRetries) {
          const refreshedParties = await refreshParties();

          // Check if user is now a member of the party
          const isNowMember = refreshedParties?.some(
            (party) =>
              party.partyId === partyId &&
              party.members &&
              party.members.some((member) => member.isUser)
          );

          if (isNowMember) {
            // Success! User is now a member
            // Refresh entitlements to check for any new premium benefits
            if (refreshEntitlements) {
              await refreshEntitlements().catch((e) => {
                console.error(e);
              });
            }
            // Then redirect
            redirect(publicInvite.redirectUri);
            return;
          }

          retryCount++;
          if (retryCount < maxRetries) {
            // Wait before retrying
            await new Promise((resolve) => setTimeout(resolve, retryDelay));
          }
        }

        // If we get here, max retries reached without finding membership
        console.warn('Failed to verify party membership after joining');
        redirect(publicInvite.redirectUri);
      }
    } catch (e) {
      console.error(e);
      setIsJoining(false);
    }
  };

  const joinParty = () => {
    // Check if user already has parties and is not subscribed and no entitlement will be granted
    if (
      userParties.length > 0 &&
      !isSubscribed &&
      !publicInvite?.entitlementDuration
    ) {
      subscribeModal?.showModalIfRequired(
        performJoinParty,
        () => {},
        SubscriptionContext.MULTIPLE_PARTIES
      );
    } else {
      performJoinParty();
    }
  };

  return (
    <div className="pt-safe min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="flex min-h-screen items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {isLoading && !publicInvite ? (
            <div className="text-center">
              <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-white/80 shadow-xl backdrop-blur-lg dark:bg-gray-800/80">
                <Loader className="h-8 w-8 animate-spin text-blue-600" />
              </div>
              <p className="text-lg font-medium text-gray-600 dark:text-gray-300">
                Loading invitation...
              </p>
            </div>
          ) : (
            <>
              {publicInvite ? (
                <div className="rounded-3xl bg-white/80 p-8 shadow-2xl backdrop-blur-xl dark:bg-gray-800/80">
                  {/* Header with app icon */}
                  <div className="mb-8 text-center">
                    <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
                      <Image
                        src="/icons/icon-512.webp"
                        alt="Sudoku Icon"
                        width={48}
                        height={48}
                        className="rounded-xl"
                      />
                    </div>
                    <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white">
                      👋 Hi{name ? ` ${name}` : ''}!
                    </h1>
                    <div className="inline-flex items-center rounded-full bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-lg">
                      <Star className="mr-2 h-4 w-4" />
                      You&apos;re Invited!
                      <Star className="ml-2 h-4 w-4" />
                    </div>
                  </div>
                  {/* Invitation content */}
                  <div className="mb-8 text-center">
                    <p className="mb-4 text-lg text-gray-700 dark:text-gray-300">
                      Join the racing team{' '}
                      <span className="inline-flex items-center rounded-full bg-gradient-to-r from-blue-100 to-purple-100 px-3 py-1 text-lg font-bold text-blue-800 dark:from-blue-900/50 dark:to-purple-900/50 dark:text-blue-200">
                        <Users className="mr-2 h-5 w-5" />
                        {publicInvite.description}
                      </span>
                    </p>
                    <p className="mb-4 text-gray-600 dark:text-gray-400">
                      Solve Sudoku puzzles together and see each other&apos;s
                      progress in real-time!
                    </p>
                    <div className="rounded-2xl bg-gradient-to-r from-blue-50 to-purple-50 p-4 dark:from-blue-900/20 dark:to-purple-900/20">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        💡 <strong>Pro tip:</strong> All future puzzles you play
                        will be shared with your team members for friendly
                        competition!
                      </p>
                    </div>
                  </div>
                  {/* Join form or sign in */}
                  {user ? (
                    <div className="space-y-6">
                      <div>
                        <label
                          className="mb-3 block text-sm font-semibold text-gray-700 dark:text-gray-300"
                          htmlFor="memberNickname"
                        >
                          What does your racing team call you?
                        </label>
                        <input
                          className={`${
                            isJoining ? 'cursor-wait' : ''
                          } w-full rounded-2xl border-2 border-gray-200 bg-white/50 px-4 py-4 text-gray-900 backdrop-blur-sm transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 focus:outline-none disabled:bg-gray-100 dark:border-gray-600 dark:bg-gray-700/50 dark:text-white dark:focus:border-blue-400`}
                          disabled={isJoining}
                          id="memberNickname"
                          type="text"
                          placeholder="Enter your nickname"
                          value={memberNickname}
                          onChange={(e) => setMemberNickname(e.target.value)}
                        />
                      </div>
                      <button
                        disabled={isJoining || !memberNickname.trim()}
                        onClick={joinParty}
                        className={`${
                          isJoining ? 'cursor-wait' : ''
                        } relative w-full transform rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-4 font-bold text-white shadow-lg transition-all hover:scale-105 hover:from-blue-600 hover:to-purple-700 hover:shadow-xl active:scale-95 disabled:from-gray-400 disabled:to-gray-500 disabled:hover:scale-100`}
                      >
                        {isJoining ? (
                          <div className="flex items-center justify-center">
                            <Loader className="mr-2 h-5 w-5 animate-spin" />
                            Joining Team...
                          </div>
                        ) : (
                          <div className="flex cursor-pointer items-center justify-center">
                            <Users className="mr-2 h-5 w-5" />
                            Join the Fun! 🎉
                          </div>
                        )}
                        {userParties.length > 0 && !isSubscribed && (
                          <span className="absolute -top-1 -right-1 z-10 inline-flex h-4 w-4 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-[8px] font-semibold text-white shadow-lg">
                            ✨
                          </span>
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <button
                        disabled={isLoggingIn}
                        onClick={() =>
                          loginRedirect &&
                          loginRedirect({ userInitiated: true })
                        }
                        className={`${
                          isLoggingIn ? 'cursor-wait' : ''
                        } w-full transform rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-4 font-bold text-white shadow-lg transition-all hover:scale-105 hover:from-blue-600 hover:to-purple-700 hover:shadow-xl active:scale-95 disabled:from-gray-400 disabled:to-gray-500`}
                      >
                        {isLoggingIn ? (
                          <div className="flex items-center justify-center">
                            <Loader className="mr-2 h-5 w-5 animate-spin" />
                            Signing in...
                          </div>
                        ) : (
                          <div className="flex cursor-pointer items-center justify-center">
                            <Star className="mr-2 h-5 w-5" />
                            Sign in to Continue
                          </div>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Premium Benefits Section - only show if user will get entitlement and isn't already subscribed */}
                  {shouldShowPremiumBenefits() && (
                    <div className="mt-6 rounded-2xl bg-gradient-to-r from-blue-50 to-purple-50 p-6 dark:from-blue-900/20 dark:to-purple-900/20">
                      <div className="mb-4 text-center">
                        <div className="mb-2 flex items-center justify-center">
                          <Star className="mr-2 h-5 w-5 text-blue-600" />
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                            🎉 Bonus: Get{' '}
                            {getEntitlementText(getEntitlementDuration()!)} of
                            Sudoku Plus!
                          </h3>
                          <Star className="ml-2 h-5 w-5 text-blue-600" />
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          By joining this racing team, you&apos;ll unlock
                          premium features absolutely free!
                        </p>
                      </div>

                      <PremiumFeatures
                        features={PREMIUM_FEATURES}
                        title=""
                        subtitle=""
                        compact={true}
                        className="mb-4"
                      />

                      <div className="text-center">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          💡 Your premium access will activate automatically
                          after joining
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-3xl bg-white/80 p-8 text-center shadow-2xl backdrop-blur-xl dark:bg-gray-800/80">
                  <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-red-100 dark:bg-red-900/20">
                    <span className="text-3xl">⏰</span>
                  </div>
                  <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
                    Invitation Expired
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    This invitation link is no longer valid. Please ask your
                    friend for a new invite or increase the team size.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Invite() {
  return (
    <Suspense>
      <InviteComponent />
    </Suspense>
  );
}
