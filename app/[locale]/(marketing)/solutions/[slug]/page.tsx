import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { 
  ShoppingCart, Activity, GraduationCap, Landmark, 
  Building, Truck, Database, Users, Store, Calendar, 
  Cloud, Wifi, Brain, Lock, CheckCircle2, ArrowRight
} from "lucide-react";

const validSolutions = [
  "ecommerce", "healthcare", "education", "fintech", 
  "realestate", "logistics", "erp", "crm", "pos", 
  "booking", "saas", "iot", "aiml", "blockchain",
];

const solutionContent: Record<string, any> = {
  "ecommerce": {
    title: "E-Commerce Solutions",
    icon: ShoppingCart,
    description: "Scale your online retail business with high-conversion headless commerce platforms, secure payment gateways, and lightning-fast storefronts.",
    features: [
      { title: "Headless Architecture", desc: "Decoupled frontend for ultra-fast load times." },
      { title: "Secure Checkout", desc: "PCI-DSS compliant payment processing integrations." },
      { title: "Inventory Sync", desc: "Real-time updates across multiple sales channels." }
    ],
    benefits: ["Higher conversion rates", "Global scalability", "Seamless mobile shopping"]
  },
  "healthcare": {
    title: "Healthcare Tech",
    icon: Activity,
    description: "Secure, HIPAA-compliant telehealth applications, patient portals, and hospital management systems designed to improve patient outcomes.",
    features: [
      { title: "Telemedicine Video", desc: "High-definition, secure patient consultations." },
      { title: "EHR Integration", desc: "Seamless syncing with electronic health records." },
      { title: "Appointment Scheduling", desc: "Automated booking and SMS reminders." }
    ],
    benefits: ["HIPAA / GDPR Compliance", "Reduced no-show rates", "Streamlined clinic operations"]
  },
  "education": {
    title: "EdTech Platforms",
    icon: GraduationCap,
    description: "Interactive Learning Management Systems (LMS), virtual classrooms, and student portals that make remote learning engaging.",
    features: [
      { title: "Virtual Classrooms", desc: "Integrated WebRTC for live lectures." },
      { title: "Course Management", desc: "Intuitive builder for quizzes and assignments." },
      { title: "Progress Analytics", desc: "Data-driven insights into student performance." }
    ],
    benefits: ["Global student reach", "Automated grading", "Interactive video learning"]
  },
  "fintech": {
    title: "Financial Technology",
    icon: Landmark,
    description: "Bank-grade security and blazing-fast performance for digital wallets, trading platforms, and custom payment processors.",
    features: [
      { title: "Payment Gateways", desc: "Custom API integrations for seamless transfers." },
      { title: "Fraud Detection", desc: "AI-driven real-time transaction monitoring." },
      { title: "Open Banking", desc: "Secure Plaid/Stripe API connections." }
    ],
    benefits: ["Bank-grade encryption", "Real-time ledger updates", "Regulatory compliance"]
  },
  "realestate": {
    title: "Real Estate Portals",
    icon: Building,
    description: "Immersive property listing platforms featuring virtual tours, CRM integrations for agents, and automated lead generation.",
    features: [
      { title: "Property Search", desc: "Advanced geospatial mapping and filtering." },
      { title: "Agent Dashboards", desc: "Lead tracking and listing management." },
      { title: "Virtual Tours", desc: "Integrated 360-degree property viewing." }
    ],
    benefits: ["Increased lead capture", "Faster property sales", "Automated agent workflows"]
  },
  "logistics": {
    title: "Logistics & Supply Chain",
    icon: Truck,
    description: "Real-time fleet tracking, inventory management, and route optimization software for modern supply chains.",
    features: [
      { title: "Fleet Tracking", desc: "Live GPS mapping and delivery status." },
      { title: "Route Optimization", desc: "Algorithmic routing to save fuel and time." },
      { title: "Warehouse Management", desc: "Barcode scanning and stock control." }
    ],
    benefits: ["Reduced delivery times", "Lower operational costs", "Complete supply chain visibility"]
  },
  "erp": {
    title: "Enterprise Resource Planning",
    icon: Database,
    description: "Unify your entire business operations—from HR to finance to inventory—in one centralized, custom-built ERP system.",
    features: [
      { title: "Financial Hub", desc: "Automated accounting and tax reporting." },
      { title: "HR Module", desc: "Payroll, attendance, and performance tracking." },
      { title: "Supply Chain", desc: "End-to-end procurement and vendor management." }
    ],
    benefits: ["Eliminate data silos", "Automate manual data entry", "Real-time enterprise reporting"]
  },
  "crm": {
    title: "Customer Relationship Management",
    icon: Users,
    description: "Custom CRM platforms tailored specifically to your sales funnel to track leads, manage pipelines, and close deals faster.",
    features: [
      { title: "Pipeline Management", desc: "Drag-and-drop Kanban deal tracking." },
      { title: "Email Automation", desc: "Automated follow-ups and drip campaigns." },
      { title: "Sales Analytics", desc: "Custom dashboards for revenue forecasting." }
    ],
    benefits: ["Higher sales win-rates", "Zero lost leads", "Centralized customer communication"]
  },
  "pos": {
    title: "Point of Sale Systems",
    icon: Store,
    description: "Cloud-based POS software for retail and restaurants that works offline, syncs inventory instantly, and tracks shift performance.",
    features: [
      { title: "Cloud Sync", desc: "Real-time sales data accessible anywhere." },
      { title: "Hardware Integration", desc: "Receipt printers, scanners, and cash drawers." },
      { title: "Staff Management", desc: "Shift tracking and permissions control." }
    ],
    benefits: ["Faster checkout times", "Accurate inventory tracking", "Detailed shift reports"]
  },
  "booking": {
    title: "Booking & Reservations",
    icon: Calendar,
    description: "Smart booking engines for hotels, salons, and events that prevent double-booking and automate customer communications.",
    features: [
      { title: "Dynamic Availability", desc: "Real-time calendar syncing across platforms." },
      { title: "Online Payments", desc: "Secure deposit processing upon booking." },
      { title: "Automated Reminders", desc: "Email and SMS notifications to reduce no-shows." }
    ],
    benefits: ["24/7 online booking", "Zero double-bookings", "Guaranteed deposits"]
  },
  "saas": {
    title: "SaaS Product Development",
    icon: Cloud,
    description: "From MVP to enterprise scale, we design and build multi-tenant Software-as-a-Service platforms with built-in billing systems.",
    features: [
      { title: "Multi-tenancy", desc: "Secure data isolation between customer accounts." },
      { title: "Subscription Billing", desc: "Stripe integration for tiered pricing plans." },
      { title: "Admin Dashboards", desc: "Super-admin views for managing total platform health." }
    ],
    benefits: ["Fast time to market", "Scalable cloud architecture", "Automated recurring billing"]
  },
  "iot": {
    title: "Internet of Things",
    icon: Wifi,
    description: "Connect physical devices to the cloud. We build the software that aggregates, visualizes, and controls your hardware sensors.",
    features: [
      { title: "Device Telemetry", desc: "High-frequency data ingestion from sensors." },
      { title: "Remote Control", desc: "Over-the-air commands and firmware updates." },
      { title: "Real-time Dashboards", desc: "Live visualization of hardware metrics." }
    ],
    benefits: ["Instant fault detection", "Predictive maintenance", "Centralized device management"]
  },
  "aiml": {
    title: "AI & Machine Learning",
    icon: Brain,
    description: "Integrate LLMs, computer vision, and predictive analytics into your proprietary software to gain an unfair market advantage.",
    features: [
      { title: "Custom AI Chatbots", desc: "Support agents trained purely on your company data." },
      { title: "Computer Vision", desc: "Automated image processing and object detection." },
      { title: "Predictive Analytics", desc: "Forecasting future trends from historical data." }
    ],
    benefits: ["Massive operational efficiency", "24/7 automated support", "Data-driven decision making"]
  },
  "blockchain": {
    title: "Blockchain & Web3",
    icon: Lock,
    description: "Smart contract development, decentralized apps (dApps), and private blockchain implementations for absolute data transparency.",
    features: [
      { title: "Smart Contracts", desc: "Immutable, automated contract execution on Ethereum/Solana." },
      { title: "Tokenization", desc: "Creating utility tokens and NFTs." },
      { title: "Crypto Wallets", desc: "Secure integrations for sending and receiving assets." }
    ],
    benefits: ["Immutable data records", "Trustless transactions", "Decentralized security"]
  }
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { slug } = await params;
  if (!validSolutions.includes(slug)) return {};
  
  const data = solutionContent[slug];
  return { title: `${data?.title || slug} Solution | MERNcrest Solutions` };
}

