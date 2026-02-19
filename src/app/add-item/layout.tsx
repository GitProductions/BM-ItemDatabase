import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Add Item',
  description: 'You always wanted to become a legend, Why not today? Help the BlackMUD community by adding new items to the database or updating existing ones.',
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_BASE_URL}/add-item`,
  },
};

export default function Layout({ children }) {
  return children;
}