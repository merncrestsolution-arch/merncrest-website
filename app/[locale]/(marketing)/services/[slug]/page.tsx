import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { 
  Code2, Globe, Smartphone, Cloud, Shield, Brain, 
  Megaphone, Briefcase, Server, CheckCircle2, ArrowRight
} from "lucide-react";

const validServices = [
  "software-development",
  "web-development",
  "mobile-app-development",
  "cloud-services",
  "cyber-security",
  "ai-solutions",
  "digital-marketing",
  "it-consulting",
  "hosting-domain",
];

const serviceContent: Record<string, any> = {
  "software-development": {
    title: "Custom Software Development",
    icon: Code2,
    description: "We build tailored, high-performance software solutions designed to solve your specific business challenges. From complex enterprise systems to nimble microservices, our engineering team delivers excellence.",
    features: [
      { title: "Enterprise Architecture", desc: "Scalable, secure, and resilient system design." },
      { title: "API Development", desc: "RESTful and GraphQL APIs for seamless integrations." },
      { title: "Legacy Modernization", desc: "Upgrading outdated systems to modern tech stacks." }
    ],
    benefits: ["100% custom-fit to your workflows", "No vendor lock-in", "Infinite scalability"]
  },
  "web-development": {
    title: "Web Platform Development",
    icon: Globe,
    description: "Create stunning, lightning-fast web applications that engage users and drive conversions. We specialize in modern frameworks like Next.js, React, and Vue.",
    features: [
      { title: "Responsive Design", desc: "Flawless experiences across all devices and screen sizes." },
      { title: "Progressive Web Apps", desc: "App-like experiences right in the browser." },
      { title: "E-Commerce", desc: "High-conversion headless commerce architectures." }
    ],
    benefits: ["Sub-second page load times", "SEO-optimized architecture", "Accessible to all users"]
  },
  "mobile-app-development": {
    title: "Mobile App Development",
    icon: Smartphone,
    description: "Reach your users wherever they are with beautiful, intuitive native and cross-platform mobile applications for iOS and Android.",
    features: [
      { title: "React Native & Flutter", desc: "Cost-effective cross-platform development." },
      { title: "Native iOS/Android", desc: "Maximum performance utilizing Swift and Kotlin." },
      { title: "UI/UX Design", desc: "Pixel-perfect, gesture-driven mobile interfaces." }
    ],
    benefits: ["Access to device hardware", "Offline capabilities", "Push notification engagement"]
  },
  "cloud-services": {
    title: "Cloud Infrastructure",
    icon: Cloud,
    description: "Migrate, manage, and optimize your infrastructure on AWS, Google Cloud, or Azure. We ensure your applications are always online and cost-efficient.",
    features: [
      { title: "Cloud Migration", desc: "Zero-downtime transitions to cloud environments." },
      { title: "DevOps Automation", desc: "CI/CD pipelines for rapid, reliable deployments." },
      { title: "Serverless Computing", desc: "Auto-scaling architectures that reduce idle costs." }
    ],
    benefits: ["99.99% Guaranteed Uptime", "Automated disaster recovery", "Optimized monthly billing"]
  },
  "cyber-security": {
    title: "Cyber Security Solutions",
    icon: Shield,
    description: "Protect your digital assets, customer data, and brand reputation with our military-grade cybersecurity audits and implementations.",
    features: [
      { title: "Penetration Testing", desc: "Identifying vulnerabilities before hackers do." },
      { title: "Compliance Audits", desc: "Ensuring HIPAA, GDPR, and SOC2 compliance." },
      { title: "Real-time Monitoring", desc: "24/7 threat detection and incident response." }
    ],
    benefits: ["Ironclad data encryption", "Regulatory peace of mind", "Zero-trust architectures"]
  },
  "ai-solutions": {
    title: "AI & Machine Learning",
    icon: Brain,
    description: "Harness the power of artificial intelligence to automate processes, generate insights, and create entirely new user experiences.",
    features: [
      { title: "Custom LLM Integration", desc: "Deploying ChatGPT-like models on your proprietary data." },
      { title: "Predictive Analytics", desc: "Forecasting trends using historical data." },
      { title: "Computer Vision", desc: "Automated image and video analysis systems." }
    ],
    benefits: ["Massive efficiency gains", "Data-driven decision making", "24/7 automated support"]
  },
  "digital-marketing": {
    title: "Digital Marketing & SEO",
    icon: Megaphone,
    description: "Amplify your brand's voice. We use data-driven strategies across SEO, content, and paid media to drive qualified traffic and exponential growth.",
    features: [
      { title: "Technical SEO", desc: "Optimizing your codebase for Google's crawlers." },
      { title: "Performance Marketing", desc: "High-ROI campaigns across social and search." },
      { title: "Conversion Optimization", desc: "A/B testing to turn more visitors into buyers." }
    ],
    benefits: ["Increased organic traffic", "Lower customer acquisition costs", "Higher brand authority"]
  },
  "it-consulting": {
    title: "Strategic IT Consulting",
    icon: Briefcase,
    description: "Not sure which technology is right for your business? Our veteran architects provide strategic guidance to align your IT with your business goals.",
    features: [
      { title: "Technology Roadmaps", desc: "Multi-year planning for tech investments." },
      { title: "Vendor Assessment", desc: "Unbiased evaluation of third-party tools." },
      { title: "Team Augmentation", desc: "Scaling your internal capabilities rapidly." }
    ],
    benefits: ["Avoid costly tech debt", "Align IT with business KPIs", "Objective expert advice"]
  },
  "hosting-domain": {
    title: "Hosting & Domain Management",
    icon: Server,
    description: "Reliable, blazing-fast hosting and secure domain registration. Let us handle the technical plumbing so you can focus on your business.",
    features: [
      { title: "Managed Hosting", desc: "Fully managed VPS and dedicated servers." },
      { title: "Domain Privacy", desc: "Protecting your WHOIS information." },
      { title: "SSL Certificates", desc: "End-to-end encryption setup and renewal." }
    ],
    benefits: ["Ultra-fast TTFB", "Automated daily backups", "24/7 technical support"]
  }
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { slug } = await params;
  if (!validServices.includes(slug)) return {};
  
  const data = serviceContent[slug];
  return { title: `${data?.title || slug} | MERNcrest Solutions` };
}

