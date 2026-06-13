import { Invite } from '@bubblyclouds-app/types/serverTypes';

export async function buildPartyInviteUrl({
  partyId,
  partyName,
  sessionId,
  redirectUri,
  appUrl,
  cacheRef,
  createInvite,
}: {
  partyId: string;
  partyName: string;
  sessionId: string;
  redirectUri: string;
  appUrl: string;
  cacheRef: Record<string, string>;
  createInvite: (args: {
    sessionId: string;
    redirectUri: string;
    expiresAt: string;
    description: string;
    resourceId: string;
  }) => Promise<Invite | undefined>;
}): Promise<string> {
  if (cacheRef[partyId]) return cacheRef[partyId];
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);
  const invite = await createInvite({
    sessionId,
    redirectUri,
    expiresAt: expiresAt.toISOString(),
    description: partyName,
    resourceId: `party-${partyId}`,
  });
  const url = invite
    ? `${appUrl}/invite?inviteId=${invite.inviteId}`
    : `${appUrl}${redirectUri}`;
  cacheRef[partyId] = url;
  return url;
}
