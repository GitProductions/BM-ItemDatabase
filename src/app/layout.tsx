import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { buildPageMetadata } from "@/lib/seo/metadata";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});



export const metadata: Metadata = {
  ...buildPageMetadata({
    title: "Blackmud ItemDB",
    description: "Item database for BlackMUD players: Explore player-submitted weapons, armor, and gear - compare stats & check drop history contributed by the community!",
    image: `${process.env.NEXT_PUBLIC_BASE_URL}/bm-itemdb-ogimage.jpg`,
    path: "/",
  }),

  // Should be build an alternative twitter description since it can be longer?

  // metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || "https://bm-itemdb.gitago.dev"),
};

const themeInitScript = `(() => {
  try {
    const stored = localStorage.getItem('blackmud-item-database-theme');
    const system = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const theme = stored === 'dark' || stored === 'light' ? stored : system;
    document.documentElement.dataset.theme = theme;
  } catch (error) {
    console.error('Theme init failed', error);
  }
})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
