import {
  BarChart3,
  Brain,
  Briefcase,
  Building2,
  Cloud,
  Code2,
  Cpu,
  Globe,
  GraduationCap,
  Headphones,
  Link2,
  Megaphone,
  Network,
  Palette,
  Server,
  Shield,
  Smartphone,
  type LucideIcon,
} from "lucide-react";

export type ServiceCategoryItem = {
  title: string;
  description: string;
  href: string;
};

export type ServiceCategory = {
  slug: string;
  title: string;
  icon: LucideIcon;
  summary: string;
  audience: string;
  items: ServiceCategoryItem[];
};

/**
 * Complete MernCrest service catalog with explanations of what we deliver.
 */
export const serviceCategories: ServiceCategory[] = [
  {
    slug: "enterprise-software",
    title: "Enterprise Software Solutions",
    icon: Building2,
    summary:
      "We design and implement modular enterprise platforms — ERP, CRM, HRM, finance, inventory, SCM, manufacturing, and projects — unified on one multi-tenant-ready stack integrated with your CRM, notifications, and audit logs.",
    audience: "Organizations replacing spreadsheets and disconnected departmental tools.",
    items: [
      {
        title: "ERP Packages & Pricing",
        description:
          "Official price book for starter ERP, industry modules, AI-powered ERP, and enterprise digital transformation suites.",
        href: "/services/erp",
      },
      {
        title: "Enterprise Resource Planning (ERP)",
        description:
          "We unify finance, inventory, HR, procurement, and operations in one system with role-based access, approvals, and real-time reporting.",
        href: "/solutions/erp",
      },
      {
        title: "Enterprise Asset Management (EAM)",
        description:
          "We track physical and digital assets across their lifecycle — acquisition, maintenance, depreciation, and disposal — with audit trails.",
        href: "/solutions",
      },
      {
        title: "Enterprise Service Management (ESM)",
        description:
          "We standardize internal service delivery with request workflows, SLAs, and department routing so IT, HR, and facilities run on one platform.",
        href: "/solutions",
      },
      {
        title: "Field Service Management (FSM)",
        description:
          "We build dispatch, scheduling, and mobile job-tracking tools so field teams close work orders with live status and customer updates.",
        href: "/solutions",
      },
      {
        title: "Business Management Packages & Pricing",
        description:
          "Official price book for CRM, HRM, payroll, inventory, fleet, projects, documents, and enterprise business suites.",
        href: "/services/business-systems",
      },
      {
        title: "Customer Relationship Management (CRM)",
        description:
          "We centralize leads, pipelines, meetings, quotations, and customer 360 views — connected to WhatsApp, chat, email, and support tickets.",
        href: "/solutions/crm",
      },
      {
        title: "Human Resource Management (HRM)",
        description:
          "We digitize employee records, attendance, leave, org structure, and performance reviews with department-level permissions.",
        href: "/solutions",
      },
      {
        title: "Payroll Management System",
        description:
          "We automate salary calculations, deductions, payslips, and payroll runs integrated with attendance and finance modules.",
        href: "/solutions",
      },
      {
        title: "Accounting & Finance Management",
        description:
          "We implement chart of accounts, journals, invoicing, receivables, payables, and financial reports on a proper GL foundation.",
        href: "/solutions",
      },
      {
        title: "Inventory & Warehouse Management",
        description:
          "We manage stock levels, batches, transfers, and warehouse operations with real-time visibility across branches.",
        href: "/solutions",
      },
      {
        title: "Supply Chain Management (SCM)",
        description:
          "We connect procurement, suppliers, logistics, and demand planning so your supply chain runs end-to-end on one platform.",
        href: "/solutions",
      },
      {
        title: "Manufacturing Management System",
        description:
          "We build production planning, BOM management, and shop-floor tracking for manufacturers who need visibility from order to delivery.",
        href: "/solutions",
      },
      {
        title: "Project Management Software",
        description:
          "We deliver milestone tracking, resource allocation, timesheets, and delivery dashboards for software and operations teams.",
        href: "/solutions",
      },
      {
        title: "Procurement & Purchasing System",
        description:
          "We automate purchase requisitions, approvals, purchase orders, and vendor management with full audit history.",
        href: "/solutions",
      },
    ],
  },
  {
    slug: "custom-software",
    title: "Custom Software Development",
    icon: Code2,
    summary:
      "We build tailored web, desktop, and mobile applications on modern MERN and TypeScript stacks — designed around your actual workflows, not generic templates.",
    audience: "Businesses that need a bespoke product rather than off-the-shelf tools.",
    items: [
      {
        title: "Custom Web Application Development",
        description:
          "We design and build secure, scalable web apps with APIs, admin panels, and integrations tailored to your business logic.",
        href: "/services/software-development",
      },
      {
        title: "Desktop Application Development",
        description:
          "We develop Windows and cross-platform desktop apps for offline-capable workflows, internal tools, and specialized operations.",
        href: "/services/software-development",
      },
      {
        title: "Mobile Application Development (Android & iOS)",
        description:
          "We create native and cross-platform mobile apps with push notifications, offline sync, and device hardware access.",
        href: "/services/mobile-app-development",
      },
      {
        title: "Progressive Web Applications (PWA)",
        description:
          "We build installable, app-like web experiences that work across devices without app store distribution.",
        href: "/services/web-development",
      },
      {
        title: "Multi-Branch Management Systems",
        description:
          "We connect branch operations with centralized reporting, stock sync, and role-based access per location.",
        href: "/solutions",
      },
      {
        title: "POS Packages & Pricing",
        description:
          "Official price book for retail, restaurant, pharmacy, supermarket, and multi-branch POS systems.",
        href: "/services/pos",
      },
      {
        title: "POS (Point of Sale) Systems",
        description:
          "We deliver cloud POS for retail and restaurants with inventory sync, receipts, shift reports, and offline fallback.",
        href: "/services/pos",
      },
      {
        title: "Hotel & Restaurant Management Systems",
        description:
          "We build booking, table management, kitchen orders, billing, and guest communication in one platform.",
        href: "/solutions/booking",
      },
      {
        title: "School & Education Management Systems",
        description:
          "We implement admissions, timetables, attendance, exams, fees, and parent portals for schools and institutes.",
        href: "/solutions/education",
      },
      {
        title: "Hospital & Healthcare Management Systems",
        description:
          "We develop patient records, appointments, billing, and clinic workflows with privacy-focused access controls.",
        href: "/solutions/healthcare",
      },
    ],
  },
  {
    slug: "website-development",
    title: "Website Development",
    icon: Globe,
    summary:
      "We design and develop corporate, business, e-commerce, and portfolio websites on fast, SEO-ready architectures — plus CMS builds and ongoing maintenance.",
    audience: "Brands launching or refreshing their online presence.",
    items: [
      {
        title: "Website Packages & Pricing",
        description:
          "Official price book for landing pages, business sites, e-commerce, portals, and custom web applications.",
        href: "/services/websites",
      },
      {
        title: "Corporate Websites",
        description:
          "We build professional company sites that communicate your brand, services, and credibility to enterprise clients.",
        href: "/services/websites",
      },
      {
        title: "Business Websites",
        description:
          "We create conversion-focused business websites with clear calls-to-action, contact flows, and mobile-first design.",
        href: "/services/websites",
      },
      {
        title: "E-Commerce Websites",
        description:
          "We develop online stores with product catalogs, cart, checkout, payment integration, and order management.",
        href: "/services/websites",
      },
      {
        title: "Portfolio Websites",
        description:
          "We showcase your work with polished galleries, case studies, and contact forms for creatives and agencies.",
        href: "/services/websites",
      },
      {
        title: "Landing Pages",
        description:
          "We build high-conversion single-page sites for campaigns, product launches, and lead capture.",
        href: "/services/websites",
      },
      {
        title: "CMS Development",
        description:
          "We implement content management so your team can update pages, blogs, and media without developer help.",
        href: "/services/websites",
      },
      {
        title: "Website Maintenance & Support",
        description:
          "We handle updates, security patches, backups, uptime monitoring, and content changes on a recurring basis.",
        href: "/support",
      },
    ],
  },
  {
    slug: "mobile-app-development",
    title: "Mobile App Development",
    icon: Smartphone,
    summary:
      "We develop native and hybrid mobile apps for Android and iOS — from consumer products to enterprise field tools and business automation.",
    audience: "Teams that need reliable mobile experiences for customers or staff.",
    items: [
      {
        title: "Mobile App Packages & Pricing",
        description:
          "Official price book for Android, iOS, cross-platform, and enterprise mobile applications.",
        href: "/services/mobile-apps",
      },
      {
        title: "Android Application Development",
        description:
          "We build performant Android apps using Kotlin and React Native with Play Store deployment support.",
        href: "/services/mobile-app-development",
      },
      {
        title: "iOS Application Development",
        description:
          "We create polished iOS apps with Swift or cross-platform stacks and App Store submission guidance.",
        href: "/services/mobile-app-development",
      },
      {
        title: "Hybrid Mobile Applications",
        description:
          "We deliver one codebase for both platforms to reduce cost and time-to-market without sacrificing quality.",
        href: "/services/mobile-app-development",
      },
      {
        title: "Enterprise Mobile Applications",
        description:
          "We build secure staff apps with login, role permissions, offline data, and integration to your backend systems.",
        href: "/services/mobile-app-development",
      },
      {
        title: "Business Automation Apps",
        description:
          "We automate approvals, data capture, inspections, and field reporting through purpose-built mobile tools.",
        href: "/services/mobile-app-development",
      },
    ],
  },
  {
    slug: "ai-automation",
    title: "AI & Automation Solutions",
    icon: Brain,
    summary:
      "We implement practical AI — chatbots, document processing, workflow automation, and CRM intelligence — integrated into your existing systems, not as isolated demos.",
    audience: "Teams looking to automate repetitive work and surface actionable insights.",
    items: [
      {
        title: "AI Packages & Pricing",
        description:
          "Official price book for AI chatbots, WhatsApp automation, voice AI, OCR, workflow automation, and enterprise AI platforms.",
        href: "/services/ai-automation",
      },
      {
        title: "AI Business Automation",
        description:
          "We identify repetitive processes and automate them with AI-driven rules, triggers, and integrations.",
        href: "/services/ai-solutions",
      },
      {
        title: "AI Chatbots",
        description:
          "We deploy website and WhatsApp chatbots trained on your FAQs and product data with human handoff when needed.",
        href: "/services/ai-solutions",
      },
      {
        title: "AI Customer Support Systems",
        description:
          "We build AI-assisted support that routes inquiries, suggests replies, and escalates to live agents with full CRM context.",
        href: "/services/ai-solutions",
      },
      {
        title: "AI CRM Solutions",
        description:
          "We add lead scoring, follow-up suggestions, and conversation insights directly into your CRM workflows.",
        href: "/solutions/crm",
      },
      {
        title: "AI Lead Management",
        description:
          "We automate lead capture, qualification, assignment, and nurturing across website, chat, and WhatsApp channels.",
        href: "/solutions/crm",
      },
      {
        title: "AI Document Processing",
        description:
          "We extract data from invoices, forms, and contracts using OCR and LLMs to reduce manual data entry.",
        href: "/services/ai-solutions",
      },
      {
        title: "AI Workflow Automation",
        description:
          "We connect triggers, approvals, notifications, and AI steps into automated business workflows.",
        href: "/services/ai-solutions",
      },
      {
        title: "Prompt Engineering Solutions",
        description:
          "We design, test, and optimize prompts and AI pipelines for reliable outputs in your specific use cases.",
        href: "/services/ai-solutions",
      },
    ],
  },
  {
    slug: "cloud-infrastructure",
    title: "Cloud & Managed Infrastructure",
    icon: Cloud,
    summary:
      "We architect, migrate, deploy, and manage cloud infrastructure on AWS — including DevOps, containers, and high availability. MernCrest does not own datacenters; we design and operate cloud environments for you.",
    audience: "Products and teams that need to scale reliably in the cloud.",
    items: [
      {
        title: "Cloud & DevOps Packages & Pricing",
        description:
          "Official price book for AWS, Azure, GCP, DevOps, Kubernetes, cloud security, SOC, and managed infrastructure.",
        href: "/services/cloud-infrastructure",
      },
      {
        title: "AWS Cloud Solutions",
        description:
          "We design and operate AWS architectures using EC2, RDS, S3, Lambda, and related services for your workloads.",
        href: "/cloud",
      },
      {
        title: "Cloud Migration",
        description:
          "We plan and execute migrations from on-premise or shared hosting to cloud with minimal downtime.",
        href: "/cloud",
      },
      {
        title: "Cloud Deployment",
        description:
          "We deploy applications to production with proper environments, CI/CD, and monitoring from day one.",
        href: "/cloud",
      },
      {
        title: "Server Management",
        description:
          "We manage Linux servers — updates, performance tuning, scaling, and incident response on your behalf.",
        href: "/cloud",
      },
      {
        title: "Infrastructure Management",
        description:
          "We maintain your cloud resources, cost optimization, and capacity planning as your product grows.",
        href: "/cloud",
      },
      {
        title: "Docker & Kubernetes",
        description:
          "We containerize applications and orchestrate them for consistent deployments and horizontal scaling.",
        href: "/cloud",
      },
      {
        title: "DevOps Implementation",
        description:
          "We set up CI/CD pipelines, infrastructure-as-code, and automated testing for faster, safer releases.",
        href: "/cloud",
      },
      {
        title: "Backup & Disaster Recovery",
        description:
          "We implement automated backups, restore procedures, and recovery plans to protect your data.",
        href: "/cloud",
      },
      {
        title: "High Availability Solutions",
        description:
          "We design multi-AZ, load-balanced architectures so your applications stay online during failures.",
        href: "/cloud",
      },
      {
        title: "Cloud Security",
        description:
          "We harden cloud accounts, IAM policies, network rules, and encryption to protect workloads in AWS.",
        href: "/services/cyber-security",
      },
    ],
  },
  {
    slug: "cyber-security",
    title: "Cyber Security Services",
    icon: Shield,
    summary:
      "We assess, harden, and monitor your applications and servers — from vulnerability testing to access controls — so your data and reputation stay protected.",
    audience: "Organizations that need proactive security beyond basic SSL.",
    items: [
      {
        title: "Security Assessment",
        description:
          "We review your systems, policies, and configurations to identify risks and recommend prioritized fixes.",
        href: "/services/cyber-security",
      },
      {
        title: "Vulnerability Assessment",
        description:
          "We scan applications and servers for known vulnerabilities and provide a remediation roadmap.",
        href: "/services/cyber-security",
      },
      {
        title: "Penetration Testing",
        description:
          "We simulate real attacks to find exploitable weaknesses before malicious actors do.",
        href: "/services/cyber-security",
      },
      {
        title: "Firewall Configuration",
        description:
          "We configure network firewalls and security groups to allow only necessary traffic.",
        href: "/services/cyber-security",
      },
      {
        title: "Server Hardening",
        description:
          "We lock down OS settings, disable unused services, and apply security baselines to servers.",
        href: "/services/cyber-security",
      },
      {
        title: "SSL & HTTPS Implementation",
        description:
          "We provision and install SSL certificates so all traffic is encrypted end-to-end.",
        href: "/products/security",
      },
      {
        title: "Security Monitoring",
        description:
          "We set up logging, alerts, and monitoring to detect suspicious activity and respond quickly.",
        href: "/services/cyber-security",
      },
      {
        title: "Identity & Access Management",
        description:
          "We implement role-based access, MFA, and session controls so only authorized users reach sensitive data.",
        href: "/services/cyber-security",
      },
    ],
  },
  {
    slug: "networking",
    title: "Networking Solutions",
    icon: Network,
    summary:
      "We design and implement office networks, VPNs, wireless infrastructure, and monitoring for secure, reliable connectivity across your locations.",
    audience: "Offices and branches that need dependable network operations.",
    items: [
      {
        title: "Office Network Setup",
        description:
          "We plan and install LAN infrastructure — switches, routers, cabling, and IP addressing for your office.",
        href: "/contact",
      },
      {
        title: "VPN Configuration",
        description:
          "We set up secure remote access so staff can connect to internal systems from anywhere.",
        href: "/contact",
      },
      {
        title: "Network Security",
        description:
          "We segment networks, configure access controls, and protect against unauthorized access.",
        href: "/services/cyber-security",
      },
      {
        title: "Wireless Infrastructure",
        description:
          "We deploy enterprise Wi-Fi with coverage planning, guest networks, and access policies.",
        href: "/contact",
      },
      {
        title: "Network Monitoring",
        description:
          "We monitor uptime, bandwidth, and device health so issues are caught before they impact staff.",
        href: "/contact",
      },
    ],
  },
  {
    slug: "it-support",
    title: "IT Support & Managed Services",
    icon: Headphones,
    summary:
      "We provide ongoing IT support through AMC contracts, remote helpdesk, monitoring, upgrades, and consulting — so your team can focus on business, not broken systems.",
    audience: "Businesses that want predictable IT operations without a full in-house team.",
    items: [
      {
        title: "Support Packages & Pricing",
        description:
          "Official price book for AMC, managed IT, monitoring, disaster recovery, training, SLA programs, and enterprise partnerships.",
        href: "/services/enterprise-support",
      },
      {
        title: "Annual Maintenance Contracts (AMC)",
        description:
          "We offer fixed-term support agreements covering agreed devices, servers, and response times.",
        href: "/support",
      },
      {
        title: "Remote IT Support",
        description:
          "We troubleshoot and resolve software, email, and connectivity issues via secure remote sessions.",
        href: "/support",
      },
      {
        title: "Server Monitoring",
        description:
          "We watch server health, disk, memory, and services — alerting and acting before outages occur.",
        href: "/support",
      },
      {
        title: "Software Maintenance",
        description:
          "We apply updates, patches, and license renewals to keep your software current and secure.",
        href: "/support",
      },
      {
        title: "System Upgrades",
        description:
          "We plan and execute OS, application, and hardware upgrades with minimal disruption.",
        href: "/support",
      },
      {
        title: "Technical Consulting",
        description:
          "We advise on technology choices, vendor selection, and IT roadmaps aligned with your goals.",
        href: "/services/it-consulting",
      },
    ],
  },
  {
    slug: "digital-marketing",
    title: "Digital Marketing",
    icon: Megaphone,
    summary:
      "We run data-driven digital marketing — SEO, paid ads, social media, email, and content — to grow your visibility and generate qualified leads in Sri Lanka and beyond.",
    audience: "Businesses investing in measurable online growth.",
    items: [
      {
        title: "Marketing Packages & Pricing",
        description:
          "Official price book for SEO, Google Ads, social media, content, branding, video, and enterprise marketing retainers.",
        href: "/services/marketing",
      },
      {
        title: "Search Engine Optimization (SEO)",
        description:
          "We optimize your site structure, content, and technical SEO to improve organic search rankings.",
        href: "/services/digital-marketing",
      },
      {
        title: "Social Media Marketing",
        description:
          "We manage your social presence with content calendars, community engagement, and brand consistency.",
        href: "/services/digital-marketing",
      },
      {
        title: "Google Ads Management",
        description:
          "We create and optimize search and display campaigns to drive targeted traffic and conversions.",
        href: "/services/digital-marketing",
      },
      {
        title: "Facebook & Instagram Advertising",
        description:
          "We run paid social campaigns with audience targeting, creatives, and performance tracking.",
        href: "/services/digital-marketing",
      },
      {
        title: "Email Marketing",
        description:
          "We design email sequences, newsletters, and automation flows to nurture leads and retain customers.",
        href: "/services/digital-marketing",
      },
      {
        title: "Content Marketing",
        description:
          "We produce blogs, articles, and resources that build authority and support your SEO strategy.",
        href: "/services/digital-marketing",
      },
      {
        title: "Brand Development",
        description:
          "We define brand voice, visual identity, and messaging that differentiates you in the market.",
        href: "/services/branding",
      },
    ],
  },
  {
    slug: "domain-hosting",
    title: "Domain & Hosting Services",
    icon: Server,
    summary:
      "We resell domains, hosting, VPS, cloud hosting, SSL, and business email through trusted provider partners. MernCrest is not a registrar or datacenter — we orchestrate provider APIs and support you through activation.",
    audience: "Customers who need infrastructure provisioned and managed through MernCrest.",
    items: [
      {
        title: "Domain Registration",
        description:
          "We search, register, renew, and manage .lk, .com, and other TLDs with DNS configuration.",
        href: "/domains",
      },
      {
        title: "Business Email Solutions",
        description:
          "We set up professional email on Google Workspace or Microsoft 365 through our marketplace.",
        href: "/products/email",
      },
      {
        title: "Shared Hosting",
        description:
          "We provision affordable shared hosting packages with SSL and control panel access via providers.",
        href: "/hosting",
      },
      {
        title: "VPS Hosting",
        description:
          "We activate managed VPS plans with root access, monitoring, and scalable resources.",
        href: "/products/hosting",
      },
      {
        title: "Cloud Hosting",
        description:
          "We offer cloud hosting tiers suited for growing websites and applications.",
        href: "/hosting",
      },
      {
        title: "SSL Certificates",
        description:
          "We provision and install SSL certificates to secure your domains and subdomains.",
        href: "/products/security",
      },
      {
        title: "Website Migration",
        description:
          "We move your existing site to new hosting with minimal downtime and DNS cutover support.",
        href: "/hosting",
      },
    ],
  },
  {
    slug: "business-intelligence",
    title: "Business Intelligence & Analytics",
    icon: BarChart3,
    summary:
      "We build dashboards, reports, and KPI monitoring across your CRM, ERP, and operations data so leaders make decisions from facts, not guesswork.",
    audience: "Leaders who need real-time visibility into business performance.",
    items: [
      {
        title: "Interactive Dashboards",
        description:
          "We create live dashboards with filters and drill-downs for sales, finance, and operations metrics.",
        href: "/solutions",
      },
      {
        title: "Business Reports",
        description:
          "We automate scheduled reports — P&L, inventory, pipeline, attendance — delivered to stakeholders.",
        href: "/solutions",
      },
      {
        title: "Data Analytics",
        description:
          "We analyze historical data to uncover trends, bottlenecks, and opportunities in your business.",
        href: "/solutions",
      },
      {
        title: "KPI Monitoring",
        description:
          "We track key performance indicators with alerts when metrics fall outside target ranges.",
        href: "/solutions",
      },
      {
        title: "Executive Reporting",
        description:
          "We deliver consolidated views for owners and managers across departments and branches.",
        href: "/solutions",
      },
    ],
  },
  {
    slug: "industrial-iot",
    title: "Industrial & IoT Solutions",
    icon: Cpu,
    summary:
      "We connect machines, sensors, and equipment to cloud platforms for monitoring, predictive maintenance, and asset tracking in manufacturing and operations.",
    audience: "Manufacturing and operations teams modernizing physical assets.",
    items: [
      {
        title: "Industrial IoT Systems",
        description:
          "We ingest sensor data from factory floors and field equipment into centralized dashboards.",
        href: "/solutions/iot",
      },
      {
        title: "Smart Factory Solutions",
        description:
          "We digitize production lines with real-time OEE, downtime tracking, and quality metrics.",
        href: "/solutions/iot",
      },
      {
        title: "Equipment Monitoring",
        description:
          "We monitor machine health, temperature, vibration, and usage to catch faults early.",
        href: "/solutions/iot",
      },
      {
        title: "Predictive Maintenance",
        description:
          "We use data patterns and AI signals to schedule maintenance before costly breakdowns.",
        href: "/solutions/iot",
      },
      {
        title: "Asset Tracking",
        description:
          "We track location and status of vehicles, tools, and inventory across sites in real time.",
        href: "/solutions/iot",
      },
    ],
  },
  {
    slug: "integrations",
    title: "Integration Services",
    icon: Link2,
    summary:
      "We connect your platform to payment gateways, WhatsApp, SMS, email, Zoom, Google Workspace, Microsoft 365, and third-party APIs so data flows automatically between systems.",
    audience: "Teams that need reliable connections between business systems.",
    items: [
      {
        title: "Payment Gateway Integration",
        description:
          "We integrate Stripe, PayHere, and other gateways for secure online and in-app payments.",
        href: "/contact",
      },
      {
        title: "WhatsApp Business API Integration",
        description:
          "We connect WhatsApp to your CRM and support system for automated and agent-assisted messaging.",
        href: "/contact",
      },
      {
        title: "SMS Gateway Integration",
        description:
          "We send OTPs, alerts, and marketing SMS through reliable gateway providers.",
        href: "/contact",
      },
      {
        title: "Email Integration",
        description:
          "We connect inbound and outbound email to tickets, CRM, and notification workflows.",
        href: "/contact",
      },
      {
        title: "Zoom Integration",
        description:
          "We embed meeting scheduling, links, and recordings into your portal or CRM.",
        href: "/contact",
      },
      {
        title: "Google Workspace Integration",
        description:
          "We sync calendars, contacts, and SSO with Google Workspace for your organization.",
        href: "/contact",
      },
      {
        title: "Microsoft 365 Integration",
        description:
          "We connect Outlook, Teams, and Azure AD with your business applications.",
        href: "/contact",
      },
      {
        title: "Third-Party API Integration",
        description:
          "We build custom connectors to any REST or webhook API your business depends on.",
        href: "/contact",
      },
    ],
  },
  {
    slug: "ui-ux-design",
    title: "UI/UX & Graphic Design",
    icon: Palette,
    summary:
      "We design user interfaces, brand identities, and marketing materials that look professional and convert — for web, mobile, and print.",
    audience: "Products and campaigns that need polished, conversion-focused design.",
    items: [
      {
        title: "UI/UX Design",
        description:
          "We research user flows, wireframe screens, and design intuitive interfaces for web and mobile.",
        href: "/services/branding",
      },
      {
        title: "Mobile App UI Design",
        description:
          "We create gesture-friendly, platform-consistent mobile interfaces ready for development.",
        href: "/services/branding",
      },
      {
        title: "Website UI Design",
        description:
          "We design responsive page layouts, components, and interactions for your website.",
        href: "/services/branding",
      },
      {
        title: "Brand Identity Design",
        description:
          "We develop color palettes, typography, and visual guidelines for a cohesive brand.",
        href: "/services/branding",
      },
      {
        title: "Logo Design",
        description:
          "We design memorable logos and provide files for web, print, and social media use.",
        href: "/services/branding",
      },
      {
        title: "Marketing Materials",
        description:
          "We produce brochures, social kits, presentations, and ad creatives aligned with your brand.",
        href: "/services/branding",
      },
    ],
  },
  {
    slug: "it-consulting",
    title: "IT Consulting",
    icon: Briefcase,
    summary:
      "We advise on digital transformation, software architecture, technology strategy, process automation, and system audits — helping you invest in the right technology at the right time.",
    audience: "Decision-makers planning technology investments and roadmaps.",
    items: [
      {
        title: "Digital Transformation Consulting",
        description:
          "We assess your current state and roadmap the shift from manual processes to digital platforms.",
        href: "/services/it-consulting",
      },
      {
        title: "Software Architecture Consulting",
        description:
          "We design scalable system architectures, tech stacks, and integration patterns for new products.",
        href: "/services/it-consulting",
      },
      {
        title: "Technology Strategy",
        description:
          "We align IT investments with business goals through multi-year technology planning.",
        href: "/services/it-consulting",
      },
      {
        title: "Business Process Automation",
        description:
          "We map workflows and recommend software and automation to eliminate manual bottlenecks.",
        href: "/services/it-consulting",
      },
      {
        title: "System Audit",
        description:
          "We review existing systems for security gaps, technical debt, and improvement opportunities.",
        href: "/services/it-consulting",
      },
      {
        title: "Cloud Consulting",
        description:
          "We evaluate cloud readiness, provider options, and migration strategies for your workloads.",
        href: "/cloud",
      },
    ],
  },
  {
    slug: "training-academy",
    title: "Training & Academy",
    icon: GraduationCap,
    summary:
      "We deliver corporate IT training, hands-on development courses, cloud and AI programs, cyber security workshops, internships, and certification prep for teams and individuals.",
    audience: "Teams and individuals building practical technology skills.",
    items: [
      {
        title: "Corporate IT Training",
        description:
          "We train your staff on the tools and systems you use — from Office to custom platforms.",
        href: "/careers",
      },
      {
        title: "Software Development Training",
        description:
          "We teach web and mobile development with real projects using industry-standard stacks.",
        href: "/careers",
      },
      {
        title: "Cloud Computing Training",
        description:
          "We cover AWS fundamentals, deployment, and DevOps practices for technical teams.",
        href: "/careers",
      },
      {
        title: "AI & Automation Training",
        description:
          "We introduce practical AI tools, prompt engineering, and automation for business users.",
        href: "/careers",
      },
      {
        title: "Cyber Security Training",
        description:
          "We educate teams on security best practices, phishing awareness, and safe data handling.",
        href: "/careers",
      },
      {
        title: "Internship Programs",
        description:
          "We offer structured internships where students work on real projects with mentor guidance.",
        href: "/careers",
      },
      {
        title: "Professional Certification Programs",
        description:
          "We prepare candidates for industry certifications in development, cloud, and security.",
        href: "/careers",
      },
    ],
  },
];
