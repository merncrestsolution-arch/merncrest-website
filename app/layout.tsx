import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
  weight: ["500", "600", "700", "800"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://merncrest.lk").replace(/\/$/, "");

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "MernCrest — Enterprise Software, AI & Cloud Solutions",
  description:
    "MernCrest builds enterprise software, AI, and cloud solutions, and runs a domain & hosting marketplace powered by trusted providers.",
  applicationName: "MernCrest",
  openGraph: {
    type: "website",
    siteName: "MernCrest",
    url: SITE_URL,
    title: "MernCrest — Enterprise Software, AI & Cloud Solutions",
    description:
      "Enterprise software, AI, and cloud solutions, plus a domain & hosting marketplace powered by trusted providers.",
  },
  twitter: {
    card: "summary_large_image",
    title: "MernCrest — Enterprise Software, AI & Cloud Solutions",
    description:
      "Enterprise software, AI, and cloud solutions, plus a domain & hosting marketplace.",
  },
};

/**
 * Root layout MUST include <html> and <body> (Next.js App Router).
 * Locale-specific providers live in app/[locale]/layout.tsx.
 * `suppressHydrationWarning` allows next-themes / locale lang updates.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${jakarta.variable} ${inter.variable} ${jetbrains.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
