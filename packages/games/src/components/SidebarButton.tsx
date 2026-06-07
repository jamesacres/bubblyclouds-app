import { memo, MouseEventHandler } from 'react';
import { Users } from 'lucide-react';

const MemoisedSidebarButton = memo(function MemoisedSidebarButton({
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

// Export both names for compatibility
export { MemoisedSidebarButton as SidebarButton };
export default MemoisedSidebarButton;
