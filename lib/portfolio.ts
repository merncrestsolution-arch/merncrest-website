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

export const portfolioProjects: ProjectCaseStudy[] = [
  {
    id: "fintech-app",
    title: "FinTech Mobile Banking App",
    category: "Mobile App",
    image: "/fintech-app.png",
    description: "A secure, high-performance banking app serving over 500,000 active users with real-time transactions.",
    tech: ["React Native", "Node.js", "AWS", "PostgreSQL"],
    metric: "500k+ Active Users",
    featured: true,
    client: "Global Financial Group",
    duration: "8 Months",
    overview: "We partnered with a leading financial institution to redesign and rebuild their core mobile banking application from the ground up, prioritizing security, speed, and an intuitive user experience.",
    challenge: "The legacy application was suffering from slow transaction times, frequent crashes on Android devices, and an outdated user interface that was leading to negative app store reviews and high customer churn.",
    solution: "We engineered a modern cross-platform application using React Native. We implemented an event-driven microservices architecture on the backend using Node.js and AWS to handle high concurrency, and integrated advanced biometric authentication for seamless, secure access.",
    results: [
      { label: "Active Users", value: "500k+" },
      { label: "App Store Rating", value: "4.8/5" },
      { label: "Load Time Reduction", value: "65%" }
    ]
  },
  {
    id: "ecommerce-platform",
    title: "Enterprise E-Commerce Platform",
    category: "Web Platform",
    image: "https://images.unsplash.com/photo-1661956602116-aa6865609028?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80",
    description: "A headless e-commerce solution handling 10k+ orders daily with sub-second page loads.",
    tech: ["Next.js", "GraphQL", "Elasticsearch", "Redis"],
    metric: "Sub-second Loads",
    featured: false,
    client: "RetailMax Global",
    duration: "6 Months",
    overview: "A complete digital transformation of an international retail brand's online presence, transitioning from a monolithic legacy system to a modern headless architecture.",
    challenge: "During peak sales events (like Black Friday), the client's legacy Magento server would consistently crash, losing millions in potential revenue. Page load times averaged 4-5 seconds, significantly impacting SEO and conversion rates.",
    solution: "We implemented a decoupled headless architecture using Next.js for the frontend and a scalable microservices backend. By leveraging Redis caching and Elasticsearch for instantaneous product discovery, we ensured the platform could handle massive traffic spikes seamlessly.",
    results: [
      { label: "Conversion Rate Increase", value: "32%" },
      { label: "Average Load Time", value: "0.8s" },
      { label: "Daily Orders Handled", value: "10k+" }
    ]
  },
  {
    id: "ai-crm",
    title: "AI-Powered CRM Dashboard",
    category: "SaaS",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80",
    description: "A customer relationship manager using AI to predict sales trends and automate outreach.",
    tech: ["React", "Python", "TensorFlow", "MongoDB"],
    metric: "+150% Sales",
    featured: false,
    client: "SalesTech Innovations",
    duration: "5 Months",
    overview: "We built an intelligent CRM system designed to help sales teams prioritize leads based on machine-learning-driven conversion probability models.",
    challenge: "Sales representatives were spending up to 40% of their day manually sorting through leads and drafting routine follow-up emails, leading to inefficiency and missed high-value opportunities.",
    solution: "Our team developed a custom SaaS platform integrating predictive AI models trained on historical sales data. We automated email outreach using NLP generation and provided a centralized React dashboard with real-time analytics and scoring metrics.",
    results: [
      { label: "Sales Increase", value: "+150%" },
      { label: "Time Saved/Rep", value: "15 hrs/wk" },
      { label: "Lead Prediction Accuracy", value: "89%" }
    ]
  },
  {
    id: "supply-chain",
    title: "Global Supply Chain Tracker",
    category: "Enterprise",
    image: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80",
    description: "Real-time logistics tracking system with IoT integration across 40+ countries.",
    tech: ["Vue.js", "Go", "Docker", "Kubernetes"],
    metric: "Global Scale",
    featured: true,
    client: "TransLogistics Inc.",
    duration: "10 Months",
    overview: "A massive-scale enterprise system to track cargo ships, trucks, and individual shipping containers globally in real-time.",
    challenge: "The client was relying on fragmented systems and manual reporting to track global freight. This lack of visibility resulted in lost cargo, delayed deliveries, and inability to proactively communicate with clients.",
    solution: "We engineered a highly resilient Go backend capable of ingesting millions of data points from IoT sensors every minute. We deployed the system using Kubernetes for global distribution and built a high-performance Vue.js dashboard for logistics managers.",
    results: [
      { label: "Countries Covered", value: "40+" },
      { label: "Data Points/Min", value: "2M+" },
      { label: "Lost Cargo Reduction", value: "94%" }
    ]
  },
  {
    id: "telehealth",
    title: "Telehealth Video Platform",
    category: "SaaS",
    image: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80",
    description: "HIPAA-compliant video consultation platform connecting patients with doctors instantly.",
    tech: ["WebRTC", "Socket.io", "NestJS", "AWS"],
    metric: "Zero Latency",
    featured: false,
    client: "HealthConnect",
    duration: "4 Months",
    overview: "A secure, browser-based telehealth platform enabling seamless, high-quality video consultations between healthcare providers and patients.",
    challenge: "The rise in remote healthcare demanded a platform that was strictly HIPAA-compliant, completely secure, and easy for elderly or non-technical patients to use without installing complex software.",
    solution: "We leveraged WebRTC to build a peer-to-peer video streaming infrastructure that works natively in the browser. All signaling was handled via encrypted WebSockets using NestJS, ensuring zero-latency communication and end-to-end encryption.",
    results: [
      { label: "Consultations/Month", value: "50k+" },
      { label: "Video Latency", value: "< 50ms" },
      { label: "HIPAA Audits Passed", value: "100%" }
    ]
  },
  {
    id: "blockchain-realestate",
    title: "Blockchain Real Estate Exchange",
    category: "Web3",
    image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80",
    description: "Tokenizing physical real estate assets for fractional ownership and seamless trading.",
    tech: ["Solidity", "Next.js", "Web3.js", "IPFS"],
    metric: "$50M+ Volume",
    featured: false,
    client: "BlockProp Partners",
    duration: "7 Months",
    overview: "A decentralized application (dApp) that bridges traditional real estate with the blockchain, allowing users to buy and trade fractional shares of commercial properties.",
    challenge: "Commercial real estate investing is traditionally highly illiquid and requires massive capital. The client wanted a legally compliant platform to democratize access to high-yield properties through smart contracts.",
    solution: "We wrote and audited secure Solidity smart contracts representing property shares as ERC-20 tokens. We built an intuitive Next.js frontend integrated with Web3 wallets, allowing users to seamlessly invest, trade, and collect automated dividend payouts.",
    results: [
      { label: "Total Volume Traded", value: "$50M+" },
      { label: "Smart Contract Audits", value: "Passed" },
      { label: "Average Investment Time", value: "< 2 mins" }
    ]
  }
];
