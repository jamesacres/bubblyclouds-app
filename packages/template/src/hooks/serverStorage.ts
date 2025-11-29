'use client';

import { useCallback, useContext, useRef } from 'react';
import { useFetch } from '@sudoku-web/auth/hooks/useFetch';
import {
  UserContext,
  UserContextInterface,
} from '@sudoku-web/auth/providers/AuthProvider';
import { StateType } from '@sudoku-web/types/stateType';
import { UserProfile } from '@sudoku-web/types/userProfile';
import { useOnline } from './online';
import {
  MemberResponse,
  Member,
  PartyResponse,
  Party,
  ServerStateResult,
  Session,
  StateResponse,
  Invite,
  InviteResponse,
  PublicInvite,
} from '@sudoku-web/types/serverTypes';

const apiUrl = 'https://api.bubblyclouds.com';

const responseToResult = <T>(
  response: StateResponse<T>
): ServerStateResult<T> => {
  return {
    parties: response.parties
      ? Object.entries(response.parties).reduce(
          (result, [partyId, partyResponse]) => {
            if (!partyResponse || !partyResponse.memberSessions) {
              return result;
            }
            return {
              ...result,
              [partyId]: {
                memberSessions: Object.entries(
                  partyResponse.memberSessions
                ).reduce((result, [userId, memberSessionResponse]) => {
                  if (!memberSessionResponse) {
                    return result;
                  }
                  const memberSessionResult: Session<T> = {
                    sessionId: response.sessionId,
                    state: memberSessionResponse.state,
                    updatedAt: new Date(memberSessionResponse.updatedAt),
                  };
                  return {
                    ...result,
                    [userId]: memberSessionResult,
                  };
                }, {}),
              },
            };
          },
          {}
        )
      : undefined,
    sessionId: response.sessionId,
    state: response.state,
    updatedAt: new Date(response.updatedAt),
  };
};

const partyResponseToResult = (
  party: PartyResponse,
  members: Member[],
  user: UserProfile | undefined
) => {
  return {
    ...party,
    members,
    createdAt: new Date(party.createdAt),
    updatedAt: new Date(party.updatedAt),
    isOwner: party.createdBy === user?.sub,
  };
};

const memberResponseToResult = (
  member: MemberResponse,
  user: UserProfile | undefined,
  partyCreatedBy?: string
): Member => {
  return {
    ...member,
    createdAt: new Date(member.createdAt),
    updatedAt: new Date(member.updatedAt),
    isOwner: member.userId === partyCreatedBy,
    isUser: member.userId === user?.sub,
  };
};

