import { Link } from "@/i18n/routing";
import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { CallbackForm } from "@/components/support/callback-form";
import { IvrSimulator } from "@/components/support/ivr-simulator";
import { MessageSquare, Ticket, BookOpen, Phone } from "lucide-react";

const channels = [
  { icon: Ticket, title: "Create a ticket", body: "Trackable support with SLA routing across portal and chat.", href: "/portal/tickets", cta: "Open portal" },
  { icon: MessageSquare, title: "Live chat", body: "AI assistant on every page — say “agent” to escalate to a ticket.", href: "/support", cta: "Use chat widget" },
  { icon: BookOpen, title: "Knowledge base", body: "Tutorials, FAQs, and troubleshooting guides.", href: "/knowledge-base", cta: "Browse articles" },
  { icon: Phone, title: "WhatsApp & phone", body: "WhatsApp business menu + IVR language/department routing.", href: "/contact", cta: "Contact care" },
];

export default function SupportCenterPage() {
  return (
    <div className="pt-28 section-padding">
      <div className="container-wide">
        <Reveal className="max-w-2xl mb-14">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent mb-3">Support Center</p>
          <h1 className="font-display text-4xl sm:text-5xl font-bold">How can we help?</h1>
          <p className="mt-4 text-lg text-muted">
            Omnichannel care: tickets, live chat, WhatsApp, email, knowledge base, and IVR — all linked to CRM.
          </p>
        </Reveal>
        <div className="grid sm:grid-cols-2 gap-10 mb-14">
          {channels.map((c, i) => {
            const Icon = c.icon;
            return (
              <Reveal key={c.title} delay={i * 0.05}>
                <div className="space-y-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/15 text-accent">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h2 className="font-display text-xl font-semibold">{c.title}</h2>
                  <p className="text-sm text-muted">{c.body}</p>
                  <Link href={c.href} className="text-sm text-accent hover:underline">{c.cta} →</Link>
                </div>
              </Reveal>
            );
          })}
        </div>
        <div className="grid lg:grid-cols-2 gap-8 mb-10">
          <Reveal>
            <CallbackForm />
          </Reveal>
          <Reveal delay={0.05}>
            <IvrSimulator />
          </Reveal>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild><Link href="/login">Customer login</Link></Button>
          <Button asChild variant="outline"><Link href="/contact">Emergency support</Link></Button>
        </div>
      </div>
    </div>
  );
}
