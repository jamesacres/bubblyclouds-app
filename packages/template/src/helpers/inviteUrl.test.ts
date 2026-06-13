import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { buildPartyInviteUrl } from './inviteUrl';
import { Invite } from '@bubblyclouds-app/types/serverTypes';

const makeInvite = (inviteId: string): Invite => ({
  inviteId,
  resourceId: 'party-123',
  createdBy: 'user1',
  expiresAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
});

describe('buildPartyInviteUrl', () => {
  const baseArgs = {
    partyId: 'party-123',
    partyName: 'My Team',
    sessionId: 'session-abc',
    redirectUri: '/puzzle/123',
    appUrl: 'https://app.example.com',
  };

  let cacheRef: Record<string, string>;

  beforeEach(() => {
    cacheRef = {};
  });

  it('returns invite URL when createInvite succeeds', async () => {
    const createInvite = jest
      .fn<() => Promise<Invite | undefined>>()
      .mockResolvedValue(makeInvite('invite-xyz'));

    const url = await buildPartyInviteUrl({
      ...baseArgs,
      cacheRef,
      createInvite,
    });

    expect(url).toBe('https://app.example.com/invite?inviteId=invite-xyz');
  });

  it('falls back to appUrl + redirectUri when createInvite returns undefined', async () => {
    const createInvite = jest
      .fn<() => Promise<Invite | undefined>>()
      .mockResolvedValue(undefined);

    const url = await buildPartyInviteUrl({
      ...baseArgs,
      cacheRef,
      createInvite,
    });

    expect(url).toBe('https://app.example.com/puzzle/123');
  });

  it('caches the result so createInvite is only called once', async () => {
    const createInvite = jest
      .fn<() => Promise<Invite | undefined>>()
      .mockResolvedValue(makeInvite('invite-abc'));

    await buildPartyInviteUrl({ ...baseArgs, cacheRef, createInvite });
    await buildPartyInviteUrl({ ...baseArgs, cacheRef, createInvite });

    expect(createInvite).toHaveBeenCalledTimes(1);
  });

  it('returns cached URL on second call', async () => {
    const createInvite = jest
      .fn<() => Promise<Invite | undefined>>()
      .mockResolvedValue(makeInvite('invite-cached'));

    const first = await buildPartyInviteUrl({
      ...baseArgs,
      cacheRef,
      createInvite,
    });
    const second = await buildPartyInviteUrl({
      ...baseArgs,
      cacheRef,
      createInvite,
    });

    expect(first).toBe(second);
  });

  it('passes correct args to createInvite', async () => {
    const createInvite = jest
      .fn<() => Promise<Invite | undefined>>()
      .mockResolvedValue(undefined);

    await buildPartyInviteUrl({ ...baseArgs, cacheRef, createInvite });

    expect(createInvite).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionId: 'session-abc',
        redirectUri: '/puzzle/123',
        description: 'My Team',
        resourceId: 'party-party-123',
      })
    );
  });
});
