import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHero } from "@/components/ui/page-hero";
import { MapPin, Clock, Briefcase } from "lucide-react";
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
    description:
      "Kickstart your career in full-stack development. Learn modern frameworks, contribute to live projects, and get mentored by industry experts.",
  },
  {
    id: "python-developer-intern",
    title: "Python Developer Intern",
    department: "Engineering",
    location: "Remote / Colombo",
    type: "Internship (Unpaid)",
    description:
      "Gain hands-on experience in backend engineering and automation. Work alongside senior engineers on real-world Python projects.",
  },
];

export default async function CareersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="stitch-page">
      <PageHero
        eyebrow="Join Our Team"
        title="Build the future of tech with us"
        description="We are always looking for passionate, driven individuals to join our mission of transforming businesses through software."
      />

      <div className="stitch-page-body">
        <div className="grid lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4">
            <div className="stitch-card relative overflow-hidden sticky top-28">
              <div className="pointer-events-none absolute top-0 left-0 h-24 w-24 rounded-full bg-violet-500/15 blur-[40px]" />
              <h3 className="font-display text-xl font-bold text-white mb-4">Why MERNcrest?</h3>
              <ul className="space-y-4 text-sm text-muted">
                {[
                  "Competitive salary and equity options",
                  "Flexible hybrid/remote work culture",
                  "Comprehensive health insurance",
                  "Continuous learning and development budget",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-500/20 text-violet-300 text-xs">
                      ✓
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="lg:col-span-8 space-y-5">
            <h3 className="font-display text-xl font-bold text-white">Open Positions</h3>
            {openPositions.map((job) => (
              <div
                key={job.id}
                id={job.id}
                className="stitch-card stitch-card-hover scroll-mt-32"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 mb-4">
                  <div>
                    <h4 className="font-display text-lg font-semibold text-white mb-2">
                      {job.title}
                    </h4>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted">
                      <span className="flex items-center gap-1.5">
                        <Briefcase className="h-4 w-4" /> {job.department}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <MapPin className="h-4 w-4" /> {job.location}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-4 w-4" /> {job.type}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <ShareButton jobId={job.id} />
                    <ApplyButton jobTitle={job.title} />
                  </div>
                </div>
                <p className="text-sm text-muted leading-relaxed">{job.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
