export type Industry = {
  slug: string;
  title: string;
  description: string;
};

export const industries: Industry[] = [
  { slug: "ecommerce", title: "E-Commerce", description: "High-conversion stores, inventory sync, and payment flows." },
  { slug: "healthcare", title: "Healthcare", description: "Clinic, hospital, and telehealth platforms with secure records." },
  { slug: "education", title: "Education", description: "LMS, admissions, and campus digital systems." },
  { slug: "fintech", title: "FinTech", description: "Secure financial apps, wallets, and compliance-aware UX." },
  { slug: "real-estate", title: "Real Estate", description: "Listings, CRM, and property operations software." },
  { slug: "logistics", title: "Logistics", description: "Fleet, warehouse, and supply-chain visibility." },
  { slug: "manufacturing", title: "Manufacturing", description: "Production, maintenance, and industrial IoT." },
  { slug: "hospitality", title: "Hospitality", description: "Booking, POS, and guest experience platforms." },
  { slug: "government", title: "Public Sector", description: "Citizen services, workflows, and secure portals." },
  { slug: "retail", title: "Retail", description: "POS, inventory, and omnichannel retail systems." },
];
