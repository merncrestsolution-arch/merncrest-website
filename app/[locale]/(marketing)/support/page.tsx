import { Link } from "@/i18n/routing";
import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { MessageSquare, Ticket, BookOpen, Phone } from "lucide-react";

const channels = [
  { icon: Ticket, title: "Create a ticket", body: "Trackable support with file uploads and SLA routing.", href: "/portal/tickets", cta: "Open portal" },
  { icon: MessageSquare, title: "Live chat", body: "AI assistant plus human agents on the website.", href: "/contact", cta: "Start chat" },
  { icon: BookOpen, title: "Knowledge base", body: "Tutorials, FAQs, and troubleshooting guides.", href: "/knowledge-base", cta: "Browse articles" },
  { icon: Phone, title: "WhatsApp & phone", body: "Quick contact and IVR-ready customer care.", href: "/contact", cta: "Contact care" },
];

export default function SupportCenterPage() {
  return (
    <div className="pt-28 section-padding">
      <div className="container-wide">
        <Reveal className="max-w-2xl mb-14">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent mb-3">Support Center</p>
          <h1 className="font-display text-4xl sm:text-5xl font-bold">How can we help?</h1>
          <p className="mt-4 text-lg text-muted">
            Tickets, live chat, WhatsApp, knowledge base, and emergency escalation — one support system.
          </p>
        </Reveal>
        <div className="grid sm:grid-cols-2 gap-10 mb-12">
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
        <div className="flex flex-wrap gap-3">
          <Button asChild><Link href="/login">Customer login</Link></Button>
          <Button asChild variant="outline"><Link href="/contact">Emergency support</Link></Button>
        </div>
      </div>
    </div>
  );
}
