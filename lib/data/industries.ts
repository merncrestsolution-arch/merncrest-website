export type Industry = {
  slug: string;
  title: string;
  description: string;
};

export const industries: Industry[] = [
  {
    slug: "manufacturing",
    title: "Manufacturing",
    description:
      "We build production planning, shop-floor tracking, industrial IoT dashboards, and predictive maintenance systems for factories.",
  },
  {
    slug: "distribution",
    title: "Distribution",
    description:
      "We digitize warehouse operations, inventory control, procurement, and multi-branch distribution workflows.",
  },
  {
    slug: "retail-wholesale",
    title: "Retail & Wholesale",
    description:
      "We deliver POS, omnichannel retail, inventory sync, and wholesale order management for retailers and distributors.",
  },
  {
    slug: "healthcare",
    title: "Healthcare",
    description:
      "We develop clinic, hospital, and telehealth platforms with secure patient records and appointment workflows.",
  },
  {
    slug: "education",
    title: "Education",
    description:
      "We implement LMS, admissions, campus management, and school administration systems for institutes.",
  },
  {
    slug: "hospitality",
    title: "Hospitality",
    description:
      "We build booking engines, restaurant POS, kitchen management, and guest experience platforms for hotels and F&B.",
  },
  {
    slug: "construction",
    title: "Construction",
    description:
      "We create project tracking, field service, procurement, and site operations software for construction firms.",
  },
  {
    slug: "finance",
    title: "Finance",
    description:
      "We develop accounting systems, compliance-aware fintech apps, and financial reporting for finance teams.",
  },
  {
    slug: "logistics",
    title: "Logistics & Transportation",
    description:
      "We build fleet tracking, warehouse management, route optimization, and supply-chain visibility tools.",
  },
  {
    slug: "government",
    title: "Government Organizations",
    description:
      "We develop citizen service portals, secure departmental workflows, and digital government platforms.",
  },
  {
    slug: "ngos",
    title: "NGOs",
    description:
      "We implement donor management, program tracking, and field operations systems for non-profit organizations.",
  },
  {
    slug: "sme-enterprise",
    title: "SMEs & Large Enterprises",
    description:
      "We deliver scalable ERP, CRM, and custom digital platforms that grow with your business from SME to enterprise.",
  },
];