export default async function SolutionSubPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  
  if (!validSolutions.includes(slug)) notFound();

  const data = solutionContent[slug];
  const Icon = data.icon;

  return (
    <div className="stitch-page">
      <div className="stitch-container pt-32 pb-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-sm font-medium text-violet-300 mb-6">
          <Icon className="h-4 w-4" />
          <span>Industry Solution</span>
        </div>
        <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-white text-balance tracking-tight max-w-4xl">
          {data.title}
        </h1>
        <p className="mt-4 text-lg text-muted leading-relaxed max-w-3xl">{data.description}</p>
      </div>

      <div className="stitch-page-body !pt-0">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <h2 className="font-display text-2xl font-bold text-white mb-6">What We Deliver</h2>
            <div className="grid sm:grid-cols-2 gap-5">
              {data.features.map((feature: { title: string; desc: string }, i: number) => (
                <div key={i} className="stitch-card stitch-card-hover">
                  <h3 className="font-display text-lg font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-5">
            <div className="stitch-card">
              <h3 className="font-display text-lg font-semibold text-white mb-5">Key Benefits</h3>
              <ul className="space-y-4">
                {data.benefits.map((benefit: string, i: number) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-muted">
                    <CheckCircle2 className="h-5 w-5 text-violet-300 shrink-0" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="stitch-card text-center relative overflow-hidden border-violet-500/20 bg-violet-500/[0.06]">
              <div className="pointer-events-none absolute inset-0 brand-mesh opacity-40" />
              <h3 className="relative z-10 font-display text-xl font-bold text-white mb-3">
                Transform Your Business
              </h3>
              <p className="relative z-10 text-sm text-muted mb-5">
                Let&apos;s discuss how our {data.title.toLowerCase()} software can drive your growth.
              </p>
              <Button asChild className="relative z-10 w-full rounded-full h-11">
                <Link href="/contact">
                  Get a Free Consultation <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
