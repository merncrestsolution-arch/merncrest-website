"use client";

import { motion } from "framer-motion";
import {
  Rocket,
  LifeBuoy,
  Activity,
  Users,
  Boxes,
  Code2,
  ShieldCheck,
  Zap,
  Sparkles,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

type Stat = {
  icon: LucideIcon;
  value: string;
  title: string;
  desc: string;
};

const stats: Stat[] = [
  { icon: Rocket, value: "100+", title: "Successful Projects", desc: "Delivered across multiple industries" },
  { icon: LifeBuoy, value: "24/7", title: "Technical Support", desc: "Always available when you need us" },
  { icon: Activity, value: "99.9%", title: "System Uptime", desc: "Reliable cloud infrastructure" },
  { icon: Users, value: "50+", title: "Happy Clients", desc: "Businesses trust our solutions" },
  { icon: Boxes, value: "15+", title: "Enterprise Solutions", desc: "ERP, CRM, HRM, LMS, AI & Cloud" },
  { icon: Code2, value: "100%", title: "Custom Development", desc: "Tailored for your business workflow" },
  { icon: ShieldCheck, value: "256-bit", title: "Enterprise Security", desc: "Advanced encryption & secure systems" },
  { icon: Zap, value: "3 Days", title: "Fast Project Kickoff", desc: "Start development without delay" },
  { icon: Sparkles, value: "AI Powered", title: "Smart Automation", desc: "Reduce manual work using AI" },
  { icon: TrendingUp, value: "Scalable", title: "Future Ready", desc: "Grow without rebuilding your platform" },
];

export function StatsBandSection() {
  const loop = [...stats, ...stats];

  return (
    <section className="relative overflow-hidden bg-gradient-accent py-12 text-white">
      <div className="pointer-events-none absolute inset-0 opacity-20 mix-blend-overlay [background-image:radial-gradient(circle_at_20%_30%,rgba(255,255,255,0.6),transparent_40%),radial-gradient(circle_at_80%_70%,rgba(255,255,255,0.4),transparent_45%)]" />

      <motion.ul
        className="relative z-10 flex w-max items-stretch"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 22, ease: "linear", repeat: Infinity }}
      >
        {loop.map((s, i) => {
          const Icon = s.icon;
          return (
            <li
              key={`${s.title}-${i}`}
              className="mr-5 flex shrink-0 items-center gap-4 rounded-2xl border border-white/15 bg-white/10 px-6 py-4 backdrop-blur-sm"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/15">
                <Icon className="h-6 w-6" />
              </span>
              <div className="whitespace-nowrap">
                <div className="font-display text-2xl font-extrabold leading-none sm:text-[26px]">
                  {s.value}
                </div>
                <div className="mt-1 text-sm font-semibold">{s.title}</div>
                <div className="text-xs text-white/75">{s.desc}</div>
              </div>
            </li>
          );
        })}
      </motion.ul>
    </section>
  );
}
