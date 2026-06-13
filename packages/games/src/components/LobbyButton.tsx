import { memo, MouseEventHandler } from 'react';
import { Users } from 'lucide-react';

const LobbyButton = memo(function LobbyButton({
  friendsOnClick,
}: {
  friendsOnClick: MouseEventHandler;
}) {
  return (
    <button
      onClick={friendsOnClick}
      className="text-theme-primary dark:text-theme-primary-light cursor-pointer rounded-lg"
    >
      <Users className="float-left mr-2" />
      Opponents
    </button>
  );
});

export default LobbyButton;
