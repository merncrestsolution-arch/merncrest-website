import { getTranslations, setRequestLocale } from "next-intl/server";
import Image from "next/image";
import { ContactForm } from "@/components/sections/contact-form";
import {
  Mail,
  MapPin,
  Phone,
  MessageCircle,
  Clock3,
  Handshake,
  LifeBuoy,
  Briefcase,
} from "lucide-react";
import { Link } from "@/i18n/routing";
import { COMPANY_EMAILS, mailto } from "@/lib/company/emails";
import {
  FREE_CONSULTING_DETAIL,
  FREE_CONSULTING_LABEL,
} from "@/lib/support/consulting-schedule";
import { ConsultingSlots } from "@/components/sections/consulting-slots";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "nav" });

  return {
    title: `${t("contact")} | MERNcrest Solutions`,
  };
}

/** Stitch: Contact Us - MernCrest Solutions (project 1949998139251479921) */
export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const reach = [
    {
      icon: MapPin,
      label: "Headquarters",
      value: "87/B Galle Road, Kollupitiya,\nColombo 003, Sri Lanka",
      href: "https://maps.google.com/?q=Kollupitiya,+Colombo,+Sri+Lanka",
    },
    {
      icon: Mail,
      label: "Email",
      value: COMPANY_EMAILS.contact,
      href: mailto("contact"),
    },
    {
      icon: Phone,
      label: "Phone",
      value: "+94 713 838 638",
      href: "tel:+94713838638",
    },
    {
      icon: MessageCircle,
      label: "WhatsApp",
      value: "+94 713 838 638",
      href: "https://wa.me/94713838638",
    },
    {
      icon: Clock3,
      label: "Free consulting",
      value: `${FREE_CONSULTING_LABEL}\n${FREE_CONSULTING_DETAIL}`,
      href: "#free-consulting",
    },
    {
      icon: Clock3,
      label: "Business hours",
      value: "Mon–Fri · 9:00 – 18:00 (IST)",
      href: null,
    },
  ] as const;

  const channels = [
    {
      icon: Briefcase,
      title: "Sales",
      body: "Software, AI, cloud, and transformation projects.",
      action: { label: COMPANY_EMAILS.info, href: mailto("info") },
    },
    {
      icon: LifeBuoy,
      title: "Support",
      body: "Billing, tickets, and emergency technical help.",
      action: { label: COMPANY_EMAILS.support, href: mailto("support") },
    },
    {
      icon: Handshake,
      title: "Partnerships",
      body: "Reseller, agency, and technology alliances.",
      action: {
        label: "Contact partnerships",
        href: mailto("contact", { subject: "Partnership inquiry" }),
      },
    },
  ] as const;

  return (
    <div className="bg-[#f8fafc] text-slate-900">
      {/* Stitch split hero — customer care photo */}
      <section className="relative overflow-hidden border-b border-slate-200/80">
        <div className="grid min-h-[min(72vh,640px)] lg:grid-cols-12">
          <div className="relative flex flex-col justify-center px-4 pb-12 pt-28 sm:px-8 sm:pb-16 sm:pt-32 lg:col-span-5 lg:px-10 xl:px-14">
            <div className="pointer-events-none absolute inset-0" aria-hidden>
              <div className="absolute inset-0 bg-[#f8fafc]" />
              <div className="absolute -left-16 top-20 h-72 w-72 rounded-full bg-rose-500/[0.1] blur-[90px]" />
              <div className="absolute bottom-10 right-0 h-48 w-48 rounded-full bg-rose-400/[0.07] blur-[70px]" />
            </div>
            <div className="relative z-10 max-w-xl">
              <p className="mb-4 font-display text-[11px] font-semibold uppercase tracking-[0.2em] text-rose-600">
                Customer Care
              </p>
              <h1 className="font-display text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl md:leading-[1.08]">
                We&apos;re here to help
              </h1>
              <p className="mt-5 max-w-md text-base leading-relaxed text-slate-600 sm:text-lg">
                Speak with MernCrest about software, AI, cloud consulting, and support — our team
                replies within one business day.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="#inquiry"
                  className="inline-flex h-12 items-center justify-center rounded-full bg-rose-600 px-6 text-[15px] font-semibold text-white transition hover:bg-rose-700"
                >
                  Send an inquiry
                </a>
                <a
                  href="tel:+94713838638"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-6 text-[15px] font-semibold text-slate-800 transition hover:border-rose-200 hover:bg-rose-50"
                >
                  <Phone className="h-4 w-4 text-rose-600" />
                  Call +94 713 838 638
                </a>
              </div>
            </div>
          </div>

          <div className="relative lg:col-span-7">
            <div className="relative h-[320px] w-full sm:h-[420px] lg:absolute lg:inset-0 lg:h-auto">
              <Image
                src="/images/contact-customer-care.png"
                alt="MernCrest Solutions customer care executive ready to help"
                fill
                priority
                className="object-cover object-[center_20%]"
                sizes="(max-width: 1024px) 100vw, 55vw"
              />
              {/* Soft fade into text column — Stitch gradient edge */}
              <div
                className="pointer-events-none absolute inset-y-0 left-0 hidden w-28 bg-gradient-to-r from-[#f8fafc] to-transparent lg:block"
                aria-hidden
              />
              <div
                className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#f8fafc] to-transparent lg:hidden"
                aria-hidden
              />
            </div>
          </div>
        </div>
      </section>

      {/* Main: Reach us + Form */}
      <section
        id="inquiry"
        className="mx-auto max-w-6xl scroll-mt-28 px-4 py-12 sm:px-6 sm:py-16 lg:py-20"
      >
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
          <aside className="lg:col-span-5">
            <h2 className="font-display text-2xl font-semibold tracking-tight text-slate-900">
              Reach us
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              Colombo headquarters with direct lines to sales and support.
            </p>

            <ul className="mt-8 space-y-1">
              {reach.map((item) => {
                const Icon = item.icon;
                const inner = (
                  <>
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-600">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[12px] font-medium uppercase tracking-wide text-slate-400">
                        {item.label}
                      </span>
                      <span className="mt-0.5 block whitespace-pre-line text-[15px] font-medium text-slate-800">
                        {item.value}
                      </span>
                    </span>
                  </>
                );
                return (
                  <li key={item.label}>
                    {item.href ? (
                      <a
                        href={item.href}
                        target={item.href.startsWith("http") ? "_blank" : undefined}
                        rel={item.href.startsWith("http") ? "noreferrer" : undefined}
                        className="flex items-start gap-3 rounded-xl px-2 py-3 transition hover:bg-white"
                      >
                        {inner}
                      </a>
                    ) : (
                      <div className="flex items-start gap-3 rounded-xl px-2 py-3">{inner}</div>
                    )}
                  </li>
                );
              })}
            </ul>

            <a
              href="tel:+94713838638"
              className="mt-6 flex items-center gap-3 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3.5 text-sm font-medium text-rose-800 transition hover:bg-rose-100/80"
            >
              <Phone className="h-4 w-4 shrink-0" />
              24/7 emergency support: +94 713 838 638
            </a>

            <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
              <iframe
                title="MernCrest location — Kollupitiya, Colombo"
                src="https://www.google.com/maps?q=Kollupitiya,+Colombo,+Sri+Lanka&output=embed"
                className="h-48 w-full border-0 sm:h-56"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>
          </aside>

          <div className="lg:col-span-7">
            <div id="free-consulting" className="mb-6 scroll-mt-28">
              <ConsultingSlots />
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_10px_30px_-12px_rgba(15,23,42,0.06)] sm:p-8">
              <div className="mb-6">
                <h2 className="font-display text-2xl font-semibold tracking-tight text-slate-900">
                  Send an inquiry
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  CRM-connected — our team replies within one business day.
                </p>
              </div>
              <ContactForm />
            </div>
          </div>
        </div>
      </section>

      {/* Channel tiles */}
      <section className="border-t border-slate-200 bg-white">
        <div className="mx-auto grid max-w-6xl gap-4 px-4 py-12 sm:grid-cols-3 sm:px-6 sm:py-16">
          {channels.map((c) => {
            const Icon = c.icon;
            return (
              <div
                key={c.title}
                className="rounded-xl border border-slate-200 bg-[#f8fafc] p-6 transition hover:border-rose-200 hover:bg-white"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-50 text-rose-600">
                  <Icon className="h-4 w-4" />
                </span>
                <h3 className="mt-4 font-display text-lg font-semibold text-slate-900">{c.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">{c.body}</p>
                <a
                  href={c.action.href}
                  className="mt-4 inline-block text-sm font-medium text-rose-600 hover:text-rose-700"
                >
                  {c.action.label}
                </a>
              </div>
            );
          })}
        </div>
      </section>

      <div className="border-t border-slate-200 bg-[#f8fafc] px-4 py-6 text-center text-sm text-slate-500">
        Your Technology Partner — Colombo, Sri Lanka ·{" "}
        <Link href="/support" className="font-medium text-rose-600 hover:text-rose-700">
          Support Center
        </Link>
      </div>
    </div>
  );
}
