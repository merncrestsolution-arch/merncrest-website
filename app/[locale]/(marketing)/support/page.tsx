import { Link } from "@/i18n/routing";
import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/ui/page-hero";
import { CallbackForm } from "@/components/support/callback-form";
import { IvrSimulator } from "@/components/support/ivr-simulator";
import { KbQuickSearch } from "@/components/support/kb-quick-search";
import { MessageSquare, Ticket, BookOpen, Phone } from "lucide-react";

export const metadata = {
  title: "Support Center | MernCrest",
  description:
    "Get help from MernCrest: open a ticket, chat with us, search the knowledge base, request a callback, or reach us on WhatsApp.",
};

const WHATSAPP_NUMBER = "94713838638";

const channels = [
  {
    icon: Ticket,
    title: "Create a ticket",
    body: "Trackable support with SLA routing. Sign in to open and follow your tickets.",
    href: "/portal/tickets",
    cta: "Sign in to open a ticket",
    external: false,
  },
  {
    icon: MessageSquare,
    title: "Live chat",
    body: "AI assistant on every page — say “agent” to escalate to a ticket.",
    href: "/contact",
    cta: "Start a conversation",
    external: false,
  },
  {
    icon: BookOpen,
    title: "Knowledge base",
    body: "Tutorials, FAQs, and troubleshooting guides.",
    href: "/knowledge-base",
    cta: "Browse articles",
    external: false,
  },
  {
    icon: Phone,
    title: "WhatsApp & phone",
    body: "Message us on WhatsApp, or call +94 71 383 8638 during business hours.",
    href: `https://wa.me/${WHATSAPP_NUMBER}`,
    cta: "Chat on WhatsApp",
    external: true,
  },
];

export default function SupportCenterPage() {
  return (
    <div className="stitch-page">
      <PageHero
        eyebrow="Support Center"
        title="How can we help?"
        description="Omnichannel care: tickets, live chat, WhatsApp, email, knowledge base, and IVR — all linked to CRM."
      />

      <div className="stitch-page-body stitch-stack-lg">
        <Reveal>
          <KbQuickSearch />
        </Reveal>

        <div className="grid sm:grid-cols-2 gap-5">
          {channels.map((c, i) => {
            const Icon = c.icon;
            return (
              <Reveal key={c.title} delay={i * 0.05}>
                <div className="h-full stitch-card stitch-card-hover">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/15 text-stitch-glow">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h2 className="font-display text-xl font-semibold text-foreground">{c.title}</h2>
                  <p className="mt-2 text-sm text-muted">{c.body}</p>
                  {c.external ? (
                    <a
                      href={c.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 inline-block text-sm text-stitch-glow hover:text-violet-200"
                    >
                      {c.cta} →
                    </a>
                  ) : (
                    <Link
                      href={c.href}
                      className="mt-4 inline-block text-sm text-stitch-glow hover:text-violet-200"
                    >
                      {c.cta} →
                    </Link>
                  )}
                </div>
              </Reveal>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-2 gap-5">
          <Reveal>
            <div className="stitch-card">
              <CallbackForm />
            </div>
          </Reveal>
          <Reveal delay={0.05}>
            <div className="stitch-card">
              <IvrSimulator />
            </div>
          </Reveal>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button asChild className="rounded-full">
            <Link href="/login">Client login</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/contact">Emergency support</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
