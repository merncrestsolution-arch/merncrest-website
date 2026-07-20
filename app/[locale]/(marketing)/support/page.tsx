import { Link } from "@/i18n/routing";
import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/ui/page-hero";
import { CallbackForm } from "@/components/support/callback-form";
import { IvrSimulator } from "@/components/support/ivr-simulator";
import { MessageSquare, Ticket, BookOpen, Phone } from "lucide-react";

const channels = [
  {
    icon: Ticket,
    title: "Create a ticket",
    body: "Trackable support with SLA routing across portal and chat.",
    href: "/portal/tickets",
    cta: "Open portal",
  },
  {
    icon: MessageSquare,
    title: "Live chat",
    body: "AI assistant on every page — say “agent” to escalate to a ticket.",
    href: "/support",
    cta: "Use chat widget",
  },
  {
    icon: BookOpen,
    title: "Knowledge base",
    body: "Tutorials, FAQs, and troubleshooting guides.",
    href: "/knowledge-base",
    cta: "Browse articles",
  },
  {
    icon: Phone,
    title: "WhatsApp & phone",
    body: "WhatsApp business menu + IVR language/department routing.",
    href: "/contact",
    cta: "Contact care",
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
        <div className="grid sm:grid-cols-2 gap-5">
          {channels.map((c, i) => {
            const Icon = c.icon;
            return (
              <Reveal key={c.title} delay={i * 0.05}>
                <div className="h-full stitch-card stitch-card-hover">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/15 text-violet-300">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h2 className="font-display text-xl font-semibold text-white">{c.title}</h2>
                  <p className="mt-2 text-sm text-muted">{c.body}</p>
                  <Link
                    href={c.href}
                    className="mt-4 inline-block text-sm text-violet-300 hover:text-violet-200"
                  >
                    {c.cta} →
                  </Link>
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
            <Link href="/login">Customer login</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/contact">Emergency support</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
