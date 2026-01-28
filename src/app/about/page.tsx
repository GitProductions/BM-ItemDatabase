import React from "react";
import Link from "next/link";

const AboutPage = () => (
    <main className="max-w-5xl mx-auto my-2 bg-zinc-800 border border-zinc-700 rounded-lg p-4 mb-4 hover:border-zinc-500 transition-colors shadow-sm h-full">
        <h1 className="text-3xl font-bold mb-4 text-white">About BlackMUD Item Database</h1>
        <p className="mb-4 text-zinc-300 leading-relaxed">
            The <span className="font-semibold text-orange-600">BlackMUD Item Database</span> is a community-driven resource for players of <Link className="underline" href="https://blackmud.com">BlackMUD</Link>.
            It provides a searchable and organized collection of items found within the game,
            helping adventurers discover equipment, compare stats, and plan their journeys.
        </p>
        <p className="mb-8 text-zinc-300 leading-relaxed">
            The goal is to make item information accessible and easy to browse,
            supporting both new and veteran players in their adventures... and save gold of course!
        </p>

        <h2 className="text-2xl font-semibold mb-3 text-orange-600">What's inside</h2>
        <ul className="list-disc list-inside space-y-3 text-zinc-200 mb-4">
            <li>
                <span className="font-semibold text-orange-500">Backend API</span> for submissions and searches, so tools like Mudlet can push
                identify dumps straight into the database or query it live.
            </li>
            <li>
                <span className="font-semibold text-orange-500">Duplicate-aware imports</span> that flag possible matches and let contributors merge or extend data safely.
            </li>
            <li>
                <span className="font-semibold text-orange-500">Crowd-sourced stats</span>: multiple user entries combine to show practical min / max rolls and worn/drop locations.
            </li>
            <li>
                <span className="font-semibold text-orange-500">Fuzzy search</span> across names, keywords, types, and affects so you can find items even with typos.
            </li>
            <li>
                <span className="font-semibold text-orange-500">Gear planner</span> to assemble full loadouts, check possible slot upgrades, calculate total damroll/ac and theorycraft before you log in.
            </li>

            <li>
                <span className="font-semibold text-orange-500">Half-Orc 'error' phrases</span> implemented at random for fun, adding a bit of flavor and humor to the database.
            </li>
        </ul>

        <h2 className="text-2xl font-semibold mb-3 text-orange-600">Who Made This?</h2>
        <p className="text-zinc-300 leading-relaxed mb-4">
            This project was created by David "Gitago" Bell and is maintained by the BlackMUD community,
            with development led by <span className="font-semibold text-orange-600">GitProductions</span>.
        </p>

        <h2 className="text-2xl font-semibold mb-3 text-orange-600">Get Involved</h2>
        <p className="text-zinc-300 leading-relaxed mb-4">
            We welcome contributions from the community! Whether it's submitting new items,
            improving existing entries, or providing feedback on features, your input helps make
            the database better for everyone.
        </p>

    </main>
);

export default AboutPage;
