export interface ProjectCaseStudy {
  id: string;
  title: string;
  category: string;
  image: string;
  description: string;
  tech: string[];
  metric: string;
  featured: boolean;
  client?: string;
  duration?: string;
  overview: string;
  challenge: string;
  solution: string;
  results: {
    label: string;
    value: string;
  }[];
}

/**
 * Case studies are real client work only. Fabricated sample projects were
 * removed (no invented clients/metrics — see "no fabricated content" rule).
 * Real case studies are served from the CaseStudy table (see /api/portfolio);
 * this array stays empty until seeded with genuine, approved work.
 */
export const portfolioProjects: ProjectCaseStudy[] = [];

/** DB CaseStudy row (subset) used for public rendering. */
export interface CaseStudyRow {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  industry: string | null;
  category: string;
  techJson: string | null;
  problem: string | null;
  solution: string | null;
  resultsJson: string | null;
  coverImageUrl: string | null;
  clientName: string | null;
  duration: string | null;
  featured: boolean;
}

function safeJsonArray<T>(raw: string | null | undefined): T[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

/** Normalize a CaseStudy DB row into the portfolio card shape. */
export function caseStudyToCard(study: CaseStudyRow) {
  const results = safeJsonArray<{ label: string; value: string }>(study.resultsJson);
  return {
    id: study.id,
    slug: study.slug,
    title: study.title,
    category: study.industry || study.category || "Software",
    image: study.coverImageUrl,
    description: study.excerpt || study.problem,
    tech: safeJsonArray<string>(study.techJson),
    metric: results[0]?.value ?? null,
    featured: study.featured,
  };
}

export function caseStudyTech(study: CaseStudyRow): string[] {
  return safeJsonArray<string>(study.techJson);
}

export function caseStudyResults(study: CaseStudyRow): { label: string; value: string }[] {
  return safeJsonArray<{ label: string; value: string }>(study.resultsJson);
}
