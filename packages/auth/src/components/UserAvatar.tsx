'use client';
import type { UserProfile } from '@bubblyclouds-app/types/userProfile';
import Image from 'next/image';
import { User } from 'react-feather';

export const UserAvatar = ({
  user,
  size,
  showRing = false,
}: {
  user: UserProfile;
  size: number;
  showRing?: boolean;
}) => {
  // Calculate the inner size when using the ring
  const innerSize = showRing ? size - 4 : size;

  const avatarContent = user.picture ? (
    <Image
      src={user.picture}
      alt={user.name || 'user'}
      width={innerSize}
      height={innerSize}
      className="overflow-hidden rounded-full"
    />
  ) : (
    <div
      className="bg-theme-primary flex items-center justify-center rounded-full"
      style={{ height: innerSize, width: innerSize }}
    >
      <User
        className="text-white"
        style={{ height: innerSize * 0.6, width: innerSize * 0.6 }}
      />
    </div>
  );

  if (showRing) {
    return (
      <div
        className="rounded-full bg-gradient-to-r from-blue-500 via-red-500 via-yellow-500 to-green-500 p-0.5"
        style={{ height: size + 4, width: size + 4 }}
      >
        <div className="flex items-center justify-center rounded-full bg-white p-0.5 dark:bg-gray-800">
          {avatarContent}
        </div>
      </div>
    );
  }

  return avatarContent;
};
