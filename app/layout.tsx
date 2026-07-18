import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "MernCrest Solutions",
  description: "AI-Powered Enterprise Digital Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
