import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "MERNcrest Solutions",
  description: "Your Technology Partner",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
