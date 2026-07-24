import type { PriceBookVolume } from "./types";

/** MernCrest Solutions — Master Price Book 2026–2027 · Volume 01 */
export const volume01Branding: PriceBookVolume = {
  id: "volume-01-branding",
  title: "Branding & Creative Solutions",
  subtitle: "Volume 01 — Master Price Book 2026–2027",
  fiscalYear: "2026–2027",
  services: [
    {
      serviceNumber: 16,
      slug: "ui-design",
      name: "UI Design",
      packages: [
        { tier: "basic", label: "Basic", priceLkr: 15_000 },
        { tier: "professional", label: "Professional", priceLkr: 35_000 },
        { tier: "enterprise", label: "Enterprise", priceLkr: 75_000 },
      ],
      includes: ["Desktop Design", "Mobile Design", "Figma Source", "Prototype"],
    },
    {
      serviceNumber: 17,
      slug: "ux-design",
      name: "UX Design",
      packages: [
        { tier: "basic", label: "Basic", priceLkr: 20_000 },
        { tier: "professional", label: "Professional", priceLkr: 45_000 },
        { tier: "enterprise", label: "Enterprise", priceLkr: 90_000 },
      ],
      includes: ["User Journey", "Wireframes", "Interactive Prototype", "UX Research"],
    },
    {
      serviceNumber: 18,
      slug: "social-media-branding-kit",
      name: "Social Media Branding Kit",
      packages: [
        { tier: "basic", label: "Basic", priceLkr: 12_000 },
        { tier: "professional", label: "Professional", priceLkr: 25_000 },
        { tier: "enterprise", label: "Enterprise", priceLkr: 45_000 },
      ],
      includes: ["Facebook", "Instagram", "LinkedIn", "YouTube", "TikTok"],
    },
    {
      serviceNumber: 19,
      slug: "presentation-design",
      name: "Presentation Design",
      packages: [
        { tier: "basic", label: "Basic", priceLkr: 8_000 },
        { tier: "professional", label: "Professional", priceLkr: 20_000 },
        { tier: "enterprise", label: "Enterprise", priceLkr: 40_000 },
      ],
      includes: ["PowerPoint", "Google Slides", "PDF"],
    },
    {
      serviceNumber: 20,
      slug: "brand-guidelines-manual",
      name: "Brand Guidelines Manual",
      packages: [
        { tier: "basic", label: "Basic", priceLkr: 20_000 },
        { tier: "professional", label: "Professional", priceLkr: 45_000 },
        { tier: "enterprise", label: "Enterprise", priceLkr: 90_000 },
      ],
      includes: [
        "Logo Usage",
        "Color Rules",
        "Typography",
        "Icon Guidelines",
        "Photography Style",
        "Marketing Standards",
        "Brand Assets",
      ],
    },
  ],
  addOns: [
    { name: "Extra Revision", priceLkr: 1_000 },
    { name: "Source Files (AI/EPS)", priceLkr: 3_000 },
    { name: "Express Delivery (24 Hours)", priceLkr: 5_000 },
    { name: "Additional Concept", priceLkr: 2_500 },
    { name: "Stock Image License", priceLkr: null, priceNote: "Actual Cost + 15%" },
    { name: "Commercial Font License", priceLkr: null, priceNote: "Actual Cost + 15%" },
  ],
  deliveryTimes: [
    { serviceType: "Logo Design", delivery: "2–7 Days" },
    { serviceType: "Business Card", delivery: "1–2 Days" },
    { serviceType: "Flyer / Poster", delivery: "1–3 Days" },
    { serviceType: "Company Profile", delivery: "5–10 Days" },
    { serviceType: "Brand Identity", delivery: "7–14 Days" },
  ],
  paymentTerms: ["50% Advance Payment", "50% Before Final File Delivery"],
  warrantyAndSupport: [
    "30–90 Days Free Minor Revisions (depending on the service)",
    "Final source files are delivered after full payment.",
    "Major redesigns, new concepts, or scope changes are quoted separately.",
    "All commercial licenses for fonts, stock photos, or third-party assets are charged separately unless explicitly included.",
  ],
};
