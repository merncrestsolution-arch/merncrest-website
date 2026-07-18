"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export function LoginForm() {
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
        <h1 className="font-display text-3xl font-bold">{t("loginTitle")}</h1>
        <p className="mt-2 text-muted">{t("loginSubtitle")}</p>
      </div>

      <form
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setError("");
          setLoading(true);
          const form = e.currentTarget;
          const email = (form.elements.namedItem("email") as HTMLInputElement).value;
          const password = (form.elements.namedItem("password") as HTMLInputElement).value;

          try {
            const res = await fetch("/api/auth/login", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email, password }),
            });
            const data = await res.json();
            if (!res.ok) {
              setError(data.error || "Login failed");
              return;
            }
            const role = data.user?.role;
            if (role === "ADMIN" || role === "OWNER" || role === "STAFF") {
              router.push("/admin");
            } else {
              router.push("/portal");
            }
            router.refresh();
          } catch {
            setError("Network error. Please try again.");
          } finally {
            setLoading(false);
          }
        }}
      >
        <div>
          <label className="text-sm font-medium mb-1.5 block" htmlFor="email">{t("email")}</label>
          <input id="email" name="email" type="email" required autoComplete="email"
            className="w-full h-11 rounded-lg border border-white/10 bg-white/5 px-3 text-sm outline-none focus:ring-2 focus:ring-accent/50" />
        </div>
        <div>
          <label className="text-sm font-medium mb-1.5 block" htmlFor="password">{t("password")}</label>
          <input id="password" name="password" type="password" required autoComplete="current-password"
            className="w-full h-11 rounded-lg border border-white/10 bg-white/5 px-3 text-sm outline-none focus:ring-2 focus:ring-accent/50" />
        </div>
        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-muted">
            <input type="checkbox" name="remember" className="rounded border-white/20" />
            {t("rememberMe")}
          </label>
          <Link href="/forgot-password" className="text-accent hover:underline">{t("forgotPassword")}</Link>
        </div>
        {error && <p className="text-sm text-red-400" role="alert">{error}</p>}
        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? "Signing in..." : t("loginCta")}
        </Button>
      </form>

      <p className="text-sm text-muted">
        {t("noAccount")}{" "}
        <Link href="/register" className="text-accent hover:underline">{t("registerCta")}</Link>
      </p>
    </motion.div>
  );
}
