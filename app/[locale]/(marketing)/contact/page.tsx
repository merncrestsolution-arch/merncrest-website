import { getTranslations, setRequestLocale } from "next-intl/server";
import Image from "next/image";
import { ContactForm } from "@/components/sections/contact-form";
import { PageHero } from "@/components/ui/page-hero";
import { BrandStrip } from "@/components/ui/brand-logo";
import { techBrands } from "@/lib/data/resources";
import { Mail, MapPin, Phone, Cloud } from "lucide-react";

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

/** Stitch screen: Contact - MernCrest */
export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="stitch-page">
      <PageHero
        eyebrow="Connect with MernCrest"
        title="Start your digital transformation journey today."
        description="Whether you need AI integration, cloud infrastructure, or custom software — our team is ready to help."
      />

      <div className="stitch-page-body stitch-stack-lg">
        <div className="grid lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-5">
            <div className="stitch-card overflow-hidden !p-0">
              <div className="relative h-40 w-full">
                <Image
                  src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80"
                  alt="Colombo skyline"
                  fill
                  className="object-cover opacity-70"
                  sizes="40vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#131317] to-transparent" />
              </div>
              <div className="p-6">
                <div className="flex items-start gap-3 mb-3">
                  <MapPin className="h-5 w-5 text-[#d2bbff] shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-display font-semibold text-white">Our Headquarters</h3>
                    <p className="mt-1 text-sm text-[#ccc3d8] leading-relaxed">
                      87/B Galle Road Kollupity,
                      <br />
                      Colombo 003, Sri Lanka
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="stitch-card space-y-5">
              <h3 className="font-display font-semibold text-white">Support Channels</h3>
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-[#d2bbff] shrink-0" />
                <div>
                  <p className="text-sm text-white">Email</p>
                  <p className="text-sm text-[#ccc3d8]">merncrestsolution@gmail.com</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-[#d2bbff] shrink-0" />
                <div>
                  <p className="text-sm text-white">Phone</p>
                  <p className="text-sm text-[#ccc3d8]">+94 713838638</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Cloud className="h-5 w-5 text-[#25d366] shrink-0" />
                <div>
                  <p className="text-sm text-white">System Status</p>
                  <p className="text-sm text-[#25d366]">Systems Operational</p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="stitch-card">
              <div className="flex items-center justify-between gap-3 mb-6">
                <h3 className="font-display text-2xl font-bold text-white">Request an Inquiry</h3>
                <span className="rounded-full border border-[#7c3aed]/40 bg-[#7c3aed]/15 px-3 py-1 font-mono text-[11px] text-[#d2bbff]">
                  CRM Integrated
                </span>
              </div>
              <ContactForm />
            </div>
          </div>
        </div>

        <div className="pt-6">
          <p className="font-mono text-[12px] text-center text-[#958da1] mb-6 uppercase tracking-[0.2em]">
            Trusted by Global Leaders
          </p>
          <BrandStrip
            items={techBrands.filter((b) =>
              ["amazonaws", "microsoft", "googlecloud", "docker", "kubernetes"].includes(b.slug)
            )}
            className="opacity-60"
          />
        </div>
      </div>
    </div>
  );
}
