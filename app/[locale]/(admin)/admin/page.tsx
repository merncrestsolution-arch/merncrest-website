"use client";

import { useTranslations } from "next-intl";
import { AdminCommercePanel } from "@/components/admin/admin-commerce-panel";
import { SystemCommandCenter } from "@/components/staff/system-command-center";

export default function AdminDashboardPage() {
  const t = useTranslations("admin");

  return (
    <div className="space-y-10">
      <SystemCommandCenter breadcrumb="Admin > Command Center" />
      <div className="border-t border-[var(--sp-outline)] pt-8">
        <div className="mb-6">
          <h2 className="stitch-page-title text-xl">{t("welcome")}</h2>
          <p className="stitch-page-sub">{t("welcomeBody")}</p>
        </div>
        <AdminCommercePanel view="dashboard" />
      </div>
    </div>
  );
}