export default async function ServiceSubPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  
  if (!validServices.includes(slug)) notFound();

  const data = serviceContent[slug];
  const Icon = data.icon;

  return (
    <div className="container-wide section-padding pt-32 min-h-screen">
      {/* Hero Section */}
      <div className="max-w-4xl mb-24">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-sm font-medium mb-6">
          <Icon className="h-4 w-4" />
          <span>Core Service</span>
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 font-display text-balance tracking-tight">
          {data.title}
        </h1>
        <p className="text-xl text-muted leading-relaxed max-w-3xl">
          {data.description}
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-12 mb-24">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-12">
          <div>
            <h2 className="text-3xl font-bold mb-8">What We Deliver</h2>
            <div className="grid sm:grid-cols-2 gap-6">
              {data.features.map((feature: any, i: number) => (
                <div key={i} className="glass-panel p-6 rounded-2xl border border-white/5 hover:border-accent/30 transition-colors">
                  <h3 className="text-xl font-bold mb-3 text-foreground">{feature.title}</h3>
                  <p className="text-muted leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          <div className="glass-card p-8 rounded-3xl border border-white/5">
            <h3 className="text-xl font-bold mb-6">Key Benefits</h3>
            <ul className="space-y-4">
              {data.benefits.map((benefit: string, i: number) => (
                <li key={i} className="flex items-start gap-3 text-muted">
                  <CheckCircle2 className="h-6 w-6 text-accent shrink-0" />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="glass-card p-8 rounded-3xl border border-accent/20 bg-accent/5 relative overflow-hidden text-center">
            <div className="absolute inset-0 bg-gradient-to-b from-accent/10 to-transparent pointer-events-none" />
            <h3 className="text-2xl font-bold mb-4 relative z-10">Ready to start?</h3>
            <p className="text-muted mb-6 relative z-10">
              Let's discuss how our {data.title.toLowerCase()} can transform your business.
            </p>
            <Button asChild className="w-full relative z-10 h-12">
              <Link href="/contact">Get a Free Quote <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
