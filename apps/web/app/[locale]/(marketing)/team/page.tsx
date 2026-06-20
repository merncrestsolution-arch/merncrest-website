import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
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
    bio: "Visionary leader driving MERNcrest Solutions towards engineering excellence and global scale."
  },
  {
    name: "Fathima Saza",
    role: "HR & Software Developer",
    gender: "female",
    bio: "Bridging the gap between human resources and technical execution, fostering a healthy engineering culture."
  },
  {
    name: "Mohamed Fasrin",
    role: "TL & Senior Software Developer",
    gender: "male",
    bio: "Leading technical delivery and architecting robust, scalable software solutions."
  },
  {
    name: "Mohammed Hamith",
    role: "TL Digital Marketing",
    gender: "male",
    bio: "Strategizing digital growth and brand positioning for maximum market impact."
  }
];

export default async function TeamPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="container-wide section-padding pt-32 min-h-screen">
      {/* Header Section */}
      <div className="text-center max-w-3xl mx-auto mb-24">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-sm font-medium mb-6">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
          </span>
          Our People
        </div>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 font-display text-balance tracking-tight">
          Meet the Minds Behind the <span className="gradient-text">Code</span>
        </h1>
        <p className="text-muted text-lg md:text-xl leading-relaxed">
          We are a diverse collective of visionary engineers, designers, and strategists united by a singular passion: building exceptional software that transforms industries.
        </p>
      </div>

      {/* Team Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-16 mt-12">
        {teamMembers.map((member, i) => (
          <div key={i} className="group relative flex flex-col items-center text-center">
            {/* Avatar Container */}
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-accent/20 rounded-full blur-xl scale-150 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative w-48 h-48 rounded-full p-1.5 bg-gradient-to-b from-accent/50 to-transparent group-hover:from-accent transition-colors duration-500">
                <div className="w-full h-full rounded-full overflow-hidden bg-background flex items-center justify-center p-2">
                  {member.gender === "female" ? (
                    <svg viewBox="0 0 24 24" className="w-full h-full text-muted group-hover:text-accent transition-colors duration-500" fill="currentColor">
                      <path d="M12 14c-3.31 0-6 2.69-6 6v2h12v-2c0-3.31-2.69-6-6-6zm0-2c2.21 0 4-1.79 4-4V6c0-2.21-1.79-4-4-4S8 3.79 8 6v2c0 2.21 1.79 4 4 4zm0-6c1.1 0 2 .9 2 2v2c0 1.1-.9 2-2 2s-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                      <path d="M6 10v2c0 3.31 2.69 6 6 6s6-2.69 6-6v-2c0-.55-.45-1-1-1s-1 .45-1 1v2c0 2.21-1.79 4-4 4s-4-1.79-4-4v-2c0-.55-.45-1-1-1s-1 .45-1 1z" opacity="0.3"/>
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" className="w-full h-full text-muted group-hover:text-accent transition-colors duration-500" fill="currentColor">
                      <path d="M12 14c-4.42 0-8 3.58-8 8h16c0-4.42-3.58-8-8-8zm0-2c3.31 0 6-2.69 6-6s-2.69-6-6-6-6 2.69-6 6 2.69 6 6 6z"/>
                    </svg>
                  )}
                </div>
              </div>
              
              {/* Floating Social Icons (appear on hover) */}
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex gap-2 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 ease-out z-20">
                <Link href="#" className="h-10 w-10 rounded-full bg-background border border-border shadow-lg flex items-center justify-center text-foreground hover:bg-accent hover:text-white hover:border-accent transition-colors">
                  <Globe className="h-4 w-4" />
                </Link>
                <Link href="#" className="h-10 w-10 rounded-full bg-background border border-border shadow-lg flex items-center justify-center text-foreground hover:bg-accent hover:text-white hover:border-accent transition-colors">
                  <MessageSquare className="h-4 w-4" />
                </Link>
                <Link href="#" className="h-10 w-10 rounded-full bg-background border border-border shadow-lg flex items-center justify-center text-foreground hover:bg-accent hover:text-white hover:border-accent transition-colors">
                  <Mail className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* Content */}
            <div className="pt-4">
              <h3 className="text-2xl font-bold mb-1 text-foreground group-hover:text-accent transition-colors">
                {member.name}
              </h3>
              <p className="text-accent font-medium text-sm tracking-wide uppercase mb-4">
                {member.role}
              </p>
              <p className="text-muted text-sm leading-relaxed max-w-[280px] mx-auto">
                {member.bio}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
