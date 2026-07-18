"use client";

import { useTranslations } from "next-intl";
import { ComingOnline } from "@/components/ui/coming-online";

const placeholders = [
  { label: "Revenue", value: "—" },
  { label: "Customers", value: "—" },
  { label: "Open tickets", value: "—" },
  { label: "Outstanding", value: "—" },
];

export default function AdminDashboardPage() {
  const t = useTranslations("admin");

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-3xl font-bold">{t("welcome")}</h1>
        <p className="mt-2 text-muted">{t("welcomeBody")}</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {placeholders.map((p) => (
          <div
            key={p.label}
            className="rounded-xl border border-white/10 bg-white/[0.02] p-5"
          >
            <p className="text-xs font-mono uppercase tracking-wider text-muted">{p.label}</p>
            <p className="mt-2 font-display text-3xl font-bold text-muted/50">{p.value}</p>
          </div>
        ))}
      </div>

      <ComingOnline title="Analytics charts" />
    </div>
  );
}
