import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { PageHero } from "@/components/ui/page-hero";
import { Globe, Mail, MessageSquare } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "nav" });

  return {
    title: `${t("team")} | MERNcrest Solutions`,
  };
}

const teamMembers = [
  {
    name: "Mohamed Shakkir",
    role: "CEO & Founder",
    gender: "male",
    bio: "Visionary leader driving MERNcrest Solutions towards engineering excellence and global scale.",
  },
  {
    name: "Fathima Saza",
    role: "HR & Software Developer",
    gender: "female",
    bio: "Bridging the gap between human resources and technical execution, fostering a healthy engineering culture.",
  },
  {
    name: "Mohamed Fasrin",
    role: "TL & Senior Software Developer",
    gender: "male",
    bio: "Leading technical delivery and architecting robust, scalable software solutions.",
  },
  {
    name: "Mohammed Hamith",
    role: "TL Digital Marketing",
    gender: "male",
    bio: "Strategizing digital growth and brand positioning for maximum market impact.",
  },
];

export default async function TeamPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="stitch-page">
      <PageHero
        eyebrow="Our People"
        title="Meet the minds behind the code"
        description="We are a diverse collective of visionary engineers, designers, and strategists united by a singular passion: building exceptional software that transforms industries."
      />

      <div className="stitch-page-body">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {teamMembers.map((member) => (
            <div key={member.name} className="stitch-card stitch-card-hover text-center group">
              <div className="relative mx-auto mb-5 w-28 h-28">
                <div className="absolute inset-0 rounded-full bg-violet-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative w-full h-full rounded-full p-1 bg-gradient-to-b from-violet-500/40 to-transparent">
                  <div className="w-full h-full rounded-full overflow-hidden bg-[var(--stitch-surface)] flex items-center justify-center">
                    {member.gender === "female" ? (
                      <svg
                        viewBox="0 0 24 24"
                        className="w-16 h-16 text-muted group-hover:text-violet-300 transition-colors"
                        fill="currentColor"
                      >
                        <path d="M12 14c-3.31 0-6 2.69-6 6v2h12v-2c0-3.31-2.69-6-6-6zm0-2c2.21 0 4-1.79 4-4V6c0-2.21-1.79-4-4-4S8 3.79 8 6v2c0 2.21 1.79 4 4 4zm0-6c1.1 0 2 .9 2 2v2c0 1.1-.9 2-2 2s-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      </svg>
                    ) : (
                      <svg
                        viewBox="0 0 24 24"
                        className="w-16 h-16 text-muted group-hover:text-violet-300 transition-colors"
                        fill="currentColor"
                      >
                        <path d="M12 14c-4.42 0-8 3.58-8 8h16c0-4.42-3.58-8-8-8zm0-2c3.31 0 6-2.69 6-6s-2.69-6-6-6-6 2.69-6 6 2.69 6 6 6z" />
                      </svg>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-center gap-2 mb-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <Link
                  href="#"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-muted hover:text-white hover:border-violet-400/40"
                >
                  <Globe className="h-3.5 w-3.5" />
                </Link>
                <Link
                  href="#"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-muted hover:text-white hover:border-violet-400/40"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                </Link>
                <Link
                  href="#"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-muted hover:text-white hover:border-violet-400/40"
                >
                  <Mail className="h-3.5 w-3.5" />
                </Link>
              </div>

              <h3 className="font-display text-lg font-semibold text-white">{member.name}</h3>
              <p className="mt-1 text-xs font-mono uppercase tracking-wider text-violet-300">
                {member.role}
              </p>
              <p className="mt-3 text-sm text-muted leading-relaxed">{member.bio}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
