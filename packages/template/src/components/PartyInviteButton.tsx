import { useServerStorage } from '../hooks/serverStorage';
import { CopyButton } from '@bubblyclouds-app/ui/components/CopyButton';
import { useState } from 'react';
import { isIOS } from '../helpers/capacitor';

const PartyInviteButton = ({
  sessionId,
  redirectUri,
  partyId,
  partyName,
  extraSmall = false,
  app,
  appName,
  apiUrl,
  appUrl,
}: {
  sessionId: string;
  redirectUri: string;
  partyId: string;
  partyName: string;
  extraSmall?: boolean;
  app: string;
  appName: string;
  apiUrl: string;
  appUrl: string;
}) => {
  const [inviteUrl, setInviteUrl] = useState('');
  const { createInvite } = useServerStorage({ app, apiUrl });

  const getInviteUrl = async (): Promise<string> => {
    let latestInviteUrl = inviteUrl;
    if (!inviteUrl) {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      const invite = await createInvite({
        sessionId,
        redirectUri,
        expiresAt: expiresAt.toISOString(),
        description: partyName,
        resourceId: `party-${partyId}`,
      });
      if (invite) {
        latestInviteUrl = `${appUrl}/invite?inviteId=${invite.inviteId}`;
        setInviteUrl(latestInviteUrl);
      }
    }
    return latestInviteUrl;
  };

  return (
    <CopyButton
      getText={getInviteUrl}
      extraSmall={extraSmall}
      partyName={partyName}
      isIOS={isIOS}
      appName={appName}
    />
  );
};

export { PartyInviteButton };
