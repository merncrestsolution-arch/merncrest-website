"use client";

import { useTranslations } from "next-intl";
import { AdminCommercePanel } from "@/components/admin/admin-commerce-panel";

export default function AdminDashboardPage() {
  const t = useTranslations("admin");

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-3xl font-bold">{t("welcome")}</h1>
        <p className="mt-2 text-muted">{t("welcomeBody")}</p>
      </div>
      <AdminCommercePanel view="dashboard" />
    </div>
  );
}
