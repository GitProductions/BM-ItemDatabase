import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Gear Planner',
  description: 'Build and compare equipment loadouts with stat calculations. Find optimal gear combinations to maximize your character\'s stats effectively',
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_BASE_URL}/gear-planner`,
  },
};

export default function Layout({ children } : Readonly<{ children: React.ReactNode }>) {
  return children;
}