function useServerStorage({
  app,
  type: initialType,
  id: initialId,
}: {
  app: string;
  type?: StateType;
  id?: string;
}) {
  const state = useRef({
    id: initialId,
    type: initialType,
  });
  const context = useContext(UserContext) as UserContextInterface | undefined;
  const { user, logout } = context || {};
  const { fetch, getUser } = useFetch();
  const { isOnline } = useOnline();

  const setIdAndType = ({
    type: newType,
    id: newId,
  }: { type?: StateType; id?: string } = {}) => {
    state.current.id = newId;
    state.current.type = newType;
  };
  const getStateKey = useCallback(() => {
    const { id, type } = state.current;
    if (!(id && type)) {
      throw Error('Unknown id and type');
    }
    let key = `${app}-${id}`;
    if (type !== StateType.PUZZLE) {
      key = `${key}-${type}`;
    }
    return key;
  }, [app]);

  const isLoggedIn = useCallback(async () => {
    if (user) {
      if (getUser()) {
        return true;
      }
      console.warn('no longer logged in, retrying');
      if (
        await new Promise((res) => {
          setTimeout(() => {
            res(getUser());
          }, 5000);
        })
      ) {
        console.warn('we are logged back in!');
        return true;
      }

      console.warn('no longer logged in, logging out');
      if (logout) {
        logout();
      }
    }
    console.warn('not logged in');
    return false;
  }, [getUser, logout, user]);

  const listValues = useCallback(
    async <T>({
      partyId,
      userId,
    }: {
      partyId?: string;
      userId?: string;
    } = {}): Promise<ServerStateResult<T>[] | undefined> => {
      if (isOnline && (await isLoggedIn())) {
        try {
          console.info('fetching sessions', { partyId, userId });
          const response = await fetch(
            new Request(
              `${apiUrl}/sessions?app=${app}${partyId ? `&partyId=${encodeURIComponent(partyId)}` : ''}${userId ? `&userId=${encodeURIComponent(userId)}` : ''}`
            )
          );
          if (response.ok) {
            return (<StateResponse<T>[]>await response.json()).map((item) =>
              responseToResult(item)
            );
          }
        } catch (e) {
          console.error(e);
        }
      }
      return undefined;
    },
    [fetch, isLoggedIn, isOnline, app]
  );

  const getValue = useCallback(async <T>(): Promise<
    ServerStateResult<T> | undefined
  > => {
    if (isOnline && (await isLoggedIn())) {
      try {
        const stateKey = getStateKey();
        console.info('fetching session', stateKey);
        const response = await fetch(
          new Request(`${apiUrl}/sessions/${stateKey}`)
        );
        if (response.ok) {
          return responseToResult(await response.json());
        }
      } catch (e) {
        console.error(e);
      }
    }
    return undefined;
  }, [getStateKey, fetch, isLoggedIn, isOnline]);

  const saveValue = useCallback(
    async <T>(state: T): Promise<ServerStateResult<T> | undefined> => {
      if (isOnline && (await isLoggedIn())) {
        try {
          const stateKey = getStateKey();
          console.info('saving session', stateKey);
          const inOneMonth = new Date();
          inOneMonth.setDate(inOneMonth.getDate() + 32);
          const response = await fetch(
            new Request(`${apiUrl}/sessions/${stateKey}`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                state,
                expiresAt: inOneMonth.toISOString(),
              }),
            })
          );
          if (response.ok) {
            return responseToResult(await response.json());
          }
        } catch (e) {
          console.error(e);
        }
      }
      return undefined;
    },
    [getStateKey, fetch, isLoggedIn, isOnline]
  );

  const listParties = useCallback(async (): Promise<Party[] | undefined> => {
    if (isOnline && (await isLoggedIn())) {
      try {
        console.info('fetching parties');
        const response = await fetch(
          new Request(`${apiUrl}/parties?app=${app}`)
        );
        if (response.ok) {
          const result: Party[] = [];
          const partiesResponse = <PartyResponse[]>await response.json();
          for (const party of partiesResponse) {
            const memberResponse = await fetch(
              new Request(`${apiUrl}/members?resourceId=party-${party.partyId}`)
            );
            const membersResponse =
              memberResponse.ok &&
              <MemberResponse[]>await memberResponse.json();
            const members = membersResponse
              ? membersResponse.map((member: MemberResponse) =>
                  memberResponseToResult(member, user, party.createdBy)
                )
              : [];
            result.push(partyResponseToResult(party, members, user));
          }
          return result;
        }
      } catch (e) {
        console.error(e);
      }
    }
    return undefined;
  }, [fetch, isLoggedIn, isOnline, user, app]);

  const createParty = useCallback(
    async ({
      partyName,
      memberNickname,
    }: {
      partyName: string;
      memberNickname: string;
    }): Promise<Party | undefined> => {
      if (isOnline && (await isLoggedIn())) {
        try {
          const response = await fetch(
            new Request(`${apiUrl}/parties`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                partyName,
                memberNickname,
                appId: app,
              }),
            })
          );
          if (response.ok) {
            const partyResponse = (await response.json()) as PartyResponse;
            return partyResponseToResult(
              partyResponse,
              [
                memberResponseToResult(
                  {
                    memberNickname,
                    createdAt: partyResponse.createdAt,
                    resourceId: `party-${partyResponse.partyId}`,
                    updatedAt: partyResponse.updatedAt,
                    userId: user?.sub || '',
                  },
                  user,
                  user?.sub
                ),
              ],
              user
            );
          }
        } catch (e) {
          console.error(e);
        }
      }
      return undefined;
    },
    [fetch, isLoggedIn, isOnline, user, app]
  );

  const createInvite = useCallback(
    async ({
      resourceId,
      description,
      sessionId,
      redirectUri,
      expiresAt,
    }: {
      resourceId: string;
      description: string;
      sessionId: string;
      redirectUri: string;
      expiresAt: string;
    }): Promise<Invite | undefined> => {
      if (isOnline && (await isLoggedIn())) {
        try {
          const response = await fetch(
            new Request(`${apiUrl}/invites`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                resourceId,
                description,
                sessionId,
                redirectUri,
                expiresAt,
              }),
            })
          );
          if (response.ok) {
            const inviteResponse = (await response.json()) as InviteResponse;
            return {
              ...inviteResponse,
              expiresAt: new Date(inviteResponse.expiresAt),
              createdAt: new Date(inviteResponse.createdAt),
              updatedAt: new Date(inviteResponse.updatedAt),
            };
          }
        } catch (e) {
          console.error(e);
        }
      }
      return undefined;
    },
    [fetch, isLoggedIn, isOnline]
  );

  const getPublicInvite = useCallback(
    async (inviteId: string): Promise<PublicInvite | undefined> => {
      if (isOnline) {
        try {
          const response = await fetch(
            new Request(`${apiUrl}/invites/${inviteId}`)
          );
          if (response.ok) {
            const publicInviteResponse =
              (await response.json()) as PublicInvite;
            return publicInviteResponse;
          }
        } catch (e) {
          console.error(e);
        }
      }
      return undefined;
    },
    [fetch, isOnline]
  );

  const createMember = useCallback(
    async ({
      inviteId,
      memberNickname,
    }: {
      inviteId: string;
      memberNickname: string;
    }): Promise<Member | undefined> => {
      if (isOnline && (await isLoggedIn())) {
        try {
          const response = await fetch(
            new Request(`${apiUrl}/members`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                inviteId,
                memberNickname,
              }),
            })
          );
          if (response.ok) {
            const memberResponse = (await response.json()) as MemberResponse;
            return {
              ...memberResponse,
              createdAt: new Date(memberResponse.createdAt),
              updatedAt: new Date(memberResponse.updatedAt),
              isOwner: false,
              isUser: true,
            };
          }
        } catch (e) {
          console.error(e);
        }
      }
      return undefined;
    },
    [fetch, isLoggedIn, isOnline]
  );

  const removeMember = useCallback(
    async (partyId: string, userId: string): Promise<boolean> => {
      if (isOnline && (await isLoggedIn())) {
        try {
          console.info('removing member from party', { partyId, userId });
          const response = await fetch(
            new Request(
              `${apiUrl}/members/${encodeURIComponent(userId)}?resourceId=party-${partyId}`,
              {
                method: 'DELETE',
                headers: {
                  'Content-Type': 'application/json',
                },
              }
            )
          );
          return response.ok;
        } catch (e) {
          console.error(e);
        }
      }
      return false;
    },
    [fetch, isLoggedIn, isOnline]
  );

  const leaveParty = useCallback(
    async (partyId: string): Promise<boolean> => {
      if (user) {
        return removeMember(partyId, user.sub);
      }
      return false;
    },
    [removeMember, user]
  );

  const deleteParty = useCallback(
    async (partyId: string): Promise<boolean> => {
      if (isOnline && (await isLoggedIn())) {
        try {
          console.info('deleting party', partyId);
          const response = await fetch(
            new Request(`${apiUrl}/parties/${partyId}?app=${app}`, {
              method: 'DELETE',
              headers: {
                'Content-Type': 'application/json',
              },
            })
          );
          return response.ok;
        } catch (e) {
          console.error(e);
        }
      }
      return false;
    },
    [fetch, isLoggedIn, isOnline, app]
  );

  const updateParty = useCallback(
    async (
      partyId: string,
      updates: { maxSize?: number; partyName?: string }
    ): Promise<boolean> => {
      if (isOnline && (await isLoggedIn())) {
        try {
          console.info('updating party', { partyId, updates });
          const response = await fetch(
            new Request(`${apiUrl}/parties/${partyId}?app=${app}`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(updates),
            })
          );
          return response.ok;
        } catch (e) {
          console.error(e);
        }
      }
      return false;
    },
    [fetch, isLoggedIn, isOnline, app]
  );

  const deleteAccount = useCallback(async (): Promise<boolean> => {
    if (isOnline && (await isLoggedIn()) && user) {
      try {
        console.info('deleting account', user.sub);
        const response = await fetch(
          new Request(`${apiUrl}/account`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
          })
        );
        return response.ok;
      } catch (e) {
        console.error(e);
      }
    }
    return false;
  }, [fetch, isLoggedIn, isOnline, user]);

  return {
    setIdAndType,
    listValues,
    getValue,
    saveValue,
    listParties,
    createParty,
    updateParty,
    createInvite,
    getPublicInvite,
    createMember,
    leaveParty,
    removeMember,
    deleteParty,
    deleteAccount,
    isLoggedIn,
    apiUrl,
  };
}
export { useServerStorage };
