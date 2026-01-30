import React from 'react'
import Image from 'next/image'
import { Session } from "next-auth";

function UserIcon({ session }: { session: Session }) {
  return (
    <div className="mt-3">
        {session.user?.image ? (
        <Image
            src={session.user.image}
            alt="User Avatar"
            className="w-16 h-16 rounded-full border border-zinc-700"
            width={32}
            height={32}
        />
        ) : (
        <div className="w-16 h-16 rounded-full border border-zinc-700 bg-zinc-800 flex items-center justify-center text-zinc-500">
            No Image
        </div>
        )}
    </div>
    )
}

export default UserIcon