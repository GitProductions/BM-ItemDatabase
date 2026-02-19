import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});



export const metadata: Metadata = {
  title: {
    default: "Blackmud Item Database",
    template: "%s | Blackmud Item Database",
  },
  icons: {
    icon: "/bm-logo.png",
    apple: "/bm-logo.png",
  },

  description:
    "Community-driven item database for BlackMUD players: Explore player-submitted weapons, armor, and gear - compare stats & check drop history contributed by the community!",

  keywords: [
    "BlackMUD",
    "MUD",
    "multi-user dungeon",
    "item database",
    "equipment reference",
    "Silly MUD",
    "DikuMUD",
    "Diku",
    "text RPG",
    "text-based RPG",
    "online RPG",
    "MUD game",
    "longest running MUD",
    "classic MUD",
    "MUD community",
    "weapons database",
    "armor database",
    "RPG items",
  ], 

  authors: [{ name: "BlackMUD Community" }],
  creator: "GitProductions",
  publisher: "GitProductions",
  
  openGraph: {
    title: "Blackmud Item Database",
    description:
      "A community-built item reference for BlackMUD. Browse weapons, armor, and gear - compare stats, explore drop history, and stay tuned for an equipment planner coming soon.",
    type: "website",
    locale: "en_US",
    url: process.env.NEXT_PUBLIC_BASE_URL || "https://bm-itemdb.gitago.dev",
    siteName: "Blackmud Item Database",
    images: [
      {
        url: `${process.env.NEXT_PUBLIC_BASE_URL}/bm-itemdb-ogimage.jpg`,
        width: 1200,
        height: 630,
        alt: "Blackmud Item Database - Browse items, compare stats, and calculate equipment for BlackMUD",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Blackmud Item Database",
    description:
      "Community-driven item database for BlackMUD players: Explore player-submitted weapons, armor, and gear - compare stats & check drop history contributed by the community!",
    images: [
      {
        url: `${process.env.NEXT_PUBLIC_BASE_URL}/bm-itemdb-ogimage.jpg`,
        alt: "Blackmud Item Database - Browse items, compare stats, and calculate equipment for BlackMUD",
      },
    ],
  },

  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_BASE_URL}`,
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || "https://bm-itemdb.gitago.dev"),
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
