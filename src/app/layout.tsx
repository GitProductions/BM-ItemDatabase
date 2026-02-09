import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import Image from "next/image";

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
        <Providers>{children}</Providers>

        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[300px] w-[600px] -translate-x-1/2 -translate-y-1/2 opacity-[0.02]">
          <Image src="/bm-logo.webp" alt="Background Logo" width={800} height={800} loading="eager" />
        </div>
      </body>
    </html>
  );
}
