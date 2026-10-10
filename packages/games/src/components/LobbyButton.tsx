import { memo, MouseEventHandler } from 'react';
import { Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const LobbyButton = memo(function LobbyButton({
  friendsOnClick,
}: {
  friendsOnClick: MouseEventHandler;
}) {
  const { t } = useTranslation('games');
  return (
    <button
      onClick={friendsOnClick}
      className="text-theme-primary dark:text-theme-primary-light cursor-pointer rounded-lg"
    >
      <Users className="float-left mr-2" />
      {t('lobbyButton.opponents')}
    </button>
  );
});

export default LobbyButton;
