import React from 'react'

function UserIcon({ session }: { session: any }) {
  return (
    <div className="mt-3">
        {session.user?.image ? (
        <img
            src={session.user.image}
            alt="User Avatar"
            className="w-16 h-16 rounded-full border border-zinc-700"
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