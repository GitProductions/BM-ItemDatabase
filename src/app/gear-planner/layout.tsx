import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Gear Planner',
  description: 'Build and compare equipment loadouts with stat calculations',
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_BASE_URL}/gear-planner`,
  },
};

export default function Layout({ children }) {
  return children;
}