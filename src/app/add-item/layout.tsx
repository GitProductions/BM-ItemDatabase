import type { Metadata } from 'next';
import { buildPageMetadata } from "@/lib/seo/metadata";



export const metadata: Metadata = {
  ...buildPageMetadata({
    title: "Add Item",
    description: 'You\'ve always wanted to become a legend, Why not today? Help the BlackMUD community by adding new items to the database or updating existing ones.',
    path: "/add-item",
  }),
  // Should be build an alternative twitter description since it can be longer?
  
  // openGraph: {
  //   description: 'TEST You always wanted to become a legend, Why not today? Help the BlackMUD community by adding new items to the database or updating existing ones.',
  //   url: `${process.env.NEXT_PUBLIC_BASE_URL}/add-item`,
  // },
  // twitter: {
  //   card: "summary_large_image",
  //   title: "Add Item",
  //   description: 'TESST TWITTER You always wanted to become a legend, Why not today? Help the BlackMUD community by adding new items to the database or updating existing ones.',
  // }

  // metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || "https://bm-itemdb.gitago.dev"),
};

export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}