export type PricingTier = {
  id: string;
  name: string;
  price: string;
  period: string;
  description: string;
  featured?: boolean;
  features: string[];
  cta: string;
  href: string;
};

export const pricingTiers: PricingTier[] = [
  {
    id: "starter",
    name: "Starter",
    price: "LKR 9,900",
    period: "/month",
    description: "For small teams launching their first digital presence.",
    features: [
      "Business website or landing page",
      "Domain + SSL setup guidance",
      "Shared hosting starter pack",
      "Email support",
      "Knowledge base access",
    ],
    cta: "Get Started",
    href: "/register",
  },
  {
    id: "growth",
    name: "Growth",
    price: "LKR 29,900",
    period: "/month",
    description: "For growing businesses that need hosting, CRM hooks, and support.",
    featured: true,
    features: [
      "Everything in Starter",
      "cPanel or VPS hosting options",
      "Customer portal access",
      "Priority ticket support",
      "WhatsApp care channel",
      "Monthly performance report",
    ],
    cta: "Choose Growth",
    href: "/register",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "Full ERP/CRM, cloud, SLA, and dedicated operations.",
    features: [
      "Custom enterprise software",
      "Dedicated account manager",
      "AWS / cloud architecture",
      "SLA-backed support",
      "CRM + billing integration",
      "Onboarding & training",
    ],
    cta: "Talk to Sales",
    href: "/contact",
  },
];
