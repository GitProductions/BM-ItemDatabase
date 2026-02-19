import type { Metadata } from 'next';
import { buildPageMetadata } from "@/lib/seo/metadata";




export const metadata: Metadata = {
  ...buildPageMetadata({
    title: "Log-in or Sign-up",
    description: 'Access your account to contribute item drops, manage submissions, and participate in the community.',
    path: "/login",
    noindex: true,
    nofollow: true,
  }),
}

export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}