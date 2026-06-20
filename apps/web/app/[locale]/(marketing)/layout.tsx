import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { WhatsAppButton } from "@/components/layout/whatsapp-button";
import { PageTransition } from "@/components/layout/page-transition";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <main className="min-h-screen">
        <PageTransition>{children}</PageTransition>
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  );
}
