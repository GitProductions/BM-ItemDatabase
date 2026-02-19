import type { Metadata } from 'next';
import { buildPageMetadata } from "@/lib/seo/metadata";



export const metadata: Metadata = {
  ...buildPageMetadata({
    title: "Account",
    description: 'Manage your account settings and preferences.',
    path: "/account",
  }),

};

export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}