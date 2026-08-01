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

export const GRADIENT_THEMES: Record<
  string,
  { card: string; glow: string; badge: string }
> = {
  blue: {
    card: "from-blue-600/90 via-blue-700/80 to-slate-900/95",
    glow: "shadow-[0_20px_60px_-15px_rgba(37,99,235,0.45)]",
    badge: "bg-blue-500/20 text-blue-100 border-blue-400/30",
  },
  purple: {
    card: "from-violet-600/90 via-purple-700/80 to-slate-900/95",
    glow: "shadow-[0_20px_60px_-15px_rgba(124,58,237,0.45)]",
    badge: "bg-violet-500/20 text-violet-100 border-violet-400/30",
  },
  green: {
    card: "from-emerald-600/90 via-teal-700/80 to-slate-900/95",
    glow: "shadow-[0_20px_60px_-15px_rgba(16,185,129,0.45)]",
    badge: "bg-emerald-500/20 text-emerald-100 border-emerald-400/30",
  },
};
