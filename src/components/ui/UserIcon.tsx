import React from 'react';
import Image from 'next/image';
import { Session } from 'next-auth';

type UserIconProps = { session: Session | null };

function UserIcon({ session }: UserIconProps) {
  const image = session?.user?.image;
  const initials = session?.user?.name ? session.user.name.slice(0, 2).toUpperCase() : '?';

  return (
    <div className="mt-3">
      {image ? (
        <Image
          src={image}
          alt="User Avatar"
          className="w-16 h-16 rounded-full border border-zinc-700"
          width={64}
          height={64}
        />
      ) : (
        <div className="w-16 h-16 rounded-full border border-zinc-700 bg-zinc-800 flex items-center justify-center text-zinc-300 font-semibold">
          {initials}
        </div>
      )}
    </div>
  );
}

export default UserIcon;
