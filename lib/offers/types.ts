export type PublicOffer = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  price: string | null;
  badge: string | null;
  category: string | null;
  imageUrl: string | null;
  bannerImageUrl: string | null;
  features: string[];
  gradientTheme: string;
  ctaText: string;
  ctaUrl: string | null;
  priority: number;
  sortOrder: number;
  seoTitle: string | null;
  seoDescription: string | null;
};

/** Stitch offer card accents per theme */
export const OFFER_THEME_ACCENTS: Record<
  string,
  { a: string; b: string; chip: string; label: string }
> = {
  blue: {
    a: "#2563eb",
    b: "#4f46e5",
    chip: "border-blue-200/80 bg-blue-50 text-blue-800",
    label: "Enterprise",
  },
  purple: {
    a: "#7c3aed",
    b: "#db2777",
    chip: "border-violet-200/80 bg-violet-50 text-violet-800",
    label: "Mobile",
  },
  green: {
    a: "#059669",
    b: "#0d9488",
    chip: "border-emerald-200/80 bg-emerald-50 text-emerald-800",
    label: "Finance",
  },
};

/** @deprecated use OFFER_THEME_ACCENTS — kept for non-poster fallback cards */
export const GRADIENT_THEMES: Record<
  string,
  {
    card: string;
    glow: string;
    badge: string;
    cta: string;
    footer: string;
    ring: string;
    ctaGlow: string;
  }
> = {
  blue: {
    card: "from-blue-600/90 via-blue-700/80 to-slate-900/95",
    glow: "shadow-[0_20px_60px_-15px_rgba(37,99,235,0.45)]",
    badge: "bg-blue-500/20 text-blue-100 border-blue-400/30",
    cta: "bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700",
    footer: "border-blue-100/80 bg-gradient-to-b from-blue-50/90 to-white",
    ring: "lg:group-hover:ring-blue-400/40",
    ctaGlow: "bg-blue-500/40",
  },
  purple: {
    card: "from-violet-600/90 via-purple-700/80 to-slate-900/95",
    glow: "shadow-[0_20px_60px_-15px_rgba(124,58,237,0.45)]",
    badge: "bg-violet-500/20 text-violet-100 border-violet-400/30",
    cta: "bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-700",
    footer: "border-violet-100/80 bg-gradient-to-b from-violet-50/90 to-white",
    ring: "lg:group-hover:ring-violet-400/40",
    ctaGlow: "bg-violet-500/40",
  },
  green: {
    card: "from-emerald-600/90 via-teal-700/80 to-slate-900/95",
    glow: "shadow-[0_20px_60px_-15px_rgba(16,185,129,0.45)]",
    badge: "bg-emerald-500/20 text-emerald-100 border-emerald-400/30",
    cta: "bg-gradient-to-r from-emerald-600 via-teal-600 to-green-700",
    footer: "border-emerald-100/80 bg-gradient-to-b from-emerald-50/90 to-white",
    ring: "lg:group-hover:ring-emerald-400/40",
    ctaGlow: "bg-emerald-500/40",
  },
};
