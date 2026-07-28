import dynamic from "next/dynamic";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { WhatsAppButton } from "@/components/layout/whatsapp-button";
import { PageTransition } from "@/components/layout/page-transition";
import { ForceLightTheme } from "@/components/layout/force-light-theme";
import { SiteIntro } from "@/components/layout/site-intro";
import { isSystemSurface } from "@/lib/system-surface";

const AiChatWidget = dynamic(
  () => import("@/components/layout/ai-chat-widget").then((m) => m.AiChatWidget),
  { ssr: false, loading: () => null },
);
export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // System.merncrest.lk uses Stitch portal chrome — no marketing navbar/footer
  if (await isSystemSurface()) {
    return <>{children}</>;
  }

  return (
    <>
      <ForceLightTheme />
      <SiteIntro />
      <Navbar />
      <main className="relative z-0 min-h-screen">
        <PageTransition>{children}</PageTransition>
      </main>
      <Footer />
      <WhatsAppButton />
      <AiChatWidget />
    </>
  );
}

