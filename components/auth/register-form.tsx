"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export function RegisterForm() {
  const t = useTranslations("auth");
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md space-y-8"
    >
      <div>
        <h1 className="font-display text-3xl font-bold">{t("registerTitle")}</h1>
        <p className="mt-2 text-muted">{t("registerSubtitle")}</p>
      </div>

      <form
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setError("");
          setLoading(true);
          const form = e.currentTarget;
          const firstName = (form.elements.namedItem("firstName") as HTMLInputElement).value;
          const lastName = (form.elements.namedItem("lastName") as HTMLInputElement).value;
          const terms = (form.elements.namedItem("terms") as HTMLInputElement).checked;
          if (!terms) {
            setError("Please accept Terms & Privacy Policy");
            setLoading(false);
            return;
          }

          const payload = {
            fullName: `${firstName} ${lastName}`.trim(),
            company: (form.elements.namedItem("company") as HTMLInputElement).value,
            email: (form.elements.namedItem("email") as HTMLInputElement).value,
            password: (form.elements.namedItem("password") as HTMLInputElement).value,
            confirmPassword: (form.elements.namedItem("confirm") as HTMLInputElement).value,
            mobile: (form.elements.namedItem("mobile") as HTMLInputElement).value,
            country: (form.elements.namedItem("country") as HTMLInputElement).value,
            address: (form.elements.namedItem("address") as HTMLInputElement).value,
            nic: (form.elements.namedItem("nic") as HTMLInputElement).value,
          };

          try {
            const res = await fetch("/api/auth/register", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (!res.ok) {
              setError(data.error || "Registration failed");
              return;
            }
            router.push("/portal");
            router.refresh();
          } catch {
            setError("Network error. Please try again.");
          } finally {
            setLoading(false);
          }
        }}
      >
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium mb-1.5 block" htmlFor="firstName">{t("firstName")}</label>
            <input id="firstName" name="firstName" required className="w-full h-11 rounded-lg border border-white/10 bg-white/5 px-3 text-sm outline-none focus:ring-2 focus:ring-accent/50" />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block" htmlFor="lastName">{t("lastName")}</label>
            <input id="lastName" name="lastName" required className="w-full h-11 rounded-lg border border-white/10 bg-white/5 px-3 text-sm outline-none focus:ring-2 focus:ring-accent/50" />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium mb-1.5 block" htmlFor="company">{t("company")}</label>
          <input id="company" name="company" className="w-full h-11 rounded-lg border border-white/10 bg-white/5 px-3 text-sm outline-none focus:ring-2 focus:ring-accent/50" />
        </div>
        <div>
          <label className="text-sm font-medium mb-1.5 block" htmlFor="email">{t("email")}</label>
          <input id="email" name="email" type="email" required autoComplete="email" className="w-full h-11 rounded-lg border border-white/10 bg-white/5 px-3 text-sm outline-none focus:ring-2 focus:ring-accent/50" />
        </div>
        <div>
          <label className="text-sm font-medium mb-1.5 block" htmlFor="mobile">{t("mobile")}</label>
          <input id="mobile" name="mobile" type="tel" className="w-full h-11 rounded-lg border border-white/10 bg-white/5 px-3 text-sm outline-none focus:ring-2 focus:ring-accent/50" />
        </div>
        <div>
          <label className="text-sm font-medium mb-1.5 block" htmlFor="country">{t("country")}</label>
          <input id="country" name="country" defaultValue="Sri Lanka" className="w-full h-11 rounded-lg border border-white/10 bg-white/5 px-3 text-sm outline-none focus:ring-2 focus:ring-accent/50" />
        </div>
        <div>
          <label className="text-sm font-medium mb-1.5 block" htmlFor="address">{t("address")}</label>
          <input id="address" name="address" className="w-full h-11 rounded-lg border border-white/10 bg-white/5 px-3 text-sm outline-none focus:ring-2 focus:ring-accent/50" />
        </div>
        <div>
          <label className="text-sm font-medium mb-1.5 block" htmlFor="nic">{t("nic")}</label>
          <input id="nic" name="nic" className="w-full h-11 rounded-lg border border-white/10 bg-white/5 px-3 text-sm outline-none focus:ring-2 focus:ring-accent/50" />
        </div>
        <div>
          <label className="text-sm font-medium mb-1.5 block" htmlFor="password">{t("password")}</label>
          <input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" className="w-full h-11 rounded-lg border border-white/10 bg-white/5 px-3 text-sm outline-none focus:ring-2 focus:ring-accent/50" />
        </div>
        <div>
          <label className="text-sm font-medium mb-1.5 block" htmlFor="confirm">{t("confirmPassword")}</label>
          <input id="confirm" name="confirm" type="password" required minLength={8} autoComplete="new-password" className="w-full h-11 rounded-lg border border-white/10 bg-white/5 px-3 text-sm outline-none focus:ring-2 focus:ring-accent/50" />
        </div>
        <label className="flex items-start gap-2 text-sm text-muted">
          <input id="terms" name="terms" type="checkbox" required className="mt-1 rounded border-white/20" />
          <span>
            {t("acceptTerms")}{" "}
            <Link href="/terms" className="text-accent hover:underline">Terms</Link>
            {" · "}
            <Link href="/privacy" className="text-accent hover:underline">Privacy</Link>
          </span>
        </label>
        {error && <p className="text-sm text-red-400" role="alert">{error}</p>}
        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? "Creating..." : t("registerCta")}
        </Button>
      </form>

      <p className="text-sm text-muted">
        {t("hasAccount")}{" "}
        <Link href="/login" className="text-accent hover:underline">{t("loginCta")}</Link>
      </p>
    </motion.div>
  );
}
