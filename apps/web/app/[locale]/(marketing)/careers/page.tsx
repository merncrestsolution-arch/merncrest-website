import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { ArrowRight, MapPin, Clock, Briefcase, Share2 } from "lucide-react";
import { ShareButton } from "@/components/ui/share-button";
import { ApplyButton } from "@/components/forms/apply-button";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "nav" });

  return {
    title: `${t("careers")} | MERNcrest Solutions`,
  };
}

const openPositions = [
  {
    id: "junior-software-developer",
    title: "Junior Software Developer",
    department: "Engineering",
    location: "Remote",
    type: "Internship (Unpaid)",
    description: "Kickstart your career in full-stack development. Learn modern frameworks, contribute to live projects, and get mentored by industry experts."
  },
  {
    id: "python-developer-intern",
    title: "Python Developer Intern",
    department: "Engineering",
    location: "Remote / Colombo",
    type: "Internship (Unpaid)",
    description: "Gain hands-on experience in backend engineering and automation. Work alongside senior engineers on real-world Python projects."
  }
];

export default async function CareersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="container-wide section-padding pt-32 min-h-screen">
      <div className="text-center max-w-2xl mx-auto mb-20">
        <p className="text-accent font-mono text-sm uppercase tracking-wider mb-3">
          Join Our Team
        </p>
        <h1 className="text-4xl sm:text-5xl font-bold mb-6 font-display text-balance">
          Build the Future of Tech with Us
        </h1>
        <p className="text-muted text-lg">
          We are always looking for passionate, driven individuals to join our mission of transforming businesses through software.
        </p>
      </div>

      <div className="grid lg:grid-cols-12 gap-12">
        <div className="lg:col-span-4 space-y-8">
          <div className="glass-card p-8 rounded-3xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-32 h-32 bg-accent/10 blur-[40px] rounded-full pointer-events-none" />
            <h3 className="text-2xl font-bold mb-4">Why MERNcrest?</h3>
            <ul className="space-y-4 text-muted">
              <li className="flex items-start gap-3">
                <span className="h-6 w-6 rounded-full bg-accent/20 text-accent flex items-center justify-center shrink-0 mt-0.5">✓</span>
                Competitive salary and equity options
              </li>
              <li className="flex items-start gap-3">
                <span className="h-6 w-6 rounded-full bg-accent/20 text-accent flex items-center justify-center shrink-0 mt-0.5">✓</span>
                Flexible hybrid/remote work culture
              </li>
              <li className="flex items-start gap-3">
                <span className="h-6 w-6 rounded-full bg-accent/20 text-accent flex items-center justify-center shrink-0 mt-0.5">✓</span>
                Comprehensive health insurance
              </li>
              <li className="flex items-start gap-3">
                <span className="h-6 w-6 rounded-full bg-accent/20 text-accent flex items-center justify-center shrink-0 mt-0.5">✓</span>
                Continuous learning and development budget
              </li>
            </ul>
          </div>
        </div>

        <div className="lg:col-span-8 space-y-6">
          <h3 className="text-2xl font-bold mb-6">Open Positions</h3>
          {openPositions.map((job, i) => (
            <div key={i} id={job.id} className="glass-card p-6 sm:p-8 rounded-2xl hover:border-accent/30 dark:hover:border-accent/30 transition-all group scroll-mt-32">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-4">
                <div>
                  <h4 className="text-xl font-bold text-foreground dark:text-white group-hover:text-accent transition-colors mb-2">
                    {job.title}
                  </h4>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted">
                    <span className="flex items-center gap-1.5"><Briefcase className="h-4 w-4" /> {job.department}</span>
                    <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {job.location}</span>
                    <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> {job.type}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <ShareButton jobId={job.id} />
                  <ApplyButton jobTitle={job.title} />
                </div>
              </div>
              <p className="text-muted leading-relaxed">
                {job.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
