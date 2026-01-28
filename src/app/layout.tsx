import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppDataProvider } from "@/components/app-provider";
import { AppShell } from "@/components/app-shell";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});



export const metadata: Metadata = {
  title: "Blackmud Item Database",
  description: "An item database and equipment calculator for the BlackMUD Community.",

  openGraph: {
    title: "Blackmud Item Database",
    description: "An item database and equipment calculator for the BlackMUD Community.",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "https://bm-itemdb.gitago.dev/bm-itemdb-ogimage.jpg",
        width: 1200,
        height: 630,
        alt: "Blackmud Item Database",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Blackmud Item Database",
    description: "An item database and equipment calculator for the BlackMUD Community.",
    images: [
      {
        url: "https://bm-itemdb.gitago.dev/bm-itemdb-ogimage.jpg",
        alt: "Blackmud Item Database",
      },
    ],
  },

  alternates: {
    canonical: "https://bm-itemdb.gitago.dev",
  },

  
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
        <AppDataProvider>
          <AppShell>{children}</AppShell>
        </AppDataProvider>
      </body>
    </html>
  );
}
