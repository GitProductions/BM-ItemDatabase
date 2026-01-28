import React from 'react'


function Footer() {
  return (
    <footer className="w-full border-t border-zinc-700 mt-8 pb-2 text-center text-xs text-zinc-500 bg-zinc-900">

    
        {/* Nav Links */}
        <div className=" space-x-4 p-2 ">
          <a href="/" className="hover:underline hover:text-orange-600">Home</a>
          <a href="/gear-planner" className="hover:underline hover:text-orange-600">Gear Planner</a>
          <a href="/add-item" className="hover:underline hover:text-orange-600">Add Items</a>
          <a href="/about" className="hover:underline hover:text-orange-600">About</a>
        </div>

         <p className="mt-2">Created by David &quot;Gitago&quot; Bell with ❤️</p>

    </footer>
  )
}

export default Footer