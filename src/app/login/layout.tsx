import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Log-in or Sign-up',
  description: 'Access your account to contribute item drops, manage submissions, and participate in the community.',
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_BASE_URL}/login`,
  },
  robots: {
    index: false,
    follow: false,
        noarchive: true,
        nosnippet: true,
   },

};

export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}