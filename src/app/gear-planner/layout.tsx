import type { Metadata } from 'next';
import { buildPageMetadata } from "@/lib/seo/metadata";


export const metadata: Metadata = {
  ...buildPageMetadata({
    title: "Gear Planner",
    description: "Build and compare equipment loadouts with stat calculations. Find optimal gear combinations to maximize your character's stats effectively",
    path: "/gear-planner",
  }),
}

export default function Layout({ children } : Readonly<{ children: React.ReactNode }>) {
  return children;
}