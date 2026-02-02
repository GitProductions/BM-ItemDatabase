import React from 'react'
import Leaderboard from '@/components/leaderboard'

function Page() {
  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-2 text-white">ItemDB Leaderboard</h1>

      <p className="text-zinc-400 mb-2">
        {/* Here you can see the top contributors who have helped expand and improve the BlackMUD Item Database. 
        We appreciate your efforts in making this resource better for everyone! */}
        Whom is the biggest loot goblin of them all? 
      </p>
      <p className="text-zinc-400 mb-6">
        View the top contributors who have helped expand and improve the BlackMUD Item Database.
         We appreciate your efforts in making this resource better for everyone!

      </p>
      <div className="max-w-4xl mx-auto">

        <Leaderboard />

      </div>
  
    </div>
  )
}

export default Page