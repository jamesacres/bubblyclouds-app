import { useServerStorage } from '../hooks/serverStorage';
import { CopyButton } from '@sudoku-web/ui/components/CopyButton';
import { useState } from 'react';
import { isIOS } from '../helpers/capacitor';

const PartyInviteButton = ({
  puzzleId,
  redirectUri,
  partyId,
  partyName,
  extraSmall = false,
  app,
}: {
  puzzleId: string;
  redirectUri: string;
  partyId: string;
  partyName: string;
  extraSmall?: boolean;
  app: string;
}) => {
  const sessionId = `sudoku-${puzzleId}`;
  const [inviteUrl, setInviteUrl] = useState('');
  const { createInvite } = useServerStorage({ app });

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
        latestInviteUrl = `https://${app}.bubblyclouds.com/invite?inviteId=${invite.inviteId}`;
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
    />
  );
};

export { PartyInviteButton };
