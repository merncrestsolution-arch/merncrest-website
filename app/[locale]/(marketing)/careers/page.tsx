import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHero } from "@/components/ui/page-hero";
import { MapPin, Clock, Briefcase } from "lucide-react";
import { ShareButton } from "@/components/ui/share-button";
import { ApplyButton } from "@/components/forms/apply-button";
import { getOpenJobs } from "@/lib/cms";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "nav" });
  const title = `${t("careers")} | MernCrest Solutions`;
  const description =
    "Internships and roles at MernCrest — learn the MERN stack, cloud, and AI on real projects with mentorship.";
  return {
    title,
    description,
    alternates: { canonical: "https://merncrest.lk/careers" },
    openGraph: { title, description, url: "https://merncrest.lk/careers", type: "website" },
  };
}

const employmentLabel: Record<string, string> = {
  FULL_TIME: "Full-time",
  PART_TIME: "Part-time",
  CONTRACT: "Contract",
  INTERNSHIP: "Internship",
};

const perks = [
  "Hands-on mentorship from working engineers",
  "Real client projects, not throwaway exercises",
  "Flexible remote / hybrid (Colombo) schedule",
  "Certificate and reference on successful completion",
];

export default async function CareersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const { all } = await getOpenJobs();

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
              <h3 className="font-display text-xl font-bold text-foreground mb-4">Why MernCrest?</h3>
              <ul className="space-y-4 text-sm text-muted">
                {perks.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-500/20 text-stitch-glow text-xs">
                      ✓
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="lg:col-span-8 space-y-5">
            <h3 className="font-display text-xl font-bold text-foreground">Open Positions</h3>
            {all.length === 0 && (
              <div className="stitch-card text-muted">
                No open positions right now. Send your CV to{" "}
                <a href="mailto:careers@merncrest.lk" className="text-accent hover:underline">
                  careers@merncrest.lk
                </a>{" "}
                and we&apos;ll reach out when a role opens.
              </div>
            )}
            {all.map((job) => (
              <div key={job.id} id={job.id} className="stitch-card stitch-card-hover scroll-mt-32">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 mb-4">
                  <div>
                    <h4 className="font-display text-lg font-semibold text-foreground mb-2">
                      {job.title}
                    </h4>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted">
                      {job.department && (
                        <span className="flex items-center gap-1.5">
                          <Briefcase className="h-4 w-4" /> {job.department}
                        </span>
                      )}
                      {job.location && (
                        <span className="flex items-center gap-1.5">
                          <MapPin className="h-4 w-4" /> {job.location}
                        </span>
                      )}
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-4 w-4" />{" "}
                        {employmentLabel[job.employmentType] || job.employmentType}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <ShareButton jobId={job.id} />
                    <ApplyButton jobId={job.id} jobTitle={job.title} />
                  </div>
                </div>
                {job.description && (
                  <p className="text-sm text-muted leading-relaxed">{job.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
